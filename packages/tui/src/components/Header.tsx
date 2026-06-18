import type { Session } from "@adler/sdk"
import { Theme } from "../theme"

export function Header({ session }: { session: Session | null }) {
  const statusColor = session?.status === "active"
    ? Theme.header.status.active
    : Theme.header.status.completed
  return (
    <box style={{ height: 1 }}>
      <text><b>adler</b></text>
      <text fg="#666"> · session: </text>
      <text fg={Theme.primary}>{session?.id.slice(0, 6)}</text>
      <text fg="#666"> · </text>
      <text fg={statusColor}>{session?.status}</text>
      <text fg="#666"> · {session?.working_dir}</text>
    </box>
  )
}
