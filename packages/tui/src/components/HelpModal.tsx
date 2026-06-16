import { Box, Text } from "ink"
import { PanelRegistry } from "../core/PanelRegistry"
import { Theme } from "../theme"

export function HelpModal({ onClose }: { onClose: () => void }) {
  const panels = PanelRegistry.getAll()
  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={Theme.primary}
      padding={1}
      width={60}
      height={20}
    >
      <Text bold color={Theme.primary}>Hotkeys</Text>
      <Box flexDirection="column" marginTop={1}>
        <Text bold underline>Global</Text>
        <Text>tab / shift+tab — next / prev focus</Text>
        <Text>q / ctrl+c — quit</Text>
        <Text>? — toggle help</Text>
      </Box>
      {panels.map(panel => (
        <Box key={panel.id} marginTop={1} flexDirection="column">
          <Text bold underline color={Theme.primary}>{panel.title}</Text>
          {panel.hotkeys?.map(hk => (
            <Text key={hk.key}>{hk.key} — {hk.description}</Text>
          ))}
        </Box>
      ))}
    </Box>
  )
}
