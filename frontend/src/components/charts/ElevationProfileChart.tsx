import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { Box } from '@mantine/core'

const FEET_TO_MILES = 5280

export interface ElevationProfilePoint {
  x: number // distance in feet
  y: number // elevation in feet
}

interface ElevationProfileChartProps {
  data: ElevationProfilePoint[]
  height?: number
  ariaLabel?: string
}

/**
 * Normalize and transform elevation profile data for charting.
 * Handles:
 * - String values from API (parse to numbers)
 * - Swapped x/y (some APIs return elevation in x, distance in y)
 * - Unsorted data (must be ordered by distance for correct line)
 */
function transformData(data: ElevationProfilePoint[]) {
  if (!data || data.length < 2) return []

  const parsed = data
    .map((p) => ({ x: Number(p.x), y: Number(p.y) }))
    .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y))

  if (parsed.length < 2) return []

  const xRange = Math.max(...parsed.map((p) => p.x)) - Math.min(...parsed.map((p) => p.x))
  const yRange = Math.max(...parsed.map((p) => p.y)) - Math.min(...parsed.map((p) => p.y))

  // Some APIs return { x: elevation, y: distance } instead of { x: distance, y: elevation }.
  // Distance in feet (e.g. 0–40k) has much larger range than elevation (e.g. 200–1500).
  const swapped = yRange > xRange

  const normalized = swapped
    ? parsed.map((p) => ({ dist: p.y / FEET_TO_MILES, elev: p.x }))
    : parsed.map((p) => ({ dist: p.x / FEET_TO_MILES, elev: p.y }))

  return normalized.sort((a, b) => a.dist - b.dist).map((p) => ({ x: p.dist, y: p.elev }))
}

function formatDistance(value: number): string {
  return `${value.toFixed(2)} mi`
}

function formatElevation(value: number): string {
  return `${Math.round(value)} ft`
}

export function ElevationProfileChart({
  data,
  height = 180,
  ariaLabel = 'Elevation profile: distance in miles, elevation in feet',
}: ElevationProfileChartProps) {
  const chartData = transformData(data)

  if (chartData.length < 2) return null

  const minElev = Math.min(...chartData.map((p) => p.y))
  const maxElev = Math.max(...chartData.map((p) => p.y))
  const totalMiles = chartData[chartData.length - 1].x

  // Add padding so the curve doesn't touch the chart edges
  const elevPadding = Math.max((maxElev - minElev) * 0.05, 10)
  const yDomain: [number, number] = [minElev - elevPadding, maxElev + elevPadding]

  return (
    <Box
      role="img"
      aria-label={ariaLabel}
      style={{ width: '100%', height }}
    >
      <Box
        component="span"
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
      >
        Elevation profile: min {formatElevation(minElev)}, max{' '}
        {formatElevation(maxElev)}, total distance {formatDistance(totalMiles)}.
      </Box>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis
            dataKey="x"
            type="number"
            domain={['dataMin', 'dataMax']}
            tickFormatter={formatDistance}
            tick={{ fontSize: 11 }}
            label={{
              value: 'Distance (miles)',
              position: 'insideBottom',
              offset: -4,
              style: { fontSize: 11 },
            }}
          />
          <YAxis
            dataKey="y"
            type="number"
            domain={yDomain}
            tickFormatter={formatElevation}
            tick={{ fontSize: 11 }}
            label={{
              value: 'Elevation (ft)',
              angle: -90,
              position: 'insideLeft',
              style: { fontSize: 11 },
            }}
          />
          <Tooltip
            formatter={(value: number) => [formatElevation(value), 'Elevation']}
            labelFormatter={(label: number) => `Distance: ${formatDistance(label)}`}
            contentStyle={{
              fontSize: 12,
              borderRadius: 4,
            }}
          />
          <Line
            type="monotone"
            dataKey="y"
            stroke="#6AB03E"
            strokeWidth={2}
            dot={false}
            isAnimationActive={true}
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  )
}
