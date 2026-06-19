# @adlr/sdk refactor: typed span hierarchy + span.create/finish client methods

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor `@adlr/sdk` so it becomes a typed observability foundation: move the SQLite implementation into the daemon, introduce a strongly-typed span discriminated union, and expose generic `span.create`/`span.finish`/`span.get`/`span.update` client methods.

**Architecture:** The SDK keeps the `Storage` interface and all shared types/paths/constants but no longer owns the SQLite implementation. Span types become a discriminated union keyed by `kind`, with per-kind data maps. The IPC client gains generic span methods; the daemon implements matching handlers.

**Tech Stack:** TypeScript, Bun, `bun:sqlite`, `@adlr/sdk`, `adlrd`

---

### Task 1: Introduce typed span hierarchy in `@adlr/sdk`

**Files:**
- Modify: `packages/sdk/src/types.ts`

**Context:**
The current `Span` interface stores `data: Record<string, unknown>` for every span kind. We need a discriminated union so agent spans carry `AgentSpanData` (prompt, agent_type, output, usage, pid, exit_code) while other kinds keep a generic record.

- [ ] **Step 1: Replace span types with discriminated union**

  Replace the existing `Span`/`CreateSpanInput` definitions in `packages/sdk/src/types.ts` with:

  ```ts
  export type SpanKind = "agent" | "workflow" | "step" | "hook";
  export type SpanStatus = "pending" | "running" | "done" | "failed" | "blocked";

  export interface SpanUsage {
  	prompt_tokens?: number;
  	completion_tokens?: number;
  	total_tokens?: number;
  }

  export interface AgentSpanData {
  	prompt?: string;
  	agent_type?: string;
  	output?: { type: "text"; content: string } | { type: "file"; path: string };
  	usage?: SpanUsage;
  	pid?: number | null;
  	exit_code?: number | null;
  }

  export interface SpanDataMap {
  	agent: AgentSpanData;
  	workflow: Record<string, unknown>;
  	step: Record<string, unknown>;
  	hook: Record<string, unknown>;
  }

  export interface BaseSpan<K extends SpanKind = SpanKind> {
  	id: string;
  	session_id: string;
  	parent_id: string | null;
  	kind: K;
  	name: string;
  	status: SpanStatus;
  	started_at: number;
  	finished_at: number | null;
  }

  export type SpanOf<K extends SpanKind> = BaseSpan<K> & { data: SpanDataMap[K] };

  export type AgentSpan = SpanOf<"agent">;

  export type Span = SpanOf<SpanKind>;

  export type CreateSpanInput<K extends SpanKind = SpanKind> = {
  	session_id: string;
  	parent_id?: string | null;
  	kind: K;
  	name: string;
  	status?: SpanStatus;
  	data?: SpanDataMap[K];
  };
  ```

  Keep `CreateSpanInput` without an explicit default export name; it should default to `SpanKind` so existing non-generic callers still compile.

- [ ] **Step 2: Update `AgentConfig` hooks to use `AgentSpan`**

  In the same file, change the `span: Span` parameters in `AgentConfig` to `span: AgentSpan`:

  ```ts
  export interface AgentConfig {
  	run?: (ctx: { prompt: string; subagent?: string }) => string;
  	open?: (ctx: { span: AgentSpan; proc: ProcContext; $: unknown }) => string;
  	output?: (ctx: {
  		span: AgentSpan;
  		proc: ProcContext;
  		$: unknown;
  	}) => Promise<
  		{ type: "text"; content: string } | { type: "file"; path: string }
  	>;
  	status?: (ctx: {
  		span: AgentSpan;
  		currentStatus: SpanStatus;
  		proc: ProcContext;
  		$: unknown;
  	}) => Promise<"working" | "completed" | "failed" | "blocked">;
  	statusPollInterval?: number;
  	mode?: "tui" | "log";
  	interactive?: boolean;
  	interactiveTimeout?: number;
  }
  ```

- [ ] **Step 3: Typecheck the SDK**

  Run: `~/.bun/bin/bun --filter='@adlr/sdk' typecheck`
  Expected: no errors.

- [ ] **Step 4: Commit**

  ```bash
  git add packages/sdk/src/types.ts
  git commit -m "feat(sdk): typed span discriminated union"
  ```

---

### Task 2: Move `SQLiteStorage` from `@adlr/sdk` to `adlrd`

**Files:**
- Move: `packages/sdk/src/sqlite-storage.ts` → `packages/daemon/src/sqlite-storage.ts`
- Move: `packages/sdk/test/storage.test.ts` → `packages/daemon/test/storage.test.ts`
- Modify: `packages/sdk/src/index.ts`
- Modify: `packages/daemon/src/index.ts`
- Modify: `packages/daemon/test/server.test.ts`
- Modify: `packages/daemon/test/process-manager.test.ts`
- Modify: `packages/daemon/test/logger.test.ts`
- May modify: `packages/daemon/src/process-manager.ts` (minimal `AgentSpan` casts if required to keep typecheck green after Task 1)

**Context:**
Only the daemon needs `bun:sqlite`. Removing it from the SDK keeps the SDK dependency-free.

- [ ] **Step 1: Move source and test files**

  Use git mv so history is preserved:

  ```bash
  git mv packages/sdk/src/sqlite-storage.ts packages/daemon/src/sqlite-storage.ts
  git mv packages/sdk/test/storage.test.ts packages/daemon/test/storage.test.ts
  ```

- [ ] **Step 2: Remove `sqlite-storage` export from SDK**

  In `packages/sdk/src/index.ts`, remove:

  ```ts
  export * from "./sqlite-storage";
  ```

  The file should now export only `client`, `constants`, `paths`, `storage`, `types`.

- [ ] **Step 3: Ensure `Storage` interface uses the new typed `Span`**

  In `packages/sdk/src/storage.ts`, the interface already imports `Span`, `CreateSpanInput`, etc. With Task 1's changes these are now generic/union types. The default generic parameter on `CreateSpanInput` makes the existing method signatures compatible, so this file may not require edits. Verify it compiles after Task 1.

- [ ] **Step 4: Update daemon imports to use local `SQLiteStorage`**

  In each of these files, change the import of `SQLiteStorage` from `@adlr/sdk` to a relative path:

  - `packages/daemon/src/index.ts`
  - `packages/daemon/src/logger.ts`
  - `packages/daemon/test/server.test.ts`
  - `packages/daemon/test/process-manager.test.ts`
  - `packages/daemon/test/logger.test.ts`

  Example change in `packages/daemon/src/index.ts`:

  ```ts
  import { getDbPath } from "@adlr/sdk";
  import { SQLiteStorage } from "./sqlite-storage";
  ```

  In `packages/daemon/test/server.test.ts` and the other test files, replace:

  ```ts
  import { SQLiteStorage } from "@adlr/sdk";
  ```

  with:

  ```ts
  import { SQLiteStorage } from "../src/sqlite-storage";
  ```

  Keep the `DAEMON_SESSION_ID` import from `@adlr/sdk` unchanged.

- [ ] **Step 5: Update `SQLiteStorage` to import from `@adlr/sdk` instead of relative SDK files**

  In the moved `packages/daemon/src/sqlite-storage.ts`, the imports currently reference `./constants`, `./storage`, `./types`. Replace them with `@adlr/sdk` imports so the daemon uses the SDK package boundary:

  ```ts
  import { Database, type SQLQueryBindings } from "bun:sqlite";
  import { DAEMON_SESSION_ID } from "@adlr/sdk";
  import type { Storage } from "@adlr/sdk";
  import type {
  	AddContextItemInput,
  	ContextFilter,
  	ContextItem,
  	ContextItemType,
  	CreateEventInput,
  	CreateSessionInput,
  	CreateSpanInput,
  	Event,
  	EventFilter,
  	EventType,
  	Session,
  	SessionStatus,
  	Span,
  	SpanKind,
  	SpanStatus,
  } from "@adlr/sdk";
  ```

- [ ] **Step 6: Run daemon and SDK tests**

  Run:

  ```bash
  ~/.bun/bin/bun --filter='@adlr/sdk' test
  ~/.bun/bin/bun --filter='adlrd' test
  ```

  Expected: all existing tests pass (storage tests now run under daemon package).

- [ ] **Step 7: Commit**

  ```bash
  git add packages/sdk/src/index.ts packages/daemon/src/sqlite-storage.ts packages/daemon/test/storage.test.ts packages/daemon/src/index.ts packages/daemon/test/server.test.ts packages/daemon/test/process-manager.test.ts packages/daemon/test/logger.test.ts
  git commit -m "refactor: move SQLiteStorage from sdk to daemon"
  ```

---

### Task 3: Add generic span client methods and daemon handlers

**Files:**
- Modify: `packages/sdk/src/client.ts`
- Modify: `packages/sdk/test/client.test.ts`
- Modify: `packages/daemon/src/handlers.ts`

**Context:**
Clients need to create spans, finish them, and fetch/update them with kind-specific typing. The daemon needs to handle `span.create` and `span.finish` commands.

- [ ] **Step 1: Add generic span methods to the client**

  In `packages/sdk/src/client.ts`:

  1. Add these type imports at the top:

     ```ts
     import type {
     	AddContextItemInput,
     	ContextItem,
     	CreateSessionInput,
     	CreateSpanInput,
     	Event,
     	Session,
     	Span,
     	SpanKind,
     	SpanOf,
     	SpanStatus,
     } from "./types";
     ```

  2. Update the `Client.span` field to:

     ```ts
     span: {
     	create<K extends SpanKind = SpanKind>(
     		input: CreateSpanInput<K>,
     	): Promise<SpanOf<K>>;
     	finish(id: string, data?: Record<string, unknown>): Promise<void>;
     	get<K extends SpanKind = SpanKind>(id: string): Promise<SpanOf<K>>;
     	list(sessionId: string): Promise<Span[]>;
     	update<K extends SpanKind = SpanKind>(
     		id: string,
     		data: SpanOf<K>["data"],
     		options?: { merge?: boolean },
     	): Promise<void>;
     };
     ```

  3. Update the implementation object:

     ```ts
     span: {
     	create: (input) => send("span.create", input),
     	finish: (id, data) => send("span.finish", { id, data }),
     	get: (id) => send("span.get", { id }),
     	list: (sessionId) => send("span.list", { session_id: sessionId }),
     	update: (id, data, options) =>
     		send("span.update", { id, data, options }),
     },
     ```

  The `toSnakeCase` helper will convert `parentSpanId`-style keys for nested payloads; for span methods the payloads are already flat/snake_case.

- [ ] **Step 2: Add daemon handlers for `span.create` and `span.finish`**

  In `packages/daemon/src/handlers.ts`, add cases before the default branch:

  ```ts
  case "span.create": {
  	const data = payload as CreateSpanInput;
  	return ctx.storage.createSpan(data);
  }

  case "span.finish": {
  	const { id, data } = payload as {
  		id: string;
  		data?: Record<string, unknown>;
  	};
  	const existing = await ctx.storage.getSpan(id);
  	if (!existing) throw new Error(`Span not found: ${id}`);
  	const updatedData = data ? { ...existing.data, ...data } : existing.data;
  	await ctx.storage.updateSpan(id, {
  		status: "done",
  		finished_at: Date.now(),
  		data: updatedData,
  	});
  	ctx.broadcast(existing.session_id, {
  		type: "span.finished",
  		payload: { session_id: existing.session_id, span_id: id },
  	});
  	return { success: true };
  }
  ```

  Add `CreateSpanInput` to the existing `@adlr/sdk` type imports at the top of `handlers.ts`.

- [ ] **Step 3: Update `span.update` to support kind-specific data merging**

  The existing `span.update` handler already merges `data`. It should continue to work with the new typed `Record<string, unknown>` data for non-agent spans and `AgentSpanData` for agent spans. No logic change is required, but confirm the import of `CreateSpanInput` is present.

- [ ] **Step 4: Add client tests for new span methods**

  In `packages/sdk/test/client.test.ts`, add tests that assert the new methods exist and send the correct commands.

  Add after the existing "client has all namespace methods" test:

  ```ts
  test("client has span.create and span.finish methods", () => {
  	const client = createClient(FAKE_SOCK);
  	expect(client.span.create).toBeFunction();
  	expect(client.span.finish).toBeFunction();
  	expect(client.span.get).toBeFunction();
  	expect(client.span.list).toBeFunction();
  	expect(client.span.update).toBeFunction();
  	client.close();
  });
  ```

  Add a test that verifies `span.create` sends the expected payload:

  ```ts
  test("span.create sends create command and returns span", async () => {
  	const client = createClient(FAKE_SOCK);
  	const socket = await waitForSocket();

  	let receivedPayload: unknown;
  	const originalOnData = socket.listeners("data")[0] as (
  		data: Buffer,
  	) => void;
  	socket.removeListener("data", originalOnData);
  	socket.on("data", (data) => {
  		const text = data.toString();
  		for (const line of text.trim().split("\n")) {
  			if (!line) continue;
  			try {
  				const msg = JSON.parse(line);
  				if (msg.type === "span.create") {
  					receivedPayload = msg.payload;
  					socket.write(
  						`${JSON.stringify({
  							type: "response",
  							id: msg.id,
  							payload: {
  								id: "span-new",
  								session_id: msg.payload.session_id,
  								name: msg.payload.name,
  								kind: msg.payload.kind,
  								status: "pending",
  								parent_id: msg.payload.parent_id ?? null,
  								started_at: 0,
  								finished_at: null,
  								data: msg.payload.data ?? {},
  							},
  						})}\n`,
  					);
  					return;
  				}
  			} catch {
  				// ignore
  			}
  		}
  		originalOnData(data);
  	});

  	const result = await client.span.create({
  		session_id: "sess-1",
  		kind: "step",
  		name: "my-step",
  		data: { key: "value" },
  	});

  	expect(result.id).toBe("span-new");
  	expect(result.kind).toBe("step");
  	expect(receivedPayload).toEqual({
  		session_id: "sess-1",
  		kind: "step",
  		name: "my-step",
  		data: { key: "value" },
  	});

  	client.close();
  });
  ```

- [ ] **Step 5: Run SDK tests**

  Run: `~/.bun/bin/bun --filter='@adlr/sdk' test`
  Expected: all tests pass, including the new ones.

- [ ] **Step 6: Commit**

  ```bash
  git add packages/sdk/src/client.ts packages/sdk/test/client.test.ts packages/daemon/src/handlers.ts
  git commit -m "feat(sdk): generic span client methods and daemon handlers"
  ```

---

### Task 4: Update dependent packages for typed spans

**Files:**
- Modify: `packages/daemon/src/process-manager.ts`
- Modify: `packages/cli/src/commands/span/get.ts`
- Modify: `packages/cli/src/commands/span/list.ts`
- Modify: `packages/tui/src/types.ts`
- Modify: `packages/tui/src/components/TreeNode.tsx`
- Modify: `packages/tui/src/components/panels/AgentsPanel.tsx`
- Modify: `packages/tui/src/components/panels/TracesPanel.tsx`

**Context:**
After the type changes, several consumers need small adjustments to remain type-correct.

- [ ] **Step 1: Update `ProcessManager` to use `AgentSpan`/`AgentSpanData`**

  In `packages/daemon/src/process-manager.ts`:

  1. Import `AgentSpan` from `@adlr/sdk`:

     ```ts
     import type { AgentSpan, Span, SpanStatus, Storage } from "@adlr/sdk";
     ```

  2. In `pollStatus` and `completeAgent`, the hooks receive `span`. Cast or type them as `AgentSpan` where needed. The simplest approach is to type the local `span` variable as `AgentSpan` after fetching:

     ```ts
     const span = (await this.storage.getSpan(spanId)) as AgentSpan | null;
     if (!span) return;
     ```

     This lets `span.data.agent_type` and `span.data.output` remain strongly typed without changing the hooks' signatures.

  3. In `completeAgent`, the `outputData` assignment currently does `outputData = output as Record<string, unknown>;`. Keep this cast, but the `output` hook now returns the same union type, so the cast is safe.

  4. In `spawnAgent`, the created span data uses agent-specific fields. Ensure the data object passed to `createSpan` is typed correctly:

     ```ts
     const span = await this.storage.createSpan({
     	session_id: data.sessionId,
     	parent_id: data.parentSpanId ?? null,
     	kind: "agent",
     	name: data.name,
     	status: "running",
     	data: {
     		prompt: data.prompt,
     		agent_type: data.agentType,
     		pid: null,
     		exit_code: null,
     	},
     });
     ```

- [ ] **Step 2: Update CLI span commands**

  In `packages/cli/src/commands/span/get.ts` and `packages/cli/src/commands/span/list.ts`, no runtime changes are needed, but confirm `Span` is imported from `@adlr/sdk` and that `span.data` access remains valid. `span.data` is still an object; printing it as JSON works for all kinds.

- [ ] **Step 3: Update TUI reducer and components**

  In `packages/tui/src/types.ts`, no change is needed other than confirming `Span` import still resolves.

  In `packages/tui/src/components/panels/AgentsPanel.tsx`, change the cast for `agent_type` and `prompt`:

  ```tsx
  title={String((span as AgentSpan).data?.agent_type ?? span.name)}
  description={String((span as AgentSpan).data?.prompt ?? "").slice(0, 40)}
  ```

  Add `AgentSpan` to the import:

  ```ts
  import type { AgentSpan, Span } from "@adlr/sdk";
  ```

  In `packages/tui/src/components/panels/TracesPanel.tsx` and `packages/tui/src/components/TreeNode.tsx`, no changes are needed beyond verifying `Span` resolves.

- [ ] **Step 4: Run all tests and typecheck**

  Run:

  ```bash
  ~/.bun/bin/bun test
  ~/.bun/bin/bun typecheck
  ~/.bun/bin/bun lint
  ```

  Expected: all pass.

- [ ] **Step 5: Commit**

  ```bash
  git add packages/daemon/src/process-manager.ts packages/cli/src/commands/span/get.ts packages/cli/src/commands/span/list.ts packages/tui/src/components/panels/AgentsPanel.tsx
  git commit -m "refactor: adapt consumers to typed spans"
  ```

---

## Self-review

**Spec coverage:**
- Move `SQLiteStorage` to daemon → Task 2.
- Typed `Span` discriminated union with `BaseSpan`, `AgentSpan`, `SpanDataMap`, `SpanOf<K>`, `AgentSpanData`, `SpanUsage` → Task 1.
- Generic client methods `span.create<K>`, `span.finish`, typed `span.get<K>` and `span.update<K>` → Task 3.
- Daemon handlers for new commands → Task 3.
- Consumers updated → Task 4.

**Placeholder scan:** No TBD/TODO placeholders; all code blocks contain concrete implementations.

**Type consistency:** `SpanOf<K>` is used consistently. `CreateSpanInput` defaults to `SpanKind`. `AgentConfig` uses `AgentSpan`. `Storage` interface uses the union `Span`.
