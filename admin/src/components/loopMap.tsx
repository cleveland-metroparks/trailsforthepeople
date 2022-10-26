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

import type { Loop } from "../types/loop";

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
  loop: Loop;
}

//
export function LoopMap(props: LoopMapProps) {
  // Existing waypoint coordinates as GeoJSON string, from database
  const initialWaypointsStr = props.loop.waypoints_geojson;
  let initialWaypointsFeature = JSON.parse(initialWaypointsStr);
  // Filter out the zero entries; a vestige of the way we used to store waypoints in the DB
  let filteredCoords = Array;
  if (initialWaypointsFeature.geometry.coordinates) {
    const initialCoords = initialWaypointsFeature.geometry.coordinates
    filteredCoords = initialCoords.filter(function(coordinate, index, arr) {
      return ((coordinate[0] != 0) && (coordinate[1] != 0));
    });
    initialWaypointsFeature.geometry.coordinates = filteredCoords;
  }
  // Mapbox GL JS Draw returns a feature object keyed by a randomly generated ID
  // for each linestring inside the object. We re-parent our feature with our own
  // dummy ID to resemble the structure:
  const reparentedInitialWaypointsFeature = { dummyKey: initialWaypointsFeature };
  // console.log('reparentedInitialWaypointsFeature', reparentedInitialWaypointsFeature); // @TODO This gets called over and over...

  const [features, setFeatures] = useState(reparentedInitialWaypointsFeature);

  const mapRef = useRef<MapRef>(null);

  const [bounds, setBounds] = useState(new LngLatBounds());

  const [mapViewState, setMapViewState] = useState({
    longitude: MAP_DEFAULT_STATE.longitude,
    latitude: MAP_DEFAULT_STATE.latitude,
    zoom: MAP_DEFAULT_STATE.zoom
  });

  //----------------------------------
  // Waypoints Draw update callbcks
  //
  const onCreate = useCallback(e => {
    // console.log('onCreate()');
    // console.log('e.features', e.features);
    setFeatures(curFeatures => {
      // console.log('curFeatures', curFeatures);
      const newFeatures = {...curFeatures};
      // Delete existing features
      for (const key of Object.keys(newFeatures)) {
        delete newFeatures[key];
      }
      // Add new
      for (const f of e.features) {
        newFeatures[f.id] = f;
      }
      // console.log('newFeatures', newFeatures);
      return newFeatures;
    });
  }, []);

  const onUpdate = useCallback(e => {
    // console.log('onUpdate()');
    // console.log('e.features', e.features);
    setFeatures(curFeatures => {
      // console.log('curFeatures', curFeatures);
      const newFeatures = {...curFeatures};
      for (const f of e.features) {
        newFeatures[f.id] = f;
      }
      // console.log('newFeatures', newFeatures);
      return newFeatures;
    });
  }, []);

  const onDelete = useCallback(e => {
    // console.log('onDelete()');
    // console.log('e.features', e.features);
    setFeatures(curFeatures => {
      // console.log('curFeatures', curFeatures);
      const newFeatures = {...curFeatures};
      for (const f of e.features) {
        delete newFeatures[f.id];
      }
      // console.log('newFeatures', newFeatures);
      return newFeatures;
    });
  }, []);
  //----------------------------------

  let loopId = props.loop.id ? props.loop.id.toString() : '';

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
                style={{width: "100%", height: 600}}
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
                  initialData={{
                    waypoints: features
                  }}
                  // styles={[
                    // https://github.com/mapbox/mapbox-gl-draw/blob/main/docs/EXAMPLES.md
                    // https://github.com/mapbox/mapbox-gl-draw/blob/main/docs/API.md#styling-draw
                    // https://docs.mapbox.com/mapbox-gl-js/style-spec/
                  // ]}
                  defaultMode="draw_line_string"
                  onCreate={onCreate}
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
