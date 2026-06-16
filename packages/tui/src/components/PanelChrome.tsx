import { Box, Text } from "ink"
import { Theme } from "../theme"

export function PanelChrome({
  title,
  width,
  height,
  isFocused = false,
  children,
}: {
  title: string
  width: number
  height: number
  isFocused?: boolean
  children: React.ReactNode
}) {
  return (
    <Box
      flexDirection="column"
      width={width}
      height={height}
      borderStyle="round"
      borderColor={isFocused ? Theme.panel.activeBorder : Theme.panel.border}
      label={<Text color={Theme.panel.title}>{title}</Text>}
      padding={1}
    >
      {children}
    </Box>
  )
}
