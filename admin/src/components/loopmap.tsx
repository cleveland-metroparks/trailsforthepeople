import axios from "axios";
import { useQuery } from "react-query";
import { Link, Outlet, useParams } from "react-router-dom";
import {Map, Source, Layer, LineLayer} from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiY2xldmVsYW5kLW1ldHJvcGFya3MiLCJhIjoiY2w1Y2h5NWN4MGhxejNjbDFzOWczNXJmdyJ9.TrbioVMC_vB2cl34g6Ja8A';
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
  baseURL: "https://maps-api-dev2.clevelandmetroparks.com/api/v1",
  headers: {
    "Content-type": "application/json",
  },
});

interface LoopMapProps {
  loopId:  number;
}

//
export function LoopMap(props: LoopMapProps) {
  let loopId = props.loopId ? props.loopId.toString() : '';

  //
  const getLoopGeometry = async (id: string) => {
    const response = await apiClient.get<any>("/trail_geometries/" + id);
    return response.data.data;
  }

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
        <Map
          initialViewState={{
            latitude: MAP_DEFAULT_STATE.latitude,
            longitude: MAP_DEFAULT_STATE.longitude,
            zoom: MAP_DEFAULT_STATE.zoom
          }}
          style={{width: 600, height: 400}}
          mapStyle={MAPBOX_STYLE}
          mapboxAccessToken={MAPBOX_TOKEN}
        >
          <Source type="geojson" data={JSON.parse(data.geom_geojson)}>
            <Layer {...loopLayer} />
          </Source>
        </Map>
      }
    </div>
  );
}
