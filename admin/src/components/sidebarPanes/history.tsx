import { Box, Text, ScrollArea } from "@mantine/core";
import type { LineStringFeature } from "../../types/trail";

interface HistoryProps {
  waypointHistory: LineStringFeature[];
  historyIndex: number;
}

/**
 * History - Shows waypoints undo/redo history for debugging
 */
export function History({ waypointHistory, historyIndex }: HistoryProps) {
  if (!waypointHistory || waypointHistory.length === 0) {
    return (
      <Box>
        <Text size="sm" c="dimmed">
          No history available
        </Text>
      </Box>
    );
  }

  return (
    <Box>
      <Text size="sm" mb="xs" fw={500}>
        History ({waypointHistory.length} items, index: {historyIndex})
      </Text>
      <ScrollArea h={400}>
        {waypointHistory.map((item, index) => {
          const isCurrent = index === historyIndex;
          const coordinates = item.geometry?.coordinates || [];
          const coordCount = coordinates.length;

          return (
            <Box
              key={index}
              p="xs"
              mb="xs"
              style={{
                backgroundColor: isCurrent ? "#e3f2fd" : "transparent",
                border: isCurrent ? "1px solid #2196f3" : "1px solid #e0e0e0",
                borderRadius: "4px",
                fontFamily: "monospace",
                fontSize: "12px",
              }}
            >
              <Text size="xs" fw={isCurrent ? 600 : 400}>
                [{index}] {coordCount} waypoints
              </Text>
              {coordinates.length > 0 && (
                <Text size="xs" c="dimmed" mt={4}>
                  {coordinates
                    .map(
                      (coord) =>
                        `[${coord[0].toFixed(4)}, ${coord[1].toFixed(4)}]`
                    )
                    .join(", ")}
                </Text>
              )}
            </Box>
          );
        })}
      </ScrollArea>
    </Box>
  );
}
