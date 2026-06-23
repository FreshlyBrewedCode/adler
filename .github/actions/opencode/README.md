# opencode Action

Runs [opencode](https://opencode.ai) in response to a slash-command comment on an issue or pull request, then posts the result as a comment.

## Prerequisites: GitHub App

This action requires a GitHub App. Instead of using the default `GITHUB_TOKEN`, it acquires a short-lived token from your app and uses it for all git operations and `gh` CLI calls. **The app's permissions determine what opencode can do at runtime** — granting `contents: write` lets it push commits, `pull-requests: write` lets it open PRs, and so on. Only grant what you need.

To set up:

1. [Create a GitHub App](https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/registering-a-github-app) in your account or organisation
2. Grant it the repository permissions opencode needs (e.g. `Contents: Read & write`, `Pull requests: Read & write`, `Issues: Read & write`)
3. Install the app on your repository
4. Generate a private key and store the App ID and key PEM as repository secrets

## Usage

```yaml
- name: Checkout repository
  uses: actions/checkout@v4
  with:
    persist-credentials: false

- name: Run opencode
  uses: FreshlyBrewedCode/adlr/.github/actions/opencode@main
  with:
    opencode-api-key: ${{ secrets.OPENCODE_API_KEY }}
    app-id: ${{ secrets.APP_ID }}
    app-private-key: ${{ secrets.APP_PRIVATE_KEY }}
    model: opencode-go/kimi-k2.7-code
    comment-body: ${{ github.event.comment.body }}
    issue-number: ${{ github.event.issue.number || github.event.pull_request.number }}
    is-pr: ${{ toJSON(!!github.event.issue.pull_request || github.event_name == 'pull_request_review_comment') }}
```

A complete workflow example is at [`.github/workflows/opencode.yml`](../../workflows/opencode.yml).

## Inputs

| Input | Required | Default | Description |
|---|---|---|---|
| `opencode-api-key` | yes | — | opencode API key |
| `app-id` | yes | — | GitHub App ID. The app's permissions control what opencode can do at runtime. |
| `app-private-key` | yes | — | Private key PEM for the GitHub App |
| `model` | no | `opencode-go/kimi-k2.7-code` | opencode model to use |
| `comment-body` | yes | — | Raw comment body (including the slash command) |
| `issue-number` | yes | — | Issue or PR number the comment is on |
| `is-pr` | yes | — | `'true'` if the comment is on a PR, `'false'` for an issue |

## Required secrets

| Secret | Description |
|---|---|
| `OPENCODE_API_KEY` | opencode API key |
| `APP_ID` | GitHub App ID (or any name you choose) |
| `APP_PRIVATE_KEY` | Private key PEM for the GitHub App (or any name you choose) |

## How it works

1. Acquires a short-lived token from your GitHub App via [`actions/create-github-app-token`](https://github.com/actions/create-github-app-token). This token is used for all `gh` CLI calls and git operations — `GITHUB_TOKEN` is not used.
2. Configures git credentials so any `git push` opencode performs authenticates as the app.
3. Strips the `/oc` or `/opencode` marker from the comment body and builds a prompt with PR/issue context.
4. Runs `opencode` with the specified model, writing JSONL output to a temp file.
5. Converts the JSONL log to Markdown via `log2md.mjs` and posts it as a comment on the issue or PR.
