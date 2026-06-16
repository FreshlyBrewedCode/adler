import { Text } from "ink"

const TYPE_COLORS: Record<string, string> = {
  goal: "green",
  url: "blue",
  file: "yellow",
  text: "white",
}

export function TypeBadge({ type }: { type: string }) {
  return (
    <Text backgroundColor={TYPE_COLORS[type] ?? "white"} color="black">
      {" "}{type.toUpperCase()}{" "}
    </Text>
  )
}
