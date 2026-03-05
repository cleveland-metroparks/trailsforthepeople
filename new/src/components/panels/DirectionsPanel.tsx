import {
  Box, Stack, Button, Loader,
  ActionIcon, Tooltip, Alert,
} from '@mantine/core'
import { CurrentLocation } from 'tabler-icons-react'
import { useState, useRef, useEffect } from 'react'
import { PanelHeader } from '../PanelHeader'
import { BackButton } from '../BackButton'
import { useDirections } from '../../contexts/DirectionsContext'
import { useMap } from '../../contexts/MapContext'
import { useSidebarAwarePadding } from '../../hooks/useSidebarAwarePadding'
import { useResolveLocation } from '../../hooks/useResolveLocation'
import { getDirections as fetchDirections } from '../../lib/api'
import { wktToGeoJSON } from '../../lib/wktUtils'
import {
  drawDirectionsLine,
  drawDirectionsEndpoints,
  clearAttractionMarker,
  clearDirectionsLine,
  clearParkHighlight,
  clearTrailHighlight,
  zoomToDirectionsEndpoints,
  zoomToDirectionsBounds,
} from '../../lib/mapUtils'
import { FeatureAutocompleteInput } from '../inputs/FeatureAutocompleteInput'
import { ViaModeSelector } from '../ViaModeSelector'
import { DirectionsResultDisplay } from './DirectionsResultDisplay'
import type { DirectionsResult } from '../../types/api'

interface DirectionsPanelProps {
  onClose: () => void
}

interface DirectionsInputs {
  sourceText: string
  targetText: string
  sourceLngLat: { lat: number; lng: number } | null
  targetLngLat: { lat: number; lng: number } | null
}

export function DirectionsPanel(_props: DirectionsPanelProps) {
  const { target, via, setVia, closeDirections, openRequestId } = useDirections()
  const { map } = useMap()
  const sidebarAwarePadding = useSidebarAwarePadding(120)
  const resolveLocation = useResolveLocation()

  const [sourceText, setSourceText] = useState('')
  const [targetText, setTargetText] = useState(target?.name ?? '')
  const [sourceLngLat, setSourceLngLat] = useState<{ lat: number; lng: number } | null>(null)
  const [targetLngLat, setTargetLngLat] = useState<{ lat: number; lng: number } | null>(
    target ? { lat: target.lat, lng: target.lng } : null
  )

  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [result, setResult] = useState<DirectionsResult | null>(null)

  const prevTargetRef = useRef(target)
  const prevOpenRequestIdRef = useRef(openRequestId)

  useEffect(() => {
    if (openRequestId > prevOpenRequestIdRef.current) {
      setSourceText('')
      setSourceLngLat(null)
      setResult(null)
      setErrorMsg(null)
    }
    prevOpenRequestIdRef.current = openRequestId
  }, [openRequestId])

  useEffect(() => {
    if (target && target !== prevTargetRef.current) {
      setTargetText(target.name)
      setTargetLngLat({ lat: target.lat, lng: target.lng })
      setResult(null)
      setErrorMsg(null)
    }
    prevTargetRef.current = target
  }, [target])

  useEffect(() => {
    return () => {
      clearDirectionsLine(map)
    }
  }, [map])

  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setSourceText(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`)
        setSourceLngLat({ lat: latitude, lng: longitude })
      },
      () => {
        setErrorMsg('Unable to retrieve your location.')
      }
    )
  }

  const handleGetDirections = async (overrides?: Partial<DirectionsInputs>) => {
    const sourceTextValue = overrides?.sourceText ?? sourceText
    const targetTextValue = overrides?.targetText ?? targetText
    const sourceLngLatValue = overrides?.sourceLngLat ?? sourceLngLat
    const targetLngLatValue = overrides?.targetLngLat ?? targetLngLat

    setErrorMsg(null)
    setResult(null)
    clearDirectionsLine(map)
    clearAttractionMarker(map)
    clearTrailHighlight(map)
    clearParkHighlight(map)
    setIsLoading(true)

    try {
      const source = await resolveLocation(sourceTextValue, sourceLngLatValue)
      if (!source) {
        setErrorMsg('Please enter a starting location (From).')
        setIsLoading(false)
        return
      }
      setSourceLngLat(source)

      const destination = await resolveLocation(targetTextValue, targetLngLatValue)
      if (!destination) {
        setErrorMsg('Please enter a destination (To).')
        setIsLoading(false)
        return
      }
      setTargetLngLat(destination)

      if (map) {
        drawDirectionsEndpoints(map, source, destination)
        zoomToDirectionsEndpoints(map, source, destination, sidebarAwarePadding)
      }

      const directions = await fetchDirections(
        source.lat,
        source.lng,
        destination.lat,
        destination.lng,
        via
      )

      if (!directions || !directions.wkt) {
        let msg = 'Could not find directions for this start and endpoint.'
        if (via !== 'hike' && via !== 'car' && via !== 'bus') {
          msg += '\nTry a different type of trail, terrain, or difficulty.'
        }
        setErrorMsg(msg)
        setIsLoading(false)
        return
      }

      setResult(directions)

      const geojson = wktToGeoJSON(directions.wkt)
      if (geojson && map) {
        drawDirectionsLine(map, geojson, directions.start, directions.end)
        zoomToDirectionsBounds(map, directions.bounds, sidebarAwarePadding)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error getting directions.'
      setErrorMsg(message)
    } finally {
      setIsLoading(false)
    }
  }

  const maybeAutoGetDirections = (nextInputs: DirectionsInputs) => {
    if (isLoading) return
    if (!nextInputs.sourceLngLat || !nextInputs.targetLngLat) return
    void handleGetDirections(nextInputs)
  }

  const handleBack = () => {
    clearDirectionsLine(map)
    closeDirections()
  }

  const handleSourceChange = (val: string) => {
    setSourceText(val)
    setSourceLngLat(null)
    setResult(null)
  }

  const handleTargetChange = (val: string) => {
    setTargetText(val)
    setTargetLngLat(null)
    setResult(null)
  }

  const handleClearRoute = () => {
    setResult(null)
    clearDirectionsLine(map)
  }

  return (
    <Box p="md" pr="sm" style={{ position: 'relative' }}>
      <PanelHeader title="Directions" />
      <Stack spacing="md">
        <BackButton onClick={handleBack} />

        <ViaModeSelector value={via} onChange={setVia} variant="full" />

        <FeatureAutocompleteInput
          inputId="directions-from-input"
          isPrimaryFocusTarget
          label="From"
          value={sourceText}
          onChange={handleSourceChange}
          onSelect={(s) => {
            const nextSourceText = s.text
            const nextSourceLngLat = { lat: s.lat, lng: s.lng }
            setSourceText(nextSourceText)
            setSourceLngLat(nextSourceLngLat)
            setResult(null)
            maybeAutoGetDirections({
              sourceText: nextSourceText,
              sourceLngLat: nextSourceLngLat,
              targetText,
              targetLngLat,
            })
          }}
          rightSection={
            <Tooltip label="Use my location" withArrow>
              <ActionIcon size="sm" onClick={handleGeolocate}>
                <CurrentLocation size={16} color="#6AB03E" />
              </ActionIcon>
            </Tooltip>
          }
        />

        <FeatureAutocompleteInput
          label="To"
          value={targetText}
          onChange={handleTargetChange}
          onSelect={(s) => {
            const nextTargetText = s.text
            const nextTargetLngLat = { lat: s.lat, lng: s.lng }
            setTargetText(nextTargetText)
            setTargetLngLat(nextTargetLngLat)
            setResult(null)
            maybeAutoGetDirections({
              sourceText,
              sourceLngLat,
              targetText: nextTargetText,
              targetLngLat: nextTargetLngLat,
            })
          }}
        />

        <Button
          fullWidth
          loading={isLoading}
          onClick={() => {
            void handleGetDirections()
          }}
          styles={{
            root: {
              backgroundColor: '#6AB03E',
              '&:hover': { backgroundColor: '#5a9a34' },
            },
          }}
        >
          Get Directions
        </Button>

        {errorMsg && (
          <Alert color="red" title="Directions Error" withCloseButton onClose={() => setErrorMsg(null)}>
            {errorMsg}
          </Alert>
        )}

        {isLoading && (
          <Box style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
            <Loader size="sm" />
          </Box>
        )}

        {result && <DirectionsResultDisplay result={result} onClear={handleClearRoute} />}
      </Stack>
    </Box>
  )
}
