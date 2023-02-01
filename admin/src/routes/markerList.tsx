import axios from "axios";
import { useQuery } from "react-query";
import { Link } from "react-router-dom";
import { Table, Title, Anchor, Button } from '@mantine/core';
import { default as dayjs } from 'dayjs';

import type { Marker } from "../types/marker";

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_MAPS_API_BASE_URL,
  headers: {
    "Content-type": "application/json",
  },
});

//
export function MarkerList() {
  // Get all markers
  const getAllMarkers = async () => {
    const response = await apiClient.get<any>("/markers");
    return response.data.data;
  }

  const { isLoading, isSuccess, isError, data, error, refetch } = useQuery<Marker[], Error>('markers', getAllMarkers);

  return (
    <>
      <Title order={2}>Markers</Title>
      {isLoading && <div>Loading...</div>}
      {isError && (
        <div>{`There is a problem fetching the post data - ${error.message}`}</div>
      )}

      <Button component={Link} to="/markers/new"  variant="outline" sx={{ margin: '1em 0' }}>
        + Add Marker
      </Button>

      <Table striped highlightOnHover>
        <thead>
          <tr>
            <th>Title</th>
            <th>Creator</th>
            <th>Created</th>
            <th>Modified</th>
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
                    // key={marker.id}
                  >
                    {marker.title}
                  </Anchor>
                </td>
                <td>{marker.creator} ({marker.creatorid})</td>
                <td>{dayjs(marker.created).format('MMM D, YYYY, h:mma')}</td>
                <td>{dayjs(marker.modified).format('MMM D, YYYY, h:mma')}</td>
                <td>{marker.category}</td>
                <td>{marker.enabled ? 'Enabled' : ''}</td>
                <td>{marker.annual ? 'Annual' : ''}</td>
              </tr>
            ))}
        </tbody>
      </Table>
    </>
  );
}