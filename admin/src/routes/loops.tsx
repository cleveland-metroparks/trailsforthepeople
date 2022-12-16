import { useState } from 'react';
import axios from "axios";
import { useQuery } from "react-query";
import { Link, useParams } from "react-router-dom";
import { Title, Text, Tabs, Grid, Accordion, Table, Anchor, Input, TextInput, Checkbox, Button, Group, Box, Select } from '@mantine/core';
import { useForm } from '@mantine/form';
import { RichTextEditor } from '@mantine/rte';
import { LngLatBounds } from 'mapbox-gl';
import { coordEach } from '@turf/meta';
import { lineString } from '@turf/helpers';

import type { Loop, LoopProfile, LoopGeometry } from "../types/loop";

import { LoopMap } from "../components/loopMap";
import { LoopWaypoints } from "../components/loopWaypoints";
import { LoopStats } from "../components/loopStats";
import { LoopDirections } from "../components/loopDirections";
import { LoopProfileChart } from "../components/loopProfileChart";

//
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_MAPS_API_BASE_URL,
  headers: {
    "Content-type": "application/json",
  },
});

const defaultLoopProfile: LoopProfile = {
  id: null,
  elevation_profile: []
};

/**
 * Loop Edit
 *
 * @returns 
 */
export function LoopEdit() {
  let params = useParams();
  let loopId = params.loopId ? params.loopId.toString() : '';

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

  const [waypointsFeature, setWaypointsFeature] = useState({});
  // Mapbox GL JS Draw returns a feature object keyed by a randomly generated ID
  // for each linestring inside the object. We re-parent our feature with our own
  // dummy ID to resemble the structure:
  // const [waypointsFeatures, setWaypointsFeatures] = useState({ dummyKey: {} });
  const [waypointsGeoJSON, setWaypointsGeoJSON] = useState('');
  const [bounds, setBounds] = useState(new LngLatBounds());

  const form = useForm({
    initialValues: {
      name: '',
      description: '',
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
  // @TODO: Don't call this the very first time the loop is loaded,
  // because we're overwriting saved stats/data
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

  // Make GeoJSON linestring from waypoints (inside [Draw] features object), for DB storage
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
  const onDrawCreate = e => {
    // setWaypointsFeatures(curFeatures => {
    //   const newFeatures = {...curFeatures};
    //   // Delete existing features
    //   for (const key of Object.keys(newFeatures)) {
    //     delete newFeatures[key];
    //   }
    //   // Add new
    //   for (const f of e.features) {
    //     newFeatures[f.id] = f;
    //   }
    //   return newFeatures;
    // });
    setWaypointsFeature(curFeature => {
      const feature_id = Object.keys(e.features)[0];
      return e.features[feature_id];
    });
    const geoJSON = makeWaypointGeojsonString(e.features);
    setWaypointsGeoJSON(geoJSON);
    getRouteFromWaypoints(geoJSON, 'hike');
  };

  //
  const onDrawUpdate = e => {
    // setWaypointsFeatures(curFeatures => {
    //   const newFeatures = {...curFeatures};
    //   for (const f of e.features) {
    //     newFeatures[f.id] = f;
    //   }
    //   return newFeatures;
    // });
    setWaypointsFeature(curFeature => {
      const feature_id = Object.keys(e.features)[0];
      return e.features[feature_id];
    });
    const geoJSON = makeWaypointGeojsonString(e.features);
    setWaypointsGeoJSON(geoJSON);
    getRouteFromWaypoints(geoJSON, 'hike');
  };

  //
  const onDrawDelete = e => {
    // setWaypointsFeatures(curFeatures => {
    //   const newFeatures = {...curFeatures};
    //   for (const f of e.features) {
    //     delete newFeatures[f.id];
    //   }
    //   return newFeatures;
    // });
    setWaypointsFeature(curFeature => {
      const feature_id = Object.keys(e.features)[0];
      return e.features[feature_id];
    });
    const geoJSON = makeWaypointGeojsonString(e.features);
    setWaypointsGeoJSON(geoJSON);
    getRouteFromWaypoints(geoJSON, 'hike');
  };
  //----------------------------------

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
                      data={[
                        { value: 'Acacia Reservation', label: 'Acacia Reservation' },
                        { value: 'Bedford Reservation', label: 'Bedford Reservation' },
                        { value: 'Big Creek Reservation', label: 'Big Creek Reservation' },
                        { value: 'Bradley Woods Reservation', label: 'Bradley Woods Reservation' },
                        { value: 'Brecksville Reservation', label: 'Brecksville Reservation' },
                        { value: 'Brookside Reservation', label: 'Brookside Reservation' },
                        { value: 'Euclid Creek Reservation', label: 'Euclid Creek Reservation' },
                        { value: 'Garfield Park Reservation', label: 'Garfield Park Reservation' },
                        { value: 'Hinckley Reservation', label: 'Hinckley Reservation' },
                        { value: 'Huntington Reservation', label: 'Huntington Reservation' },
                        { value: 'Lakefront Reservation', label: 'Lakefront Reservation' },
                        { value: 'Mill Stream Run Reservation', label: 'Mill Stream Run Reservation' },
                        { value: 'North Chagrin Reservation', label: 'North Chagrin Reservation' },
                        { value: 'Ohio & Erie Canal Reservation', label: 'Ohio & Erie Canal Reservation' },
                        { value: 'Rocky River Reservation', label: 'Rocky River Reservation' },
                        { value: 'South Chagrin Reservation', label: 'South Chagrin Reservation' },
                        { value: 'Washington Reservation', label: 'Washington Reservation' },
                        { value: 'West Creek Reservation', label: 'West Creek Reservation' },
                      ]}
                      value={loopData.res}
                    />
                  </Box>

                  <Input.Wrapper
                    label="Description"
                    withAsterisk
                    sx={{marginTop: '1em'}}
                  >
                    <RichTextEditor
                      id="rte"
                      required
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
                        mapBounds={bounds}
                        onDrawCreate={onDrawCreate}
                        onDrawUpdate={onDrawUpdate}
                        onDrawDelete={onDrawDelete}
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
                          <LoopWaypoints feature={waypointsFeature} geojson={waypointsGeoJSON} />
                        </Accordion.Panel>
                      </Accordion.Item>
                    </Accordion>
                  </Grid.Col>
                </Grid>
              </Tabs.Panel>

            </Tabs>

            <Group position="left" mt="md">
              <Button type="submit" sx={{ margin: '1em 0' }}>Save Loop</Button>
            </Group>

          </form>
        </div>
      }

    </>
  );
}

/**
 * Loops List
 *
 * @returns 
 */
export function LoopsList() {

  // Get all loops from the API
  const getAllLoops = async () => {
    const response = await apiClient.get<any>("/trails");
    return response.data.data;
  }

  const { isLoading, isError, data, error } = useQuery<Loop[], Error>('loops', getAllLoops);

  return (
    <div>
      <Title order={2}>Loops</Title>
      {isLoading && <div>Loading...</div>}
      {isError && (
        <div>{`There is a problem fetching the post data - ${error.message}`}</div>
      )}
      <Table striped highlightOnHover>
        <thead>
          <tr>
            <th>Name</th>
            <th>Reservation</th>
            <th>Distance</th>
          </tr>
        </thead>
        <tbody>
        {data &&
          data.map(loop => (
            <tr key={loop.id}>
              <td>
                <Anchor
                  component={Link}
                  to={`/loops/${loop.id}`}
                  key={loop.id}
                >
                  {loop.name}
                </Anchor>
              </td>
              <td>{loop.res}</td>
              <td>{loop.distance_text}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}