import { useState } from "react"
import { Box } from "ink"
import { useInput } from "ink"
import type { Span } from "@adler/sdk"
import type { PanelProps } from "../../core/types"
import { TreeNode } from "../TreeNode"

function buildTree(spans: Span[]): Span[] {
  return spans.filter(s => s.parent_id === null).sort((a, b) => a.started_at - b.started_at)
}

function getChildren(spans: Span[], parentId: string): Span[] {
  return spans.filter(s => s.parent_id === parentId).sort((a, b) => a.started_at - b.started_at)
}

function TreeView({
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
      <TreeNode span={span} depth={depth} isSelected={isSelected} />
      {children.map(child => (
        <TreeView
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

export function TracesPanel({ state, width, height }: PanelProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const roots = buildTree(state.spans)
  const currentIndex = { value: 0 }

  useInput((input, key) => {
    if (key.upArrow) {
      setSelectedIndex(i => Math.max(0, i - 1))
    } else if (key.downArrow) {
      setSelectedIndex(i => Math.min(state.spans.length - 1, i + 1))
    }
  })

  return (
    <Box flexDirection="column" width={width} height={height}>
      {roots.map(span => (
        <TreeView
          key={span.id}
          span={span}
          spans={state.spans}
          depth={0}
          selectedIndex={selectedIndex}
          currentIndex={currentIndex}
        />
      ))}
    </Box>
  )
}
