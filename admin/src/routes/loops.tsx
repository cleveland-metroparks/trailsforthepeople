import axios from "axios";
import { useQuery } from "react-query";
import { Link, Outlet, useParams } from "react-router-dom";
import { Table, Anchor } from '@mantine/core';

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
  return (
    <div>
      <Anchor component={Link} to={`/loops`}>Loops</Anchor>
      {isLoading && <div>Loading...</div>}
      {isError && (
        <div>{`There is a problem fetching the post data - ${error.message}`}</div>
      )}
        {data &&
          <div>
            <h2>{data.name}</h2>
            <dl>
              <dt><strong>id:</strong></dt><dd>{data.id}</dd>
              <dt><strong>name:</strong></dt><dd>{data.name}</dd>
              <dt><strong>res:</strong></dt><dd>{data.res}</dd>
              <dt><strong>bike:</strong></dt><dd>{data.bike}</dd>
              <dt><strong>hike:</strong></dt><dd>{data.hike}</dd>
              <dt><strong>bridle:</strong></dt><dd>{data.bridle}</dd>
              <dt><strong>mountainbike:</strong></dt><dd>{data.mountainbike}</dd>
              <dt><strong>description:</strong></dt><dd>{data.description}</dd>
              <dt><strong>distance_feet:</strong></dt><dd>{data.distance_feet}</dd>
              <dt><strong>distancetext:</strong></dt><dd>{data.distancetext}</dd>
              <dt><strong>durationtext_hike:</strong></dt><dd>{data.durationtext_hike}</dd>
              <dt><strong>durationtext_bike:</strong></dt><dd>{data.durationtext_bike}</dd>
              <dt><strong>durationtext_bridle:</strong></dt><dd>{data.durationtext_bridle}</dd>
              <dt><strong>lat:</strong></dt><dd>{data.lat}</dd>
              <dt><strong>lng:</strong></dt><dd>{data.lng}</dd>
              <dt><strong>boxw:</strong></dt><dd>{data.boxw}</dd>
              <dt><strong>boxs:</strong></dt><dd>{data.boxs}</dd>
              <dt><strong>boxe:</strong></dt><dd>{data.boxe}</dd>
              <dt><strong>boxn:</strong></dt><dd>{data.boxn}</dd>
              <dt><strong>dest_id:</strong></dt><dd>{data.dest_id}</dd>
              <dt><strong>dd_lat:</strong></dt><dd>{data.dd_lat}</dd>
              <dt><strong>dd_lng:</strong></dt><dd>{data.dd_lng}</dd>
            </dl>
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