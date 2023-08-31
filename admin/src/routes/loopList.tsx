import { useState, useEffect } from 'react';
import { mapsApiClient } from "../components/mapsApi";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Anchor,
  Button,
  Center,
  createStyles,
  Group,
  Table,
  Text,
  TextInput,
  Title,
  UnstyledButton,
  rem,
} from '@mantine/core';
import { keys } from '@mantine/utils';
import { IconSelector, IconChevronDown, IconChevronUp, IconSearch } from '@tabler/icons-react';
import { default as dayjs } from 'dayjs';

import type { Loop } from "../types/loop";

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

//
// For table sort & filter
// Derived from https://ui.mantine.dev/component/table-sort
//
const useStyles = createStyles((theme) => ({
  th: {
    padding: '0 !important',
  },

  control: {
    width: '100%',
    padding: `${theme.spacing.xs} ${theme.spacing.md}`,

    '&:hover': {
      backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0],
    },
  },

  icon: {
    width: rem(21),
    height: rem(21),
    borderRadius: rem(21),
  },
}));

interface RowData extends Loop {}
// The loop columns we'll display, sort, & filter
const rowKeys: (keyof RowData)[] = ['name', 'res', 'distancetext', 'modified'];

interface ThProps {
  children: React.ReactNode;
  reversed: boolean;
  sorted: boolean;
  onSort(): void;
}

function Th({ children, reversed, sorted, onSort }: ThProps) {
  const { classes } = useStyles();
  const Icon = sorted ? (reversed ? IconChevronUp : IconChevronDown) : IconSelector;
  return (
    <th className={classes.th}>
      <UnstyledButton onClick={onSort} className={classes.control}>
        <Group position="apart">
          <Text fw={500} fz="sm">
            {children}
          </Text>
          <Center className={classes.icon}>
            <Icon size="0.9rem" stroke={1.5} />
          </Center>
        </Group>
      </UnstyledButton>
    </th>
  );
}

// Filter row data by search query
function filterData(data: RowData[], search: string) {
  const query = search.toLowerCase().trim();
  return data.filter((item) =>
    keys(data[0]).some(function (key) {
      if (rowKeys.includes(key) && item[key]) {
        if (key === 'modified') {
          return dayjs(item[key]).format('MMM D, YYYY, h:mma').toLowerCase().includes(query);
        } else {
          return item[key].toString().toLowerCase().includes(query);
        }
      }
      return false;
    })
  );
}

// Sort compare, for strings & numbers
function compareItems(a: string | number, b: string | number, reversed: boolean) {
  if (a === b) {
    return 0;
  } else if (a > b) {
    return reversed ? -1 : 1;
  } else {
    return reversed ? 1 : -1;
  }
}

function sortData(
  data: RowData[],
  payload: { sortBy: keyof RowData | null; reversed: boolean; search: string }
) {
  const { sortBy } = payload;

  if (!sortBy) {
    return filterData(data, payload.search);
  }

  return filterData(
    [...data].sort((a, b) => {
      return compareItems(a[sortBy], b[sortBy], payload.reversed);
    }),
    payload.search
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

  const [search, setSearch] = useState('');
  const [sortedData, setSortedData] = useState(loopsData);
  const [sortBy, setSortBy] = useState<keyof RowData | null>(null);
  const [reverseSortDirection, setReverseSortDirection] = useState(false);

  const setSorting = (field: keyof RowData) => {
    const reversed = field === sortBy ? !reverseSortDirection : false;
    setReverseSortDirection(reversed);
    setSortBy(field);
    setSortedData(sortData(loopsData, { sortBy: field, reversed, search }));
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.currentTarget;
    setSearch(value);
    setSortedData(sortData(loopsData, { sortBy, reversed: reverseSortDirection, search: value }));
  };

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
      <td>{row.modified ? dayjs(row.modified).format('MMM D, YYYY, h:mma') : ''}</td>
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
          >
            Name
          </Th>
          <Th
            sorted={sortBy === 'res'}
            reversed={reverseSortDirection}
            onSort={() => setSorting('res')}
          >
            Reservation
          </Th>
          <Th
            sorted={sortBy === 'distancetext'}
            reversed={reverseSortDirection}
            onSort={() => setSorting('distancetext')}
          >
            Distance
          </Th>
          <Th
            sorted={sortBy === 'modified'}
            reversed={reverseSortDirection}
            onSort={() => setSorting('modified')}
          >
            Last modified
          </Th>
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