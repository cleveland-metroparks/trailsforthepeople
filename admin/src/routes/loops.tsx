import axios from "axios";
import { useQuery } from "react-query";
import { Table } from '@mantine/core';

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

const apiClient = axios.create({
  baseURL: "https://maps-api-dev2.clevelandmetroparks.com/api/v1",
  headers: {
    "Content-type": "application/json",
  },
});

const getAllLoops = async () => {
  const response = await apiClient.get<any>("/trails");
  return response.data.data;
}

export default function Loops() {
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
            <th>id</th>
            <th>name</th>
            <th>res</th>
            <th>distance_feet</th>
            <th>distancetext</th>
            <th>durationtext_hike</th>
            <th>durationtext_bike</th>
            <th>durationtext_bridle</th>
          </tr>
        </thead>
        <tbody>
        {data &&
          data.map(loop => (
            <tr key={loop.id}>
              <td>{loop.id}</td>
              <td>{loop.name}</td>
              <td>{loop.res}</td>
              <td>{loop.distance_feet}</td>
              <td>{loop.distancetext}</td>
              <td>{loop.durationtext_hike}</td>
              <td>{loop.durationtext_bike}</td>
              <td>{loop.durationtext_bridle}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}