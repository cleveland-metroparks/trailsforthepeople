import { useEffect, useMemo, useRef, useState } from 'react'
import { Box, Alert } from '@mantine/core'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useMapConfig } from '../hooks/useMapConfig'
import { FloatingSearch } from './FloatingSearch'
import { useMap } from '../contexts/MapContext'
import { useMapHover } from '../contexts/MapHoverContext'
import { useMapSelection } from '../contexts/MapSelectionContext'
import { useURLState } from '../hooks/useURLState'
import { useMapURLSync, getInitialMapStateFromURL } from '../hooks/useMapURLSync'
import { ResetMapControl } from './ResetMapControl'

function isValidGisId(value: unknown): boolean {
  if (value === null || value === undefined) return false
  if (typeof value === 'number') return value !== 0
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed !== '' && trimmed !== '0'
  }
  return true
}

function isClickableFeature(feature: mapboxgl.MapboxGeoJSONFeature): boolean {
  const props = (feature.properties ?? {}) as Record<string, unknown>
  return isValidGisId(props.gis_id)
}

function getFilteredFeatures(
  map: mapboxgl.Map,
  point: mapboxgl.PointLike,
  allowedLayerIds: Set<string>
): mapboxgl.MapboxGeoJSONFeature[] {
  return map.queryRenderedFeatures(point).filter((feature) => {
    const layerId = feature.layer?.id
    return layerId ? allowedLayerIds.has(layerId) : false
  })
}

function isAttractionGroupFeature(
  feature: mapboxgl.MapboxGeoJSONFeature,
  attractionGroupLayerIds: Set<string>
): boolean {
  const layerId = feature.layer?.id
  return layerId ? attractionGroupLayerIds.has(layerId) : false
}

export function MapView() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const { map: mapFromContext, setMap } = useMap()
  const { setHoverInfo } = useMapHover()
  const { bumpSelectionTick } = useMapSelection()
  const { setParams } = useURLState()
  const popupRef = useRef<mapboxgl.Popup | null>(null)
  const { mapConfig } = useMapConfig()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isContainerReady, setIsContainerReady] = useState(false)
  const attractionLayerIds = useMemo(
    () => new Set(['Attractions 1', 'Attractions 2', 'Attractions 3', 'Park Amenities']),
    []
  )
  const attractionGroupLayerIds = useMemo(
    () => new Set(['Attraction Groups 1', 'Attraction Groups 2', 'Attraction Groups 3', 'Attraction Groups Outliers']),
    []
  )
  const allowedLayerIds = useMemo(
    () => new Set([...attractionLayerIds, ...attractionGroupLayerIds]),
    [attractionLayerIds, attractionGroupLayerIds]
  )

  // Sync map position to URL
  useMapURLSync(mapFromContext)

  // Check if container is ready
  useEffect(() => {
    const checkContainer = () => {
      if (mapContainer.current && mapContainer.current.offsetWidth > 0 && mapContainer.current.offsetHeight > 0) {
        setIsContainerReady(true)
      } else {
        setTimeout(checkContainer, 100)
      }
    }

    checkContainer()
  }, [])


  useEffect(() => {
    if (map.current || !isContainerReady) return

    if (!mapConfig.accessToken) {
      setError('Mapbox access token is missing. Please check your environment variables.')
      setIsLoading(false)
      return
    }

    mapboxgl.accessToken = mapConfig.accessToken;

    try {
      // Get initial state from URL or use defaults
      const urlState = getInitialMapStateFromURL()
      const initialCenter: [number, number] = urlState.lat !== null && urlState.lng !== null
        ? [urlState.lng, urlState.lat]
        : mapConfig.startCenter
      const initialZoom = urlState.zoom !== null ? urlState.zoom : mapConfig.startZoom

      // Choose style based on URL 'base' param ('map' or 'photo')
      const initialStyle = urlState.base && mapConfig.styleLayers[urlState.base]
        ? mapConfig.styleLayers[urlState.base]
        : mapConfig.styleLayer

      map.current = new mapboxgl.Map({
        container: mapContainer.current!,
        style: initialStyle,
        center: initialCenter,
        zoom: initialZoom,
      })

      // Update context so other components can access the map
      setMap(map.current)

      // Add reset control (above zoom buttons)
      map.current.addControl(
        new ResetMapControl({
          center: mapConfig.startCenter,
          zoom: mapConfig.startZoom,
        }),
        'top-right'
      )

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

      map.current.addControl(
        new mapboxgl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true,
          },
          trackUserLocation: true,
        }),
        'top-right'
      )

      map.current.on('style.load', () => {
        setIsLoading(false)
      })

      map.current.on('error', () => {
        setError('Failed to load map. Please check your configuration.')
        setIsLoading(false)
      })

      const timeoutId = setTimeout(() => {
        if (map.current && map.current.isStyleLoaded()) {
          setIsLoading(false)
        } else {
          setError('Map failed to load.')
          setIsLoading(false)
        }
      }, 5000)

      return () => {
        clearTimeout(timeoutId)
        if (map.current) {
          setMap(null) // Clear map from context
          map.current.remove()
        }
      }
    } catch (err) {
      setError('Failed to initialize map. Please check your configuration.')
      setIsLoading(false)
      return () => {
        if (map.current) {
          setMap(null)
          map.current.remove()
        }
      }
    }
  }, [mapConfig, isContainerReady, setMap])

  useEffect(() => {
    if (!mapFromContext) return

    const handleMouseMove = (event: mapboxgl.MapMouseEvent) => {
      const features = getFilteredFeatures(mapFromContext, event.point, allowedLayerIds)

      setHoverInfo({
        lngLat: { lng: event.lngLat.lng, lat: event.lngLat.lat },
        point: { x: event.point.x, y: event.point.y },
        features,
      })

      if (features.length === 0) {
        mapFromContext.getCanvas().style.cursor = ''
        popupRef.current?.remove()
        return
      }

      const clickableFeature = features.find((candidate) => isClickableFeature(candidate))
      const attractionGroupFeature = features.find((candidate) =>
        isAttractionGroupFeature(candidate, attractionGroupLayerIds)
      )

      if (clickableFeature) {
        mapFromContext.getCanvas().style.cursor = 'pointer'
      } else if (attractionGroupFeature) {
        mapFromContext.getCanvas().style.cursor = 'zoom-in'
      } else {
        mapFromContext.getCanvas().style.cursor = ''
      }

      if (clickableFeature || attractionGroupFeature) {
        popupRef.current?.remove()
        return
      }

      const feature = features[0]
      const properties = (feature.properties ?? {}) as Record<string, unknown>

      const container = document.createElement('div')
      container.style.fontSize = '12px'
      container.style.lineHeight = '1.4'
      container.style.fontFamily = 'sans-serif'

      const nameValue = properties.name ?? '—'
      const parkValue = properties.res ?? '—'

      const titleRow = document.createElement('div')
      titleRow.textContent = String(nameValue)
      titleRow.style.fontWeight = '600'
      titleRow.style.marginBottom = '2px'
      container.appendChild(titleRow)

      const parkRow = document.createElement('div')
      parkRow.textContent = String(parkValue)
      container.appendChild(parkRow)

      if (!popupRef.current) {
        popupRef.current = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: 12,
        })
      }

      popupRef.current
        .setLngLat(event.lngLat)
        .setDOMContent(container)
        .addTo(mapFromContext)
    }

    const handleMouseOut = () => {
      mapFromContext.getCanvas().style.cursor = ''
      popupRef.current?.remove()
      setHoverInfo(null)
    }

    const handleClick = (event: mapboxgl.MapMouseEvent) => {
      const features = getFilteredFeatures(mapFromContext, event.point, allowedLayerIds)

      const clickableFeature = features.find((candidate) => isClickableFeature(candidate))
      const attractionGroupFeature = features.find((candidate) =>
        isAttractionGroupFeature(candidate, attractionGroupLayerIds)
      )

      if (!clickableFeature && attractionGroupFeature) {
        mapFromContext.flyTo({
          center: [event.lngLat.lng, event.lngLat.lat],
          zoom: 14,
        })
        return
      }

      if (!clickableFeature) {
        return
      }

      const props = (clickableFeature.properties ?? {}) as Record<string, unknown>
      const gisId = props.gis_id
      if (!isValidGisId(gisId)) {
        return
      }

      bumpSelectionTick()
      setParams(
        {
          type: 'attraction',
          gid: String(gisId),
          activityId: null,
          fromSearch: null,
        },
        false,
        true
      )
    }

    mapFromContext.on('mousemove', handleMouseMove)
    mapFromContext.on('mouseout', handleMouseOut)
    mapFromContext.on('click', handleClick)

    return () => {
      mapFromContext.off('mousemove', handleMouseMove)
      mapFromContext.off('mouseout', handleMouseOut)
      mapFromContext.off('click', handleClick)
      popupRef.current?.remove()
      popupRef.current = null
      mapFromContext.getCanvas().style.cursor = ''
      setHoverInfo(null)
    }
  }, [allowedLayerIds, attractionGroupLayerIds, mapFromContext, setHoverInfo, setParams])


  if (error) {
    return (
      <Box style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Alert title="Map Error" color="red">
          {error}
        </Alert>
      </Box>
    )
  }

  return (
    <Box className="map-container" style={{ width: '100%', height: '100%', position: 'relative' }}>
      <FloatingSearch />
      <div
        ref={mapContainer}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      />
      {isLoading && (
        <Box
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1000,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            padding: '1rem',
            borderRadius: '4px'
          }}
        >
          Loading map...
        </Box>
      )}
    </Box>
  )
}
