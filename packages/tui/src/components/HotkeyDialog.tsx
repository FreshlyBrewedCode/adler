import { Box, Text } from "ink"

export function HotkeyDialog() {
  return (
    <Box flexDirection="column" borderStyle="round" padding={1}>
      <Text bold>Hotkeys</Text>
      <Box flexDirection="column" marginTop={1}>
        <Text bold underline>Global</Text>
        <Text>tab / shift+tab — next / prev tab</Text>
        <Text>1-5 — jump to tab</Text>
        <Text>q / ctrl+c — quit</Text>
        <Text>? — toggle help</Text>
      </Box>
      <Box flexDirection="column" marginTop={1}>
        <Text bold underline>Agents</Text>
        <Text>↑↓ — navigate</Text>
        <Text>enter — attach to running agent or read output</Text>
        <Text>o — open external (agent.attach hook)</Text>
      </Box>
      <Box flexDirection="column" marginTop={1}>
        <Text bold underline>Traces</Text>
        <Text>↑↓ — navigate</Text>
        <Text>enter — expand/collapse</Text>
      </Box>
      <Box flexDirection="column" marginTop={1}>
        <Text bold underline>Logs</Text>
        <Text>i/w/e — filter info/warn/error</Text>
        <Text>f — toggle auto-scroll</Text>
      </Box>
    </Box>
  )
}
