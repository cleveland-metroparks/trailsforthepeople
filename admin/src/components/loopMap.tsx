import { useState, useRef } from 'react';
import axios from "axios";
import { LngLatBounds } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { Map, Source, NavigationControl, Layer, LineLayer } from 'react-map-gl';
import type { MapRef, MapboxEvent, ViewStateChangeEvent, GeoJSONSource } from 'react-map-gl';
import { Text, TextInput, Button, Group, Box } from '@mantine/core';
import DrawControl from './draw-control';

import type { Loop } from "../types/loop";

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;
const MAPBOX_STYLE = 'mapbox://styles/cleveland-metroparks/cisvvmgwe00112xlk4jnmrehn';
const MAP_DEFAULT_STATE = {
  latitude: 41.3953,
  longitude: -81.6730,
  zoom: 9
};

//
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_MAPS_API_BASE_URL,
  headers: {
    "Content-type": "application/json",
  },
});

interface LoopMapProps {
  loop: Loop;
  loopGeom: string;
  mapBounds: LngLatBounds;
  waypointsFeature: Object;
  // Callbacks for LoopMap to update the Stats data & pane here
  // updateStats: Function;
  // updateDirections: Function;
  // updateElevation: Function;
  onDrawCreate: (evt: {features: object[]}) => void;
  onDrawUpdate: (evt: {features: object[]; action: string}) => void;
  onDrawDelete: (evt: {features: object[]}) => void;
}

/**
 * Loop Map
 *
 * @param props 
 * @returns 
 */
export function LoopMap(props: LoopMapProps) {
  // Existing waypoint coordinates as GeoJSON string
  // (fetched from API and passed in props)
  const initialWaypointsFeature = JSON.parse(props.loop.waypoints_geojson);


  const mapRef = useRef<MapRef>(null);

  const [mapViewState, setMapViewState] = useState({
    longitude: MAP_DEFAULT_STATE.longitude,
    latitude: MAP_DEFAULT_STATE.latitude,
    zoom: MAP_DEFAULT_STATE.zoom
  });

  //
  const doCompleteLoop = () => {
    console.log('HERE HERE');
  }

  // Map onMove event
  const onMapMove = (event: ViewStateChangeEvent) => {
    setMapViewState(event.viewState);
  };

  // Map onLoad event
  const onMapLoad = (event: MapboxEvent) => {
    // @DEBUG: Does this happen whenever new data is passed down from parent Loop component
    // Basically we need to figure out how to replace the Source data when Waypoints are changed
    // and the parent component gets new GeoJSON
    console.log('onMapLoad');
    const loopSource = mapRef.current.getSource('loop-data') as GeoJSONSource;
    loopSource.setData(props.loopGeom);

    // Fit map bounds to loop bounds
    if (mapRef.current) {
      mapRef.current.fitBounds(props.mapBounds, { padding: 40 });
    }
  };

  const loopLayer: LineLayer = {
    id: "loop-line",
    type: "line",
    source: {
      type: "geojson"
    },
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
      {props.loopGeom &&
        <>
          <Map
            reuseMaps
            ref={mapRef}
            {...mapViewState}
            style={{width: "100%", height: 600}}
            mapStyle={MAPBOX_STYLE}
            mapboxAccessToken={MAPBOX_TOKEN}
            onLoad={onMapLoad}
            onMove={onMapMove}
          >
            <Source
              id="loop-data"
              type="geojson"
              data={JSON.parse(props.loopGeom)}
            >
              <Layer {...loopLayer} />
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
              initialData={{
                waypoints: props.waypointsFeature
              }}
              // styles={[
                // https://github.com/mapbox/mapbox-gl-draw/blob/main/docs/EXAMPLES.md
                // https://github.com/mapbox/mapbox-gl-draw/blob/main/docs/API.md#styling-draw
                // https://docs.mapbox.com/mapbox-gl-js/style-spec/
              // ]}
              defaultMode="draw_line_string"
              onCreate={props.onDrawCreate} // draw.create
              onUpdate={props.onDrawUpdate} // draw.update
              onDelete={props.onDrawDelete} // draw.delete

              completeLoop={doCompleteLoop}
            />
          </Map>

          <Group position="apart">
            <Box my={15}>
              <Text size="sm" weight={500}>Zoom to location</Text>
              <TextInput
                placeholder="Park location"
              />
            </Box>
            <Box>
              <Text size="sm" weight={500}>Complete loop</Text>
              <Button
                variant="light"
                onClick={doCompleteLoop}
              >Back to start</Button>
            </Box>
          </Group>

        </>
      }
    </>
  );
}
