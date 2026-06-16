import { Text } from "ink"

const STATUS_COLORS: Record<string, string> = {
  done: "green",
  failed: "red",
  blocked: "yellow",
  running: "blue",
}

export function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] ?? "white"
  return <Text color={color}>● {status}</Text>
}
