import { Box, Divider, Stack, Text, Title } from '@mantine/core'
import type { MapboxGeoJSONFeature } from 'mapbox-gl'
import { useMemo } from 'react'
import { useMapHover } from '../../contexts/MapHoverContext'

interface DebugPanelProps {
  onClose: () => void
}

function summarizeGeometry(geometry: GeoJSON.Geometry | null | undefined) {
  if (!geometry) return null

  switch (geometry.type) {
    case 'Point':
      return { type: geometry.type, coordinates: geometry.coordinates }
    case 'MultiPoint':
      return { type: geometry.type, pointCount: geometry.coordinates.length }
    case 'LineString':
      return { type: geometry.type, pointCount: geometry.coordinates.length }
    case 'MultiLineString':
      return {
        type: geometry.type,
        lineCount: geometry.coordinates.length,
        pointCount: geometry.coordinates.reduce((sum, line) => sum + line.length, 0),
      }
    case 'Polygon':
      return {
        type: geometry.type,
        ringCount: geometry.coordinates.length,
        pointCount: geometry.coordinates.reduce((sum, ring) => sum + ring.length, 0),
      }
    case 'MultiPolygon':
      return {
        type: geometry.type,
        polygonCount: geometry.coordinates.length,
        ringCount: geometry.coordinates.reduce((sum, poly) => sum + poly.length, 0),
        pointCount: geometry.coordinates.reduce(
          (sum, poly) => sum + poly.reduce((polySum, ring) => polySum + ring.length, 0),
          0
        ),
      }
    case 'GeometryCollection':
      return { type: geometry.type, geometryCount: geometry.geometries.length }
    default:
      return geometry
  }
}

function formatFeature(feature: MapboxGeoJSONFeature) {
  return {
    id: feature.id ?? null,
    layer: feature.layer
      ? {
          id: feature.layer.id,
          type: feature.layer.type,
          source: feature.layer.source,
          sourceLayer: feature.layer['source-layer'] ?? null,
          minzoom: feature.layer.minzoom ?? null,
          maxzoom: feature.layer.maxzoom ?? null,
        }
      : null,
    source: feature.source ?? null,
    state: feature.state ?? null,
    geometry: summarizeGeometry(feature.geometry),
    properties: feature.properties ?? null,
  }
}

export function DebugPanel(_props: DebugPanelProps) {
  const { hoverInfo } = useMapHover()
  const features = hoverInfo?.features ?? []

  const formattedFeatures = useMemo(() => {
    return features.map((feature) => formatFeature(feature))
  }, [features])

  const cursorLocation = hoverInfo?.lngLat
    ? `${hoverInfo.lngLat.lat.toFixed(5)}, ${hoverInfo.lngLat.lng.toFixed(5)}`
    : '—'

  return (
    <Box p="md" pr="sm" style={{ position: 'relative' }}>
      <Stack spacing="sm">
        <Title order={1} size="h3">
          Debug
        </Title>
        <Text size="sm" color="dimmed">
          Hover over map features to inspect Mapbox data.
        </Text>
        <Divider />
        <Text size="sm">Cursor: {cursorLocation}</Text>
        <Text size="sm">Features under cursor: {features.length}</Text>

        {features.length === 0 ? (
          <Text size="sm" color="dimmed">
            No rendered features at the cursor position.
          </Text>
        ) : (
          formattedFeatures.slice(0, 5).map((feature, index) => (
            <Box
              key={`${feature.layer?.id ?? 'layer'}-${index}`}
              style={{
                backgroundColor: '#f8f9fa',
                borderRadius: '6px',
                padding: '8px',
              }}
            >
              <Text size="xs" weight={600}>
                Feature {index + 1}
              </Text>
              <Text
                component="pre"
                size="xs"
                style={{
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'monospace',
                  marginTop: '6px',
                }}
              >
                {JSON.stringify(feature, null, 2)}
              </Text>
            </Box>
          ))
        )}

        {features.length > 5 && (
          <Text size="xs" color="dimmed">
            Showing first 5 features.
          </Text>
        )}
      </Stack>
    </Box>
  )
}
