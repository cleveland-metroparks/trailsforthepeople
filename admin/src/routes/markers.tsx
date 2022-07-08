import {useState, useCallback} from 'react';
import axios from "axios";
import { useQuery } from "react-query";
import { Link, Outlet, useParams } from "react-router-dom";
import { Table, Anchor, Box, Button, Group } from '@mantine/core';
import { useForm } from '@mantine/form';
import { default as dayjs } from 'dayjs';

import * as MapGl from 'react-map-gl'; // Namespace as MapGl since we already have "Marker"
import type {MarkerDragEvent, LngLat} from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiY2xldmVsYW5kLW1ldHJvcGFya3MiLCJhIjoiY2w1Y2h5NWN4MGhxejNjbDFzOWczNXJmdyJ9.TrbioVMC_vB2cl34g6Ja8A';
const MAPBOX_STYLE = 'mapbox://styles/cleveland-metroparks/cisvvmgwe00112xlk4jnmrehn';
const MAP_DEFAULT_STATE = {
  latitude: 41.3953,
  longitude: -81.6730,
  zoom: 9
};

type Marker = {
  id: number,
  creator: string,
  created: string,
  lat: number,
  lng: number,
  content: string,
  title: string,
  expires: string,
  creatorid: number,
  geom_geojson: string,
  category: string,
  enabled: number,
  annual: number,
  startdate: string
};

const apiClient = axios.create({
  baseURL: "https://maps-api-dev2.clevelandmetroparks.com/api/v1",
  headers: {
    "Content-type": "application/json",
  },
});

//
const getAllMarkers = async () => {
  const response = await apiClient.get<any>("/markers");
  return response.data.data;
}

//
const getMarker = async (id: string) => {
  const response = await apiClient.get<any>("/markers/" + id);
  return response.data.data;
}

//
export function Marker() {
  let params = useParams();
  let markerId = params.markerId ? params.markerId.toString() : '';

  const { isLoading, isSuccess, isError, data, error, refetch } = useQuery<Marker, Error>(['marker', params.markerId], () => getMarker(markerId));

  const form = useForm({
    initialValues: {
      test: 'This is a test',
      // Setting these directly in the TSX below to get the API-loaded data.
      // @TODO: Should be better to use this, so we can use form.getInputProps() below to also get other data
    },
    validate: {
    },
  });

  //--------

  const [marker, setMarker] = useState({
    latitude: 40,
    longitude: -100
  });
  const [events, logEvents] = useState<Record<string, LngLat>>({});

  const onMarkerDragStart = useCallback((event: MarkerDragEvent) => {
    logEvents(_events => ({..._events, onDragStart: event.lngLat}));
  }, []);

  const onMarkerDrag = useCallback((event: MarkerDragEvent) => {
    logEvents(_events => ({..._events, onDrag: event.lngLat}));

    setMarker({
      longitude: event.lngLat.lng,
      latitude: event.lngLat.lat
    });
  }, []);

  const onMarkerDragEnd = useCallback((event: MarkerDragEvent) => {
    logEvents(_events => ({..._events, onDragEnd: event.lngLat}));
  }, []);

  //--------

  return (
    <div>
      <Anchor component={Link} to={`/markers`}>« Markers</Anchor>

      {isLoading && <div>Loading...</div>}

      {isError && (
        <div>{`There is a problem fetching the marker - ${error.message}`}</div>
      )}

      {data &&
        <div>
          <h2>{data.title}</h2>

          <form onSubmit={form.onSubmit((values) => console.log(values))}>
            <span><strong>Enabled:</strong> {data.enabled}</span><br />
            <span><strong>Category:</strong> {data.category}</span><br />
            <span><strong>Creator:</strong> {data.creator}</span><br />
            <span><strong>Created:</strong> {dayjs(data.created).format('YYYY-MM-DD HH:mm:ss Z')}</span><br />

            <div>
              <MapGl.Map
                initialViewState={{
                  latitude: data.lat,
                  longitude: data.lng,
                  zoom: MAP_DEFAULT_STATE.zoom
                }}
                style={{width: 600, height: 400}}
                mapStyle={MAPBOX_STYLE}
                mapboxAccessToken={MAPBOX_TOKEN}
              >
                <MapGl.Marker
                  longitude={data.lng}
                  latitude={data.lat}
                  anchor="bottom"
                  draggable
                  onDragStart={onMarkerDragStart}
                  onDrag={onMarkerDrag}
                  onDragEnd={onMarkerDragEnd}
                ></MapGl.Marker>
              </MapGl.Map>

            </div>

            <span><strong>Lat/Lng:</strong> {data.lat}, {data.lng}</span><br />
            <span><strong>Content:</strong> {data.content}</span><br />
            <span><strong>Expires:</strong> {data.expires ? dayjs(data.expires).format('YYYY-MM-DD HH:mm:ss Z') : <em>none</em>}</span><br />
            <span><strong>Annual:</strong> {data.annual}</span><br />
            <span><strong>Start date:</strong> {data.startdate ? dayjs(data.startdate).format('YYYY-MM-DD HH:mm:ss Z') : ''}</span><br />

            <Group position="left" mt="md">
              <Button type="submit">Submit</Button>
            </Group>

          </form>
        </div>
      }

    </div>
  );
}

//
export function MarkersList() {
  const { isLoading, isSuccess, isError, data, error, refetch } = useQuery<Marker[], Error>('markers', getAllMarkers);
  return (
    <div>
      <h2>Markers</h2>

      {isLoading && <div>Loading...</div>}

      {isError && (
        <div>{`There is a problem fetching the post data - ${error.message}`}</div>
      )}
      <Table striped highlightOnHover>

        <thead>
          <tr>
            <th>Title</th>
            <th>Creator</th>
            <th>Date created</th>
            <th>Expires</th>
            <th>Category</th>
            <th>Enabled</th>
            <th>Annual</th>
          </tr>
        </thead>

        <tbody>
        {data &&
          data.map(marker => (
            <tr key={marker.id}>
              <td>
                <Anchor
                  component={Link}
                  to={`/markers/${marker.id}`}
                  key={marker.id}
                >
                  {marker.title}
                </Anchor>
              </td>
              <td>{marker.creator}</td>
              <td>{dayjs(marker.created).format('YYYY-MM-DD HH:mm:ss Z')}</td>
              <td>{marker.expires ? dayjs(marker.expires).format('YYYY-MM-DD HH:mm:ss Z') : ''}</td>
              <td>{marker.category}</td>
              <td>{marker.enabled}</td>
              <td>{marker.annual}</td>
            </tr>
          ))}
        </tbody>

      </Table>
    </div>
  );
}