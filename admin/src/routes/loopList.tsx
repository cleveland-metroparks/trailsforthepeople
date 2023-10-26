import { useState, useEffect } from 'react';
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Anchor, Button, Table, Text, TextInput, Title } from '@mantine/core';
import { keys } from '@mantine/utils';
import { IconSearch } from '@tabler/icons-react';
import { default as dayjs } from 'dayjs';

import { mapsApiClient } from "../components/mapsApi";
import type { Loop } from "../types/loop";
import { sortTableData, Th } from "../components/tablesort";

// Get all loops from the API
const getAllLoops = async () => {
  const response = await mapsApiClient.get<any>(process.env.REACT_APP_MAPS_API_BASE_PATH + "/trails");
  return response.data.data;
}

// See https://tkdodo.eu/blog/react-query-meets-react-router
// for React Router (>=6.4) + React Query

// Define the "Get all loops" query
const getAllLoopsQuery = () => ({
  queryKey: ['loopList'],
  queryFn: async () => getAllLoops(),
})

// Data loader (React Router)
export const loader =
  (queryClient) =>
  async () => {
    const query = getAllLoopsQuery();
    // Return cached data or fetch anew
    return (
      queryClient.getQueryData(query.queryKey) ??
      (await queryClient.fetchQuery(query))
    )
};

// The loop columns we'll display, sort, & filter
const rowKeys: (keyof Loop)[] = ['name', 'res', 'distancetext', 'date_modified', 'modifier_username', 'status'];

// Filter row data by search query
function filterTableData(data: Loop[], search: string) {
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
 * Loop List
 */
export function LoopList() {
  // Instead of useLoaderData(); see tkdodo.eu article above
  const {
    isLoading: loopsIsLoading,
    isError: loopsIsError,
    data: loopsData,
    error: loopsError,
  } = useQuery<Loop[], Error>(['loops'], getAllLoops);

  // For table sorting
  const [search, setSearch] = useState('');
  const [sortedData, setSortedData] = useState(loopsData);
  const [sortBy, setSortBy] = useState<keyof Loop | null>(null);
  const [reverseSortDirection, setReverseSortDirection] = useState(false);

  // Handle column sort
  const setSorting = (field: keyof Loop) => {
    const reversed = field === sortBy ? !reverseSortDirection : false;
    setReverseSortDirection(reversed);
    setSortBy(field);
    setSortedData(sortTableData(loopsData, { sortBy: field, reversed, search }, filterTableData));
  };

  // Handle table search
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.currentTarget;
    setSearch(value);
    setSortedData(sortTableData(loopsData, { sortBy, reversed: reverseSortDirection, search: value }, filterTableData));
  };

  // Table rows
  const rows = sortedData?.map((row, index) => (
    <tr key={index}>
      <td>
        <Anchor
          component={Link}
          to={`/loops/${row.id}`}
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

  // Set table data when we get Loops
  useEffect(() => {
    setSortedData(loopsData);
  }, [loopsData]);

  return (<>
    <Title order={2}>Loops</Title>

    {loopsIsLoading && <div>Loading...</div>}
    {loopsIsError && (
      <div>{`There is a problem fetching the post data - ${loopsError.message}`}</div>
    )}

    <Button component={Link} to="/loops/new"  variant="outline" sx={{ margin: '1em 0' }}>
      + Add Loop
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
        loopsData && rows && rows.length > 0 ? (rows) :
          <tr>
            <td colSpan={4}>
              <Text weight={500} align="center">
                No loops found
              </Text>
            </td>
          </tr>
      }
      </tbody>
    </Table>
  </>);
  }