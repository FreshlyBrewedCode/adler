import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { createClient } from "@adlr/sdk";
import { CliProcess } from "@adlr/test-utils";
import { ObservabilityPlugin } from "../src/index";

const opencodeBinary = "opencode";

function opencodeAvailable(): boolean {
	try {
		Bun.spawnSync([opencodeBinary, "--version"]);
		return true;
	} catch {
		return false;
	}
}

describe("opencode plugin daemon integration", () => {
	let cli: CliProcess;
	let projectDir: string;
	let socketPath: string;
	let sessionId: string;

	beforeEach(async () => {
		cli = new CliProcess();
		projectDir = mkdtempSync(join(cli.tmpDir, "project-"));
		mkdirSync(projectDir, { recursive: true });
		socketPath = join(cli.adlrDir, "adlr.sock");

		const newResult = await cli.run(["new"], { cwd: projectDir });
		expect(newResult.exitCode).toBe(0);
		const match = newResult.stdout.match(/Created session (.+)/);
		expect(match).not.toBeNull();
		// biome-ignore lint/style/noNonNullAssertion: guarded by the expect above
		sessionId = match![1];
	});

	afterEach(async () => {
		await cli.cleanup();
	});

	test("plugin handles opencode events and emits span events to the daemon", async () => {
		process.env.ADLR_SESSION = sessionId;
		process.env.ADLR_SOCKET = socketPath;
		delete process.env.ADLR_SPAN_ID;

		const plugin = await ObservabilityPlugin({});
		expect(typeof plugin.event).toBe("function");

		const client = createClient(socketPath);
		const events: { type: string; payload: unknown }[] = [];
		const unsubscribe = await client.subscribe(sessionId, (msg) => {
			if (msg.type === "event") {
				events.push({
					type: msg.event,
					payload: msg.payload,
				});
			}
		});

		try {
			await plugin.event?.({
				event: {
					type: "session.updated",
					properties: {
						info: {
							id: "opencode-session-1",
							tokens: { input: 10, output: 5 },
							cost: 0.001,
						},
					},
				},
			});

			await plugin.event?.({
				event: {
					type: "session.created",
					properties: {
						info: {
							id: "opencode-subagent-1",
							parentID: "opencode-session-1",
							title: "subagent",
						},
					},
				},
			});

			const spanEvents = events.filter(
				(e) => e.type === "span.started" || e.type === "span.finished",
			);
			expect(spanEvents.length).toBeGreaterThan(0);
		} finally {
			unsubscribe();
			client.close();
		}
	});
});

describe("opencode plugin binary integration", () => {
	if (!opencodeAvailable()) {
		test.skip("opencode binary not available", () => {});
		return;
	}

	let cli: CliProcess;
	let projectDir: string;
	let repoRoot: string;

	beforeEach(() => {
		repoRoot = resolve(import.meta.dir, "../../../../");
		cli = new CliProcess();
		projectDir = mkdtempSync(join(cli.tmpDir, "project-"));
		const opencodeDir = join(projectDir, ".opencode");
		const pluginsDir = join(opencodeDir, "plugins");
		mkdirSync(pluginsDir, { recursive: true });

		const pluginSourcePath = resolve(
			repoRoot,
			"packages/plugins/opencode/src/index.ts",
		);

		// Local plugin: loads the package under test from source.
		writeFileSync(
			join(pluginsDir, "adlr.ts"),
			`export { ObservabilityPlugin } from "${pluginSourcePath}";\n`,
		);

		// Symlink the SDK into opencode's node_modules so the plugin can resolve
		// @adlr/sdk without needing a full install (which would fail on workspace
		// catalog references).
		const nodeModulesDir = join(opencodeDir, "node_modules");
		const sdkLinkDir = join(nodeModulesDir, "@adlr");
		mkdirSync(sdkLinkDir, { recursive: true });
		symlinkSync(
			resolve(repoRoot, "packages/sdk"),
			join(sdkLinkDir, "sdk"),
			"dir",
		);
	});

	afterEach(async () => {
		await cli.cleanup();
	});

	test("opencode loads the plugin and exits cleanly", async () => {
		const newResult = await cli.run(["new"], { cwd: projectDir });
		expect(newResult.exitCode).toBe(0);
		const match = newResult.stdout.match(/Created session (.+)/);
		expect(match).not.toBeNull();
		// biome-ignore lint/style/noNonNullAssertion: guarded by the expect above
		const sessionId = match![1];
		const socketPath = join(cli.adlrDir, "adlr.sock");

		const proc = Bun.spawn([opencodeBinary, "models"], {
			cwd: projectDir,
			env: {
				...process.env,
				HOME: cli.tmpDir,
				ADLR_DIR: cli.adlrDir,
				ADLR_SESSION: sessionId,
				ADLR_SOCKET: socketPath,
			},
			stdout: "pipe",
			stderr: "pipe",
		});

		const opencodeTimeout = setTimeout(() => {
			proc.kill();
		}, 60000);

		try {
			await proc.exited;
		} finally {
			clearTimeout(opencodeTimeout);
		}

		const stderr = await new Response(proc.stderr).text();
		expect(proc.exitCode).toBe(0);
		expect(stderr).not.toContain("error");
	}, 60000);
});
