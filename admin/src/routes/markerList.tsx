import { useState, useEffect } from 'react';
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Anchor, Button, Table, Text, TextInput, Title } from '@mantine/core';
import { keys } from '@mantine/utils';
import { IconSearch } from '@tabler/icons-react';
import { default as dayjs } from 'dayjs';

import { mapsApiClient } from "../components/mapsApi";
import type { Marker } from "../types/marker";
import { sortTableData, Th } from "../components/tablesort";

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
export const loader = (queryClient) =>
  async () => {
    const query = getAllMarkersQuery();
    // Return cached data or fetch anew
    return (
      queryClient.getQueryData(query.queryKey) ??
      (await queryClient.fetchQuery(query))
    )
};

// The marker columns we'll display, sort, & filter
const rowKeys: (keyof Marker)[] = ['title', 'category', 'reservation', 'enabled', 'annual', 'date_modified', 'modifier_username'];

// Filter row data by search query
function filterTableData(data: Marker[], search: string) {
  const query = search.toLowerCase().trim();
  return data.filter((item) =>
    keys(data[0]).some(function (key) {
      if (rowKeys.includes(key) && item[key]) {
        switch (key) {
          case 'date_modified':
          case 'date_created':
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
 * Marker List component
 */
export function MarkerList() {
  // Instead of useLoaderData(); see tkdodo.eu article above
  const {
    isLoading: markersIsLoading,
    isError: markersIsError,
    data: markersData,
    error: markersError,
  } = useQuery<Marker[], Error>(['markers'], getAllMarkersQuery());

  // For table sorting
  const [search, setSearch] = useState('');
  const [sortedData, setSortedData] = useState(markersData);
  const [sortBy, setSortBy] = useState<keyof Marker | null>(null);
  const [reverseSortDirection, setReverseSortDirection] = useState(false);

  // Handle column sort
  const setSorting = (field: keyof Marker) => {
    const reversed = field === sortBy ? !reverseSortDirection : false;
    setReverseSortDirection(reversed);
    setSortBy(field);
    setSortedData(sortTableData(markersData, { sortBy: field, reversed, search }, filterTableData));
  };

  // Handle table search
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.currentTarget;
    setSearch(value);
    setSortedData(sortTableData(markersData, { sortBy, reversed: reverseSortDirection, search: value }, filterTableData));
  };

  // Table rows
  const rows = sortedData?.map((row, index) => (
    <tr key={index}>


      <td>
        <Anchor
          component={Link}
          to={`/markers/${row.id}`}
          // key={marker.id}
        >
          {row.title}
        </Anchor>
      </td>
      <td>{row.category}</td>
      <td>{row.reservation}</td>
      <td>{row.date_modified ? dayjs(row.date_modified).format('MMM D, YYYY, h:mma') : ''}</td>
      <td>{row.modifier_username}</td>
      <td>{row.annual ? 'Annual' : ''}</td>
      <td>{row.enabled ? 'Enabled' : ''}</td>
    </tr>
  ));

  // Set table data when we get Markers
  useEffect(() => {
    setSortedData(markersData);
  }, [markersData]);

  return (
    <>
      <Title order={2}>Markers</Title>

      {markersIsLoading && <div>Loading...</div>}

      {markersIsError && (
        <div>{`There is a problem fetching the post data - ${markersError.message}`}</div>
      )}

      <Button component={Link} to="/markers/new"  variant="outline" sx={{ margin: '1em 0' }}>
        + Add Marker
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
              sorted={sortBy === 'title'}
              reversed={reverseSortDirection}
              onSort={() => setSorting('title')}
            >Title</Th>
            <Th
              sorted={sortBy === 'category'}
              reversed={reverseSortDirection}
              onSort={() => setSorting('category')}
            >Category</Th>
            <Th
              sorted={sortBy === 'reservation'}
              reversed={reverseSortDirection}
              onSort={() => setSorting('reservation')}
            >Reservation</Th>
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
              sorted={sortBy === 'annual'}
              reversed={reverseSortDirection}
              onSort={() => setSorting('annual')}
            >Annual</Th>
            <Th
              sorted={sortBy === 'enabled'}
              reversed={reverseSortDirection}
              onSort={() => setSorting('enabled')}
            >Enabled</Th>
          </tr>
        </thead>
        <tbody>
        {
          markersData && rows && rows.length > 0 ? (rows) :
            <tr>
              <td colSpan={4}>
                <Text weight={500} align="center">
                  No markers found
                </Text>
              </td>
            </tr>
        }
        </tbody>
      </Table>
    </>
  );
}