import { Box, Text } from "ink"
import { Theme } from "../theme"

export function Card({
  title,
  description,
  status,
  hint,
  isSelected,
  width,
  children,
}: {
  title: string
  description?: string
  status: "done" | "failed" | "blocked" | "running" | "pending"
  hint?: string
  isSelected?: boolean
  width?: number
  children?: React.ReactNode
}) {
  const statusColor = Theme.status[status]
  return (
    <Box
      width={width}
      borderStyle="round"
      borderColor={isSelected ? Theme.primary : undefined}
      flexDirection="row"
    >
      <Box width={2} flexDirection="column">
        <Text color={statusColor}>│</Text>
      </Box>
      <Box flexDirection="column" padding={1}>
        <Text bold color={statusColor}>{title}</Text>
        {description && <Text dimColor>{description}</Text>}
        {children}
        {hint && <Text dimColor> {hint}</Text>}
      </Box>
    </Box>
  )
}
