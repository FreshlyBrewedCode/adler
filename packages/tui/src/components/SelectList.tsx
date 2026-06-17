import { Box } from "ink"
import type { ReactNode } from "react"
import { Theme } from "../theme"

export function SelectList({
  items,
  selectedIndex,
  renderItem,
  height,
}: {
  items: unknown[]
  selectedIndex: number
  renderItem: (item: unknown, index: number, isSelected: boolean) => ReactNode
  height?: number
}) {
  // If height is provided, show a sliding window of rows capped to that height
  let startIndex = 0
  let visibleItems = items
  if (height != null && height > 0) {
    startIndex = Math.max(0, Math.min(selectedIndex - Math.floor(height / 2), items.length - height))
    visibleItems = items.slice(startIndex, startIndex + height)
  }

  return (
    <Box flexDirection="column" overflow="hidden">
      {visibleItems.map((item, i) => {
        const absoluteIndex = startIndex + i
        const isSelected = absoluteIndex === selectedIndex
        return (
          <Box key={absoluteIndex} backgroundColor={isSelected ? Theme.muted : undefined}>
            {renderItem(item, absoluteIndex, isSelected)}
          </Box>
        )
      })}
    </Box>
  )
}
