import { Box, Text } from "ink"

export function PanelChrome({
  title,
  width,
  height,
  children,
}: {
  title: string
  width: number
  height: number
  children: React.ReactNode
}) {
  return (
    <Box flexDirection="column" width={width} height={height}>
      <Box height={1}>
        <Text bold underline>{title}</Text>
      </Box>
      <Box flexGrow={1} overflow="hidden">
        {children}
      </Box>
    </Box>
  )
}
