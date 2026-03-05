import { useEffect, useMemo, useRef, useState } from 'react'
import { Box, Alert } from '@mantine/core'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useMapConfig } from '../hooks/useMapConfig'
import { FloatingSearch } from './FloatingSearch'
import { useActivitiesData } from '../hooks/useActivitiesData'
import { useParksData } from '../hooks/useParksData'
import { useReservationBoundaries } from '../hooks/useReservationBoundaries'
import { useSidebarAwarePadding } from '../hooks/useSidebarAwarePadding'
import { useMap } from '../contexts/MapContext'
import { useMapHover } from '../contexts/MapHoverContext'
import { useMapSelection } from '../contexts/MapSelectionContext'
import { useURLState } from '../hooks/useURLState'
import { useMapURLSync, getInitialMapStateFromURL } from '../hooks/useMapURLSync'
import { ResetMapControl } from './ResetMapControl'
import { clearParkHighlight, fadeOutParkHighlight, getBoundingBoxFromGeometry, highlightParkBoundary, zoomToFeature } from '../lib/mapUtils'
import type { Reservation } from '../types/api'

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

function isAttractionGroupFeature(
  feature: mapboxgl.MapboxGeoJSONFeature,
  attractionGroupLayerIds: Set<string>
): boolean {
  const layerId = feature.layer?.id
  return layerId ? attractionGroupLayerIds.has(layerId) : false
}

function normalizeParkName(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const normalized = value.trim().toLowerCase()
  return normalized.length > 0 ? normalized : null
}

function getParkLabelNamesAtPoint(
  features: mapboxgl.MapboxGeoJSONFeature[],
  parkLabelLayerIds: Set<string>
): string[] {
  const names: string[] = []
  const seen = new Set<string>()

  features.forEach((feature) => {
    const layerId = feature.layer?.id
    if (!layerId || !parkLabelLayerIds.has(layerId)) return

    const props = (feature.properties ?? {}) as Record<string, unknown>
    const normalizedName = normalizeParkName(props.pagetitle)
    if (!normalizedName || seen.has(normalizedName)) return

    seen.add(normalizedName)
    names.push(normalizedName)
  })

  return names
}

function filterFeaturesByLayerIds(
  features: mapboxgl.MapboxGeoJSONFeature[],
  layerIds: Set<string>
): mapboxgl.MapboxGeoJSONFeature[] {
  return features.filter((feature) => {
    const layerId = feature.layer?.id
    return layerId ? layerIds.has(layerId) : false
  })
}

function safeQueryRenderedFeatures(
  mapInstance: mapboxgl.Map,
  point: mapboxgl.PointLike
): mapboxgl.MapboxGeoJSONFeature[] {
  try {
    return mapInstance.queryRenderedFeatures(point)
  } catch {
    return []
  }
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

function setMapCanvasCursor(mapInstance: mapboxgl.Map, cursor: string): void {
  try {
    const canvas = mapInstance.getCanvas()
    if (canvas) {
      canvas.style.cursor = cursor
    }
  } catch {
    // Map may already be torn down; ignore cursor updates.
  }
}

export function MapView() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const { attractions, isLoading: isAttractionsLoading } = useActivitiesData()
  const { data: parks } = useParksData()
  const { data: reservationBoundaries } = useReservationBoundaries()
  const { map: mapFromContext, setMap } = useMap()
  const { setHoverInfo } = useMapHover()
  const { bumpSelectionTick } = useMapSelection()
  const { setParams } = useURLState()
  const popupRef = useRef<mapboxgl.Popup | null>(null)
  const labelHoveredParkNameRef = useRef<string | null>(null)
  const sidebarAwarePadding = useSidebarAwarePadding(120)
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
  const validGisIdSet = useMemo(() => {
    if (isAttractionsLoading) return null
    const set = new Set<string>()
    attractions.forEach((attraction) => {
      const id = normalizeGisId(attraction.gis_id ?? attraction.record_id)
      if (id) {
        set.add(id)
      }
    })
    return set
  }, [attractions, isAttractionsLoading])
  const parkLabelLayerIds = useMemo(
    () => new Set(['Park Labels 9', 'Park Labels 10-12']),
    []
  )
  const debugInteractiveLayerIds = useMemo(
    () => new Set([...allowedLayerIds, ...parkLabelLayerIds]),
    [allowedLayerIds, parkLabelLayerIds]
  )
  const debugExcludedLayerIds = useMemo(
    () => new Set(['park-highlight-layer', 'park-highlight-layer-outline']),
    []
  )
  const boundariesByParkName = useMemo(() => {
    if (!reservationBoundaries) return new Map<string, GeoJSON.Polygon | GeoJSON.MultiPolygon>()

    const boundaryMap = new Map<string, GeoJSON.Polygon | GeoJSON.MultiPolygon>()
    reservationBoundaries.forEach((boundary) => {
      const normalizedName = normalizeParkName(boundary.res)
      if (!normalizedName) return

      try {
        const geometry = JSON.parse(boundary.geom_geojson) as GeoJSON.Polygon | GeoJSON.MultiPolygon
        if (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon') {
          boundaryMap.set(normalizedName, geometry)
        }
      } catch (error) {
        console.error('Failed to parse reservation boundary geometry', error)
      }
    })
    return boundaryMap
  }, [reservationBoundaries])
  const parksByName = useMemo(() => {
    const parkMap = new Map<string, Reservation>()
    parks?.forEach((park) => {
      const normalizedName = normalizeParkName(park.pagetitle)
      if (!normalizedName) return
      parkMap.set(normalizedName, park)
    })
    return parkMap
  }, [parks])

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
      const rawAllFeatures = safeQueryRenderedFeatures(mapFromContext, event.point)
      const allFeatures = rawAllFeatures.filter((feature) => {
        const layerId = feature.layer?.id
        return layerId ? !debugExcludedLayerIds.has(layerId) : true
      })
      const features = filterFeaturesByLayerIds(allFeatures, allowedLayerIds)
      const debugFeatures = filterFeaturesByLayerIds(allFeatures, debugInteractiveLayerIds)

      // Keep debug payload updates resilient even if hover-specific logic fails.
      setHoverInfo({
        lngLat: { lng: event.lngLat.lng, lat: event.lngLat.lat },
        point: { x: event.point.x, y: event.point.y },
        features: debugFeatures,
        allFeatures,
      })

      const parkLabelNames = getParkLabelNamesAtPoint(allFeatures, parkLabelLayerIds)
      const clickableParkLabelName = parkLabelNames.find((name) => parksByName.has(name)) ?? null
      const highlightParkLabelName = parkLabelNames.find((name) => boundariesByParkName.has(name)) ?? null
      const hoveredParkGeometry = highlightParkLabelName
        ? boundariesByParkName.get(highlightParkLabelName) ?? null
        : null
      const hasClickableParkLabelHover = Boolean(clickableParkLabelName)

      if (hoveredParkGeometry && highlightParkLabelName && labelHoveredParkNameRef.current !== highlightParkLabelName) {
        highlightParkBoundary(mapFromContext, hoveredParkGeometry)
        labelHoveredParkNameRef.current = highlightParkLabelName
      } else if (!hoveredParkGeometry && labelHoveredParkNameRef.current) {
        clearParkHighlight(mapFromContext)
        labelHoveredParkNameRef.current = null
      }

      if (features.length === 0 && !hasClickableParkLabelHover) {
        setMapCanvasCursor(mapFromContext, '')
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
        setMapCanvasCursor(mapFromContext, 'pointer')
      } else if (hasClickableParkLabelHover) {
        setMapCanvasCursor(mapFromContext, 'pointer')
      } else if (attractionGroupFeature) {
        setMapCanvasCursor(mapFromContext, 'zoom-in')
      } else {
        setMapCanvasCursor(mapFromContext, '')
      }

      if (clickableFeature || attractionGroupFeature) {
        popupRef.current?.remove()
        return
      }

      if (features.length === 0) {
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
      setMapCanvasCursor(mapFromContext, '')
      popupRef.current?.remove()
      if (labelHoveredParkNameRef.current) {
        clearParkHighlight(mapFromContext)
        labelHoveredParkNameRef.current = null
      }
      setHoverInfo(null)
    }

    const handleClick = (event: mapboxgl.MapMouseEvent) => {
      const allFeatures = safeQueryRenderedFeatures(mapFromContext, event.point)
      const features = filterFeaturesByLayerIds(allFeatures, allowedLayerIds)

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
        const parkLabelNames = getParkLabelNamesAtPoint(allFeatures, parkLabelLayerIds)
        const normalizedParkName = parkLabelNames.find((name) => parksByName.has(name)) ?? null
        const park = normalizedParkName ? parksByName.get(normalizedParkName) : null
        const parkGeometry = normalizedParkName
          ? boundariesByParkName.get(normalizedParkName) ?? null
          : null

        if (!park) {
          return
        }

        let didZoom = false

        if (parkGeometry) {
          const boundingBox = getBoundingBoxFromGeometry(parkGeometry)
          if (boundingBox) {
            zoomToFeature(mapFromContext, boundingBox, { padding: sidebarAwarePadding })
            highlightParkBoundary(mapFromContext, parkGeometry)
            fadeOutParkHighlight(mapFromContext, 1000, 2000)
            didZoom = true
          }
        }

        if (!didZoom && park.boxw && park.boxs && park.boxe && park.boxn) {
          zoomToFeature(mapFromContext, {
            w: park.boxw,
            s: park.boxs,
            e: park.boxe,
            n: park.boxn,
          }, {
            padding: sidebarAwarePadding,
          })
          didZoom = true
        }

        if (!didZoom && park.latitude && park.longitude) {
          zoomToFeature(mapFromContext, {
            lat: park.latitude,
            lng: park.longitude,
          }, {
            padding: sidebarAwarePadding,
          })
        }

        bumpSelectionTick()
        setParams(
          {
            type: 'park',
            gid: String(park.record_id),
            activityId: null,
            fromSearch: null,
          },
          false,
          true
        )
        return
      }

      if (!clickableFeature) {
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
      if (labelHoveredParkNameRef.current) {
        clearParkHighlight(mapFromContext)
        labelHoveredParkNameRef.current = null
      }
      setMapCanvasCursor(mapFromContext, '')
      setHoverInfo(null)
    }
  }, [
    allowedLayerIds,
    attractionGroupLayerIds,
    boundariesByParkName,
    bumpSelectionTick,
    debugExcludedLayerIds,
    debugInteractiveLayerIds,
    mapFromContext,
    parkLabelLayerIds,
    parksByName,
    sidebarAwarePadding,
    setHoverInfo,
    setParams,
    validGisIdSet,
  ])


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
    </Box>
  )
}
