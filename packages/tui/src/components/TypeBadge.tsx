import { Text } from "ink"
import { Theme } from "../theme"

export function TypeBadge({ type }: { type: string }) {
  const bg = Theme.type[type as keyof typeof Theme.type] ?? Theme.muted
  return (
    <Text backgroundColor={bg} color="black">
      {" "}{type.toUpperCase()}{" "}
    </Text>
  )
}
