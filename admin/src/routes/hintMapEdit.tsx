import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useParams, Navigate, useSubmit } from "react-router-dom";
import { Flex, Text, Title, Anchor, Box, Input, TextInput, Button, Group } from '@mantine/core';
import { showNotification, updateNotification } from '@mantine/notifications';
import { useForm } from '@mantine/form';
import { openConfirmModal } from '@mantine/modals';
import { default as dayjs } from 'dayjs';
import type { MapRef, ViewState, ViewStateChangeEvent } from 'react-map-gl';
import { NavigationControl } from 'react-map-gl';
import * as ReactMapGl from 'react-map-gl'; // For "Map", to avoid collision

import { mapsApiClient } from "../components/mapsApi";
import type { HintMap, HintMapFormData } from "../types/hintmap";
import { emptyHintMap, defaultHintMapFormData, formatMapsHintMapLink } from "../types/hintmap";

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

  const [mapboxStaticImg, setMapboxStaticImg] = useState('');

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
      deleteHintMapPath = '';

  let params = useParams();

  if (params.hintMapId) {
    if (!isNaN(parseFloat(params.hintMapId))) { // Ensure hint map ID is an int
      hintMapId = params.hintMapId;
      deleteHintMapPath = hintMapsRootPath + '/' + hintMapId + '/delete';
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

      setMapboxStaticImg(hintMapData.url_external)

      if (!hintMapData.latitude
        || !hintMapData.longitude
        || !hintMapData.zoom
        ) {
        // Parse the URL to get lat, long, & zoom for old data
        const url = new URL(hintMapData.url_external);
        if (url.host === 'api.mapbox.com') {
          // Path format is like:
          //   /styles/v1/cleveland-metroparks/cisvvmgwe00112xlk4jnmrehn/static/-81.833476,41.468252,13.68,0.00,0.00/240x240{@2x}
          // New URLs have @2x, old ones don't.
          const re = new RegExp('/styles/v1/cleveland-metroparks/.*/static/(.*),(.*),(.*),.*,.*/(.*)x(.*)(@2x)?');
          const matches = url.pathname.match(re);
          if (matches) {
            console.log('External URL regex match.', matches[0]);
            hintMapData.longitude = parseFloat(matches[1]);
            hintMapData.latitude = parseFloat(matches[2]);
            hintMapData.zoom = parseFloat(matches[3]);
          } else {
            console.error('Error getting lng,lat,zoom from external URL.', matches[0]);
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

  // Save Hint Map via the API
  const saveHintMap = async (formData) => {
    setSavingState(true);
    showNotification({
      id: 'save-hintmap',
      loading: true,
      title: 'Saving Hint Map',
      message: 'One moment',
      autoClose: false,
      withCloseButton: false,
    });

    const hintMapSaveData = {
      title: formData.title,
      // latitude: formData.latitude,
      // longitude: formData.longitude,
      // zoom: formData.zoom,
      url_external: formData.urlExternal,
      // image_filename_local: formData.filenameLocal, // API responsible for this
      last_edited: dayjs(),
      last_refreshed: dayjs(),
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
    //   const newHintMapPath = '/hint_maps/' + response['data'].data.id;
    // }

    return <Navigate to={hintMapsRootPath} replace={true} />
  }

  // Map onMove event
  const onMapMove = (event: ViewStateChangeEvent) => {
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

    return urlStr;
  };

  // Regenerate Mapbox static image
  const regenerateMapboxStaticImg = () => {
    // Get url from form urlExternal field
    setMapboxStaticImg(form.values.urlExternal);
    showNotification({
      id: 'regenerate-hintmap',
      loading: false,
      title: 'Regenerating Mapbox static image',
      message: '',
      autoClose: 5000,
    });

  }

  // Open Delete modal
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
            <TextInput
              mt="md"
              required
              label="Title"
              placeholder="Hint Map title"
              {...form.getInputProps('title')}
            />

            <Group align="flex-start" sx={{ margin: '1em 0' }}>
              {/* Left side */}
              <Box>
                <Title order={4} mb="sm">Choose map view</Title>
                <div style={{position:"relative"}}>
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
                    onMove={onMapMove}
                  >
                    <NavigationControl
                      showCompass={false}
                    />
                  </ReactMapGl.Map>

                  {/* Box overlaying map to show where the generated map area will be: */}
                  <div style={{
                    position:"absolute",
                    width: 240, height: 240,
                    top: 80, left: 80,
                    outline: "1px solid #9a9a9a",
                    pointerEvents: "none",
                    boxShadow: "0 6px 30px 0 rgba(14,33,39,.75)",
                    }}>
                  </div>
                </div>

                <Flex justify="flex-start" mt="sm">
                  <Input.Wrapper label="Zoom:">
                    <Input
                      variant="unstyled"
                      disabled
                      placeholder="Zoom"
                      size="xs"
                      {...form.getInputProps('zoom')}
                    />
                  </Input.Wrapper>
                  <Input.Wrapper label="Latitude:">
                    <Input
                      variant="unstyled"
                      disabled
                      placeholder="Latitude"
                      size="xs"
                      {...form.getInputProps('latitude')}
                    />
                  </Input.Wrapper>
                  <Input.Wrapper label="Longitude:">
                    <Input
                      variant="unstyled"
                      disabled
                      placeholder="Longitude"
                      size="xs"
                      {...form.getInputProps('longitude')}
                    />
                  </Input.Wrapper>
                </Flex>
              </Box>
              {/* End Left side */}

              {/* Center */}
              <Box>
                <Title order={4} mb="sm">Mapbox static image</Title>
                <img src={mapboxStaticImg} alt="Mapbox static map" width="240" height="240" />
                <Input.Wrapper label="Mapbox Static URL:" mt="sm">
                  <Input
                    variant="unstyled"
                    disabled
                    placeholder="URL"
                    size="xs"
                    {...form.getInputProps('urlExternal')}
                  />
                </Input.Wrapper>
                <Group position="center" mt="md">
                  <Button
                    onClick={() => regenerateMapboxStaticImg()}
                    variant="light"
                  >
                    Regenerate
                  </Button>
                </Group>

              </Box>
              {/* End Center */}

              {/* Right side */}
              <Box>
                <Title order={4} mb="sm">Saved image</Title>
                <img src={formatMapsHintMapLink(hintMapData.image_filename_local)} alt="Saved static map" width="240" height="240" />
                <Input.Wrapper label="Filename on maps server:" mt="sm">
                  <Input
                    variant="unstyled"
                    disabled
                    placeholder="Filename"
                    size="xs"
                    {...form.getInputProps('filenameLocal')}
                  />
                </Input.Wrapper>
              </Box>
              {/* End Right side */}
            </Group>

            <Group position="left">
              <Button
                type="submit"
                loading={savingState}
              >
                Save Hint Map
              </Button>

              {deleteHintMapPath &&
                <Button
                  onClick={() => openDeleteModal(deleteHintMapPath)}
                  variant="outline"
                  color="red"
                >
                  Delete Hint Map
                </Button>
              }
            </Group>
          </form>
        </>
      }
    </>
  );
}