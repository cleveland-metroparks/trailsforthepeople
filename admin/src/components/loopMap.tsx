import { useState, useRef, useCallback } from 'react';
import axios from "axios";
import { useQuery } from "react-query";
import { Grid } from '@mantine/core';
import { LngLat, LngLatBounds, LngLatLike } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { Map, Source, Layer, LineLayer } from 'react-map-gl';
import type { MapRef, MapboxEvent, ViewStateChangeEvent, GeoJSONSource } from 'react-map-gl';
import { coordEach } from '@turf/meta';
import { lineString } from '@turf/helpers';

import LoopWaypoints from "./loopWaypoints";
import DrawControl from './draw-control';
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

// Make GeoJSON linestring from waypoints (inside Draw features object), for DB storage
function makeWaypointGeojsonString(features) {
  // Mapbox GL Draw returns an object with a randomly-named member inside
  // that stores the feature. Get that member name.
  const feature_id = Object.keys(features)[0];
  if (feature_id) {
    if (features[feature_id].geometry.coordinates) {
      // Turn into GeoJSON string for DB storage
      const coordsLinestring = lineString(features[feature_id].geometry.coordinates); // Using turf
      const output = JSON.stringify(coordsLinestring);
      return output;
    }
  }
}

//
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_MAPS_API_BASE_URL,
  headers: {
    "Content-type": "application/json",
  },
});

interface LoopMapProps {
  loop: Loop;
  // Callback for LoopMap to update the Stats data & pane here
  updateStats: Function;
}

//
export function LoopMap(props: LoopMapProps) {
  // Existing waypoint coordinates as GeoJSON string
  // (fetched from API and passed in props)
  const initialWaypointsFeature = JSON.parse(props.loop.waypoints_geojson);

  // Filter out the zero entries from the waypoints;
  // a vestige of the way waypoints used to be stored in the DB
  let filteredCoords = Array;
  const initialCoords = initialWaypointsFeature.geometry.coordinates;
  if (initialCoords) {
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
  const [waypointsGeoJSON, setWaypointsGeoJSON] = useState('');

  const mapRef = useRef<MapRef>(null);

  const [bounds, setBounds] = useState(new LngLatBounds());

  const [mapViewState, setMapViewState] = useState({
    longitude: MAP_DEFAULT_STATE.longitude,
    latitude: MAP_DEFAULT_STATE.latitude,
    zoom: MAP_DEFAULT_STATE.zoom
  });

  //----------------------------------
  // Waypoints Draw update callbacks
  //
  // @TODO: Can we get rid of the "features" state var, and remove a lot of this logic?
  //
  const onCreate = e => {
    setFeatures(curFeatures => {
      const newFeatures = {...curFeatures};
      // Delete existing features
      for (const key of Object.keys(newFeatures)) {
        delete newFeatures[key];
      }
      // Add new
      for (const f of e.features) {
        newFeatures[f.id] = f;
      }
      return newFeatures;
    });
    const geoJSON = makeWaypointGeojsonString(e.features);
    setWaypointsGeoJSON(geoJSON);
    getRouteFromWaypoints(geoJSON, 'hike');
  };

  const onUpdate = e => {
    setFeatures(curFeatures => {
      const newFeatures = {...curFeatures};
      for (const f of e.features) {
        newFeatures[f.id] = f;
      }
      return newFeatures;
    });
    const geoJSON = makeWaypointGeojsonString(e.features);
    setWaypointsGeoJSON(geoJSON);
    getRouteFromWaypoints(geoJSON, 'hike');
  };

  const onDelete = e => {
    setFeatures(curFeatures => {
      const newFeatures = {...curFeatures};
      for (const f of e.features) {
        delete newFeatures[f.id];
      }
      return newFeatures;
    });
    const geoJSON = makeWaypointGeojsonString(e.features);
    setWaypointsGeoJSON(geoJSON);
    getRouteFromWaypoints(geoJSON, 'hike');
  };
  //----------------------------------

  let loopId = props.loop.id ? props.loop.id.toString() : '';

  // Get loop geometry from API
  const getLoopGeometry = async (id: string) => {
    const response = await apiClient.get<any>("/trail_geometries/" + id);
    const geojson = JSON.parse(response.data.data.geom_geojson);

    if (geojson.coordinates) {
      let loopBounds = new LngLatBounds();
      coordEach(geojson, function (coord) {
        loopBounds.extend([coord[0], coord[1]]);
      });
      setBounds((bounds) => {
        if (mapRef.current) {
          mapRef.current.fitBounds(loopBounds, { padding: 40 });
        }
        return loopBounds;
      });
    }

    return response.data.data;
  }

  // Get route from waypoints from API
  // @TODO: Don't call this the very first time the loop is loaded,
  // because we're overwriting saved stats/data
  const getRouteFromWaypoints = async (waypointsGeojson: string, travelMode: string) => {
    const params = new URLSearchParams({
      waypoints: waypointsGeojson,
      via: travelMode
    });
    const response = await apiClient.get<any>("/route_waypoints", { params });

    // @TODO: We should re-fit bounds *only* if they're [for some reason] greater than current.
    //   (Right now this is re-fitting no matter what)
    // const sw = new LngLat(response.data.data.bounds.west, response.data.data.bounds.south);
    // const ne = new LngLat(response.data.data.bounds.east, response.data.data.bounds.north);
    // let loopBounds = new LngLatBounds(sw, ne);
    // setBounds((bounds) => {
    //   if (mapRef.current) {
    //     mapRef.current.fitBounds(loopBounds, { padding: 40 });
    //   }
    //   return loopBounds;
    // });

    // Call our callback to update stats in the parent Loops component
    props.updateStats({
      distance_text : response.data.data.totals.distance_text,
      distance_feet : response.data.data.totals.distance_feet,
      durationtext_hike : response.data.data.totals.durationtext_hike,
      durationtext_bike : response.data.data.totals.durationtext_bike,
      durationtext_bridle : response.data.data.totals.durationtext_bridle
    });

    // Replace loop line Source GeoJSON data with that returned from the API
    if (mapRef.current) {
      const loopSource = mapRef.current.getSource('loop-data') as GeoJSONSource;
      loopSource.setData(response.data.data.geojson);
    }


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
                <Source
                  id="loop-data"
                  type="geojson"
                  data={JSON.parse(data.geom_geojson)}
                >
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
                    waypoints: reparentedInitialWaypointsFeature
                  }}
                  // styles={[
                    // https://github.com/mapbox/mapbox-gl-draw/blob/main/docs/EXAMPLES.md
                    // https://github.com/mapbox/mapbox-gl-draw/blob/main/docs/API.md#styling-draw
                    // https://docs.mapbox.com/mapbox-gl-js/style-spec/
                  // ]}
                  defaultMode="draw_line_string"
                  onCreate={onCreate} // draw.create
                  onUpdate={onUpdate} // draw.update
                  onDelete={onDelete} // draw.delete
                />
              </Map>
            </Grid.Col>

            <Grid.Col span={3}>
              <LoopWaypoints features={features} geojson={waypointsGeoJSON} />
            </Grid.Col>
          </Grid>
        </>
      }
    </div>
  );
}
