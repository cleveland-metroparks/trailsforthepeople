import axios from "axios";
import { useQuery } from "react-query";
import { Link, Outlet, useParams } from "react-router-dom";
import { Table, Anchor } from '@mantine/core';
import { default as dayjs } from 'dayjs';

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

//
export function Marker() {
  let params = useParams();
  return (
    <div>
      <h2>Marker {params.markerId}</h2>
    </div>
  );
}

//
export function MarkersList() {
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
            <th>Title</th>
            <th>Creator</th>
            <th>Date created</th>
            <th>Expires</th>
            <th>Category</th>
            <th>Enabled</th>
            <th>Annual</th>
          </tr>
        </thead>

        <tbody>
        {data &&
          data.map(marker => (
            <tr key={marker.id}>
              <td>
                <Anchor
                  component={Link}
                  to={`/markers/${marker.id}`}
                  key={marker.id}
                >
                  {marker.title}
                </Anchor>
              </td>
              <td>{marker.creator}</td>
              <td>{dayjs(marker.created).format('YYYY-MM-DD HH:mm:ss Z')}</td>
              <td>{marker.expires ? dayjs(marker.expires).format('YYYY-MM-DD HH:mm:ss Z') : ''}</td>
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