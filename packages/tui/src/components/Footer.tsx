import { Box, Text } from "ink"
import { PanelRegistry } from "../core/PanelRegistry"
import { Theme } from "../theme"

export function Footer({ focusedPanelId }: { focusedPanelId: string | null }) {
  const panel = focusedPanelId ? PanelRegistry.get(focusedPanelId) : null
  const hotkeys = [
    ...(panel?.hotkeys?.map(h => `${h.key} ${h.description}`) ?? []),
    "? help",
    "q quit",
  ]
  return (
    <Box height={1} justifyContent="space-between">
      <Box>
        {hotkeys.map((hk, i) => (
          <Box key={i} marginRight={1}>
            <Text backgroundColor={Theme.footer.badgeBg} color={Theme.footer.badgeText}>
              {" "}{hk}{" "}
            </Text>
          </Box>
        ))}
      </Box>
      <Text dimColor>{panel?.title ?? "No panel focused"}</Text>
    </Box>
  )
}
