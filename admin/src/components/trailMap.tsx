import { useState, useRef, useCallback, useEffect } from 'react';
import { useQuery } from "@tanstack/react-query";
import { LngLat, LngLatBounds } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { Source, NavigationControl, Layer } from 'react-map-gl/mapbox';
import type { LineLayerSpecification } from 'mapbox-gl';
import * as ReactMapGl from 'react-map-gl/mapbox'; // For "Map", to avoid collision
import type { MapRef, ViewStateChangeEvent } from 'react-map-gl/mapbox';
import type { MapEvent } from 'mapbox-gl';
import { Text, Button, Group, Box, Flex, Autocomplete, Select, Loader } from '@mantine/core';
import DrawControl from './draw-control';

import { mapsApiClient } from "../components/mapsApi";
import type { Trail } from "../types/trail";
import { travelModeSelectOptions } from "../types/trail";
import styles from './trailMap.module.css';

interface TrailMapProps {
  trail: Trail;
  trailGeom: string;
  mapBounds: LngLatBounds;
  waypointsFeature: Object;
  waypointsForDraw: Object;
  onDrawCreate: (e: {features: object[]}) => void;
  onDrawUpdate: (e: {features: object[]; action: string}) => void;
  onDrawDelete: (e: {features: object[]}) => void;
  doCompleteTrail: () => void;
  activeTab: string;
  onTravelModeChange: (string) => void;
  onElevationProfileToggle: () => void;
  showElevationProfile: boolean;
  isRouting: boolean;
}

/**
 * Trail Map
 *
 * @param props
 * @returns
 */
export function TrailMap(props: TrailMapProps) {
  // if (props.trailGeom == null) {
  //   props.trailGeom = '{"type":"MultiLineString","coordinates":[]}';
  // }
  const mapRef = useRef<MapRef>(null);

  const [currentTab, setCurrentTab] = useState(props.activeTab);

  // Map resize functionality
  const [mapHeight, setMapHeight] = useState(600);
  const [isDragging, setIsDragging] = useState(false);
  const dragStateRef = useRef({
    startY: 0,
    startHeight: 600,
    isDragging: false
  });

  const [mapViewState, setMapViewState] = useState({
    longitude: parseFloat(process.env.REACT_APP_MAP_DEFAULT_CENTER_LNG),
    latitude: parseFloat(process.env.REACT_APP_MAP_DEFAULT_CENTER_LAT),
    zoom: parseFloat(process.env.REACT_APP_MAP_DEFAULT_ZOOM),
  });

  // Trigger map resize when height changes
  useEffect(() => {
    if (mapRef.current) {
      // Small delay to ensure DOM has updated
      const timeoutId = setTimeout(() => {
        mapRef.current?.resize();
      }, 10);

      return () => clearTimeout(timeoutId);
    }
  }, [mapHeight]);

  // Drag handlers for map resize
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragStateRef.current.isDragging) return;

    const deltaY = e.clientY - dragStateRef.current.startY;
    const newHeight = Math.max(200, dragStateRef.current.startHeight + deltaY);
    setMapHeight(newHeight);
  }, []);

  const handleMouseUp = useCallback(() => {
    dragStateRef.current.isDragging = false;
    setIsDragging(false);

    // Remove document-level event listeners
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    dragStateRef.current.isDragging = true;
    dragStateRef.current.startY = e.clientY;
    dragStateRef.current.startHeight = mapHeight;
    setIsDragging(true);

    // Add document-level event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [mapHeight, handleMouseMove, handleMouseUp]);

  // Park features for the ZoomTo autocomplete field
  const [autocompleteData, setAutocompleteData] = useState([]);
  // Keyed array (Map) of park feature to coordinates
  const [parkFeatureLocations, setParkFeatureLocations] = useState(new Map());
  // Current value of the zoomTo field
  const [zoomToValue, setZoomToValue] = useState('');

  // Map needs repaint to size correctly when user switches tabs,
  // else the map shows up as 400 x 300
  if (currentTab === 'general' && props.activeTab === 'route') {
    // Changed to Route tab in parent; trigger map repaint
    if (mapRef.current) {
      // @TODO: This still doesn't work if we start with the "General" tab
      mapRef.current.triggerRepaint();
      // mapRef.current.resize(); // <-- This actually breaks it
    }
    setCurrentTab('route');
  } else if (currentTab === 'route' && props.activeTab === 'general') {
    setCurrentTab('general');
  }

  /**
   * Populate the zoomTo autocomplete component with CMP features
   */

  // Get Reservations data from the API
  const getReservations = async () => {
    const response = await mapsApiClient.get<any>(process.env.REACT_APP_MAPS_API_BASE_PATH + "/reservations");

    // Get the name, group (type), coordinates, and bounds (if set) of each reservation
    // for the Autocomplete component
    let autocompleteReservations = response.data.data.map(data => {

      // Construct LngLat from coords data, if it exists
      let coords = {};
      if ((data.longitude && data.latitude) &&
       (data.longitude !== 0 && data.latitude !== 0)) {
        coords = new LngLat(data.longitude, data.latitude);
      }

      // Construct LngLatBounds from bounds data, if it exists
      let bounds = {};
      if ((data.boxw && data.boxs && data.boxe && data.boxn) &&
        (data.boxw !== 0 && data.boxs !== 0 && data.boxe !== 0 && data.boxn !== 0)  ) {
        const sw = new LngLat(data.boxw, data.boxs);
        const ne = new LngLat(data.boxe, data.boxn);
        bounds = new LngLatBounds(sw, ne);
      }

      return {
        value: data.pagetitle,
        // group: "Reservations",
        coords: coords,
        bounds: bounds,
      }
    });

    // Keep only unique entries by name (value):
    autocompleteReservations = [...new Map(autocompleteReservations.map((item) => [item.value, item])).values()];
    setAutocompleteData(autocompleteReservations);

    // Make Map array object of locations, keyed by name and storing coords & bounds
    // -- for lookup by autocomplete text
    const locs = new Map(autocompleteReservations.map((item) =>[item.value, {
      coords: item.coords,
      bounds: item.bounds
    }]));
    setParkFeatureLocations(locs);

    return response.data.data;
  } // End getReservations()

  useQuery<Trail[], Error>({ queryKey: ['trails'], queryFn: getReservations });
  //------------------

  // Zoom map to (a park location)
  const zoomMapTo = (coords: LngLat, bounds: LngLatBounds) => {
    if (Object.keys(bounds).length !== 0) {
      mapRef.current.fitBounds(bounds, { padding: 10 });
    } else {
      if (coords.lng && coords.lat) {
        // Or, flyto coords with default zoom
        const DEFAULT_POI_ZOOM = 15;
        mapRef.current.flyTo({
          center: coords,
          zoom: DEFAULT_POI_ZOOM,
        });
      }
    }
  }

  const onMapMove = (event: ViewStateChangeEvent) => {
    setMapViewState(event.viewState);
  };

  const onMapLoad = (event: MapEvent) => {
    // @TODO: Not sure why we were doing the following...
    // React is automatically putting props.trailGeom data into the <Source> data.
    // const trailSource = mapRef.current.getSource('trail-data') as GeoJSONSource;
    // trailSource.setData(props.trailGeom);

    // Fit map bounds to trail bounds
    if (mapRef.current) {
      mapRef.current.fitBounds(props.mapBounds, { padding: 40 });
    }
  };

  const onMapRender = (event: MapEvent) => {}
  const onMapResize = (event: MapEvent) => {}

  const trailLayer: LineLayerSpecification = {
    id: "trail-line",
    type: "line",
    source: "geojson",
    layout: {
      "line-join": "round",
      "line-cap": "round"
    },
    paint: {
      "line-color": "#01B3FD",
      "line-width": 6,
      "line-opacity": 0.75
    }
  };

  return (
    <>
      <Box className={styles.mapContainer}>
        <ReactMapGl.Map
          // "reuseMaps" bypasses initialization when a map is removed and re-added
          // (switching screens, tabs, etc.) in order to avoid MapBox
          // generating a billable event with every map initialization
          // https://visgl.github.io/react-map-gl/docs/get-started/tips-and-tricks#minimize-cost-from-frequent-re-mounting
          //
          // @TODO:
          // However, it also seems to break the re-loading of the DrawControl
          // when the map is removed and re-rendered.
          // Maybe this is relevant:? https://github.com/visgl/react-map-gl/issues/699
          //
          // reuseMaps={true}

          ref={mapRef}
          {...mapViewState}
          style={{width: "100%", height: mapHeight}}
          mapStyle={process.env.REACT_APP_MAPBOX_STYLE_URL}
          mapboxAccessToken={process.env.REACT_APP_MAPBOX_TOKEN}
          onLoad={onMapLoad}
          onMove={onMapMove}
          onRender={onMapRender}
          onResize={onMapResize}
        >
        <Source
          id="trail-data"
          type="geojson"
          data={props.trailGeom ? JSON.parse(props.trailGeom) : {"type":"MultiLineString","coordinates":[]}}
        >
          <Layer {...trailLayer} />
        </Source>
        <NavigationControl
          showCompass={true}
          visualizePitch={true}
        />
        <DrawControl
          position="top-left"
          displayControlsDefault={false}
          controls={{
            line_string: true,
            trash: true
          }}
          initialData={
            props.waypointsFeature
          }
          waypointsGeom={
            props.waypointsForDraw
          }
          styles={[
            // Mapbox GL Draw styling
            // @see https://github.com/mapbox/mapbox-gl-draw/blob/main/docs/EXAMPLES.md

            // Line, active
            {
              "id": "gl-draw-line",
              "type": "line",
              "filter": ["all",
                ["==", "$type", "LineString"],
                ["!=", "mode", "static"]
              ],
              "layout": {
                "line-cap": "round",
                "line-join": "round"
              },
              "paint": {
                "line-color": "#d20000",
                "line-dasharray": [1, 2],
                "line-width": 2
              }
            },
            // Line, inactive
            {
              'id': 'gl-draw-line-inactive',
              'type': 'line',
              'filter': ['all',
                ['==', 'active', 'false'],
                ['==', '$type', 'LineString'],
                ['!=', 'mode', 'static']
              ],
              'layout': {
                'line-cap': 'round',
                'line-join': 'round'
              },
              'paint': {
                "line-color": "#d20000",
                "line-dasharray": [1, 2],
                'line-width': 2
              }
            },
            // Active (selected) points
            {
              "id": "gl-draw-point-active",
              "type": "circle",
              "filter": ["all",
                ["==", "$type", "Point"],
                ["==", "active", "true"]
              ],
              "paint": {
                "circle-radius": 12,
                "circle-color": "#000000"
              }
            },
            // Vertex point halos
            {
              "id": "gl-draw-polygon-and-line-vertex-halo-active",
              "type": "circle",
              "filter": ["all",
                ["==", "meta", "vertex"],
                ["==", "$type", "Point"],
                ["!=", "mode", "static"]
              ],
              "paint": {
                "circle-radius": 8,
                "circle-color": "#ffffff"
              }
            },
            // Vertex points
            {
              "id": "gl-draw-polygon-and-line-vertex-active",
              "type": "circle",
              "filter": ["all",
                ["==", "meta", "vertex"],
                ["==", "$type", "Point"],
                ["!=", "mode", "static"]
              ],
              "paint": {
                "circle-radius": 6,
                "circle-color": "#d20000",
              }
            },
            // Midpoint halos
            {
              'id': 'gl-draw-polygon-midpoint-halo',
              'type': 'circle',
              'filter': ['all',
                ['==', '$type', 'Point'],
                ['==', 'meta', 'midpoint']],
              'paint': {
                'circle-radius': 5,
                'circle-color': '#ffffff'
              }
            },
            // Midpoints
            {
              'id': 'gl-draw-polygon-midpoint',
              'type': 'circle',
              'filter': ['all',
                ['==', '$type', 'Point'],
                ['==', 'meta', 'midpoint']],
              'paint': {
                'circle-radius': 4,
                'circle-color': '#d20000'
              }
            },
          ]}
          onUpdate={props.onDrawUpdate} // draw.update
          onCreate={props.onDrawCreate} // draw.create
          onDelete={props.onDrawDelete} // draw.delete
        />
        </ReactMapGl.Map>

        {/* Routing spinner overlay */}
        {props.isRouting && (
          <Box className={styles.routingOverlay}>
            <Loader size="sm" />
          </Box>
        )}
      </Box>

      {/* Resize bar */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          height: '10px',
          backgroundColor: isDragging ? '#339af0' : '#e9ecef',
          cursor: 'ns-resize',
          borderTop: '1px solid #dee2e6',
          borderBottom: '1px solid #dee2e6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          transition: isDragging ? 'none' : 'background-color 0.2s ease',
        }}
        onMouseEnter={(e) => {
          if (!isDragging) {
            e.currentTarget.style.backgroundColor = '#ced4da';
          }
        }}
        onMouseLeave={(e) => {
          if (!isDragging) {
            e.currentTarget.style.backgroundColor = '#e9ecef';
          }
        }}
      >
        {/* Grip indicator */}
        <div
          style={{
            width: '40px',
            height: '4px',
            backgroundColor: isDragging ? '#ffffff' : '#6c757d',
            borderRadius: '2px',
            display: 'flex',
            gap: '2px',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: '2px',
              height: '2px',
              backgroundColor: 'currentColor',
              borderRadius: '50%',
            }}
          />
          <div
            style={{
              width: '2px',
              height: '2px',
              backgroundColor: 'currentColor',
              borderRadius: '50%',
            }}
          />
          <div
            style={{
              width: '2px',
              height: '2px',
              backgroundColor: 'currentColor',
              borderRadius: '50%',
            }}
          />
        </div>
      </div>

      {/* Extra controls beneath map */}
      <Group
        justify="space-between"
        mt="xs"
        mb="xs"
        >

        {/* Zoom to reservation */}
        <Flex
          gap="sm"
          justify="flex-start"
          align="flex-end"
        >
          <Autocomplete
            label={<span style={{fontWeight: 500, marginTop: '8px', marginBottom: '8px', display: 'block'}}>Zoom to reservation</span>}
            placeholder="Type to filter..."
            data={autocompleteData}
            onChange={setZoomToValue}
          />
          <Button
            variant="light"
            onClick={() => {
              // Get the coordinates of the current value in the autocomplete field
              // const coords = {lng: -81.804, lat: 41.301};
              const parkFeatureLocation = parkFeatureLocations.get(zoomToValue);
              zoomMapTo(parkFeatureLocation.coords, parkFeatureLocation.bounds);
            }}
          >Zoom</Button>
        </Flex>

        {/* Travel mode ("via") filter */}
        <Box>
          <Select
            label={<span style={{fontWeight: 500, marginTop: '8px', marginBottom: '8px', display: 'block'}}>Travel mode</span>}
            data={travelModeSelectOptions}
            defaultValue='hike'
            onChange={props.onTravelModeChange}
          />
        </Box>

        {/* Back to start */}
        <Box>
          <Text size="sm" fw={500} mt="xs" mb="xs">Complete trail</Text>
          <Button
            variant="light"
            onClick={props.doCompleteTrail}
          >Back to start</Button>
        </Box>

        {/* Show/hide Elevation Profile */}
        <Box>
          <Text size="sm" fw={500} mt="xs" mb="xs">Elevation Profile</Text>
          <Button
            variant="light"
            onClick={props.onElevationProfileToggle}
          >{props.showElevationProfile ? '▲ Hide' : '▼ Show'}</Button>
        </Box>
      </Group>
    </>
  );
}
