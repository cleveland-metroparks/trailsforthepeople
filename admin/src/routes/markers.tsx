import axios from "axios";
import { useQuery } from "react-query";
import { Table } from '@mantine/core';

type Marker = {
  id: number,
  creator: string,
  created: string,
  lat: number,
  lng: number,
  content: string,
  title: string,
  expires: string,
  creatorid: number,
  geom_geojson: string,
  category: string,
  enabled: number,
  annual: number,
  startdate: string
};

const apiClient = axios.create({
  baseURL: "https://maps-api-dev2.clevelandmetroparks.com/api/v1",
  headers: {
    "Content-type": "application/json",
  },
});

const getAllMarkers = async () => {
  const response = await apiClient.get<any>("/markers");
  return response.data.data;
}

export default function Markers() {
  const { isLoading, isSuccess, isError, data, error, refetch } = useQuery<Marker[], Error>('markers', getAllMarkers);
  return (
    <div>
      <h2>Markers</h2>
      {isLoading && <div>Loading...</div>}
      {isError && (
        <div>{`There is a problem fetching the post data - ${error.message}`}</div>
      )}
      <Table striped highlightOnHover>
        <thead>
          <tr>
            <th>title</th>
            <th>creator</th>
            <th>created</th>
            <th>expires</th>
            <th>category</th>
            <th>enabled</th>
            <th>annual</th>
          </tr>
        </thead>
        <tbody>
        {data &&
          data.map(marker => (
            <tr key={marker.id}>
              <td>{marker.title}</td>
              <td>{marker.creator}</td>
              <td>{marker.created}</td>
              <td>{marker.expires}</td>
              <td>{marker.category}</td>
              <td>{marker.enabled}</td>
              <td>{marker.annual}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}