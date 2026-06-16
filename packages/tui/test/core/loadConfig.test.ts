import { describe, test, expect } from "bun:test"
import { loadConfig } from "../../src/loadConfig"

describe("loadConfig", () => {
  test("loads project config with tui layout", async () => {
    const config = await loadConfig("/mnt/shares/git/adler")
    expect(config.tui?.layout).toBeDefined()
    expect(config.tui?.layout?.layout).toBe("split")
    expect(config.tui?.layout?.ratio).toBe(0.6)
  })

  test("returns empty config for non-existent directory", async () => {
    const config = await loadConfig("/tmp/non-existent-adler-project")
    expect(config.tui).toBeUndefined()
  })
})
