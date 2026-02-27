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

function transformData(data: ElevationProfilePoint[]) {
  return data.map((p) => ({
    x: p.x / FEET_TO_MILES,
    y: p.y,
  }))
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

  const minElev = Math.min(...data.map((p) => p.y))
  const maxElev = Math.max(...data.map((p) => p.y))
  const totalMiles = data.length > 0 ? data[data.length - 1].x / FEET_TO_MILES : 0

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
            domain={['dataMin', 'dataMax']}
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
