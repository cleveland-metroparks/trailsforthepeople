import { useState } from 'react';
import axios from "axios";
import { useQuery } from "react-query";
import { Link, Outlet, useParams } from "react-router-dom";
import { Tabs, Table, Anchor, TextInput, Textarea, Checkbox, Button, Group, Box } from '@mantine/core';
import { useForm } from '@mantine/form';

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

//
const getAllLoops = async () => {
  const response = await apiClient.get<any>("/trails");
  return response.data.data;
}

//
const getLoop = async (id: string) => {
  const response = await apiClient.get<any>("/trails/" + id);
  return response.data.data;
}

//
export function Loop() {
  let params = useParams();
  let loopId = params.loopId ? params.loopId.toString() : '';

  const { isLoading, isSuccess, isError, data, error, refetch } = useQuery<Loop, Error>(['loop', params.loopId], () => getLoop(loopId));

  const form = useForm({
    initialValues: {
      test: 'This is a test',
      // Setting these directly in the TSX below to get the API-loaded data.
      // @TODO: Should be better to use this, so we can use form.getInputProps() below to also get other data
    },
    validate: {
    },
  });

  const [activeTab, setActiveTab] = useState(0);

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
                    value={data.name}
                  />

                  <TextInput
                    mt="md"
                    required
                    label="Test"
                    placeholder="Test text"
                    {...form.getInputProps('test')}
                  />

                  <p>{data.res}</p>

                  <Textarea
                    mt="md"
                    required
                    label="Description"
                    placeholder=""
                    value={data.description}
                  />

                  <Checkbox
                    mt="md"
                    label="Hiking"
                    checked={data.hike == "Yes" ? true : false}
                  />

                  <Checkbox
                    mt="md"
                    label="Biking"
                    checked={data.bike == "Yes" ? true : false}
                  />

                  <Checkbox
                    mt="md"
                    label="Mountain biking"
                    checked={data.mountainbike == "Yes" ? true : false}
                  />

                  <Checkbox
                    mt="md"
                    label="Horseback"
                    checked={data.bridle == "Yes" ? true : false}
                  />

                  <Group position="right" mt="md">
                    <Button type="submit">Submit</Button>
                  </Group>

                </Box>

              </Tabs.Tab>

              <Tabs.Tab label="Route">

              </Tabs.Tab>

              <Tabs.Tab label="Directions">

                <h3>Directions</h3>
                <em>... Directions ...</em>

                <h3>Stats</h3>
                <span><strong>Distance:</strong></span> <span>{data.distancetext} ({data.distance_feet} ft)</span><br />
                <span><strong>Hiking:</strong></span> <span>{data.durationtext_hike}</span><br />
                <span><strong>Bicycling:</strong></span> <span>{data.durationtext_bike}</span><br />
                <span><strong>Horseback:</strong></span> <span>{data.durationtext_bridle}</span><br />

                <h3>Elevation Profile</h3>
                <em>... Elevation profile ...</em>

              </Tabs.Tab>

            </Tabs>

          </form>

        </div>
      }

    </div>
  );
}


//
export function LoopsList() {
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