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
import { drawDirectionsLine, clearDirectionsLine, zoomToDirectionsBounds } from '../../lib/mapUtils'
import { FeatureAutocompleteInput } from '../inputs/FeatureAutocompleteInput'
import { ViaModeSelector } from '../ViaModeSelector'
import { DirectionsResultDisplay } from './DirectionsResultDisplay'
import type { DirectionsResult } from '../../types/api'

interface DirectionsPanelProps {
  onClose: () => void
}

export function DirectionsPanel(_props: DirectionsPanelProps) {
  const { target, via, setVia, closeDirections } = useDirections()
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

  const handleGetDirections = async () => {
    setErrorMsg(null)
    setResult(null)
    clearDirectionsLine(map)
    setIsLoading(true)

    try {
      const source = await resolveLocation(sourceText, sourceLngLat)
      if (!source) {
        setErrorMsg('Please enter a starting location (From).')
        setIsLoading(false)
        return
      }
      setSourceLngLat(source)

      const destination = await resolveLocation(targetText, targetLngLat)
      if (!destination) {
        setErrorMsg('Please enter a destination (To).')
        setIsLoading(false)
        return
      }
      setTargetLngLat(destination)

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
            setSourceText(s.text)
            setSourceLngLat({ lat: s.lat, lng: s.lng })
            setResult(null)
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
            setTargetText(s.text)
            setTargetLngLat({ lat: s.lat, lng: s.lng })
            setResult(null)
          }}
        />

        <Button
          fullWidth
          loading={isLoading}
          onClick={handleGetDirections}
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
