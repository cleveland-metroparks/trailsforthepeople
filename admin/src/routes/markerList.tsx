import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Table, Title, Anchor, Button } from '@mantine/core';
import { default as dayjs } from 'dayjs';

import { mapsApiClient } from "../components/mapsApi";
import type { Marker } from "../types/marker";

// Get all markers from the API
const getAllMarkers = async () => {
  const response = await mapsApiClient.get<any>(process.env.REACT_APP_MAPS_API_BASE_PATH + "/markers");
  return response.data.data;
}

// See https://tkdodo.eu/blog/react-query-meets-react-router
// for React Router (>=6.4) + React Query

// Define the "Get all markers" query
const getAllMarkersQuery = () => ({
  queryKey: ['markerList'],
  queryFn: async () => getAllMarkers(),
})

// Data loader (React Router)
export const loader =
  (queryClient) =>
  async () => {
    const query = getAllMarkersQuery();
    // Return cached data or fetch anew
    return (
      queryClient.getQueryData(query.queryKey) ??
      (await queryClient.fetchQuery(query))
    )
};

/**
 * Marker List component
 */
export function MarkerList() {
  // Instead of useLoaderData(); see tkdodo.eu article above
  const { isLoading, isSuccess, isError, data, error, refetch } = useQuery<Marker[], Error>(getAllMarkersQuery());

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
            <th>Reservation</th>
            <th>Enabled</th>
            <th>Annual</th>
          </tr>
        </thead>
        <tbody>
          {(data instanceof Array) &&
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
                <td>{marker.reservation}</td>
                <td>{marker.enabled ? 'Enabled' : ''}</td>
                <td>{marker.annual ? 'Annual' : ''}</td>
              </tr>
            ))}
        </tbody>
      </Table>
    </>
  );
}