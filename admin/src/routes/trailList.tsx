import { useState, useEffect } from 'react';
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Anchor, Button, Table, Text, TextInput, Title } from '@mantine/core';
import { keys } from '@mantine/utils';
import { IconSearch } from '@tabler/icons-react';
import { default as dayjs } from 'dayjs';

import { mapsApiClient } from "../components/mapsApi";
import type { Trail } from "../types/trail";
import { sortTableData, Th } from "../components/tablesort";

// Get all trails from the API
const getAllTrails = async () => {
  const response = await mapsApiClient.get<any>(process.env.REACT_APP_MAPS_API_BASE_PATH + "/trails");
  return response.data.data;
}

// See https://tkdodo.eu/blog/react-query-meets-react-router
// for React Router (>=6.4) + React Query

// Define the "Get all trails" query
const getAllTrailsQuery = () => ({
  queryKey: ['trailList'],
  queryFn: async () => getAllTrails(),
})

// Data loader (React Router)
export const loader =
  (queryClient) =>
  async () => {
    const query = getAllTrailsQuery();
    // Return cached data or fetch anew
    return (
      queryClient.getQueryData(query.queryKey) ??
      (await queryClient.fetchQuery(query))
    )
};

// The trail columns we'll display, sort, & filter
const rowKeys: (keyof Trail)[] = ['name', 'res', 'distancetext', 'date_modified', 'modifier_username', 'status'];

// Filter row data by search query
function filterTableData(data: Trail[], search: string) {
  const query = search.toLowerCase().trim();
  return data.filter((item) =>
    keys(data[0]).some(function (key) {
      if (rowKeys.includes(key) && item[key]) {
        switch (key) {
          case 'date_modified':
            return dayjs(item[key]).format('MMM D, YYYY, h:mma').toLowerCase().includes(query);
          default:
            return item[key].toString().toLowerCase().includes(query);
        }
      }
      return false;
    })
  );
}

/**
 * Trail List
 */
export function TrailList() {
  // Instead of useLoaderData(); see tkdodo.eu article above
  const {
    isLoading: trailsIsLoading,
    isError: trailsIsError,
    data: trailsData,
    error: trailsError,
  } = useQuery<Trail[], Error>(['trails'], getAllTrails);

  // For table sorting
  const [search, setSearch] = useState('');
  const [sortedData, setSortedData] = useState(trailsData);
  const [sortBy, setSortBy] = useState<keyof Trail | null>(null);
  const [reverseSortDirection, setReverseSortDirection] = useState(false);

  // Handle column sort
  const setSorting = (field: keyof Trail) => {
    const reversed = field === sortBy ? !reverseSortDirection : false;
    setReverseSortDirection(reversed);
    setSortBy(field);
    setSortedData(sortTableData(trailsData, { sortBy: field, reversed, search }, filterTableData));
  };

  // Handle table search
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.currentTarget;
    setSearch(value);
    setSortedData(sortTableData(trailsData, { sortBy, reversed: reverseSortDirection, search: value }, filterTableData));
  };

  // Table rows
  const rows = sortedData?.map((row, index) => (
    <tr key={index}>
      <td>
        <Anchor
          component={Link}
          to={`/trails/${row.id}`}
        >
          {row.name}
        </Anchor>
      </td>
      <td>{row.res}</td>
      <td>{row.distancetext}</td>
      <td>{row.date_modified ? dayjs(row.date_modified).format('MMM D, YYYY, h:mma') : ''}</td>
      <td>{row.modifier_username}</td>
      <td>{row.status ? 'Yes' : 'No'}</td>
    </tr>
  ));

  // Set table data when we get Trails
  useEffect(() => {
    setSortedData(trailsData);
  }, [trailsData]);

  return (<>
    <Title order={2}>Trails</Title>

    {trailsIsLoading && <div>Loading...</div>}
    {trailsIsError && (
      <div>{`There is a problem fetching the post data - ${trailsError.message}`}</div>
    )}

    <Button component={Link} to="/trails/new"  variant="outline" sx={{ margin: '1em 0' }}>
      + Add Trail
    </Button>

    <TextInput
      placeholder="Filter by any field"
      mb="md"
      icon={<IconSearch size="0.9rem" stroke={1.5} />}
      value={search}
      onChange={handleSearchChange}
    />

    <Table striped highlightOnHover>
      <thead>
        <tr>
          <Th
            sorted={sortBy === 'name'}
            reversed={reverseSortDirection}
            onSort={() => setSorting('name')}
          >Name</Th>
          <Th
            sorted={sortBy === 'res'}
            reversed={reverseSortDirection}
            onSort={() => setSorting('res')}
          >Reservation</Th>
          <Th
            sorted={sortBy === 'distancetext'}
            reversed={reverseSortDirection}
            onSort={() => setSorting('distancetext')}
          >Distance</Th>
          <Th
            sorted={sortBy === 'date_modified'}
            reversed={reverseSortDirection}
            onSort={() => setSorting('date_modified')}
          >Last modified</Th>
          <Th
            sorted={sortBy === 'modifier_username'}
            reversed={reverseSortDirection}
            onSort={() => setSorting('modifier_username')}
          >Modified by</Th>
          <Th
            sorted={sortBy === 'status'}
            reversed={reverseSortDirection}
            onSort={() => setSorting('status')}
          >Published</Th>
        </tr>
      </thead>
      <tbody>
      {
        trailsData && rows && rows.length > 0 ? (rows) :
          <tr>
            <td colSpan={4}>
              <Text weight={500} align="center">
                No trails found
              </Text>
            </td>
          </tr>
      }
      </tbody>
    </Table>
  </>);
  }