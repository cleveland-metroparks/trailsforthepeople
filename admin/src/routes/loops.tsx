import { useState } from 'react';
import axios from "axios";
import { useQuery } from "react-query";
import { Link, useParams } from "react-router-dom";
import { Title, Tabs, Grid, Table, Anchor, Input, TextInput, Checkbox, Button, Group, Box, Select } from '@mantine/core';
import { useForm } from '@mantine/form';
import { RichTextEditor } from '@mantine/rte';

import type { Loop } from "../types/loop";
import { LoopMap } from "../components/loopMap";
// import { LoopWaypoints } from "../components/loopWaypoints";
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

/**
 *
 */
export function LoopEdit() {
  let params = useParams();
  let loopId = params.loopId ? params.loopId.toString() : '';

  const [activeTab, setActiveTab] = useState("route");
  const [loopDirections, setLoopDirections] = useState({});
  const [loopStats, setLoopStats] = useState({
    distance_text : '',
    distance_feet : '',
    durationtext_hike : '',
    durationtext_bike : '',
    durationtext_bridle : ''
  });

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

  // Get a Loop from the API
  const getLoop = async (id: string) => {
    const response = await apiClient.get<any>("/trails/" + id);

    setLoopStats({
      distance_text : response.data.data.distancetext,
      distance_feet : response.data.data.distance_feet,
      durationtext_hike : response.data.data.durationtext_hike,
      durationtext_bike : response.data.data.durationtext_bike,
      durationtext_bridle : response.data.data.durationtext_bridle
    });

    form.setValues({
      name: response.data.data.name,
      description: response.data.data.description,
      hike: response.data.data.hike === "Yes",
      bike: response.data.data.bike === "Yes",
      mountainbike: response.data.data.mountainbike === "Yes",
      bridle: response.data.data.bridle === "Yes"
    });

    return response.data.data;
  }

  const { isLoading, isSuccess, isError, data, error, refetch } = useQuery<Loop, Error>(['loop', params.loopId], () => getLoop(loopId));

  return (
    <>
      <Anchor component={Link} to={`/loops`}>« Loops</Anchor>

      {isLoading && <div>Loading...</div>}

      {isError && (
        <div>{`There is a problem fetching the loop - ${error.message}`}</div>
      )}

      {data &&
        <div>
          <Title order={2} sx={{marginTop: '1em'}}>{data.name}</Title>
          <form onSubmit={form.onSubmit((values) => console.log(values))}>

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
                      value={data.res}
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
                    <LoopMap loop={data} updateStats={setLoopStats} updateDirections={setLoopDirections} />
                    <LoopProfileChart loopId={data.id} />
                  </Grid.Col>
                  <Grid.Col span={3}>
                    {/* <LoopWaypoints features={features} geojson={waypointsGeoJSON} /> */}
                    <LoopStats stats={loopStats} />
                    <LoopDirections directions={loopDirections} />
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
 *
 */
export function LoopsList() {

  // Get all loops from the API
  const getAllLoops = async () => {
    const response = await apiClient.get<any>("/trails");
    return response.data.data;
  }

  const { isLoading, isSuccess, isError, data, error, refetch } = useQuery<Loop[], Error>('loops', getAllLoops);

  return (
    <div>
      <h2>Loops</h2>
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