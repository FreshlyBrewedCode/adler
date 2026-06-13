import { readFileSync } from "node:fs"
import { join } from "node:path"

export function resolveSessionId(args: { session?: string }): string | undefined {
  if (args.session) return args.session
  if (process.env.ADLER_SESSION) return process.env.ADLER_SESSION
  const localFile = join(process.cwd(), ".adler", ".session")
  try {
    return readFileSync(localFile, "utf-8").trim()
  } catch {
    return undefined
  }
}
