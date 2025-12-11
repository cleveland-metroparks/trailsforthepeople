import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import {
  Anchor,
  Button,
  Table,
  Text,
  TextInput,
  Title,
  Select,
  Group,
} from "@mantine/core";
import { keys } from "@mantine/utils";
import { IconSearch } from "@tabler/icons-react";
import { default as dayjs } from "dayjs";

import { mapsApiClient } from "../components/mapsApi";
import type { Trail } from "../types/trail";
import { sortTableData, Th } from "../components/tablesort";
import { useReservations } from "../hooks/useReservations";
import utils from "../styles/utils.module.css";

// Get all trails from the API
const getAllTrails = async () => {
  const response = await mapsApiClient.get<any>(
    process.env.REACT_APP_MAPS_API_BASE_PATH + "/trails"
  );
  return response.data.data;
};

// See https://tkdodo.eu/blog/react-query-meets-react-router
// for React Router (>=6.4) + React Query

// Define the "Get all trails" query
const getAllTrailsQuery = () => ({
  queryKey: ["trailList"],
  queryFn: async () => getAllTrails(),
});

// Data loader (React Router)
export const loader = (queryClient) => async () => {
  const query = getAllTrailsQuery();
  // Return cached data or fetch anew
  return (
    queryClient.getQueryData(query.queryKey) ??
    (await queryClient.fetchQuery(query))
  );
};

// The trail columns we'll display, sort, & filter
const rowKeys: (keyof Trail)[] = [
  "name",
  "res",
  "distancetext",
  "date_modified",
  "modifier_username",
  "status",
];

// Filter row data by search query and reservation
function filterTableData(
  data: Trail[],
  search: string,
  reservationFilter: string
) {
  const query = search.toLowerCase().trim();
  return data.filter((item) => {
    // Apply text search filter
    const matchesSearch =
      query === "" ||
      keys(data[0]).some(function (key) {
        if (rowKeys.includes(key) && item[key]) {
          switch (key) {
            case "date_modified":
              return dayjs(item[key])
                .format("MMM D, YYYY, h:mma")
                .toLowerCase()
                .includes(query);
            default:
              return item[key].toString().toLowerCase().includes(query);
          }
        }
        return false;
      });

    // Apply reservation filter
    const matchesReservation =
      reservationFilter === "" || item.res === reservationFilter;

    return matchesSearch && matchesReservation;
  });
}

/**
 * Trail List
 */
export function TrailList() {
  const { reservationFilterSelectOptions } = useReservations();

  // Instead of useLoaderData(); see tkdodo.eu article above
  const {
    isLoading: trailsIsLoading,
    isError: trailsIsError,
    data: trailsData,
    error: trailsError,
  } = useQuery<Trail[], Error>({
    ...getAllTrailsQuery(),
    staleTime: 10000,
    refetchOnMount: false,
  });

  // For table sorting and filtering
  const [search, setSearch] = useState("");
  const [reservationFilter, setReservationFilter] = useState("");
  const [sortedData, setSortedData] = useState(trailsData);
  const [sortBy, setSortBy] = useState<keyof Trail | null>(null);
  const [reverseSortDirection, setReverseSortDirection] = useState(false);

  // Handle column sort
  const setSorting = (field: keyof Trail) => {
    const reversed = field === sortBy ? !reverseSortDirection : false;
    setReverseSortDirection(reversed);
    setSortBy(field);
    setSortedData(
      sortTableData(trailsData, { sortBy: field, reversed, search }, (data) =>
        filterTableData(data, search, reservationFilter)
      )
    );
  };

  // Handle table search
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.currentTarget;
    setSearch(value);
    setSortedData(
      sortTableData(
        trailsData,
        { sortBy, reversed: reverseSortDirection, search: value },
        (data) => filterTableData(data, value, reservationFilter)
      )
    );
  };

  // Handle reservation filter change
  const handleReservationFilterChange = (value: string | null) => {
    const filterValue = value || "";
    setReservationFilter(filterValue);
    setSortedData(
      sortTableData(
        trailsData,
        { sortBy, reversed: reverseSortDirection, search },
        (data) => filterTableData(data, search, filterValue)
      )
    );
  };

  // Handle reset filters
  const handleResetFilters = () => {
    setSearch("");
    setReservationFilter("");
    setSortedData(
      sortTableData(
        trailsData,
        { sortBy, reversed: reverseSortDirection, search: "" },
        (data) => filterTableData(data, "", "")
      )
    );
  };

  // Table rows
  const rows = sortedData?.map((row, index) => (
    <Table.Tr key={index}>
      <Table.Td>
        <Anchor component={Link} to={`/trails/${row.id}`}>
          {row.name}
        </Anchor>
      </Table.Td>
      <Table.Td>{row.res}</Table.Td>
      <Table.Td>{row.distancetext}</Table.Td>
      <Table.Td>
        {row.date_modified
          ? dayjs(row.date_modified).format("MMM D, YYYY, h:mma")
          : ""}
      </Table.Td>
      <Table.Td>{row.modifier_username}</Table.Td>
      <Table.Td>{row.status ? "Yes" : "No"}</Table.Td>
    </Table.Tr>
  ));

  // Set table data when we get Trails
  useEffect(() => {
    setSortedData(trailsData);
  }, [trailsData]);

  return (
    <>
      <Title order={2}>Trails</Title>

      {trailsIsError && (
        <div
          style={{ marginTop: "1rem", marginBottom: "1rem" }}
        >{`There was a problem fetching the trails data - ${trailsError.message}`}</div>
      )}

      <Button component={Link} to="/trails/new" variant="outline" my="md">
        + Add Trail
      </Button>

      <Group gap="md" mb="md">
        <TextInput
          label="Search"
          placeholder="Search by any field"
          leftSection={<IconSearch size="0.9rem" stroke={1.5} />}
          value={search}
          onChange={handleSearchChange}
          className={utils.minWidth300}
        />
        <Select
          label="Reservation"
          placeholder="Filter by reservation"
          data={reservationFilterSelectOptions}
          value={reservationFilter}
          onChange={handleReservationFilterChange}
          clearable
          className={utils.minWidth300}
        />
        <Button
          variant="outline"
          onClick={handleResetFilters}
          style={{ alignSelf: "flex-end" }}
        >
          Reset
        </Button>
      </Group>

      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Th
              sorted={sortBy === "name"}
              reversed={reverseSortDirection}
              onSort={() => setSorting("name")}
            >
              Name
            </Th>
            <Th
              sorted={sortBy === "res"}
              reversed={reverseSortDirection}
              onSort={() => setSorting("res")}
            >
              Reservation
            </Th>
            <Th
              sorted={sortBy === "distancetext"}
              reversed={reverseSortDirection}
              onSort={() => setSorting("distancetext")}
            >
              Distance
            </Th>
            <Th
              sorted={sortBy === "date_modified"}
              reversed={reverseSortDirection}
              onSort={() => setSorting("date_modified")}
            >
              Last modified
            </Th>
            <Th
              sorted={sortBy === "modifier_username"}
              reversed={reverseSortDirection}
              onSort={() => setSorting("modifier_username")}
            >
              Modified by
            </Th>
            <Th
              sorted={sortBy === "status"}
              reversed={reverseSortDirection}
              onSort={() => setSorting("status")}
            >
              Published
            </Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {trailsData && rows && rows.length > 0 ? (
            rows
          ) : (
            <Table.Tr>
              <Table.Td colSpan={6}>
                <Text fw={500} ta="center">
                  {trailsIsError ? (
                    <div>{`There is a problem fetching the post data - ${trailsError.message}`}</div>
                  ) : trailsIsLoading ? (
                    <div style={{ marginTop: "1rem", marginBottom: "1rem" }}>
                      Loading...
                    </div>
                  ) : (
                    <div style={{ marginTop: "1rem", marginBottom: "1rem" }}>
                      No trails found
                    </div>
                  )}
                </Text>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </>
  );
}
