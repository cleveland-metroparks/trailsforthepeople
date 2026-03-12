import { Box, Text, Button, Divider, Anchor } from '@mantine/core'
import { ExternalLink } from 'tabler-icons-react'
import type { DirectionsResult } from '../../types/api'
import { ElevationProfileChart } from '../charts/ElevationProfileChart'

interface DirectionsResultDisplayProps {
  result: DirectionsResult
  onClear: () => void
  isMapboxRouted?: boolean
}

export function DirectionsResultDisplay({ result, onClear, isMapboxRouted }: DirectionsResultDisplayProps) {
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

      {/* Elevation profile (trail directions only) */}
      {result.elevationprofile &&
        result.elevationprofile.length >= 2 && (
          <>
            <Text size="sm" weight={600} mt="sm">
              Elevation Profile
            </Text>
            <ElevationProfileChart data={result.elevationprofile} height={160} />
          </>
        )}

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

      {isMapboxRouted && (
        <Text size="xs" color="dimmed">
          Directions provided by{' '}
          <Anchor href="https://www.mapbox.com/" target="_blank" rel="noreferrer" size="xs">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
              Mapbox
              <ExternalLink aria-hidden="true" size={12} color="#2f9e44" />
            </span>
          </Anchor>
          .
        </Text>
      )}

      {/* Clear button */}
      <Button variant="outline" size="xs" onClick={onClear}>
        Clear Route
      </Button>
    </>
  )
}
