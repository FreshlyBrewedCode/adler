import { Box, Text } from "ink"
import type { Span } from "@adler/sdk"

function buildTree(spans: Span[]): Span[] {
  // Return root-level spans (null parent_id)
  return spans.filter(s => s.parent_id === null).sort((a, b) => a.started_at - b.started_at)
}

function getChildren(spans: Span[], parentId: string): Span[] {
  return spans.filter(s => s.parent_id === parentId).sort((a, b) => a.started_at - b.started_at)
}

function TreeNode({
  span,
  spans,
  depth,
  selectedIndex,
  currentIndex,
}: {
  span: Span
  spans: Span[]
  depth: number
  selectedIndex: number
  currentIndex: { value: number }
}) {
  const isSelected = currentIndex.value === selectedIndex
  currentIndex.value++
  const children = getChildren(spans, span.id)
  return (
    <Box flexDirection="column">
      <Box borderStyle={isSelected ? "single" : undefined}>
        <Text>{"  ".repeat(depth)}</Text>
        <Text color={span.status === "done" ? "green" : span.status === "failed" ? "red" : "yellow"}>
          {span.kind === "agent" ? "●" : "○"}{" "}
        </Text>
        <Text>{span.name}</Text>
        <Text dimColor> {span.status}</Text>
      </Box>
      {children.map(child => (
        <TreeNode
          key={child.id}
          span={child}
          spans={spans}
          depth={depth + 1}
          selectedIndex={selectedIndex}
          currentIndex={currentIndex}
        />
      ))}
    </Box>
  )
}

export function TracesTab({ spans, selectedIndex }: { spans: Span[]; selectedIndex: number }) {
  const roots = buildTree(spans)
  const currentIndex = { value: 0 }
  return (
    <Box flexDirection="column">
      {roots.map(span => (
        <TreeNode
          key={span.id}
          span={span}
          spans={spans}
          depth={0}
          selectedIndex={selectedIndex}
          currentIndex={currentIndex}
        />
      ))}
    </Box>
  )
}
