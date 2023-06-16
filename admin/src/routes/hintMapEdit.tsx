import { useCallback, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useParams, Navigate, useSubmit } from "react-router-dom";
import { createStyles, Flex, Text, Title, Anchor, Box, Input, TextInput, Checkbox, Button, Group, Accordion, Select } from '@mantine/core';
import { showNotification, updateNotification } from '@mantine/notifications';
import { useForm } from '@mantine/form';
import { openConfirmModal } from '@mantine/modals';
import { default as dayjs } from 'dayjs';
import type { MapRef, MapboxEvent, ViewState, ViewStateChangeEvent } from 'react-map-gl';
import { Source, NavigationControl, Layer, LineLayer } from 'react-map-gl';
import * as ReactMapGl from 'react-map-gl'; // For "Map", to avoid collision

import { mapsApiClient } from "../components/mapsApi";
import type { HintMap, HintMapFormData } from "../types/hintmap";
import { emptyHintMap, defaultHintMapFormData } from "../types/hintmap";

const hintMapsRootPath = '/hint_maps';

//
export function HintMapEdit() {
  const submitDelete = useSubmit();

  const [savingState, setSavingState] = useState(false);

  // We can probably do without this, but leaving here for now
  const [mapViewState, setMapViewState] = useState({
    longitude: parseFloat(process.env.REACT_APP_MAP_DEFAULT_CENTER_LNG),
    latitude: parseFloat(process.env.REACT_APP_MAP_DEFAULT_CENTER_LAT),
    zoom: parseFloat(process.env.REACT_APP_MAP_DEFAULT_ZOOM),
  });

  const mutation = useMutation(
    (formData: HintMapFormData) => saveHintMap(formData)
  );

  const queryClient = useQueryClient();

  const mapRef = useRef<MapRef>(null);

  const form = useForm({
    initialValues: defaultHintMapFormData,
    validate: {},
  });

  let hintMapId = '',
      deleteHintMapPath = '',
      absoluteDeleteHintMapPath = ''
      ;

  let params = useParams();

  if (params.hintMapId) {
    if (!isNaN(parseFloat(params.hintMapId))) { // Ensure hint map ID is an int
      hintMapId = params.hintMapId;
      deleteHintMapPath = hintMapsRootPath + '/' + hintMapId + '/delete';
      absoluteDeleteHintMapPath = 'admin' + deleteHintMapPath;
    } else if (params.hintMapId === 'new') {
      hintMapId = params.hintMapId;
    } else {
      throw new Error("Invalid Hint Map ID");
    }
  }
  // Get a hintMap from the API
  const getHintMap = async (id: string) => {
    let hintMapData: HintMap = emptyHintMap;

    if (id !== 'new') {
      const response = await mapsApiClient.get<any>(process.env.REACT_APP_MAPS_API_BASE_PATH + "/hint_maps/" + id);

      hintMapData = response.data.data;

      if (!hintMapData.latitude
        || !hintMapData.longitude
        || !hintMapData.zoom
        ) {
        // Parse the URL to get lat, long, & zoom for old data
        const url = new URL(hintMapData.url_external);
        if (url.host === 'api.mapbox.com') {
          // Path format is like:
          //   /styles/v1/cleveland-metroparks/cisvvmgwe00112xlk4jnmrehn/static/-81.833476,41.468252,13.68,0.00,0.00/240x240
          const re = new RegExp('/styles/v1/cleveland-metroparks/.*/static/(.*),(.*),(.*),.*,.*/(.*)x(.*)');
          // const re = new RegExp('/styles/v1/cleveland-metroparks/.*/static/(-?[\d.]*),(-?[\d.]*),([\d.]*),[\d.]*,[\d.]*/(\d*)x(\d*)');
          const matches = url.pathname.match(re);
          if (matches) {
            console.log('Old URL match', matches[0]);
            hintMapData.longitude = parseFloat(matches[1]);
            hintMapData.latitude = parseFloat(matches[2]);
            hintMapData.zoom = parseFloat(matches[3]);
          }
        }
      }

      // Date value handling; capture nulls & reformat
      // const initEditDate = response.data.data.last_edited ? dayjs(response.data.data.last_edited).toDate() : null;
      // const initRefreshDate = response.data.data.last_refreshed ? dayjs(response.data.data.last_refreshed).toDate() : null;
      // hintMapData.modified = response.data.data.modified ? dayjs(response.data.data.modified).format('dddd, MMMM D, YYYY [at] h:mma') : null;
      // hintMapData.created = response.data.data.created ? dayjs(response.data.data.created).format('dddd, MMMM D, YYYY [at] h:mma') : null;

      form.setValues({
        title: hintMapData.title,
        filenameLocal: hintMapData.image_filename_local,
        urlExternal: hintMapData.url_external,
        latitude: hintMapData.latitude,
        longitude: hintMapData.longitude,
        zoom: hintMapData.zoom,
      });
    }

    return hintMapData;
  }
  // END getHintMap()
  //--------

  const {
    isLoading: hintMapIsLoading,
    isError: hintMapIsError,
    data: hintMapData,
    error: hintMapError,
  } = useQuery<HintMap, Error>(['hint_map', params.hintMapId], () => getHintMap(hintMapId));

  // Save Hint Map to the API
  const saveHintMap = async (formData) => {
    setSavingState(true);
    showNotification({
      id: 'save-hintmap',
      loading: true,
      title: 'Saving Hint Map',
      message: 'One moment',
      autoClose: false,
      disallowClose: true,
    });

    const hintMapSaveData = {
      title: formData.title,
      latitude: formData.latitude,
      longitude: formData.longitude,
      zoom: formData.zoom,
      // expires: formData.expireDate ? dayjs(formData.expireDate).format('YYYY-MM-DD') : null,
      // startdate: formData.expireDate ? dayjs(formData.startDate).format('YYYY-MM-DD') : null,
      // modified: dayjs(),
    };

    const response = (hintMapId === 'new') ?
      mapsApiClient.post<any>(process.env.REACT_APP_MAPS_API_BASE_PATH + '/hint_maps', hintMapSaveData)
      : mapsApiClient.put<any>(process.env.REACT_APP_MAPS_API_BASE_PATH + '/hint_maps/' + hintMapId, hintMapSaveData);

    response
      .then(function (response) {
        // Get new hint map ID:
        if (response.hasOwnProperty('data') && response['data'].data.id) {
          hintMapId = response['data'].data.id;
        }
        const savedMsg = `Hint Map (ID: ${hintMapId}) saved`;
        updateNotification({
          id: 'save-hintmap',
          loading: false,
          title: savedMsg,
          message: '',
          autoClose: 5000,
        });
        setSavingState(false);
        queryClient.invalidateQueries({ queryKey: ['hintmap'] });
        console.log(savedMsg + ':', response);
      })
      .catch(function (error) {
        const errMsg = error.name + ': ' + error.message + ' (' + error.code + ')';
        updateNotification({
          id: 'save-hintmap',
          loading: false,
          color: 'red',
          title: 'Error saving Hint Map',
          message: errMsg,
          autoClose: false,
        });
        setSavingState(false);
        console.error("Error saving Hint Map:", error);
      }
    );

    return response;
  }
  // END saveHintMap()
  //--------

  if (mutation.isSuccess) {
    // if (response.hasOwnProperty('data') && response['data'].data.id) {
    //   const newHintMapPath = process.env.REACT_APP_ROOT_PATH + '/hint_maps/' + response['data'].data.id;
    // }

    return <Navigate to={hintMapsRootPath} replace={true} />
  }

  // Map onLoad event
  // const onMapLoad = (event: MapboxEvent) => {
  //   console.log('onMapLoad');
  // };

  // Map onMove event
  const onMapMove = (event: ViewStateChangeEvent) => {
    console.log('onMapMove event:', event);
    setMapViewState(event.viewState);
    form.setValues({
      latitude: event.viewState.latitude,
      longitude: event.viewState.longitude,
      zoom: event.viewState.zoom,
      urlExternal: mapboxStaticImageUrl(event.viewState),
    });
  };

  // Create Mapbox static image URL using lat,lng,zoom (map view state)
  const mapboxStaticImageUrl = (viewState: ViewState) => {
    let username = process.env.REACT_APP_MAPBOX_USERNAME,
        style_id = process.env.REACT_APP_MAPBOX_STYLE_ID,
        lon = viewState.longitude.toString(),
        lat = viewState.latitude.toString(),
        zoom = viewState.zoom.toString(),
        bearing = '0',
        pitch = '0',
        width = '240',
        height = '240',
        retina = '@2x',
        attribution = 'false',
        logo = 'false',
        access_token = process.env.REACT_APP_MAPBOX_TOKEN;

    let urlStr = `https://api.mapbox.com/styles/v1/${username}/${style_id}/static/${lon},${lat},${zoom},${bearing},${pitch}/${width}x${height}${retina}?attribution=${attribution}&logo=${logo}&access_token=${access_token}`;

    console.log('mapboxStaticImageUrl:', urlStr);

    return urlStr;
  };

  //
  const openDeleteModal = (deleteFormAction) =>
    openConfirmModal({
      title: 'Delete Hint Map',
      centered: true,
      children: (
        <Text size="sm">
          Are you sure you want to delete this hint map? This cannot be undone.
        </Text>
      ),
      labels: { confirm: 'Delete Hint Map', cancel: "Cancel" },
      confirmProps: { color: 'red' },
      onCancel: () => {
        console.log('Hint Map delete cancelled')
      },
      onConfirm: () => {
        // We pass in deleteFormAction
        // (which should be: "/admin/hint_maps/:hintMapId/delete")
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
      <Anchor component={Link} to={`/hint_maps`}>« Hint Maps</Anchor>

      {hintMapIsLoading && <Text>Loading...</Text>}

      {hintMapIsError && (
        <Text>{`There is a problem fetching the Hint Map - ${hintMapError.message}`}</Text>
      )}

      {hintMapData &&
        <>
          <Title order={2} sx={{marginTop: '1em'}}>{hintMapData.title ? hintMapData.title : 'Add Hint Map'}</Title>
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
                placeholder="Hint Map title"
                {...form.getInputProps('title')}
              />

              <Box sx={{ maxWidth: 400, margin: '1em 0' }}>
                <ReactMapGl.Map
                  // "reuseMaps" bypasses initialization when a map is removed and re-added
                  // (switching screens, tabs, etc.) in order to avoid MapBox
                  // generating a billable event with every map initialization
                  // https://visgl.github.io/react-map-gl/docs/get-started/tips-and-tricks#minimize-cost-from-frequent-re-mounting
                  //
                  // @TODO:
                  // However, it also seems to break the re-loading of the DrawControl
                  // when the map is removed and re-rendered.
                  // Maybe this is relevant:? https://github.com/visgl/react-map-gl/issues/699
                  //
                  // reuseMaps={true}

                  ref={mapRef}
                  initialViewState={{
                    longitude: hintMapData.longitude ?? parseFloat(process.env.REACT_APP_MAP_DEFAULT_CENTER_LNG),
                    latitude: hintMapData.latitude ?? parseFloat(process.env.REACT_APP_MAP_DEFAULT_CENTER_LAT),
                    zoom: hintMapData.zoom ?? parseFloat(process.env.REACT_APP_MAP_DEFAULT_ZOOM),
                  }}
                  style={{width: 400, height: 400}}
                  mapStyle={process.env.REACT_APP_MAPBOX_STYLE_URL}
                  mapboxAccessToken={process.env.REACT_APP_MAPBOX_TOKEN}
                  // onLoad={onMapLoad}
                  onMove={onMapMove}
                >
                  <NavigationControl
                    showCompass={false}
                  />
                </ReactMapGl.Map>

              <Flex
                justify="flex-start"
                sx={{margin: '1em 0'}}
              >
                <Input.Wrapper label="Zoom">
                  <Input
                    variant="unstyled"
                    disabled
                    placeholder="Zoom"
                    {...form.getInputProps('zoom')}
                  />
                </Input.Wrapper>
                <Input.Wrapper label="Latitude">
                  <Input
                    variant="unstyled"
                    disabled
                    placeholder="Latitude"
                    {...form.getInputProps('latitude')}
                  />
                </Input.Wrapper>
                <Input.Wrapper label="Longitude">
                  <Input
                    variant="unstyled"
                    disabled
                    placeholder="Longitude"
                    {...form.getInputProps('longitude')}
                  />
                </Input.Wrapper>
              </Flex>

              <Input.Wrapper label="Mapbox Static URL">
                <Input
                  variant="unstyled"
                  disabled
                  placeholder="URL"
                  {...form.getInputProps('urlExternal')}
                />
              </Input.Wrapper>

              <Input.Wrapper label="Filename on maps server">
                <Input
                  variant="unstyled"
                  disabled
                  placeholder="Filename"
                  {...form.getInputProps('filenameLocal')}
                />
              </Input.Wrapper>
              </Box>

              <Group position="left" mt="md">
                <Button
                  type="submit"
                  loading={savingState}
                  sx={{ margin: '1em 0' }}
                >
                Save Hint Map
                </Button>

                {deleteHintMapPath &&
                  <Button
                    onClick={() => openDeleteModal(absoluteDeleteHintMapPath)}
                    variant="outline"
                    color="red"
                  >
                    Delete Hint Map
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