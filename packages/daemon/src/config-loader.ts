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
    const mod = await import(GLOBAL_CONFIG)
    globalConfig = mod.default ?? {}
  }

  if (existsSync(PROJECT_CONFIG)) {
    const mod = await import(PROJECT_CONFIG)
    projectConfig = mod.default ?? {}
  }

  return mergeConfig(globalConfig, projectConfig)
}

function mergeConfig(base: AdlerConfig, override: AdlerConfig): AdlerConfig {
  return {
    agent: {
      agents: { ...base.agent?.agents, ...override.agent?.agents },
      attach: override.agent?.attach ?? base.agent?.attach,
    },
  }
}
