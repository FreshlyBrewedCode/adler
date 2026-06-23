# Design: opencode Composite Action + adlr-action Token + Log Fix

**Date:** 2026-06-23
**Issue:** #21
**Status:** Approved

---

## Overview

Three changes delivered together:

1. Convert the opencode slash-command workflow into a reusable composite action at `.github/actions/opencode/action.yml` so other repos can use it.
2. Acquire a GitHub App token (via the `adlr-action` app) and use it for all git operations and `gh` CLI calls instead of the default `GITHUB_TOKEN`.
3. Fix #21: route opencode JSONL output through a temp file instead of a step output variable to avoid GitHub's ~1 MB output limit.

---

## Architecture

### Before

```
opencode.yml (workflow)
  ├── Build prompt (github-script)
  ├── Run opencode  →  captures log into $GITHUB_OUTPUT (broken for large logs)
  └── Post response  →  reads log from step output, calls gh CLI with GITHUB_TOKEN
```

### After

```
opencode.yml (thin caller workflow)
  └── uses: ./.github/actions/opencode
        ├── Checkout
        ├── Setup Bun
        ├── Install opencode
        ├── Acquire app token  (actions/create-github-app-token@v2)
        ├── Build prompt
        ├── Run opencode  →  writes JSONL to mktemp file, outputs file path
        └── Post response  →  reads file path, calls gh CLI with app token
```

---

## Files Changed / Created

| Path | Action | Notes |
|---|---|---|
| `.github/actions/opencode/action.yml` | **Create** | New composite action |
| `.github/workflows/opencode.yml` | **Modify** | Becomes thin caller |
| `.github/workflows/log2md.mjs` | **Move** | Relocate to `.github/actions/opencode/log2md.mjs` so it's co-located with the action |

> `log2md.mjs` is moved (not copied) because the composite action is the sole consumer. The script path inside the action uses `${{ github.action_path }}/log2md.mjs`.

---

## Composite Action: `.github/actions/opencode/action.yml`

### Inputs

| Input | Required | Default | Description |
|---|---|---|---|
| `opencode-api-key` | yes | — | API key passed to opencode via `OPENCODE_API_KEY` |
| `app-id` | yes | — | GitHub App ID for `adlr-action` |
| `app-private-key` | yes | — | GitHub App private key PEM for `adlr-action` |
| `model` | no | `opencode-go/kimi-k2.7-code` | opencode model to use |
| `comment-body` | yes | — | Raw comment body (the `/oc ...` text) |
| `issue-number` | yes | — | Issue or PR number |
| `is-pr` | yes | — | `'true'` or `'false'` — whether the comment is on a PR |

### Outputs

None exposed externally (the action posts the comment itself).

### Steps

1. **Checkout** — `actions/checkout@v4` with `persist-credentials: false` (credentials set explicitly via app token below)
2. **Setup Bun** — `oven-sh/setup-bun@v2`, bun-version `1.3`
3. **Install opencode** — `npm install -g opencode-ai`
4. **Acquire app token** — `actions/create-github-app-token@v2` with `app-id` and `private-key` inputs; output `token` stored as `steps.app-token.outputs.token`
5. **Configure git credentials** — sets `git config --global url."https://x-access-token:${TOKEN}@github.com/".insteadOf "https://github.com/"` so any `git push` opencode performs authenticates as the app
6. **Build prompt** — `actions/github-script@v7`; strips `/oc`/`/opencode` marker, wraps with PR/issue context tag, outputs `prompt`
7. **Run opencode** — shell step:
   - `mktemp /tmp/opencode-log-XXXXXX.jsonl` → `log_file`
   - `opencode run --model ... --format json <prompt> | tee "$log_file"`
   - `echo "log_file=$log_file" >> "$GITHUB_OUTPUT"`
   - Env: `OPENCODE_API_KEY`, `GH_TOKEN` = app token, `OPENCODE_CONFIG_CONTENT`
8. **Post response** — shell step:
   - `node "${{ github.action_path }}/log2md.mjs" "$log_file" "$model" opencode | gh <target> comment <number> --body-file -`
   - Env: `GH_TOKEN` = app token

### OPENCODE_CONFIG_CONTENT (inline JSON)

```json
{
  "permission": {
    "external_directory": {
      "*": "deny",
      "/tmp/**": "allow"
    }
  },
  "instructions": [".github/workflows/opencode-instructions.md"]
}
```

---

## Thin Caller: `.github/workflows/opencode.yml`

Retains:
- `on: issue_comment / pull_request_review_comment` trigger
- `if:` guard checking `author_association` ∈ `[OWNER, MEMBER, COLLABORATOR]` and comment contains `/oc` or `/opencode`
- `permissions:` block (`contents: write`, `pull-requests: write`, `issues: write`)

Job body becomes a single `uses: ./.github/actions/opencode` step passing:
- `opencode-api-key: ${{ secrets.OPENCODE_API_KEY }}`
- `app-id: ${{ secrets.ADLR_APP_ID }}`
- `app-private-key: ${{ secrets.ADLR_APP_PRIVATE_KEY }}`
- `comment-body: ${{ github.event.comment.body }}`
- `issue-number: ${{ github.event.issue.number || github.event.pull_request.number }}`
- `is-pr: ${{ toJSON(!!github.event.issue.pull_request || github.event_name == 'pull_request_review_comment') }}`

> Note: composite actions cannot access `github` context directly for cross-repo reuse — the workflow must pass all event-specific values as inputs.

---

## Token Usage

| Operation | Token used |
|---|---|
| Checkout (initial fetch) | app token (via `persist-credentials: false` + explicit `git config`) |
| `gh pr/issue comment` in Post response | app token (`GH_TOKEN`) |
| `GH_TOKEN` inside opencode agent | app token |
| Any `git push` opencode performs | app token (via git credential helper config) |

The default `GITHUB_TOKEN` is not used anywhere in the action.

---

## Required Repository Secrets

| Secret | Value |
|---|---|
| `OPENCODE_API_KEY` | opencode API key (already exists) |
| `ADLR_APP_ID` | GitHub App ID for `adlr-action` |
| `ADLR_APP_PRIVATE_KEY` | Private key PEM for `adlr-action` |

---

## Fix for Issue #21

The root cause is GitHub's step output size limit (~1 MB). Storing multi-file JSONL in `$GITHUB_OUTPUT` overflows it for long runs.

**Fix:** write to a temp file, pass only the file path through `$GITHUB_OUTPUT`.

```bash
# Before
log=$(opencode run ... | tee /dev/fd/2)
echo "log<<${delimiter}" >> "$GITHUB_OUTPUT"
echo "$log" >> "$GITHUB_OUTPUT"
echo "${delimiter}" >> "$GITHUB_OUTPUT"

# After
log_file=$(mktemp /tmp/opencode-log-XXXXXX.jsonl)
opencode run ... | tee "$log_file"
echo "log_file=$log_file" >> "$GITHUB_OUTPUT"
```

`log2md.mjs` already accepts a file path as its first argument — no changes needed to that script.

---

## Out of Scope

- Publishing the action to the GitHub Marketplace
- Extracting `opencode-instructions.md` into the action (left in `.github/workflows/` for now — projects can override via their own path)
- Changing the model default or adding model-selection logic
