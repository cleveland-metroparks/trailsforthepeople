import { Box, Text, Button, Divider } from '@mantine/core'
import type { DirectionsResult } from '../../types/api'

interface DirectionsResultDisplayProps {
  result: DirectionsResult
  onClear: () => void
}

export function DirectionsResultDisplay({ result, onClear }: DirectionsResultDisplayProps) {
  return (
    <>
      <Divider />

      {/* Totals */}
      <Box>
        <Text size="sm" weight={700}>
          Total: {result.totals.distance}, {result.totals.duration}
        </Text>
        {result.retries && result.retries > 3 && (
          <Text size="xs" color="dimmed" mt={4}>
            Route may be approximated.
          </Text>
        )}
      </Box>

      {/* Turn-by-turn steps */}
      <Box
        component="ol"
        style={{
          margin: 0,
          paddingLeft: '1.25em',
          listStyleType: 'decimal',
        }}
      >
        {result.steps.map((step, idx) => (
          <Box component="li" key={idx} mb="xs">
            <Text size="sm">
              {step.step_action ? `${step.step_action} ` : ''}
              {step.text}
            </Text>
            {step.distance && step.duration && (
              <Text size="xs" color="dimmed">
                {step.distance}, {step.duration}
              </Text>
            )}
          </Box>
        ))}
      </Box>

      {/* Clear button */}
      <Button variant="outline" size="xs" onClick={onClear}>
        Clear Route
      </Button>
    </>
  )
}
