import { useCallback, useRef, useState } from 'react';
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { Link, useParams } from "react-router-dom";
import { createStyles, Flex, Text, Title, Anchor, Box, Input, TextInput, Checkbox, Button, Group, Accordion, Select } from '@mantine/core';
import { showNotification, updateNotification } from '@mantine/notifications';
import { useForm } from '@mantine/form';
import { RichTextEditor } from '@mantine/rte';
import { DatePicker } from '@mantine/dates';
import { default as dayjs } from 'dayjs';
import * as MapGl from 'react-map-gl'; // Namespace as MapGl since we already have "Marker"
import type { MapRef } from 'react-map-gl';
import type { MarkerDragEvent } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

import type { Marker } from "../types/marker";

// Styling for datepicker weekend days
const useStyles = createStyles((theme) => ({
  weekend: {
    color: `${theme.colors.blue[5]} !important`,
  },
}));

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;
const MAPBOX_STYLE = 'mapbox://styles/cleveland-metroparks/cisvvmgwe00112xlk4jnmrehn';
const MAP_DEFAULT_STATE = {
  latitude: 41.3953,
  longitude: -81.6730,
  zoom: 9
};

type MarkerFormData = {
  title: string,
  content: string,
  category: string,
  enabled: boolean,
  annual: boolean,
  startDate,
  expireDate,
  latitude: number,
  longitude: number
};

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_MAPS_API_BASE_URL,
  headers: {
    "Content-type": "application/json",
  },
});

//
export function MarkerEdit() {
  const [savingState, setSavingState] = useState(false);

  const mutation = useMutation((formData: MarkerFormData) => saveMarker(formData));
  const queryClient = useQueryClient();

  const { classes, cx } = useStyles();

  const mapRef = useRef<MapRef>(null);

  // Get marker
  // Moved this into Marker component so we can use [now defunct] setMarker()
  const getMarker = async (id: string) => {
    const defaultLat = 41.32653793921162;
    const defaultLng = -81.6629620125847;

    let markerData: Marker = {
      id: null,
      creator: '',
      created: '',
      lat: defaultLat,
      lng: defaultLng,
      content: '',
      title: '',
      expires: '',
      creatorid: null,
      geom_geojson: '',
      category: '',
      enabled: null,
      annual: null,
      startdate: '',
      modified: '',
    };

    console.log('id', id);
    if (id !== 'new') {
      const response = await apiClient.get<any>("/markers/" + id);

      markerData = response.data.data;

      // Date value handling; capture nulls & reformat
      const initExpireDate = response.data.data.expires ? dayjs(response.data.data.expires).toDate() : null;
      const initStartDate = response.data.data.startdate ? dayjs(response.data.data.startdate).toDate() : null;
      markerData.modified = response.data.data.modified ? dayjs(response.data.data.modified).format('dddd, MMMM D, YYYY [at] h:mma') : null;
      markerData.created = response.data.data.created ? dayjs(response.data.data.created).format('dddd, MMMM D, YYYY [at] h:mma') : null;

      form.setValues({
        title: response.data.data.title,
        content: response.data.data.content,
        category: response.data.data.category,
        enabled: response.data.data.enabled === 1,
        annual: response.data.data.annual === 1,
        startDate: initStartDate,
        expireDate: initExpireDate,
        latitude: response.data.data.lat,
        longitude: response.data.data.lng
      });
    }

    return markerData;
  }

  let params = useParams();

  let markerId = '';
  let isNew = false;

  if (params.markerId) {
    if (!isNaN(parseFloat(params.markerId))) { // Ensure marker ID is an int
      markerId = params.markerId;
    } else if (params.markerId === 'new') {
      markerId = params.markerId;
      isNew = true;
    } else {
      throw new Error("Invalid Marker ID");
    }
  }

  const { isLoading, isSuccess, isError, data, error, refetch } = useQuery<Marker, Error>(['marker', params.markerId], () => getMarker(markerId));

  const form = useForm({
    initialValues: {
      title: '',
      content: '',
      category: '',
      enabled: false,
      annual: false,
      startDate: null,
      expireDate: null,
      latitude: null,
      longitude: null
    },
    validate: {
    },
  });

  // Save Marker
  const saveMarker = async (formData) => {
    setSavingState(true);
    showNotification({
      id: 'save-marker',
      loading: true,
      title: 'Saving marker',
      message: 'One moment',
      autoClose: false,
      disallowClose: true,
    });

    const response = apiClient.put<any>('/markers/' + markerId, {
      creator: 'Steven Mather', // @TODO
      // created: dayjs(),
      lat: formData.latitude,
      lng: formData.longitude,
      content: formData.content,
      title: formData.title,
      expires: formData.expireDate ? dayjs(formData.expireDate).format('YYYY-MM-DD') : null,
      creatorid: 1, // @TODO
      geom_geojson: '', // @TODO
      category: formData.category,
      enabled: formData.enabled ? 1 : 0,
      annual: formData.annual ? 1 : 0,
      startdate: formData.expireDate ? dayjs(formData.startDate).format('YYYY-MM-DD') : null,
      modified: dayjs(),
    })

    .then(function (response) {
      updateNotification({
        id: 'save-marker',
        loading: false,
        title: 'Marker saved successfully',
        message: '',
        autoClose: 5000,
      });
      setSavingState(false);
      queryClient.invalidateQueries({ queryKey: ['marker'] })
      console.log("Marker saved:", response);
    })

    .catch(function (error) {
      const errMsg = error.name + ': ' + error.message + ' (' + error.code + ')';
      updateNotification({
        id: 'save-marker',
        loading: false,
        color: 'red',
        title: 'Error saving marker',
        message: errMsg,
        autoClose: false,
      });
      setSavingState(false);
      console.error("Error saving marker:", error);
    });

    return response;
  }

  //--------

  // Marker event: on drag
  const onMarkerDrag = useCallback((event: MarkerDragEvent) => {
    form.setValues({ latitude: event.lngLat.lat, longitude: event.lngLat.lng });
  }, []);

  // Marker event: on drag end
  const onMarkerDragEnd = useCallback((event: MarkerDragEvent) => {
    // Center map on marker location
    mapRef.current?.easeTo({center: [event.lngLat.lng, event.lngLat.lat]});
  }, []);

  //--------

  return (
    <>
      <Anchor component={Link} to={`/markers`}>« Markers</Anchor>

      {isLoading && <div>Loading...</div>}

      {isError && (
        <div>{`There is a problem fetching the marker - ${error.message}`}</div>
      )}

      {data &&
        <>
          <Title order={2}>{data.title}</Title>

          <form onSubmit={form.onSubmit((formValues) => {
            mutation.mutate(formValues);
          })}>

            <Box sx={{ maxWidth: 800 }}>

              <TextInput
                mt="md"
                required
                label="Title"
                placeholder="Marker title"
                {...form.getInputProps('title')}
              />

              <Input.Wrapper
                label="Content"
                withAsterisk
                sx={{marginTop: '1em'}}
              >
                <RichTextEditor
                  id="rte"
                  {...form.getInputProps('content')}
                  controls={[
                    ['bold', 'strike', 'italic', 'underline'],
                    ['clean'],
                    ['link'],
                    ['blockquote'],
                    ['sup', 'sub'],
                    ['video'],
                    ['unorderedList', 'orderedList'],
                  ]}
                />
              </Input.Wrapper>

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

              <Flex
                justify="flex-start"
                sx={{margin: '1em 0'}}
              >
                <Input.Wrapper label="Latitude">
                  <Input
                    variant="unstyled"
                    placeholder="Latitude"
                    {...form.getInputProps('latitude')}
                  />
                </Input.Wrapper>
                <Input.Wrapper label="Longitude">
                  <Input
                    variant="unstyled"
                    placeholder="Longitude"
                    {...form.getInputProps('longitude')}
                  />
                </Input.Wrapper>
              </Flex>

              <Accordion>
                <Accordion.Item value="publishing">
                  <Accordion.Control><Text fw={500}>Publishing status</Text></Accordion.Control>
                  <Accordion.Panel>
                    <DatePicker
                      label="Start date"
                      placeholder="Pick start date"
                      firstDayOfWeek="sunday"
                      {...form.getInputProps('startDate')}
                      dayClassName={(date, modifiers) =>
                        cx({
                          [classes.weekend]: modifiers.weekend,
                        })
                      }
                    />
                    <DatePicker
                      label="Expires"
                      placeholder="Pick expiration date"
                      firstDayOfWeek="sunday"
                      {...form.getInputProps('expireDate')}
                      dayClassName={(date, modifiers) =>
                        cx({
                          [classes.weekend]: modifiers.weekend,
                        })
                      }
                      sx={{ margin: '1em 0 2em' }}
                    />

                    <Checkbox
                      mt="md"
                      label="Annual"
                      {...form.getInputProps('annual', { type: 'checkbox' })}
                    />

                    <Checkbox
                      mt="md"
                      label="Enabled"
                      {...form.getInputProps('enabled', { type: 'checkbox' })}
                      sx={{ margin: '1em 0' }}
                    />
                  </Accordion.Panel>
                </Accordion.Item>

                <Accordion.Item value="authorship">
                  <Accordion.Control><Text fw={500}>Authorship</Text></Accordion.Control>
                  <Accordion.Panel>
                    <Text>
                      <span><strong>Created:</strong> {data.created}</span><br />
                      <span><strong>By:</strong> {data.creator} (ID: {data.creatorid})</span>
                    </Text>
                    <Text sx={{marginTop: '1em'}}>
                      <span><strong>Last modified:</strong> {data.modified}</span><br />
                      <span><strong>By:</strong></span>
                    </Text>
                  </Accordion.Panel>
                </Accordion.Item>

              </Accordion>

              <Group position="left" mt="md">
                <Button
                  type="submit"
                  loading={savingState}
                  sx={{ margin: '1em 0' }}>Save Marker</Button>
              </Group>

            </Box>

          </form>
        </>
      }

    </>
  );
}