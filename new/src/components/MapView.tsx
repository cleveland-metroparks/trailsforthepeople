import { useEffect, useRef, useState } from 'react'
import { Box, Alert } from '@mantine/core'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useMapConfig } from '../hooks/useMapConfig'

export function MapView() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const { mapConfig } = useMapConfig()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isContainerReady, setIsContainerReady] = useState(false)

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
      map.current = new mapboxgl.Map({
        container: mapContainer.current!,
        style: mapConfig.styleLayer,
        center: mapConfig.startCenter,
        zoom: mapConfig.startZoom,
      })

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

      setTimeout(() => {
        if (isLoading) {
          if (map.current && map.current.isStyleLoaded()) {
            setIsLoading(false)
          } else {
            setError('Map failed to load.')
            setIsLoading(false)
          }
        }
      }, 5000)

    } catch (err) {
      setError('Failed to initialize map. Please check your configuration.')
      setIsLoading(false)
    }

    return () => {
      if (map.current) {
        map.current.remove()
      }
    }
  }, [mapConfig, isContainerReady])

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
    <Box style={{ width: '100%', height: '100%', position: 'relative' }}>
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
