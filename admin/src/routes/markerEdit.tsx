import { useCallback, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useParams, Navigate, useSubmit } from "react-router-dom";
import { createStyles, Flex, Text, Title, Anchor, Box, Input, TextInput, Checkbox, Button, Group, Accordion, Select } from '@mantine/core';
import { showNotification, updateNotification } from '@mantine/notifications';
import { useForm } from '@mantine/form';
import { RichTextEditor } from '@mantine/rte';
import { DatePicker } from '@mantine/dates';
import { openConfirmModal } from '@mantine/modals';
import { default as dayjs } from 'dayjs';
import * as MapGl from 'react-map-gl'; // Namespace as MapGl since we already have "Marker"
import type { MapRef, MarkerDragEvent } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

import { mapsApiClient } from "../components/mapsApi";
import type { Marker, MarkerFormData } from "../types/marker";
import { markerCategorySelectOptions, emptyMarker, defaultMarkerFormData } from "../types/marker";
import { reservationListSelectOptions } from "../types/reservation";

const markersRootPath = '/markers';

// Styling for datepicker weekend days
const useStyles = createStyles((theme) => ({
  weekend: {
    color: `${theme.colors.blue[5]} !important`,
  },
}));


/**
 * Marker Edit
 */
export function MarkerEdit() {
  const submitDelete = useSubmit();

  const [savingState, setSavingState] = useState(false);

  const mutation = useMutation(
    (formData: MarkerFormData) => saveMarker(formData)
  );

  const queryClient = useQueryClient();

  const { classes, cx } = useStyles();

  const mapRef = useRef<MapRef>(null);

  const form = useForm({
    initialValues: defaultMarkerFormData,
    validate: {},
  });

  let markerId = '',
      deleteMarkerPath = '',
      absoluteDeleteMarkerPath = ''
      ;

  let params = useParams();

  if (params.markerId) {
    if (!isNaN(parseFloat(params.markerId))) { // Ensure marker ID is an int
      markerId = params.markerId;
      deleteMarkerPath = markersRootPath + '/' + markerId + '/delete';
      absoluteDeleteMarkerPath = 'admin' + deleteMarkerPath;
    } else if (params.markerId === 'new') {
      markerId = params.markerId;
    } else {
      throw new Error("Invalid Marker ID");
    }
  }

  // Get a marker from the API
  const getMarker = async (id: string) => {
    let markerData: Marker = emptyMarker;

    if (id !== 'new') {
      const response = await mapsApiClient.get<any>(process.env.REACT_APP_MAPS_API_BASE_PATH + "/markers/" + id);

      markerData = response.data.data;

      // Date value handling; capture nulls & reformat
      const initExpireDate = response.data.data.expires ? dayjs(response.data.data.expires).toDate() : null;
      const initStartDate = response.data.data.startdate ? dayjs(response.data.data.startdate).toDate() : null;
      markerData.modified = response.data.data.modified ? dayjs(response.data.data.modified).format('dddd, MMMM D, YYYY [at] h:mma') : null;
      markerData.created = response.data.data.created ? dayjs(response.data.data.created).format('dddd, MMMM D, YYYY [at] h:mma') : null;

      form.setValues({
        title: response.data.data.title,
        content: response.data.data.content,
        category: response.data.data.category != null ? response.data.data.category : '',
        enabled: response.data.data.enabled === 1,
        annual: response.data.data.annual === 1,
        startDate: initStartDate,
        expireDate: initExpireDate,
        latitude: response.data.data.lat,
        longitude: response.data.data.lng,
      });
    }

    return markerData;
  }
  // END getMarker()
  //--------

  const {
    isLoading: markerIsLoading,
    isError: markerIsError,
    data: markerData,
    error: markerError,
  } = useQuery<Marker, Error>(['marker', params.markerId], () => getMarker(markerId));

  // Save Marker to the API
  const saveMarker = async (formData) => {
    setSavingState(true);
    showNotification({
      id: 'save-marker',
      loading: true,
      title: 'Saving Marker',
      message: 'One moment',
      autoClose: false,
      disallowClose: true,
    });

    const markerSaveData = {
      creator: 'Jeff Schuler', // @TODO
      // created: dayjs(),
      lat: formData.latitude,
      lng: formData.longitude,
      content: formData.content,
      title: formData.title,
      expires: formData.expireDate ? dayjs(formData.expireDate).format('YYYY-MM-DD') : null,
      creatorid: 1, // @TODO
      geom_geojson: '', // @TODO
      category: formData.category,
      reservation: formData.reservation,
      enabled: formData.enabled ? 1 : 0,
      annual: formData.annual ? 1 : 0,
      startdate: formData.expireDate ? dayjs(formData.startDate).format('YYYY-MM-DD') : null,
      modified: dayjs(),
    };

    const response = (markerId === 'new') ?
      mapsApiClient.post<any>(process.env.REACT_APP_MAPS_API_BASE_PATH + '/markers', markerSaveData)
      : mapsApiClient.put<any>(process.env.REACT_APP_MAPS_API_BASE_PATH + '/markers/' + markerId, markerSaveData);

    response
      .then(function (response) {
        // Get new marker ID:
        if (response.hasOwnProperty('data') && response['data'].data.id) {
          markerId = response['data'].data.id;
        }
        const savedMsg = `Marker (ID: ${markerId}) saved`;
        updateNotification({
          id: 'save-marker',
          loading: false,
          title: savedMsg,
          message: '',
          autoClose: 5000,
        });
        setSavingState(false);
        queryClient.invalidateQueries({ queryKey: ['marker'] });
        console.log(savedMsg + ':', response);
      })
      .catch(function (error) {
        const errMsg = error.name + ': ' + error.message + ' (' + error.code + ')';
        updateNotification({
          id: 'save-marker',
          loading: false,
          color: 'red',
          title: 'Error saving Marker',
          message: errMsg,
          autoClose: false,
        });
        setSavingState(false);
        console.error("Error saving Marker:", error);
      }
    );

    return response;
  }
  // END saveMarker()
  //--------

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

  if (mutation.isSuccess) {
    // if (response.hasOwnProperty('data') && response['data'].data.id) {
    //   const newMarkerPath = process.env.REACT_APP_ROOT_PATH + '/markers/' + response['data'].data.id;
    // }

    return <Navigate to={markersRootPath} replace={true} />
  }

  //
  const openDeleteModal = (deleteFormAction) =>
    openConfirmModal({
      title: 'Delete Marker',
      centered: true,
      children: (
        <Text size="sm">
          Are you sure you want to delete this marker? This cannot be undone.
        </Text>
      ),
      labels: { confirm: 'Delete Marker', cancel: "Cancel" },
      confirmProps: { color: 'red' },
      onCancel: () => {
        console.log('Marker delete cancelled')
      },
      onConfirm: () => {
        // We pass in deleteFormAction
        // (which should be: "/admin/markers/:markerId/delete")
        // because when using useSubmit() (which is what submitDelete is)
        // we apparently lose path context. If we just used <Form> inside our component
        // it would inherit the base path.
        // Ultimately want to use React Router's <Prompt> when they re-add it –
        // it was removed in 6.4 or thereabouts.
        submitDelete(null, { method: "post", action: deleteFormAction });
      },
    }
  );

  return (
    <>
      <Anchor component={Link} to={`/markers`}>« Markers</Anchor>

      {markerIsLoading && <Text>Loading...</Text>}

      {markerIsError && (
        <Text>{`There is a problem fetching the marker - ${markerError.message}`}</Text>
      )}

      {markerData &&
        <>
          <Title order={2} sx={{marginTop: '1em'}}>{markerData.title ? markerData.title : 'Add Marker'}</Title>

          <form
            onSubmit={
              form.onSubmit((formValues) => {
                mutation.mutate(formValues);
              })
            }
          >
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
                  data={markerCategorySelectOptions}
                  {...form.getInputProps('category')}
                />
              </Box>

              <Box sx={{marginTop: '1em'}}>
                <Select
                  label="Reservation"
                  placeholder="Choose a reservation"
                  data={reservationListSelectOptions}
                  defaultValue=''
                  {...form.getInputProps('reservation')}
                />
              </Box>

              <Box sx={{marginTop: '1em'}}>
                <MapGl.Map
                  reuseMaps
                  ref={mapRef}
                  initialViewState={{
                    latitude: markerData.lat,
                    longitude: markerData.lng,
                    zoom: parseFloat(process.env.REACT_APP_MAP_DEFAULT_ZOOM),
                  }}
                  style={{width: 800, height: 400}}
                  mapStyle={process.env.REACT_APP_MAPBOX_STYLE_URL}
                  mapboxAccessToken={process.env.REACT_APP_MAPBOX_TOKEN}
                >
                  <MapGl.Marker
                    longitude={markerData.lng}
                    latitude={markerData.lat}
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

              <Accordion defaultValue="publishing">
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
                      label="Enabled"
                      {...form.getInputProps('enabled', { type: 'checkbox' })}
                      sx={{ margin: '1em 0' }}
                    />

                    <Checkbox
                      mt="md"
                      label="Annual"
                      {...form.getInputProps('annual', { type: 'checkbox' })}
                    />
                  </Accordion.Panel>
                </Accordion.Item>

                <Accordion.Item value="authorship">
                  <Accordion.Control><Text fw={500}>Authorship</Text></Accordion.Control>
                  <Accordion.Panel>
                    <Text>
                      <span><strong>Created:</strong> {markerData.created}</span><br />
                      <span><strong>By:</strong> {markerData.creator} (ID: {markerData.creatorid})</span>
                    </Text>
                    <Text sx={{marginTop: '1em'}}>
                      <span><strong>Last modified:</strong> {markerData.modified}</span><br />
                      <span><strong>By:</strong></span>
                    </Text>
                  </Accordion.Panel>
                </Accordion.Item>

              </Accordion>

              <Group position="left" mt="md">
                <Button
                  type="submit"
                  loading={savingState}
                  sx={{ margin: '1em 0' }}
                >
                Save Marker
                </Button>

                {deleteMarkerPath &&
                  <Button
                    onClick={() => openDeleteModal(absoluteDeleteMarkerPath)}
                    variant="outline"
                    color="red"
                  >
                    Delete Marker
                  </Button>
                }
              </Group>

            </Box>

          </form>
        </>
      }

    </>
  );
}