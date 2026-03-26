import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { Box, Alert, Loader } from '@mantine/core'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useMapConfig } from '../hooks/useMapConfig'
import { FloatingSearch } from './FloatingSearch'
import { useActivitiesData } from '../hooks/useActivitiesData'
import { useMap } from '../contexts/MapContext'
import { useMapHover } from '../contexts/MapHoverContext'
import { useMapSelection } from '../contexts/MapSelectionContext'
import { useURLState } from '../hooks/useURLState'
import { useMapURLSync, getInitialMapStateFromURL } from '../hooks/useMapURLSync'
import { ResetMapControl } from './ResetMapControl'
import { useSidebar } from '../contexts/SidebarContext'
import { useDirections } from '../contexts/DirectionsContext'

function normalizeGisId(value: unknown): string | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value === 0) return null
    return String(value)
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed !== '' && trimmed !== '0' ? trimmed : null
  }
  return null
}

function isValidGisId(value: unknown, validIds: Set<string> | null): boolean {
  const normalized = normalizeGisId(value)
  if (!normalized || !validIds) return false
  return validIds.has(normalized)
}

function isClickableFeature(
  feature: mapboxgl.MapboxGeoJSONFeature,
  validIds: Set<string> | null
): boolean {
  const props = (feature.properties ?? {}) as Record<string, unknown>
  return isValidGisId(props.gis_id, validIds)
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

function annotateMapControlButtons(mapInstance: mapboxgl.Map) {
  const container = mapInstance.getContainer()
  const buttons = container.querySelectorAll<HTMLButtonElement>('.mapboxgl-ctrl-group button')

  buttons.forEach((button) => {
    if (button.getAttribute('aria-label')) return

    const className = button.className
    if (className.includes('mapboxgl-ctrl-zoom-in')) {
      button.setAttribute('aria-label', 'Zoom in')
    } else if (className.includes('mapboxgl-ctrl-zoom-out')) {
      button.setAttribute('aria-label', 'Zoom out')
    } else if (className.includes('mapboxgl-ctrl-compass')) {
      button.setAttribute('aria-label', 'Reset north')
    } else if (className.includes('mapboxgl-ctrl-geolocate')) {
      button.setAttribute('aria-label', 'Show current location')
    } else {
      button.setAttribute('aria-label', 'Map control')
    }
  })
}

export function MapView() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const { attractions, isLoading: isAttractionsLoading } = useActivitiesData()
  const { map: mapFromContext, setMap } = useMap()
  const { setHoverInfo } = useMapHover()
  const { bumpSelectionTick } = useMapSelection()
  const { setParams } = useURLState()
  const popupRef = useRef<mapboxgl.Popup | null>(null)
  const { mapConfig } = useMapConfig()
  const { isMobile, activePanel, onClosePanel } = useSidebar()
  const isMobileRef = useRef(isMobile)
  isMobileRef.current = isMobile
  const { isDirectionsLoading, directionsEndpoints } = useDirections()
  const [spinnerPos, setSpinnerPos] = useState<{ x: number; y: number } | null>(null)
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
  const validGisIdSet = useMemo(() => {
    if (isAttractionsLoading) return null
    const set = new Set<string>()
    attractions.forEach((attraction) => {
      const id = normalizeGisId(attraction.gis_id)
      if (id) {
        set.add(id)
      }
    })
    return set
  }, [attractions, isAttractionsLoading])

  // Sync map position to URL
  useMapURLSync(mapFromContext)

  // Track midpoint screen position of directions from/to while loading
  const computeSpinnerPos = useCallback(() => {
    if (!mapFromContext || !directionsEndpoints) {
      setSpinnerPos(null)
      return
    }
    const fromPx = mapFromContext.project([directionsEndpoints.from.lng, directionsEndpoints.from.lat])
    const toPx = mapFromContext.project([directionsEndpoints.to.lng, directionsEndpoints.to.lat])
    setSpinnerPos({ x: (fromPx.x + toPx.x) / 2, y: (fromPx.y + toPx.y) / 2 })
  }, [mapFromContext, directionsEndpoints])

  useEffect(() => {
    if (!isDirectionsLoading || !mapFromContext) {
      setSpinnerPos(null)
      return
    }
    computeSpinnerPos()
    mapFromContext.on('move', computeSpinnerPos)
    return () => { mapFromContext.off('move', computeSpinnerPos) }
  }, [isDirectionsLoading, mapFromContext, computeSpinnerPos])

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
    if (map.current || !isContainerReady || !mapContainer.current) return

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
        container: mapContainer.current,
        style: initialStyle,
        center: initialCenter,
        zoom: initialZoom,
        attributionControl: false,
      })

      map.current.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-left')

      // Update context so other components can access the map
      setMap(map.current)

      // Add reset control (above zoom buttons)
      map.current.addControl(
        new ResetMapControl({
          center: mapConfig.startCenter,
          getZoom: () => isMobileRef.current ? mapConfig.mobileStartZoom : mapConfig.startZoom,
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
      annotateMapControlButtons(map.current)

      let loadTimeoutId: ReturnType<typeof setTimeout> | null = null
      let hasLoaded = false

      map.current.on('style.load', () => {
        hasLoaded = true
        if (map.current) {
          annotateMapControlButtons(map.current)
        }
        if (loadTimeoutId) {
          clearTimeout(loadTimeoutId)
          loadTimeoutId = null
        }
        setIsLoading(false)
      })

      map.current.on('error', (e) => {
        // Only set error if we haven't successfully loaded yet
        // Ignore errors that occur after initial load (e.g., during style switches)
        if (!hasLoaded) {
          console.error('Mapbox error:', e)
          setError('Failed to load map. Please check your configuration.')
          setIsLoading(false)
        }
      })

      loadTimeoutId = setTimeout(() => {
        // Only show timeout error if we haven't successfully loaded yet
        if (!hasLoaded) {
          if (map.current && map.current.isStyleLoaded()) {
            hasLoaded = true
            setIsLoading(false)
          } else {
            setError('Map failed to load. Please try refreshing the page.')
            setIsLoading(false)
          }
        }
      }, 10000)

      return () => {
        if (loadTimeoutId) {
          clearTimeout(loadTimeoutId)
        }
        if (map.current) {
          setMap(null) // Clear map from context
          map.current.remove()
        }
      }
    } catch (err) {
      console.error('Map initialization error:', err)
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
      const allFeatures = mapFromContext.queryRenderedFeatures(event.point)

      setHoverInfo({
        lngLat: { lng: event.lngLat.lng, lat: event.lngLat.lat },
        point: { x: event.point.x, y: event.point.y },
        features,
        allFeatures,
      })

      if (features.length === 0) {
        mapFromContext.getCanvas().style.cursor = ''
        popupRef.current?.remove()
        return
      }

      const clickableFeature = features.find((candidate) =>
        isClickableFeature(candidate, validGisIdSet)
      )
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

      const clickableFeature = features.find((candidate) =>
        isClickableFeature(candidate, validGisIdSet)
      )
      const attractionGroupFeature = features.find((candidate) =>
        isAttractionGroupFeature(candidate, attractionGroupLayerIds)
      )

      if (!clickableFeature && attractionGroupFeature) {
        mapFromContext.flyTo({
          center: [event.lngLat.lng, event.lngLat.lat],
          zoom: 16.5,
        })
        return
      }

      if (!clickableFeature) {
        if (isMobile && activePanel !== null) onClosePanel()
        return
      }

      const props = (clickableFeature.properties ?? {}) as Record<string, unknown>
      const gisId = props.gis_id
      if (!isValidGisId(gisId, validGisIdSet)) {
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
  }, [activePanel, allowedLayerIds, attractionGroupLayerIds, bumpSelectionTick, isMobile, mapFromContext, onClosePanel, setHoverInfo, setParams, validGisIdSet])


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
      <Box
        id="map-keyboard-instructions"
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
        Interactive map of Cleveland Metroparks. Use Tab to reach map controls for zoom, location, and reset.
      </Box>
      <div
        ref={mapContainer}
        role="region"
        aria-label="Interactive Cleveland Metroparks map"
        aria-describedby="map-keyboard-instructions"
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '16px',
          left: '55%',
          backgroundColor: 'rgba(255, 252, 245, 0.75)',
          borderRadius: '14px',
          padding: '8px 12px',
          transform: 'translateX(-50%)',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      >
        <img
          src="/cleveland-metroparks-logo-horiz.png"
          alt="Cleveland Metroparks"
          style={{
            height: '30px',
            filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))',
          }}
        />
      </div>
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
      {isDirectionsLoading && (
        <Box
          aria-live="polite"
          aria-label="Getting directions"
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 500,
            backgroundColor: 'rgba(0, 0, 0, 0.25)',
            pointerEvents: 'all',
          }}
        >
          <Box
            style={{
              position: 'absolute',
              left: spinnerPos ? spinnerPos.x : '50%',
              top: spinnerPos ? spinnerPos.y : '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'rgba(255, 255, 255, 0.92)',
              padding: '0.5rem 1rem',
              borderRadius: '2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            <Loader size="xs" color="green" />
            <span style={{ fontSize: '0.875rem', color: '#333' }}>Getting directions...</span>
          </Box>
        </Box>
      )}
    </Box>
  )
}
