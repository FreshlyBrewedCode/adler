import { describe, test, expect, beforeAll, afterAll } from "bun:test"
import { loadConfig } from "../../src/loadConfig"
import { mkdirSync, rmSync, writeFileSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"

const tmpDir = join(tmpdir(), `adler-loadconfig-test-${process.pid}-${Date.now()}`)
const adlerDir = join(tmpDir, ".adler")
const configFile = join(adlerDir, "adler.ts")

beforeAll(() => {
  mkdirSync(adlerDir, { recursive: true })
  writeFileSync(
    configFile,
    `export default { tui: { layout: { layout: "split", ratio: 0.6, content: ["agents", "logs"] } } }\n`
  )
})

afterAll(() => {
  rmSync(tmpDir, { recursive: true, force: true })
})

describe("loadConfig", () => {
  test("loads project config with tui layout", async () => {
    const config = await loadConfig(tmpDir)
    expect(config.tui?.layout).toBeDefined()
    expect(config.tui?.layout?.layout).toBe("split")
    expect(config.tui?.layout?.ratio).toBe(0.6)
  })

  test("returns empty config for non-existent directory", async () => {
    const config = await loadConfig("/tmp/non-existent-adler-project")
    expect(config.tui).toBeUndefined()
  })
})
