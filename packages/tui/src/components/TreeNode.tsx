import { Box, Text } from "ink"
import type { Span } from "@adler/sdk"

export function TreeNode({
  span,
  depth,
  isSelected,
}: {
  span: Span
  depth: number
  isSelected: boolean
}) {
  return (
    <Box borderStyle={isSelected ? "single" : undefined}>
      <Text>{"  ".repeat(depth)}</Text>
      <Text color={span.status === "done" ? "green" : span.status === "failed" ? "red" : "yellow"}>
        {span.kind === "agent" ? "●" : "○"}{" "}
      </Text>
      <Text>{span.name}</Text>
      <Text dimColor> {span.status}</Text>
    </Box>
  )
}
