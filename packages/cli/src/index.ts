#!/usr/bin/env bun
import { runCli } from "./cli"

async function main() {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    // Launch TUI
    const { ensureDaemon } = await import("./auto-start")
    await ensureDaemon()
    try {
      const { runTui } = await import("@adler/tui")
      await runTui()
    } catch (err) {
      console.error("TUI failed to start:", err)
      process.exit(1)
    }
    return
  }

  await runCli(process.argv)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
