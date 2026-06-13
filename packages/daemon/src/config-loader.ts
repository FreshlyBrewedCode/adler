import { existsSync } from "fs"
import { join } from "path"
import { homedir } from "os"
import type { AdlerConfig } from "@adler/sdk"

const GLOBAL_CONFIG = join(homedir(), ".config/adler/adler.ts")
const PROJECT_CONFIG = join(process.cwd(), ".adler/adler.ts")

export async function loadConfig(): Promise<AdlerConfig> {
  let globalConfig: AdlerConfig = {}
  let projectConfig: AdlerConfig = {}

  if (existsSync(GLOBAL_CONFIG)) {
    try {
      const mod = await import(GLOBAL_CONFIG)
      globalConfig = mod.default ?? {}
    } catch (e) {
      console.error(`Failed to load global config ${GLOBAL_CONFIG}:`, e instanceof Error ? e.message : String(e))
    }
  }

  if (existsSync(PROJECT_CONFIG)) {
    try {
      const mod = await import(PROJECT_CONFIG)
      projectConfig = mod.default ?? {}
    } catch (e) {
      console.error(`Failed to load project config ${PROJECT_CONFIG}:`, e instanceof Error ? e.message : String(e))
    }
  }

  return mergeConfig(globalConfig, projectConfig)
}

function mergeConfig(base: AdlerConfig, override: AdlerConfig): AdlerConfig {
  return {
    ...base,
    ...override,
    agent: {
      ...base.agent,
      ...override.agent,
      agents: { ...base.agent?.agents, ...override.agent?.agents },
      attach: override.agent?.attach ?? base.agent?.attach,
    },
  }
}
