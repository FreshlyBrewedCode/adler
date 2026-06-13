import { SQLiteStorage, DB_PATH } from "@adler/sdk"
import { startServer } from "./server"
import { ProcessManager } from "./process-manager"
import { loadConfig } from "./config-loader"
import { writePid, removePid, removeSocket, isDaemonRunning } from "./lifecycle"

async function main() {
  if (isDaemonRunning()) {
    console.error("Daemon is already running")
    process.exit(1)
  }

  const storage = new SQLiteStorage(DB_PATH)
  const config = await loadConfig()
  const processManager = new ProcessManager(storage, config, (event) => {
    // Events are broadcast by the server via subscribers map
    // The processManager callback is a placeholder for future extensibility
  })

  writePid()

  const server = startServer(storage, processManager, () => {
    console.log("Shutting down due to inactivity")
    shutdown()
  })

  function shutdown() {
    server.close()
    processManager.stop()
    storage.close()
    removePid()
    removeSocket()
    process.exit(0)
  }

  process.on("SIGTERM", shutdown)
  process.on("SIGINT", shutdown)

  console.log("adlerd started")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
