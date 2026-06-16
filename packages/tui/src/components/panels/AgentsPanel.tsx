import { useState } from "react"
import { Box, Text } from "ink"
import { useInput } from "ink"
import type { PanelProps } from "../../core/types"
import { Card } from "../Card"
import { SelectList } from "../SelectList"

function formatDuration(started: number, finished: number | null): string {
  const ms = (finished ?? Date.now()) - started
  if (ms < 1000) return `${ms}ms`
  return `${Math.floor(ms / 1000)}s`
}

export function AgentsPanel({ state, width, height }: PanelProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const agents = state.spans.filter(s => s.kind === "agent")

  useInput((input, key) => {
    if (key.upArrow) {
      setSelectedIndex(i => Math.max(0, i - 1))
    } else if (key.downArrow) {
      setSelectedIndex(i => Math.max(0, Math.min(agents.length - 1, i + 1)))
    } else if (key.return) {
      const agent = agents[selectedIndex]
      if (agent) {
        // TODO: attach or read output
      }
    }
  })

  return (
    <Box flexDirection="column" width={width} height={height}>
      <SelectList
        items={agents}
        selectedIndex={selectedIndex}
        renderItem={(span, i, isSelected) => {
          const duration = formatDuration(span.started_at, span.finished_at)
          return (
            <Card
              title={String(span.data?.agent_type ?? span.name)}
              description={String(span.data?.prompt ?? "").slice(0, 40)}
              status={span.status as any}
              hint={
                span.status === "running"
                  ? "enter → suspend TUI, stream live PTY"
                  : "enter → replay stored PTY output"
              }
              isSelected={isSelected}
              width={width}
            />
          )
        }}
      />
    </Box>
  )
}
