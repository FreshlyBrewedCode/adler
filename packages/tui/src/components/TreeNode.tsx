import { Box, Text } from "ink"
import type { Span } from "@adler/sdk"
import { Theme } from "../theme"

export function TreeNode({
  span,
  depth,
  isSelected,
}: {
  span: Span
  depth: number
  isSelected: boolean
}) {
  const statusColor = Theme.status[span.status as keyof typeof Theme.status] ?? Theme.muted
  const indicator = span.kind === "agent" ? "●" : "○"
  return (
    <Box backgroundColor={isSelected ? "gray" : undefined}>
      <Text>{"  ".repeat(depth)}</Text>
      <Text color={statusColor}>{indicator} </Text>
      <Text>{span.name}</Text>
      <Text dimColor> {span.status}</Text>
    </Box>
  )
}
