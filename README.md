# adler - Eagle eyes on your agents

adler is yet another agent orchestrator but with a focus on flexibility, single task orchestration, and observability:

- Agents work on a task/goal within a unique adler session
- The session keeps track of everything that is happening
  - basic context for the task and goal
  - trace and log of every agent and what they worked on
  - optional workflow (e.g. research -> plan -> implement -> review) and status
  - add anything to the session context. Files, URLs, GitHub issues, you name it.
- Manual or fully automated agentic orchestration:
  - once agents finish, adler stops and lets you manually review and move to the next phase
  - or let adler assistant orchestrate automatically
- Fully hackable and customizable to your workflow and stack
  - adler is just a CLI, use it manually, in scripts, or teach an agent using a skill
  - adler runs hooks/scripts for everything. Use Claude, Opencode, Copilot or any other agent. Need to run agents in a new tmux session? You configure exactly how new agents spawn.
- TUI dashboard with an overview of the current session
- adler assistant runs an agent with full context about the current session
  - ask anything about the session
  - use it for automatic orchestration 

## Sessions

A session is the central unit in adler. Every agent run, context item, and log entry belongs to a session. Sessions provide the observability layer — a complete record of what happened, which agents ran, and what they produced.

```bash
# Create a new session
adler new

# Create a session with a goal
adler new --goal "Implement payment feature"
```

The active session is automatically resolved for all commands. See [Session detection](#session-detection).

Each session tracks:

- **Goal** — the task or goal the session is working toward
- **Agents** — every agent that ran, its prompt, status, and output
- **Context** — files, URLs, and other references attached to the session
- **Workflow** — the active workflow and its current step/status, if any
- **Logs** — structured log entries written by agents and hooks

## TUI Dashboard

Running `adler` without arguments opens an interactive dashboard for the current session:

- Live agent status and output
- Workflow progress and current step
- Session context items
- Logs and traces

Workflow steps can be triggered directly from the TUI, and the [adler assistant](#adler-assistant) can be invoked interactively.

## Adler Assistant

The adler assistant is an agent with full awareness of the current session. It can answer questions about session state or autonomously orchestrate agents through a workflow.

```bash
adler assistant "what has been implemented so far?"
adler assistant --auto "finish the current workflow"
```

The assistant receives the full session — agent traces, logs, context items, and workflow state — so it can make informed decisions. In automatic mode (`--auto`), it reads the session, decides what to do next, runs the appropriate agents, and iterates until the workflow is complete or a human decision is needed.

## CLI Quickstart

```bash
# Open interactive TUI dashboard
adler

# Init adler in your project to create custom workflows and hooks
adler init

# Start a new adler session
adler new

# Get session context
adler context list # optional: specify --session, by default adler reads the session id from ADLER_SESSION

# Add context
adler context add --type url --description "a example url" https://example.com

# List running agents
adler agent list

# Start a new agent
adler agent run \
  --agent opencode:plan \ # define your custom scripts in your adler config. Here we use the "opencode"" script and pass it the "plan" agent 
  --name "git-master" \ # Provide an optional name for the agent to reuse it later
  "check the git status" 

# Wait for an agent
adler agent wait --name "git-master"

# Check agent status
adler agent status --name "git-master"

# Read directly from an agent process stdout
adler agent read --name "git-master"

```

## Configuration

Adler is configured using a `adler.ts` typescript file. Config files are stored in following places:

**Global**: `~/.config/adler/adler.ts`
**Project**: `.adler/adler.ts`

Example `adler.ts`:

```ts
import type { AdlerConfig } from "@adler/core"
import { importedHooks } from "./hooks/externalHook"

const config: AdlerConfig = {
  plugins: ["@adler/opencode"], // Plugins are just configuration that is merged with the main config. They can provide e.g. agents and hooks
  agent: {
    agents: {
      default: "opencode:build"
    }
  },
  hooks: [
    importedHooks,
    {
      "agent.run": { before: "echo hello there from hook" }
    }
  ],
  workflows: {
    helloWorkflow: {
      steps: {
        hello: "say hello",
        goodbye: "say goodbye"
      }
    }
  }
}

export default config;
```

### Customizing agents

Adler supports the integration of any cli based coding agent. All you have to do is define how the agent is invoked.

Agents can be customized in the `agent.agents` section. For example, let's say you wanted to add a new agent `echo` that just echos the prompt you give it:

```ts
const config: AdlerConfig = {
  agent: {
    agents: {
      echo: ({prompt}) => `echo ${prompt}` // The returned string is executed as a shell command
    }
  }
}
```

you could then call it with

```bash
adler agent run --agent echo "hello there"
```

Here is a more realistic example using a basic opencode agent with subagent support:

```ts
const config: AdlerConfig = {
  agent: {
    agents: {
      opencode: ({prompt, subagent}) => `opencode run --agent ${subagent} ${prompt}`
    }
  }
}
```

then run the opencode build agent using:

```bash
adler agent run --agent opencode:build "hello there"
```

## Plugins

Plugins are npm packages that contribute pre-built agents, hooks, and workflows to your adler config. They are loaded and merged before your local configuration, so local settings always take precedence.

```ts
const config: AdlerConfig = {
  plugins: ["@adler/opencode"],
}
```

**First-party plugins:**

- `@adler/opencode` — opencode agent definitions with subagent support

To author a plugin, export an `AdlerConfig` object from an npm package:

```ts
import type { AdlerConfig } from "@adler/core"

export default {
  agent: {
    agents: {
      myagent: ({prompt}) => `my-cli run "${prompt}"`
    }
  }
} satisfies AdlerConfig
```

## Hooks

Hooks allow you to hook into any part of adlers execution flow. Distinct events are emitted for any command or action. Hooks allow you to run custom code or shell commands before or after that event:

```ts
const config: AdlerConfig = {
  hooks: {
    "agent.run": {
      before: "ADLER_LOG='Running before agent'",
      after: ({output}) => `ADLER_LOG='Running after agent Received ${output}'` // Use event parameters
    },
    "agent.run.opencode": { // Target specific agent events
      before: async ({input, adler }) => { // Run full typescript hooks
        adler.log("Running agent to create git worktree...") 
        // Invoke agents using adler. Using any adler apis here. Note that hooks wont fire here to avoid recursive hook invocation
        await adler.agent.run(`Create checkout a new branch in a worktree. Infer the branch name from based on this prompt: ${input.prompt}`)
      },
      after: async ({$}) => {
        await $("npm run lint"); // Run shell commands in typescript hooks
      }
    }
  }
}
```

## Workflows

adler supports running reusable, structured workflows. Workflows can be defined inline in the config or as a seperate yaml file. Workflow files are autodetected when added to `.adler/workflows` or `~/.config/adler/workflows`.

```yaml
name: my-workflow
steps: # Steps are just prompts
  research: |
    Research the topic thoroughly. Add any links to the session context with label 'research'
  plan: |
    Create an implementation plan
    Consider the following links:
    $ adler context get --type url --label research # include shell scripts. output will be included in the prompt
    
    Write your findings to plan.md
  implement: |
    Implement the feature according to
    @plan.md # include files
hooks: 
  - hooks/myWorkflowHooks.ts # include custom hooks from tiles
  - workflow: # or inline
      before: git worktree ...
```

Run workflows from the TUI dashboard or the cli:

```bash
adler run my-workflow
```

## Context

Context is arbitrary data attached to a session. Agents receive the full context as a JSON dump via `ADLER_CONTEXT`, and workflow step prompts can query it inline using shell interpolation.

```bash
# Add a URL
adler context add --type url --label "docs" --description "API docs" https://example.com

# Add a file
adler context add --type file --label "spec" --description "Feature spec" ./spec.md

# List all context items
adler context list

# Get items by type and label (used inside workflow prompts)
adler context get --type url --label "docs"
```

Any data can be added — files, URLs, GitHub issues, text notes. Labels let you retrieve specific items inside workflow steps:

```yaml
steps:
  implement: |
    Implement the feature. Consult these references:
    $ adler context get --type url --label "docs"
```

## Environment variables

Adler uses environment variables to pass args and context. If you run an agent using `adler agent run` the process will receive environment variables with adler context:

```bash
ADLER_SESSION # current session id
ADLER_AGENT_PROMPT # prompt passed to adler agent run
ADLER_CONTEXT # JSON dump of adler session context
```

## Session detection

Adler will infer the curent session based on the following conditions (from highest to lowest priority):

**Flag**: session id explicitly passed with `--session`
**Env**: session id read from `ADLER_SESSION`
**Session file**: session id read from `.adler/.session`
