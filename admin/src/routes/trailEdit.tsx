import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, Navigate, useParams, useSubmit } from "react-router-dom";
import { Title, Text, Tabs, Grid, Accordion, Anchor, Input, TextInput, Checkbox, Button, Group, Box, Select, Space } from '@mantine/core';
import { showNotification, updateNotification } from '@mantine/notifications';
import { useForm } from '@mantine/form';

import { RichTextEditor } from '@mantine/tiptap';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { Link as TipTapLink } from '@tiptap/extension-link';

import { openConfirmModal } from '@mantine/modals';
import { default as dayjs } from 'dayjs';
// Import timezone and utc plugins from dayjs
import { default as utc } from 'dayjs/plugin/utc';
import { default as timezone } from 'dayjs/plugin/timezone';

import { LngLat, LngLatBounds } from 'mapbox-gl';
import { coordEach } from '@turf/meta';
import { lineString } from '@turf/helpers';
import { LineString, GeoJsonProperties } from 'geojson';

import { useAuth } from "../hooks/useAuth";

import type { Trail, TrailProfile, TrailGeometry, LineStringFeature, TrailFormData } from "../types/trail";
import { emptyTrail, defaultTrailFormData } from "../types/trail";
import { reservationListSelectOptions } from "../types/reservation";

import { mapsApiClient } from "../components/mapsApi";
import { TrailMap } from "../components/trailMap";
import { TrailWaypoints } from "../components/trailWaypoints";
import { TrailStats } from "../components/trailStats";
import { TrailDirections } from "../components/trailDirections";
import { TrailProfileChart } from "../components/trailProfileChart";

const trailsRootPath = '/trails';

const defaultTrailProfile: TrailProfile = {
  id: null,
  elevation_profile: []
};

// Set up dayjs TZ
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault();

/**
 * Trail Edit
 */
export function TrailEdit() {
  const { user } = useAuth();

  const submitDelete = useSubmit();

  const [savingState, setSavingState] = useState(false);
  const [redirectPath, setRedirectPath] = useState('');

  const mutation = useMutation(
    (formData: TrailFormData) => saveTrail(formData)
  );

  const queryClient = useQueryClient();

  let trailId = '',
      deleteTrailPath = '';

  let params = useParams();

  if (params.trailId) {
    if (!isNaN(parseFloat(params.trailId))) { // Ensure trail ID is an int
      trailId = params.trailId;
      deleteTrailPath = trailsRootPath + '/' + trailId + '/delete';
    } else if (params.trailId === 'new') {
      trailId = params.trailId;
    } else {
      throw new Error("Invalid Trail ID");
    }
  }

  // @TODO: starting on "general" tab breaks map sizing
  const [activeTab, setActiveTab] = useState("route");

  const [trailGeometry, setTrailGeometry] = useState('');
  const [trailDirections, setTrailDirections] = useState({});
  const [trailElevation, setTrailElevation] = useState(defaultTrailProfile);
  const [trailStats, setTrailStats] = useState({
    // Starting point
    lat: 0,
    lng: 0,
    // Bounds
    boxw: -180,
    boxs: -90,
    boxe: 180,
    boxn: 90,
    // Distance/duration
    distancetext : '',
    distance_feet : '',
    durationtext_hike : '',
    durationtext_bike : '',
    durationtext_bridle : '',
  });

  // Travel mode ("via"), for routing
  const [travelMode, setTravelMode] = useState('');

  const emptyLineStringFeature: LineStringFeature<LineString, GeoJsonProperties> = {
    type: "Feature",
    geometry: {
      type: 'LineString',
      coordinates: [],
    },
    id: '',
    properties: {},
  };
  // @TODO: We should be able to simplify this by just storing coordinates at this level
  // and turning them into a feature only where necessary in child components.
  // Could then get rid of LineStringFeature type.
  const [waypointsFeature, setWaypointsFeature] = useState(emptyLineStringFeature);
  // Keeping a separate waypoints feature that we use for the "Back to start"
  // functionality. Triggering that functionality causes us to update the Draw
  // Control; we catch this waypointsForDraw data in the DrawControl with useEffect().
  // We don't want to use the same waypointsFeature as above because we don't want to
  // trigger an extra redraw of the draw control (via our create/update callbacks) every
  // time the user edits it via the Draw UI.
  const [waypointsForDraw, setWaypointsForDraw] = useState(emptyLineStringFeature);

  const [waypointsGeoJSON, setWaypointsGeoJSON] = useState('');

  const sw = new LngLat(-82.08504, 41.11816);
  const ne = new LngLat(-81.28029, 41.70009);
  const [bounds, setBounds] = useState(new LngLatBounds(sw, ne));

  const [trailDescription, setTrailDescription] = useState('');

  // Rich text editor
  const richTextEditor = useEditor({
    extensions: [ StarterKit, Underline, TipTapLink ],
    content: trailDescription,
    // Update form value on editor update
    onUpdate: ({ editor }) => {
      form.setFieldValue('description', editor.getHTML());
    }
  });

  // Set initial editor content when we get trail [description] from API
  useEffect(() => {
    if (richTextEditor) {
      richTextEditor.commands.setContent(trailDescription);
    }
  }, [richTextEditor, trailDescription]);

  const form = useForm({
    initialValues: defaultTrailFormData,
    validate: {},
  });

  // Get a Trail from the API
  const getTrail = async (id: string) => {
    let trailData: Trail = emptyTrail;

    if (id !== 'new') {
      const response = await mapsApiClient.get<any>(process.env.REACT_APP_MAPS_API_BASE_PATH + "/trails/" + id);

      trailData = response.data.data;

      setTrailStats({
        // Starting point
        lat: response.data.data.lat,
        lng: response.data.data.lng,
        // Bounds
        boxw: response.data.data.boxw,
        boxs: response.data.data.boxs,
        boxe: response.data.data.boxe,
        boxn: response.data.data.boxn,
        // Distance/duration
        distancetext : response.data.data.distancetext,
        distance_feet : response.data.data.distance_feet ? response.data.data.distance_feet.toString() : '',
        durationtext_hike : response.data.data.durationtext_hike,
        durationtext_bike : response.data.data.durationtext_bike,
        durationtext_bridle : response.data.data.durationtext_bridle,
      });

      setWaypointsGeoJSON(response.data.data.waypoints_geojson);

      const trailWaypoints = JSON.parse(response.data.data.waypoints_geojson);
      // Filter out the zero entries from the waypoints;
      // a vestige of the way waypoints used to be stored in the DB
      let filteredCoords = Array;
      if (trailWaypoints != null && trailWaypoints.geometry != null) {
        const initialCoords = trailWaypoints.geometry.coordinates;
        if (initialCoords) {
          filteredCoords = initialCoords.filter(function(coordinate, index, arr) {
            return ((coordinate[0] != 0) && (coordinate[1] != 0));
          });
          trailWaypoints.geometry.coordinates = filteredCoords;
        }
      }
      setWaypointsFeature(trailWaypoints);

      setTrailDescription(response.data.data.description);

      form.setValues({
        name: response.data.data.name,
        description: response.data.data.description,
        res: response.data.data.res,
        hike: response.data.data.hike === "Yes",
        bike: response.data.data.bike === "Yes",
        mountainbike: response.data.data.mountainbike === "Yes",
        bridle: response.data.data.bridle === "Yes",
        status: response.data.data.status === 1,
        creator_username: response.data.data.creator_username,
        modifier_username: response.data.data.modifier_username,
      });

      if (response.data.data.directions) {
        // "directions" is serialized as JSON in the DB
        let directionsJSON = JSON.parse(response.data.data.directions);
        setTrailDirections(directionsJSON);
      }
    }

    return trailData;
  }
  // END getTrail()
  //--------
  
  const {
    isLoading: trailIsLoading,
    isError: trailIsError,
    data: trailData,
    error: trailError
  } = useQuery<Trail, Error>(['trail', params.trailId], () => getTrail(trailId));
  //---------------------------------------------------------------------------

  // Save Trail via the API
  const saveTrail = async (formData) => {
    setSavingState(true);
    showNotification({
      id: 'save-trail',
      loading: true,
      title: 'Saving Trail',
      message: 'One moment',
      autoClose: false,
      withCloseButton: false,
    });

    const now_datetime = dayjs().tz('America/New_York').format('YYYY-MM-DD HH:mm:ss');

    const trailSaveData = {
      name: formData.name,
      res: formData.res,
      bike: formData.bike ? "Yes" : "No",
      hike: formData.hike ? "Yes" : "No",
      bridle: formData.bridle ? "Yes" : "No",
      mountainbike: formData.mountainbike ? "Yes" : "No",
      description: formData.description,
      directions: JSON.stringify(trailDirections),

      distancetext: trailStats.distancetext, // number
      distance_feet: trailStats.distance_feet, // string
      durationtext_hike: trailStats.durationtext_hike, // string
      durationtext_bike: trailStats.durationtext_bike, // string
      durationtext_bridle: trailStats.durationtext_bridle, // string

      waypoints_geojson: waypointsGeoJSON,

      elevation_profile: trailElevation,

      geom_geojson: trailGeometry,

      lat: trailStats.lat,
      lng: trailStats.lng,

      boxw: trailStats.boxw,
      boxs: trailStats.boxs,
      boxe: trailStats.boxe,
      boxn: trailStats.boxn,

      // dest_id: number,
      // dd_lat: number,
      // dd_lng: number,

      date_created: (trailId === 'new') ? now_datetime : trailData.date_created ? dayjs(trailData.date_created).tz('America/New_York').format('YYYY-MM-DD HH:mm:ss') : null,
      date_modified: now_datetime,

      status: formData.status ? 1 : 0,

      creator_username: trailData.creator_username ? trailData.creator_username : (trailId === 'new') ? user : null,
      modifier_username: user,
    };

    console.log('Saving trail:', trailSaveData);

    // Saving a new trail
    const response = (trailId === 'new') ?
      mapsApiClient.post<any>(process.env.REACT_APP_MAPS_API_BASE_PATH + '/trails', trailSaveData)
      : mapsApiClient.put<any>(process.env.REACT_APP_MAPS_API_BASE_PATH + '/trails/' + trailId, trailSaveData);
    response
      .then(function (response) {
        // Get new trail ID:
        if (response.hasOwnProperty('data') && response['data'].data.id) {
          trailId = response['data'].data.id;

          const savedMsg = `Trail "${response['data'].data.name}" (ID: ${trailId}) saved`;
          updateNotification({
            id: 'save-trail',
            loading: false,
            title: savedMsg,
            message: '',
            autoClose: 5000,
          });
          setSavingState(false);
          queryClient.invalidateQueries({ queryKey: ['trail'] });

          // Redirect to the trail edit page for this new trail
          setRedirectPath(trailsRootPath + '/' + trailId);
          console.log('Redirecting to: ', trailsRootPath + '/' + trailId);

          console.log(savedMsg + ':', response);
        }
      })
      .catch(function (error) {
        const errMsg = error.name + ': ' + error.message + ' (' + error.code + ')';
        updateNotification({
          id: 'save-trail',
          loading: false,
          color: 'red',
          title: 'Error saving Trail',
          message: errMsg,
          autoClose: false,
        });
        setSavingState(false);
        console.error("Error saving Trail:", error);
      }
    );

    return response;
  }
  // END saveTrail()
  //--------

  //
  // Get trail Elevation Profile from API
  //
  const getTrailProfile = async (id: string) => {
    if (id !== 'new') {
      const response = await mapsApiClient.get<any>(process.env.REACT_APP_MAPS_API_BASE_PATH + "/trail_profiles/" + id);

      setTrailElevation(response.data.data.elevation_profile);

      return response.data.data;
    }

    return {data: {}};
  }

  const {
    isLoading: trailProfileIsLoading,
    isError: trailProfileIsError,
    data: trailProfileData,
    error: trailProfileError
  } = useQuery<TrailProfile, Error>(['trail_profile', trailId], () => getTrailProfile(trailId));
  //---------------------------------------------------------------------------

  //
  // Get trail geometry from API 
  //
  const getTrailGeometry = async (id: string) => {
    if (id !== 'new') {
      const response = await mapsApiClient.get<any>(process.env.REACT_APP_MAPS_API_BASE_PATH + "/trail_geometries/" + id);
      const geojson = JSON.parse(response.data.data.geom_geojson);

      setTrailGeometry(response.data.data.geom_geojson);

      if (geojson.coordinates) {
        let trailBounds = new LngLatBounds();
        coordEach(geojson, function (coord) {
          trailBounds.extend([coord[0], coord[1]]);
        });
        setBounds((bounds) => {
          return trailBounds;
        });
      }

      return response.data.data;
    }

    return {data: {}};
  }

  const {
    isLoading: trailGeomIsLoading,
    isError: trailGeomIsError,
    data: trailGeomData,
    error: trailGeomError
  } = useQuery<TrailGeometry, Error>(['trail_geometry', trailId], () => getTrailGeometry(trailId));
  //---------------------------------------------------------------------------

  // Get route from waypoints from API
  const getRouteFromWaypoints = async (waypointsGeojson: string, travelMode: string) => {
    const params = new URLSearchParams({
      waypoints: waypointsGeojson,
      via: travelMode
    });

    await mapsApiClient.get<any>(process.env.REACT_APP_MAPS_API_BASE_PATH + "/route_waypoints", { params })
      .then(function (response) {
        setTrailGeometry(JSON.stringify(response.data.data.geojson));

        // Callback to update stats
        setTrailStats({
          // Totals
          distancetext: response.data.data.totals.distancetext,
          distance_feet: response.data.data.totals.distance_feet,
          durationtext_hike: response.data.data.totals.durationtext_hike,
          durationtext_bike: response.data.data.totals.durationtext_bike,
          durationtext_bridle: response.data.data.totals.durationtext_bridle,
          // Starting point
          lat: response.data.data.start.lat,
          lng: response.data.data.start.lng,
          // Bounds
          boxw: response.data.data.bounds.west,
          boxs: response.data.data.bounds.south,
          boxe: response.data.data.bounds.east,
          boxn: response.data.data.bounds.north,
        });

        // Callback to update turn-by-turn directions
        setTrailDirections(response.data.data.steps);

        // "route_waypoints" API endpoint returns the profile data in a different format than "trail_profiles" (@TODO).
        // The chart component apparently needs the coordinates as strings.
        const transformedProfile = response.data.data.elevationprofile.map(({y, x}) => { return {x: x.toString(), y: y.toString()}})
        setTrailElevation(transformedProfile);
      })
      .catch(function (error) {
        console.error('Error getting route from waypoints', error);
        let msg = error.code + ': ' + error.message;
        if (error.response && error.response.data && error.response.data.message) {
          msg += ": " + error.response.data.message;
        }
        showNotification({
          id: 'routing-error',
          title: 'Error getting route from waypoints',
          message: msg,
          autoClose: false,
          color: 'red',
        });
      });
  }
  //---------------------------------------------------------------------------
  //
  // Waypoints Draw update callbacks
  //

  // Make GeoJSON linestring from waypoints (inside Draw/GeoJSON feature)
  function makeWaypointGeojsonString(feature) {
    if (feature.geometry && feature.geometry.coordinates) { 
      // Turn into GeoJSON string for DB storage
      const coordsLinestring = lineString(feature.geometry.coordinates); // Using turf
      const output = JSON.stringify(coordsLinestring);
      return output;
    }
  }

  // Complete the trail; back to start
  const completeTrail = () => {
    // Create the new feature and append the coordinate
    let newFeature = {...waypointsFeature};
    let coords = newFeature.geometry.coordinates;
    if (coords.length > 1) {
      if (coords[0] != coords[coords.length - 1]) {
        // Add the first coordinate to the end of the coords array
        coords.push(coords[0]);
      } else {
        // @TODO: Warning to user: already added
      }
    } else {
      // @TODO: Warning to user: not enought waypoints
    }

    setWaypointsFeature(curFeature => {
      return newFeature;
    });
    setWaypointsForDraw(curFeature => {
      return newFeature;
    });

    // We have to call these, because Draw.create & Draw.update events
    // are only called via user interaction
    const wpGeoJSON = makeWaypointGeojsonString(newFeature);
    setWaypointsGeoJSON(wpGeoJSON);
    getRouteFromWaypoints(wpGeoJSON, travelMode);
  }

  // on Draw Create
  // @TODO: all these callbacks have all become the same...
  const onDrawCreate = e => {
    const feature_id = Object.keys(e.features)[0];
    setWaypointsFeature(curFeature => {
      return e.features[feature_id];
    });
    const wpGeoJSON = makeWaypointGeojsonString(e.features[feature_id]);
    setWaypointsGeoJSON(wpGeoJSON);
    getRouteFromWaypoints(wpGeoJSON, travelMode);
  };

  // on Draw Update
  const onDrawUpdate = e => {
    const feature_id = Object.keys(e.features)[0];
    setWaypointsFeature(curFeature => {
      return e.features[feature_id];
    });
    const wpGeoJSON = makeWaypointGeojsonString(e.features[feature_id]);
    setWaypointsGeoJSON(wpGeoJSON);
    getRouteFromWaypoints(wpGeoJSON, travelMode);
  };

  // on Draw Delete
  const onDrawDelete = e => {
    const feature_id = Object.keys(e.features)[0];
    setWaypointsFeature(curFeature => {
      return e.features[feature_id];
    });
    const wpGeoJSON = makeWaypointGeojsonString(e.features[feature_id]);
    setWaypointsGeoJSON(wpGeoJSON);
    getRouteFromWaypoints(wpGeoJSON, travelMode);
  };
  //----------------------------------

  // When travel mode is changed (from within Trail Map component)
  const handleTravelModeChange = (mode) => {
    setTravelMode(mode);
    // Re-calculate route
    getRouteFromWaypoints(waypointsGeoJSON, mode);
  }

  //
  const openDeleteModal = (deleteFormAction) =>
    openConfirmModal({
      title: 'Delete Trail',
      centered: true,
      children: (
        <Text size="sm">
          Are you sure you want to delete this trail? This cannot be undone.
        </Text>
      ),
      labels: { confirm: 'Delete Trail', cancel: "Cancel" },
      confirmProps: { color: 'red' },
      onCancel: () => {
        console.log('Trail delete cancelled')
      },
      onConfirm: () => {
        // We pass in deleteFormAction
        // (which should be: "/trails/:trailId/delete")
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
      {redirectPath && <Navigate to={redirectPath} />}

      <Anchor component={Link} to={`/trails`}>« Trails</Anchor>

      {trailIsLoading && <div>Loading...</div>}

      {trailIsError && (
        <Text>{`There is a problem fetching the trail - ${trailError.message}`}</Text>
      )}

      {trailData &&
        <>
          <Title order={2} sx={{marginTop: '1em'}}>{trailData.name ? trailData.name : 'Add Trail'}</Title>

          <form
            onSubmit={
              form.onSubmit((formValues) => {
                mutation.mutate(formValues);
              })
            }
          >

            <Tabs value={activeTab} onTabChange={setActiveTab} sx={{marginTop: '1em'}}>

              <Tabs.List>
                <Tabs.Tab value="general">General</Tabs.Tab>
                <Tabs.Tab value="route">Route</Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="general">
                <Box sx={{ maxWidth: 800 }}>

                  <TextInput
                    mt="md"
                    required
                    label="Name"
                    placeholder="Trail name"
                    {...form.getInputProps('name')}
                  />

                  <Box sx={{marginTop: '1em'}}>
                    <Select
                      label="Reservation"
                      data={reservationListSelectOptions}
                      {...form.getInputProps('res')}
                    />
                  </Box>

                  <Input.Wrapper
                    label="Description"
                    withAsterisk
                    sx={{marginTop: '1em'}}
                  >
                    <RichTextEditor editor={richTextEditor}>
                      <RichTextEditor.Toolbar sticky stickyOffset={60}>
                        <RichTextEditor.ControlsGroup>
                          <RichTextEditor.Bold />
                          <RichTextEditor.Italic />
                          <RichTextEditor.Underline />
                        </RichTextEditor.ControlsGroup>

                        <RichTextEditor.ControlsGroup>
                          <RichTextEditor.Link />
                          <RichTextEditor.Unlink />
                        </RichTextEditor.ControlsGroup>

                        <RichTextEditor.ControlsGroup>
                          <RichTextEditor.BulletList />
                          <RichTextEditor.OrderedList />
                        </RichTextEditor.ControlsGroup>

                        <RichTextEditor.ControlsGroup>
                          <RichTextEditor.ClearFormatting />
                          <RichTextEditor.Code />
                        </RichTextEditor.ControlsGroup>
                      </RichTextEditor.Toolbar>

                      <RichTextEditor.Content />
                    </RichTextEditor>
                  </Input.Wrapper>

                  <Group>
                    <Checkbox
                      mt="md"
                      label="Published"
                      {...form.getInputProps('status', { type: 'checkbox' })}
                    />
                  </Group>

                  <Group>
                    <Checkbox
                      mt="md"
                      label="Hiking"
                      {...form.getInputProps('hike', { type: 'checkbox' })}
                    />
                    <Checkbox
                      mt="md"
                      label="Biking"
                      {...form.getInputProps('bike', { type: 'checkbox' })}
                    />
                    <Checkbox
                      mt="md"
                      label="Mountain biking"
                      {...form.getInputProps('mountainbike', { type: 'checkbox' })}
                    />
                    <Checkbox
                      mt="md"
                      label="Horseback"
                      {...form.getInputProps('bridle', { type: 'checkbox' })}
                    />
                  </Group>

                </Box>
              </Tabs.Panel>

              <Tabs.Panel value="route">
                <Grid>
                  <Grid.Col span={9} style={{ minHeight: 600 }}>
                    <TrailMap
                      trail={trailData}
                      trailGeom={trailGeometry}
                      waypointsFeature={waypointsFeature}
                      waypointsForDraw={waypointsForDraw}
                      mapBounds={bounds}
                      onDrawCreate={onDrawCreate}
                      onDrawUpdate={onDrawUpdate}
                      onDrawDelete={onDrawDelete}
                      doCompleteTrail={completeTrail}
                      activeTab={activeTab}
                      onTravelModeChange={handleTravelModeChange}
                    />
                    <TrailProfileChart trailProfile={trailElevation} />
                  </Grid.Col>
                  <Grid.Col span={3}>
                    <Accordion defaultValue="stats">
                      <Accordion.Item value="stats">
                        <Accordion.Control>Stats</Accordion.Control>
                        <Accordion.Panel>
                          <TrailStats stats={trailStats} />
                        </Accordion.Panel>
                      </Accordion.Item>
                      <Accordion.Item value="directions">
                        <Accordion.Control>Directions</Accordion.Control>
                        <Accordion.Panel>
                          <TrailDirections directions={trailDirections} />
                        </Accordion.Panel>
                      </Accordion.Item>
                      <Accordion.Item value="waypoints">
                        <Accordion.Control>Waypoints</Accordion.Control>
                        <Accordion.Panel>
                          <TrailWaypoints
                            feature={waypointsFeature}
                            // geojson={waypointsGeoJSON}
                          />
                        </Accordion.Panel>
                      </Accordion.Item>
                    </Accordion>
                  </Grid.Col>
                </Grid>
              </Tabs.Panel>

            </Tabs>

            <Group position="left" mt="md">
              <Button
                type="submit"
                loading={savingState}
                sx={{ margin: '1em 0' }}
              >
              Save Trail
              </Button>

              {deleteTrailPath &&
                <Button
                  onClick={() => openDeleteModal(deleteTrailPath)}
                  variant="outline"
                  color="red"
                >
                  Delete Trail
                </Button>
              }
            </Group>

            <Box sx={{marginTop: '1em'}}>
              {trailData.date_created &&
                <Text fz="sm">Created: <Text span c="dimmed">{dayjs(trailData.date_created).format('dddd, MMMM D, YYYY [at] h:mma')}</Text></Text>
              }
              {trailData.creator_username &&
                <Text fz="sm">by: <Text span c="dimmed">{trailData.creator_username}</Text></Text>
              }

              {((trailData.date_created || trailData.creator_username) && (trailData.date_modified || trailData.modifier_username)) &&
                <Space h="xs" />
              }

              {trailData.date_modified &&
              <Text fz="sm">Modified: <Text span c="dimmed">{dayjs(trailData.date_modified).format('dddd, MMMM D, YYYY [at] h:mma')}</Text></Text>
              }
              {trailData.modifier_username &&
                <Text fz="sm">by: <Text span c="dimmed">{trailData.modifier_username}</Text></Text>
              }
            </Box>

          </form>
        </>
      }

    </>
  );
}
