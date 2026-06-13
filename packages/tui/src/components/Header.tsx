import { Box, Text } from "ink"
import type { Session } from "@adler/sdk"

export function Header({ session, activeTab }: { session: Session | null; activeTab: number }) {
  const tabs = ["Overview", "Context", "Agents", "Traces", "Logs"]
  return (
    <Box flexDirection="column">
      <Box>
        <Text bold>adler</Text>
        <Text> · session: {session?.id.slice(0, 6)}</Text>
        <Text> · {session?.status}</Text>
        <Text> · {session?.working_dir}</Text>
      </Box>
      <Box>
        {tabs.map((t, i) => (
          <Text key={t} bold={i === activeTab} color={i === activeTab ? "blue" : undefined}>
            [{i + 1}: {t}]{" "}
          </Text>
        ))}
      </Box>
    </Box>
  )
}
