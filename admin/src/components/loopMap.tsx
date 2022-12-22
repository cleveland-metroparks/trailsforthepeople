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

interface LoopMapProps {
  loop: Loop;
  loopGeom: string;
  mapBounds: LngLatBounds;
  waypointsFeature: Object;
  waypointsForDraw: Object;
  onDrawCreate: (e: {features: object[]}) => void;
  onDrawUpdate: (e: {features: object[]; action: string}) => void;
  onDrawDelete: (e: {features: object[]}) => void;
  doCompleteLoop: () => void;
}

/**
 * Loop Map
 *
 * @param props 
 * @returns 
 */
export function LoopMap(props: LoopMapProps) {
  const mapRef = useRef<MapRef>(null);

  const [mapViewState, setMapViewState] = useState({
    longitude: MAP_DEFAULT_STATE.longitude,
    latitude: MAP_DEFAULT_STATE.latitude,
    zoom: MAP_DEFAULT_STATE.zoom
  });

  // Map onMove event
  const onMapMove = (event: ViewStateChangeEvent) => {
    setMapViewState(event.viewState);
  };

  // Map onLoad event
  const onMapLoad = (event: MapboxEvent) => {
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
              initialData={
                props.waypointsFeature
              }
              waypointsGeom={
                props.waypointsForDraw
              }
              // styles={[
                // https://github.com/mapbox/mapbox-gl-draw/blob/main/docs/EXAMPLES.md
                // https://github.com/mapbox/mapbox-gl-draw/blob/main/docs/API.md#styling-draw
                // https://docs.mapbox.com/mapbox-gl-js/style-spec/
              // ]}
              defaultMode="draw_line_string"
              onCreate={props.onDrawCreate} // draw.create
              onUpdate={props.onDrawUpdate} // draw.update
              onDelete={props.onDrawDelete} // draw.delete
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
                onClick={props.doCompleteLoop}
              >Back to start</Button>
            </Box>
          </Group>

        </>
      }
    </>
  );
}
