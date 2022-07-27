import { useState, useCallback, useRef } from 'react';
import axios from "axios";
import { useQuery } from "react-query";
import { Link, useParams } from "react-router-dom";
import { Table, Anchor, Box, TextInput, Textarea, Checkbox, Button, Group, Accordion, Select } from '@mantine/core';
import { useForm } from '@mantine/form';
import { default as dayjs } from 'dayjs';

import * as MapGl from 'react-map-gl'; // Namespace as MapGl since we already have "Marker"
import type { MapRef } from 'react-map-gl';
import type { MarkerDragEvent, LngLat } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN; // Specify in .env
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
export function MarkerEdit() {
  const mapRef = useRef<MapRef>(null);

  // Get marker
  // Moved this into Marker component so we can use setMarker()
  const getMarker = async (id: string) => {
    const response = await apiClient.get<any>("/markers/" + id);

    setMarker({
      longitude: response.data.data.lng,
      latitude: response.data.data.lat
    });

    form.setValues({
      title: response.data.data.title,
      content: response.data.data.content,
      category: response.data.data.category,
      enabled: response.data.data.enabled == 1
    });

    return response.data.data;
  }

  let params = useParams();
  let markerId = params.markerId ? params.markerId.toString() : '';

  const { isLoading, isSuccess, isError, data, error, refetch } = useQuery<Marker, Error>(['marker', params.markerId], () => getMarker(markerId));

  const form = useForm({
    initialValues: {
      title: '',
      content: '',
      category: '',
      enabled: false
    },
    validate: {
    },
  });

  //--------

  const [marker, setMarker] = useState({
    latitude: MAP_DEFAULT_STATE.latitude,
    longitude: MAP_DEFAULT_STATE.longitude
  });

  // Marker event: on drag
  const onMarkerDrag = useCallback((event: MarkerDragEvent) => {
    setMarker({
      longitude: event.lngLat.lng,
      latitude: event.lngLat.lat
    });
  }, []);

  // Marker event: on drag end
  const onMarkerDragEnd = useCallback((event: MarkerDragEvent) => {
    // Center map on marker location
    mapRef.current?.easeTo({center: [event.lngLat.lng, event.lngLat.lat]});
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

            <Box sx={{ maxWidth: 800 }}>

              <TextInput
                mt="md"
                required
                label="Title"
                placeholder="Marker title"
                {...form.getInputProps('title')}
              />

              <Textarea
                mt="md"
                required
                label="Content"
                placeholder=""
                {...form.getInputProps('content')}
              />

              <Box sx={{marginTop: '1em'}}>
                <Select
                  label="Category"
                  data={[
                    { value: 'Events', label: 'Events' },
                    { value: 'Trail Closures and Construction', label: 'Trail Closures and Construction' },
                  ]}
                  {...form.getInputProps('category')}
                />
              </Box>

              <Box sx={{marginTop: '1em'}}>
                <MapGl.Map
                  reuseMaps
                  ref={mapRef}
                  initialViewState={{
                    latitude: data.lat,
                    longitude: data.lng,
                    zoom: MAP_DEFAULT_STATE.zoom
                  }}
                  style={{width: 800, height: 400}}
                  mapStyle={MAPBOX_STYLE}
                  mapboxAccessToken={MAPBOX_TOKEN}
                >
                  <MapGl.Marker
                    longitude={data.lng}
                    latitude={data.lat}
                    anchor="bottom"
                    draggable
                    onDrag={onMarkerDrag}
                    onDragEnd={onMarkerDragEnd}
                  ></MapGl.Marker>
                </MapGl.Map>
              </Box>

              <Box sx={{margin: '1em 0'}}>
                <span><strong>Lat:</strong> {marker.latitude}</span><br />
                <span><strong>Lat:</strong> {marker.longitude}</span><br />
              </Box>

              <Accordion>
                <Accordion.Item label="Publishing status">
                  <span><strong>Start date:</strong> {data.startdate ? dayjs(data.startdate).format('YYYY-MM-DD HH:mm:ss Z') : ''}</span><br />
                  <span><strong>Expires:</strong> {data.expires ? dayjs(data.expires).format('YYYY-MM-DD HH:mm:ss Z') : <em>none</em>}</span><br />
                  <span><strong>Annual:</strong> {data.annual}</span><br />
                  <Checkbox
                    mt="md"
                    label="Enabled"
                    {...form.getInputProps('enabled', { type: 'checkbox' })}
                  />
                </Accordion.Item>

                <Accordion.Item label="Authorship">
                  <div>
                    <span><strong>Created:</strong> {dayjs(data.created).format('YYYY-MM-DD HH:mm:ss Z')}</span><br />
                    <span><strong>Created by:</strong> {data.creator}</span>
                  </div>
                  <div>
                    <span><strong>Last edited:</strong></span><br />
                    <span><strong>Last edited by:</strong></span>
                  </div>
                </Accordion.Item>

              </Accordion>

              <Group position="left" mt="md">
                <Button type="submit" sx={{ margin: '1em 0' }}>Save Marker</Button>
              </Group>

            </Box>

          </form>
        </div>
      }

    </div>
  );
}

//
export function MarkersList() {

  // Get all markers
  const getAllMarkers = async () => {
    const response = await apiClient.get<any>("/markers");
    return response.data.data;
  }

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