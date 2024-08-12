import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Table, Title, Anchor, Button } from '@mantine/core';
import { default as dayjs } from 'dayjs';

import type { HintMap } from "../types/hintmap";
import { formatMapsHintMapLink } from "../types/hintmap";

import { mapsApiClient } from "../components/mapsApi";

const getAllHintMaps = async () => {
  const response = await mapsApiClient.get<any>(process.env.REACT_APP_MAPS_API_BASE_PATH + "/hint_maps");
  return response.data.data;
}

// See https://tkdodo.eu/blog/react-query-meets-react-router
// for React Router (>=6.4) + React Query

// Define the "Get all hint maps" query
const getAllHintMapsQuery = () => ({
  queryKey: ['hintMapList'],
  queryFn: async () => getAllHintMaps(),
})

// Data loader (React Router)
export const loader = (queryClient) =>
  async () => {
    const query = getAllHintMapsQuery();
    // Return cached data or fetch anew
    return (
      queryClient.getQueryData(query.queryKey) ??
      (await queryClient.fetchQuery(query))
    )
  };

/**
 * Hint Map List component
 */
export function HintMapList() {
  const { isLoading, isSuccess, isError, data, error, refetch } = useQuery<HintMap[], Error>(['hint_maps'], getAllHintMaps);
  return (
    <>
      <Title order={2}>Hint Maps</Title>

      {isLoading && <div>Loading...</div>}

      {isError && (
        <div>{`There is a problem fetching the post data - ${error.message}`}</div>
      )}

      <Button component={Link} to="/hint_maps/new"  variant="outline" sx={{ margin: '1em 0' }}>
        + Add Hint Map
      </Button>

      <Table striped highlightOnHover>
        <thead>
          <tr>
            <th>Title</th>
            <th>On Mapbox</th>
            <th>On maps server</th>
            <th>Date edited</th>
            {/* <th>Date refreshed</th> */}
          </tr>
        </thead>

        <tbody>
        {data &&
          data.map(hint_map => (
            <tr key={hint_map.id}>
              <td>
                <Anchor
                  component={Link}
                  to={`/hint_maps/${hint_map.id}`}
                  key={hint_map.id}
                >
                  {hint_map.title}
                </Anchor>
              </td>
              <td><img src={hint_map.url_external} width="100" height="100" /></td>
              <td><img src={formatMapsHintMapLink(hint_map.image_filename_local)} width="100" height="100" /></td>
              <td>{dayjs(hint_map.last_edited).format('YYYY-MM-DD HH:mm:ss Z')}</td>
              {/* <td>{dayjs(hint_map.last_refreshed).format('YYYY-MM-DD HH:mm:ss Z')}</td> */}
            </tr>
          ))}
        </tbody>
      </Table>

    </>
  );
}