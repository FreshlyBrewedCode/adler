import { render } from "ink"
import React from "react"
import { App } from "./app"
import { createClient } from "@adler/sdk"
import { readFileSync, existsSync } from "fs"
import { join } from "path"

function resolveSessionId(): string | undefined {
  if (process.env.ADLER_SESSION) return process.env.ADLER_SESSION
  const localFile = join(process.cwd(), ".adler", ".session")
  if (existsSync(localFile)) {
    return readFileSync(localFile, "utf-8").trim()
  }
  return undefined
}

export async function runTui(): Promise<void> {
  const client = createClient()
  const sessionId = resolveSessionId()
  if (!sessionId) {
    console.error("No active session. Run `adler new` first.")
    process.exit(1)
  }
  const { waitUntilExit } = render(React.createElement(App, { sessionId }))
  await waitUntilExit()
  client.close()
}
