import { useState } from 'react';
import axios from "axios";
import { useQuery } from "react-query";
import { Link, useParams } from "react-router-dom";
import { Tabs, Table, Anchor, TextInput, Textarea, Checkbox, Button, Group, Box, Select } from '@mantine/core';
import { useForm } from '@mantine/form';

import { LoopMap } from "../components/loopMap";
import { LoopProfileChart } from "../components/loopProfileChart";

type Loop = {
  id: number,
  name: string,
  res: string,
  bike: string,
  hike: string,
  bridle: string,
  mountainbike: string,
  description: string,
  distance_feet: number,
  distancetext: string,
  durationtext_hike: string,
  durationtext_bike: string,
  durationtext_bridle: string,
  lat: number,
  lng: number,
  boxw: number,
  boxs: number,
  boxe: number,
  boxn: number,
  dest_id: number,
  dd_lat: number,
  dd_lng: number
};

//
const apiClient = axios.create({
  baseURL: "https://maps-api-dev2.clevelandmetroparks.com/api/v1",
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

  const [activeTab, setActiveTab] = useState(0);

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
    <div>
      <Anchor component={Link} to={`/loops`}>« Loops</Anchor>

      {isLoading && <div>Loading...</div>}

      {isError && (
        <div>{`There is a problem fetching the loop - ${error.message}`}</div>
      )}

      {data &&
        <div>
          <h2>{data.name}</h2>

          <form onSubmit={form.onSubmit((values) => console.log(values))}>

            <Tabs active={activeTab} onTabChange={setActiveTab} tabPadding="xl">

              <Tabs.Tab label="General">

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

                  <Textarea
                    mt="md"
                    required
                    label="Description"
                    placeholder=""
                    {...form.getInputProps('description')}
                  />

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

              </Tabs.Tab>

              <Tabs.Tab label="Route">

                <LoopMap loopId={data.id} />

              </Tabs.Tab>

              <Tabs.Tab label="Directions">

                <h3>Stats</h3>
                <span><strong>Distance:</strong></span> <span>{data.distancetext} ({data.distance_feet} ft)</span><br />
                <span><strong>Hiking:</strong></span> <span>{data.durationtext_hike}</span><br />
                <span><strong>Bicycling:</strong></span> <span>{data.durationtext_bike}</span><br />
                <span><strong>Horseback:</strong></span> <span>{data.durationtext_bridle}</span><br />

                <h3>Elevation Profile</h3>

                <LoopProfileChart loopId={data.id} />

              </Tabs.Tab>

            </Tabs>

            <Group position="left" mt="md">
              <Button type="submit" sx={{ margin: '1em 0' }}>Save Loop</Button>
            </Group>

          </form>

        </div>
      }

    </div>
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
              <td>{loop.distancetext}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}