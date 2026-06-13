import { Box, Text } from "ink"
import type { ContextItem } from "@adler/sdk"

const TYPE_COLORS: Record<string, string> = {
  goal: "green",
  url: "blue",
  file: "yellow",
  text: "white",
}

export function ContextTab({ context, selectedIndex }: { context: ContextItem[]; selectedIndex: number }) {
  const grouped = context.reduce((acc, item) => {
    acc[item.type] = acc[item.type] ?? []
    acc[item.type].push(item)
    return acc
  }, {} as Record<string, ContextItem[]>)

  let globalIndex = 0
  return (
    <Box flexDirection="column">
      {Object.entries(grouped).map(([type, items]) => (
        <Box key={type} flexDirection="column" marginTop={1}>
          <Text bold backgroundColor={TYPE_COLORS[type] ?? "white"} color="black">
            {" "}{type.toUpperCase()} — {items.length} items{" "}
          </Text>
          {items.map(item => {
            const isSelected = globalIndex === selectedIndex
            globalIndex++
            const valueText = item.value?.text ?? item.value?.url ?? item.value?.path ?? JSON.stringify(item.value)
            return (
              <Box key={item.id} borderStyle={isSelected ? "single" : undefined}>
                <Text color={TYPE_COLORS[type]}>│ </Text>
                <Text>{valueText}</Text>
                <Text dimColor> {item.label} {item.description}</Text>
              </Box>
            )
          })}
        </Box>
      ))}
    </Box>
  )
}
