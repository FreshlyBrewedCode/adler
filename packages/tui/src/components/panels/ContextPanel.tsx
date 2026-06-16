import { useState, useMemo } from "react"
import { Box, Text } from "ink"
import { useInput } from "ink"
import type { ContextItem } from "@adler/sdk"
import type { PanelProps } from "../../core/types"
import { TypeBadge } from "../TypeBadge"
import { Theme } from "../../theme"
import { SelectList } from "../SelectList"

export function ContextPanel({ state, width, height }: PanelProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const grouped = useMemo(() => {
    return state.context.reduce<Record<string, ContextItem[]>>((acc, item) => {
      acc[item.type] = acc[item.type] ?? []
      acc[item.type].push(item)
      return acc
    }, {})
  }, [state.context])

  const itemIndexMap = useMemo(() => {
    const map = new Map<string, number>()
    let index = 0
    Object.entries(grouped).forEach(([_, items]) => {
      items.forEach(item => {
        map.set(item.id, index++)
      })
    })
    return map
  }, [grouped])

  const flatItems = useMemo(() => {
    const result: ContextItem[] = []
    Object.values(grouped).forEach(items => {
      items.forEach(item => result.push(item))
    })
    return result
  }, [grouped])

  useInput((input, key) => {
    if (key.upArrow) {
      setSelectedIndex(i => Math.max(0, i - 1))
    } else if (key.downArrow) {
      setSelectedIndex(i => Math.max(0, Math.min(state.context.length - 1, i + 1)))
    }
  })

  return (
    <Box flexDirection="column" width={width} height={height}>
      {Object.entries(grouped).map(([type, items]) => (
        <Box key={type} flexDirection="column" marginTop={1}>
          <Box flexDirection="row">
            <TypeBadge type={type} />
            <Text dimColor> {items.length} items</Text>
          </Box>
          <SelectList
            items={items}
            selectedIndex={selectedIndex}
            renderItem={(item, i, isSelected) => {
              const contextItem = item as ContextItem
              const isItemSelected = (itemIndexMap.get(contextItem.id) ?? -1) === selectedIndex
              const valueText = String(contextItem.value?.text ?? contextItem.value?.url ?? contextItem.value?.path ?? JSON.stringify(contextItem.value))
              const typeColor = Theme.type[contextItem.type as keyof typeof Theme.type] ?? Theme.muted
              return (
                <Box>
                  <Text color={typeColor}>│ </Text>
                  <Text>{valueText}</Text>
                  <Text dimColor> {contextItem.label} {contextItem.description}</Text>
                </Box>
              )
            }}
          />
        </Box>
      ))}
    </Box>
  )
}
