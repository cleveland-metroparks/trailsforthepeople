import { useState } from 'react';
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams, Navigate, useSubmit } from "react-router-dom";
import { Title, Text, Tabs, Grid, Accordion, Anchor, Input, TextInput, Checkbox, Button, Group, Box, Select } from '@mantine/core';
import { useForm } from '@mantine/form';
import { RichTextEditor } from '@mantine/rte';
import { openConfirmModal } from '@mantine/modals';
import { LngLatBounds } from 'mapbox-gl';
import { coordEach } from '@turf/meta';
import { lineString } from '@turf/helpers';
import { LineString, GeoJsonProperties } from 'geojson';

import type { Loop, LoopProfile, LoopGeometry, LineStringFeature } from "../types/loop";
import { reservationListSelectOptions } from "../types/reservation";

import { LoopMap } from "../components/loopMap";
import { LoopWaypoints } from "../components/loopWaypoints";
import { LoopStats } from "../components/loopStats";
import { LoopDirections } from "../components/loopDirections";
import { LoopProfileChart } from "../components/loopProfileChart";

const loopsRootPath = '/loops';

//
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_MAPS_API_BASE_URL,
});

const defaultLoopProfile: LoopProfile = {
  id: null,
  elevation_profile: []
};

/**
 * Loop Edit
 */
export function LoopEdit() {
  const submitDelete = useSubmit();

  let params = useParams();

  let loopId = '',
      submitBtnText = 'Save Loop',
      deleteLoopPath = '',
      absoluteDeleteLoopPath = ''
      ;



  if (params.loopId) {
    if (!isNaN(parseFloat(params.loopId))) { // Ensure loop ID is an int
      loopId = params.loopId;
      deleteLoopPath = loopsRootPath + '/' + loopId + '/delete';
      absoluteDeleteLoopPath = 'admin' + deleteLoopPath;
    } else if (params.loopId === 'new') {
      loopId = params.loopId;
      submitBtnText = 'Create Loop';
    } else {
      throw new Error("Invalid Loop ID");
    }
  }

  if (params.loopId) {
    if (!isNaN(parseFloat(params.loopId))) { // Ensure loop ID is an int
      loopId = params.loopId.toString();
    } else {
      throw new Error("Invalid Loop ID");
    }
  }

  const [activeTab, setActiveTab] = useState("route");

  const [loopGeometry, setLoopGeometry] = useState('');
  const [loopDirections, setLoopDirections] = useState({});
  const [loopElevation, setLoopElevation] = useState(defaultLoopProfile);
  const [loopStats, setLoopStats] = useState({
    distance_text : '',
    distance_feet : '',
    durationtext_hike : '',
    durationtext_bike : '',
    durationtext_bridle : ''
  });

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
  const [bounds, setBounds] = useState(new LngLatBounds());

  const form = useForm({
    initialValues: {
      name: '',
      description: '',
      res: '',
      hike: false,
      bike: false,
      mountainbike: false,
      bridle: false
    },
    validate: {
    },
  });

  //
  // Get a Loop from the API
  //
  const getLoop = async (id: string) => {
    const response = await apiClient.get<any>("/trails/" + id);
    const loop = response.data.data;

    setLoopStats({
      distance_text : loop.distancetext,
      distance_feet : loop.distance_feet,
      durationtext_hike : loop.durationtext_hike,
      durationtext_bike : loop.durationtext_bike,
      durationtext_bridle : loop.durationtext_bridle
    });

    setWaypointsGeoJSON(loop.waypoints_geojson);

    const loopWaypoints = JSON.parse(loop.waypoints_geojson);
    // Filter out the zero entries from the waypoints;
    // a vestige of the way waypoints used to be stored in the DB
    let filteredCoords = Array;
    const initialCoords = loopWaypoints.geometry.coordinates;
    if (initialCoords) {
      filteredCoords = initialCoords.filter(function(coordinate, index, arr) {
        return ((coordinate[0] != 0) && (coordinate[1] != 0));
      });
      loopWaypoints.geometry.coordinates = filteredCoords;
    }
    setWaypointsFeature(loopWaypoints);

    form.setValues({
      name: loop.name,
      description: loop.description,
      res: loop.res,
      hike: loop.hike === "Yes",
      bike: loop.bike === "Yes",
      mountainbike: loop.mountainbike === "Yes",
      bridle: loop.bridle === "Yes"
    });

    return loop;
  }
  
  const {
    isLoading: loopIsLoading,
    isError: loopIsError,
    data: loopData,
    error: loopError
  } = useQuery<Loop, Error>(['loop', params.loopId], () => getLoop(loopId));
  //---------------------------------------------------------------------------

  //
  // Get loop Elevation Profile from API
  //
  const getLoopProfile = async (id: string) => {
    const response = await apiClient.get<any>("/trail_profiles/" + id);

    setLoopElevation(response.data.data.elevation_profile);

    return response.data.data;
  }
  const {
    isLoading: loopProfileIsLoading,
    isError: loopProfileIsError,
    data: loopProfileData,
    error: loopProfileError
  } = useQuery<LoopProfile, Error>(['loop_profile', loopId], () => getLoopProfile(loopId));
  //---------------------------------------------------------------------------

  //
  // Get loop geometry from API 
  //
  const getLoopGeometry = async (id: string) => {
    const response = await apiClient.get<any>("/trail_geometries/" + id);
    const geojson = JSON.parse(response.data.data.geom_geojson);

    setLoopGeometry(response.data.data.geom_geojson);

    if (geojson.coordinates) {
      let loopBounds = new LngLatBounds();
      coordEach(geojson, function (coord) {
        loopBounds.extend([coord[0], coord[1]]);
      });
      setBounds((bounds) => {
        // if (mapRef.current) {
        //   mapRef.current.fitBounds(loopBounds, { padding: 40 });
        // }
        return loopBounds;
      });
    }

    return response.data.data;
  }

  const {
    isLoading: loopGeomIsLoading,
    isError: loopGeomIsError,
    data: loopGeomData,
    error: loopGeomError
  } = useQuery<LoopGeometry, Error>(['loop_geometry', loopId], () => getLoopGeometry(loopId));
  //---------------------------------------------------------------------------

  // Get route from waypoints from API
  const getRouteFromWaypoints = async (waypointsGeojson: string, travelMode: string) => {
    const params = new URLSearchParams({
      waypoints: waypointsGeojson,
      via: travelMode
    });
    const response = await apiClient.get<any>("/route_waypoints", { params });

    setLoopGeometry(JSON.stringify(response.data.data.geojson));

    // Callback to update stats
    setLoopStats({
      distance_text: response.data.data.totals.distance_text,
      distance_feet: response.data.data.totals.distance_feet,
      durationtext_hike: response.data.data.totals.durationtext_hike,
      durationtext_bike: response.data.data.totals.durationtext_bike,
      durationtext_bridle: response.data.data.totals.durationtext_bridle
    });

    // Callback to update turn-by-turn directions
    setLoopDirections(response.data.data.steps);

    // "route_waypoints" API endpoint returns the profile data in a different format than "trail_profiles" (@TODO).
    // The chart component apparently needs the coordinates as strings.
    const transformedProfile = response.data.data.elevationprofile.map(({y, x}) => { return {x: x.toString(), y: y.toString()}})
    setLoopElevation(transformedProfile);
  }
  //---------------------------------------------------------------------------
  //
  // Waypoints Draw update callbacks
  //

  // Make GeoJSON linestring from waypoints (inside Draw/GeoJSON feature)
  function makeWaypointGeojsonString(feature) {
    if (feature.geometry.coordinates) {
      // Turn into GeoJSON string for DB storage
      const coordsLinestring = lineString(feature.geometry.coordinates); // Using turf
      const output = JSON.stringify(coordsLinestring);
      return output;
    }
  }

  // Complete the loop; back to start
  const completeLoop = () => {
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
    getRouteFromWaypoints(wpGeoJSON, 'hike');
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
    getRouteFromWaypoints(wpGeoJSON, 'hike');
  };

  // on Draw Update
  const onDrawUpdate = e => {
    const feature_id = Object.keys(e.features)[0];
    setWaypointsFeature(curFeature => {
      return e.features[feature_id];
    });
    const wpGeoJSON = makeWaypointGeojsonString(e.features[feature_id]);
    setWaypointsGeoJSON(wpGeoJSON);
    getRouteFromWaypoints(wpGeoJSON, 'hike');
  };

  // on Draw Delete
  const onDrawDelete = e => {
    const feature_id = Object.keys(e.features)[0];
    setWaypointsFeature(curFeature => {
      return e.features[feature_id];
    });
    const wpGeoJSON = makeWaypointGeojsonString(e.features[feature_id]);
    setWaypointsGeoJSON(wpGeoJSON);
    getRouteFromWaypoints(wpGeoJSON, 'hike');
  };
  //----------------------------------

  //
  const openDeleteModal = (deleteFormAction) =>
    openConfirmModal({
      title: 'Delete Loop',
      centered: true,
      children: (
        <Text size="sm">
          Are you sure you want to delete this loop? This cannot be undone.
        </Text>
      ),
      labels: { confirm: 'Delete Loop', cancel: "Cancel" },
      confirmProps: { color: 'red' },
      onCancel: () => {
        console.log('Loop delete cancelled')
      },
      onConfirm: () => {
        // We pass in deleteFormAction
        // (which should be: "/admin/loops/:loopId/delete")
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
      <Anchor component={Link} to={`/loops`}>« Loops</Anchor>

      {loopIsLoading && <div>Loading...</div>}

      {loopIsError && (
        <Text>{`There is a problem fetching the loop - ${loopError.message}`}</Text>
      )}

      {loopData &&
        <div>
          {loopData &&
          <Title order={2} sx={{marginTop: '1em'}}>{loopData.name}</Title>
          }
          <form onSubmit={form.onSubmit((values) => console.log('onSubmit():', values))}>

            <Tabs defaultValue={activeTab} onTabChange={setActiveTab} sx={{marginTop: '1em'}}>

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
                    placeholder="Loop name"
                    {...form.getInputProps('name')}
                  />

                  <Box sx={{marginTop: '1em'}}>
                    <Select
                      label="Reservation"
                      // placeholder="Choose a reservation"
                      data={reservationListSelectOptions}
                      // defaultValue=''
                      // value={loopData.res}
                      {...form.getInputProps('res')}
                    />
                  </Box>

                  <Input.Wrapper
                    label="Description"
                    withAsterisk
                    sx={{marginTop: '1em'}}
                  >
                    <RichTextEditor
                      id="rte"
                      {...form.getInputProps('description')}
                      controls={[
                        ['bold', 'italic', 'underline'],
                        ['link'],
                        ['sup', 'sub'],
                        ['unorderedList', 'orderedList'],
                      ]}
                    />
                  </Input.Wrapper>

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
                  <Grid.Col span={9}>
                    {loopData && loopGeometry &&
                      <LoopMap
                        loop={loopData}
                        loopGeom={loopGeometry}
                        waypointsFeature={waypointsFeature}
                        waypointsForDraw={waypointsForDraw}
                        mapBounds={bounds}
                        onDrawCreate={onDrawCreate}
                        onDrawUpdate={onDrawUpdate}
                        onDrawDelete={onDrawDelete}
                        doCompleteLoop={completeLoop}
                      />
                    }
                    <LoopProfileChart loopProfile={loopElevation} />
                  </Grid.Col>
                  <Grid.Col span={3}>
                    <Accordion defaultValue="stats">
                      <Accordion.Item value="stats">
                        <Accordion.Control>Stats</Accordion.Control>
                        <Accordion.Panel>
                          <LoopStats stats={loopStats} />
                        </Accordion.Panel>
                      </Accordion.Item>
                      <Accordion.Item value="directions">
                        <Accordion.Control>Directions</Accordion.Control>
                        <Accordion.Panel>
                          <LoopDirections directions={loopDirections} />
                        </Accordion.Panel>
                      </Accordion.Item>
                      <Accordion.Item value="waypoints">
                        <Accordion.Control>Waypoints</Accordion.Control>
                        <Accordion.Panel>
                          <LoopWaypoints
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
                sx={{ margin: '1em 0' }}
              >
                {submitBtnText}
              </Button>

              {deleteLoopPath &&
                <Button
                  onClick={() => openDeleteModal(absoluteDeleteLoopPath)}
                  variant="outline"
                  color="red"
                >
                  Delete Loop
                </Button>
              }
            </Group>

          </form>
        </div>
      }

    </>
  );
}
