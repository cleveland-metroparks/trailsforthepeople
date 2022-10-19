import { useState, useRef, useCallback } from 'react';
import axios from "axios";
import { useQuery } from "react-query";

import { Grid } from '@mantine/core';

import { LngLatBounds } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';

import { Map, Source, Layer, LineLayer } from 'react-map-gl';
import type { MapRef, MapboxEvent, ViewStateChangeEvent } from 'react-map-gl';

import LoopWaypoints from "./loopWaypoints";
import DrawControl from './draw-control';

import { coordEach } from '@turf/meta';

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;
const MAPBOX_STYLE = 'mapbox://styles/cleveland-metroparks/cisvvmgwe00112xlk4jnmrehn';
const MAP_DEFAULT_STATE = {
  latitude: 41.3953,
  longitude: -81.6730,
  zoom: 9
};

type LoopGeometry = {
  id: number,
  geom_geojson: string
};

//
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_MAPS_API_BASE_URL,
  headers: {
    "Content-type": "application/json",
  },
});

interface LoopMapProps {
  loopId: number;
}

//
function onWaypointUpdate(evt) {
  console.log('Coordinates: ', evt.features[0].geometry.coordinates);
}

//
export function LoopMap(props: LoopMapProps) {
  const mapRef = useRef<MapRef>(null);

  const [bounds, setBounds] = useState(new LngLatBounds());

  const [mapViewState, setMapViewState] = useState({
    longitude: MAP_DEFAULT_STATE.longitude,
    latitude: MAP_DEFAULT_STATE.latitude,
    zoom: MAP_DEFAULT_STATE.zoom
  });

  //-----------------
  // For waypoints drawing
  //
  const [features, setFeatures] = useState({});

  const onUpdate = useCallback(e => {
    console.log('onUpdate()');
    setFeatures(curFeatures => {
      const newFeatures = {...curFeatures};
      for (const f of e.features) {
        newFeatures[f.id] = f;
      }
      return newFeatures;
    });
  }, []);

  const onDelete = useCallback(e => {
    console.log('onDelete()');
    setFeatures(curFeatures => {
      const newFeatures = {...curFeatures};
      for (const f of e.features) {
        delete newFeatures[f.id];
      }
      return newFeatures;
    });
  }, []);
  //-----------------

  let loopId = props.loopId ? props.loopId.toString() : '';

  // Get loop geometry from API
  const getLoopGeometry = async (id: string) => {
    const response = await apiClient.get<any>("/trail_geometries/" + id);
    const geojson = JSON.parse(response.data.data.geom_geojson);

    const tmpBounds = new LngLatBounds();
    if (geojson.coordinates) {
      coordEach(geojson, function (coord) {
        tmpBounds.extend([coord[0], coord[1]]);
      });
      setBounds(bounds => tmpBounds);
    }

    return response.data.data;
  }

  // Map onMove event
  const onMapMove = (event: ViewStateChangeEvent) => {
    setMapViewState(event.viewState);
  };

  // Map onLoad event
  const onMapLoad = (event: MapboxEvent) => {
    // Fit map bounds to loop bounds
    if (mapRef.current) {
      mapRef.current.fitBounds(bounds, { padding: 40 });
    }
  };

  const { isLoading, isSuccess, isError, data, error, refetch } = useQuery<LoopGeometry, Error>(['loop_geometry', loopId], () => getLoopGeometry(loopId));

  const loopLayer: LineLayer = {
    id: "highlightLine",
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
    <div>
      {isLoading && <div>Loading...</div>}

      {isError && (
        <div>{`There is a problem fetching the loop - ${error.message}`}</div>
      )}

      {data &&
        <>
          <Grid>
            <Grid.Col span={9}>
              <Map
                reuseMaps
                ref={mapRef}
                {...mapViewState}
                style={{width: "100%", height: 400}}
                mapStyle={MAPBOX_STYLE}
                mapboxAccessToken={MAPBOX_TOKEN}
                onLoad={onMapLoad}
                onMove={onMapMove}
              >
                <Source type="geojson" data={JSON.parse(data.geom_geojson)}>
                  <Layer {...loopLayer} />
                </Source>
                <DrawControl
                  position="top-left"
                  displayControlsDefault={false}
                  controls={{
                    line_string: true,
                    trash: true
                  }}
                  defaultMode="draw_line_string"
                  onCreate={onUpdate}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                />
              </Map>
            </Grid.Col>

            <Grid.Col span={3}>
              <LoopWaypoints waypoints={features} />
            </Grid.Col>
          </Grid>
        </>
      }
    </div>
  );
}
