import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Link, useParams } from "react-router";
import {
  Alert,
  Anchor,
  Box,
  Code,
  Collapse,
  Group,
  Loader,
  Pagination,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Title,
} from "@mantine/core";
import {
  IconAlertTriangle,
  IconClockExclamation,
  IconInfoCircle,
} from "@tabler/icons-react";

import { mapsApiClient } from "../components/mapsApi";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { sortTableData, Th } from "../components/tablesort";
import {
  SyncStatusBadge,
  TableStatusBadge,
  formatDuration,
  formatET,
  describeRunType,
} from "../components/syncFormat";
import type {
  SyncHealth,
  SyncRunListResponse,
  SyncRunDetail,
  SyncRunStatus,
  SyncTable,
} from "../types/fulcrumSync";

const API_BASE = import.meta.env.VITE_MAPS_API_BASE_PATH;
const PER_PAGE = 20;

// A run is considered overdue if its most recent start is older than ~25 hours
// — the nightly sync should have fired within the last day.
const STALE_LAST_RUN_MS = 25 * 60 * 60 * 1000;

//
// Dashboard health widget — "is tonight's data fresh?"
//
function SyncHealthWidget() {
  const getHealth = async () => {
    const response = await mapsApiClient.get<{ data: SyncHealth }>(
      `${API_BASE}/fulcrum_sync_runs/health`
    );
    return response.data.data;
  };

  const { isLoading, isError, data, error } = useQuery<SyncHealth, Error>({
    queryKey: ["fulcrum_sync_health"],
    queryFn: getHealth,
  });

  if (isLoading) {
    return (
      <Paper withBorder p="md" mb="lg">
        <Group gap="xs">
          <Loader size="sm" />
          <Text>Loading sync status…</Text>
        </Group>
      </Paper>
    );
  }

  if (isError) {
    return (
      <Alert color="red" icon={<IconAlertTriangle />} mb="lg">
        Could not load sync status — {error.message}
      </Alert>
    );
  }

  if (!data) {
    return null;
  }

  const { last_run, last_successful_run, active_run, stale_run_count } = data;

  const lastRunOverdue =
    last_run !== null &&
    Date.now() - new Date(last_run.started_at).getTime() > STALE_LAST_RUN_MS;

  return (
    <Stack gap="sm" mb="lg">
      {!last_run && (
        <Alert color="gray" icon={<IconInfoCircle />}>
          No sync runs have been recorded yet.
        </Alert>
      )}

      {active_run && (
        <Alert color="blue" icon={<IconInfoCircle />}>
          A sync is currently in progress (started{" "}
          {formatET(active_run.started_at)}
          ).
        </Alert>
      )}

      {lastRunOverdue && (
        <Alert
          color="red"
          icon={<IconClockExclamation />}
          title="Nightly sync may not have run"
        >
          The most recent run started {formatET(last_run.started_at)} — over a
          day ago. Tonight&rsquo;s data may not be fresh.
        </Alert>
      )}

      {stale_run_count > 0 && (
        <Alert color="orange" icon={<IconAlertTriangle />}>
          {stale_run_count} run{stale_run_count === 1 ? "" : "s"} appear to have
          crashed (running for over 2 hours without finishing).
        </Alert>
      )}

      <Paper withBorder p="md">
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
          <div>
            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
              Last run
            </Text>
            {last_run ? (
              <>
                <Group gap="xs" mt={4}>
                  <SyncStatusBadge status={last_run.computed_status} />
                </Group>
                <Text size="sm" mt={4}>
                  {formatET(last_run.started_at)}
                </Text>
                <Text size="xs" c="dimmed">
                  {formatDuration(last_run.duration_secs)} ·{" "}
                  {describeRunType(last_run.cli_args)}
                </Text>
              </>
            ) : (
              <Text size="sm" c="dimmed" mt={4}>
                —
              </Text>
            )}
          </div>

          <div>
            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
              Last successful run
            </Text>
            {last_successful_run ? (
              <>
                <Text size="sm" mt={4}>
                  {formatET(last_successful_run.started_at)}
                </Text>
                <Text size="xs" c="dimmed">
                  {formatDuration(last_successful_run.duration_secs)}
                </Text>
              </>
            ) : (
              <Text size="sm" c="dimmed" mt={4}>
                —
              </Text>
            )}
          </div>

          <div>
            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
              Failed runs (30d)
            </Text>
            <Text
              size="xl"
              fw={700}
              mt={4}
              c={data.recent_30d.failed_runs > 0 ? "red" : undefined}
            >
              {data.recent_30d.failed_runs}
            </Text>
            <Text size="xs" c="dimmed">
              of {data.recent_30d.total_runs} total
            </Text>
          </div>

          <div>
            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
              Failed tables (30d)
            </Text>
            <Text
              size="xl"
              fw={700}
              mt={4}
              c={data.recent_30d.failed_tables > 0 ? "red" : undefined}
            >
              {data.recent_30d.failed_tables}
            </Text>
          </div>
        </SimpleGrid>
      </Paper>
    </Stack>
  );
}

//
// Per-run tables rollup, e.g. "62 synced · 1 failed · 3 skipped".
// Failed count is shown in red even when the run's own status is success.
//
function TablesRollup({
  total,
  failed,
  skipped,
}: {
  total: number;
  failed: number;
  skipped: number;
}) {
  return (
    <Text size="sm">
      {total} synced
      {failed > 0 && (
        <>
          {" · "}
          <Text span c="red" fw={700} inherit>
            {failed} failed
          </Text>
        </>
      )}
      {skipped > 0 && (
        <Text span c="dimmed" inherit>
          {" · "}
          {skipped} skipped
        </Text>
      )}
    </Text>
  );
}

//
// Run history list
//
export function FulcrumSyncList() {
  useDocumentTitle("Fulcrum Sync");

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<SyncRunStatus | null>(null);

  const getRuns = async () => {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: PER_PAGE.toString(),
    });
    if (status) {
      params.set("status", status);
    }
    const response = await mapsApiClient.get<{ data: SyncRunListResponse }>(
      `${API_BASE}/fulcrum_sync_runs?${params.toString()}`
    );
    return response.data.data;
  };

  const { isLoading, isError, data, error } = useQuery<
    SyncRunListResponse,
    Error
  >({
    queryKey: ["fulcrum_sync_runs", page, status],
    queryFn: getRuns,
    placeholderData: keepPreviousData,
  });

  const runs = data?.data ?? [];
  const totalPages = data
    ? Math.max(1, Math.ceil(data.total / data.per_page))
    : 1;

  return (
    <div>
      <Title order={2} mb="md">
        Fulcrum Sync
      </Title>

      <SyncHealthWidget />

      <Group mb="md">
        <Select
          label="Status"
          placeholder="All"
          clearable
          data={[
            { value: "success", label: "Success" },
            { value: "failure", label: "Failure" },
            { value: "running", label: "Running" },
          ]}
          value={status}
          onChange={(value) => {
            setStatus(value as SyncRunStatus | null);
            setPage(1);
          }}
        />
      </Group>

      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Started</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Duration</Table.Th>
            <Table.Th>Run type</Table.Th>
            <Table.Th>Tables</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {runs.length > 0 ? (
            runs.map((run) => (
              <Table.Tr key={run.id}>
                <Table.Td>
                  <Anchor component={Link} to={`/fulcrum/${run.id}`}>
                    {formatET(run.started_at)}
                  </Anchor>
                </Table.Td>
                <Table.Td>
                  <SyncStatusBadge status={run.computed_status} />
                </Table.Td>
                <Table.Td>{formatDuration(run.duration_secs)}</Table.Td>
                <Table.Td>
                  <Text size="sm">{describeRunType(run.cli_args)}</Text>
                </Table.Td>
                <Table.Td>
                  <TablesRollup
                    total={run.tables_total}
                    failed={run.tables_failed}
                    skipped={run.tables_skipped}
                  />
                </Table.Td>
              </Table.Tr>
            ))
          ) : (
            <Table.Tr>
              <Table.Td colSpan={5}>
                <Text fw={500} ta="center" my="md">
                  {isError
                    ? `There was a problem fetching sync runs — ${error.message}`
                    : isLoading
                      ? "Loading…"
                      : "No sync runs found"}
                </Text>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>

      {totalPages > 1 && (
        <Box mt="md">
          <Pagination value={page} onChange={setPage} total={totalPages} />
        </Box>
      )}
    </div>
  );
}

//
// One row of the per-table detail table, with an expandable error message.
//
function TableRow({ table }: { table: SyncTable }) {
  const [open, setOpen] = useState(false);
  const hasError = !!table.error_message;

  const rowChange =
    table.rows_before !== null && table.rows_after !== null
      ? `${table.rows_before} → ${table.rows_after}`
      : table.rows_after !== null
        ? `(new) → ${table.rows_after}`
        : "—";

  return (
    <>
      <Table.Tr
        onClick={hasError ? () => setOpen((o) => !o) : undefined}
        style={hasError ? { cursor: "pointer" } : undefined}
      >
        <Table.Td>{table.fulcrum_name}</Table.Td>
        <Table.Td>{table.table_type}</Table.Td>
        <Table.Td>
          <TableStatusBadge status={table.status} />
        </Table.Td>
        <Table.Td>{formatDuration(table.duration_secs)}</Table.Td>
        <Table.Td>{rowChange}</Table.Td>
      </Table.Tr>
      {hasError && (
        <Table.Tr>
          <Table.Td colSpan={5} p={0}>
            <Collapse in={open}>
              <Code block m="xs">
                {table.error_message}
              </Code>
            </Collapse>
          </Table.Td>
        </Table.Tr>
      )}
    </>
  );
}

//
// Run detail view
//
export function FulcrumSyncDetail() {
  useDocumentTitle("Fulcrum Sync");

  const params = useParams();
  const runId = params.runId ?? "";

  const getRun = async () => {
    const response = await mapsApiClient.get<{ data: SyncRunDetail }>(
      `${API_BASE}/fulcrum_sync_runs/${runId}`
    );
    return response.data.data;
  };

  const { isLoading, isError, data, error } = useQuery<SyncRunDetail, Error>({
    queryKey: ["fulcrum_sync_run", runId],
    queryFn: getRun,
  });

  // Per-table sorting (by duration or row-count change)
  const [sortBy, setSortBy] = useState<keyof SyncTable | "row_change" | null>(
    null
  );
  const [reversed, setReversed] = useState(false);

  const setSorting = (field: keyof SyncTable | "row_change") => {
    setReversed(field === sortBy ? !reversed : false);
    setSortBy(field);
  };

  const tables = data?.tables ?? [];
  const sortedTables = sortBy
    ? sortTableData(
        tables.map((t) => ({
          ...t,
          row_change:
            t.rows_before !== null && t.rows_after !== null
              ? t.rows_after - t.rows_before
              : null,
        })),
        { sortBy, reversed, search: "" },
        (d) => d
      )
    : tables;

  return (
    <div>
      <Anchor component={Link} to="/fulcrum">
        « Fulcrum Sync
      </Anchor>

      {isLoading && <Text mt="md">Loading…</Text>}

      {isError && (
        <Text mt="md">
          There was a problem fetching this run — {error.message}
        </Text>
      )}

      {data && (
        <>
          <Group mt="md" mb="xs" gap="sm">
            <Title order={2}>Run #{data.id}</Title>
            <SyncStatusBadge status={data.computed_status} />
          </Group>

          <Stack gap={4} mb="md">
            <Text size="sm">
              <strong>Started:</strong> {formatET(data.started_at)}
            </Text>
            <Text size="sm">
              <strong>Finished:</strong>{" "}
              {data.finished_at ? formatET(data.finished_at) : "—"}
            </Text>
            <Text size="sm">
              <strong>Duration:</strong> {formatDuration(data.duration_secs)}
            </Text>
            <Text size="sm">
              <strong>Run type:</strong> {describeRunType(data.cli_args)}
            </Text>
            <Text size="sm" c="dimmed">
              <Code>{data.cli_args}</Code>
            </Text>
          </Stack>

          {data.error_message && (
            <Alert
              color="red"
              icon={<IconAlertTriangle />}
              title="Run error"
              mb="md"
            >
              <Code block>{data.error_message}</Code>
            </Alert>
          )}

          <Title order={4} mb="xs">
            Tables
          </Title>

          {tables.length > 0 ? (
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Table</Table.Th>
                  <Table.Th>Type</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Th
                    sorted={sortBy === "duration_secs"}
                    reversed={reversed}
                    onSort={() => setSorting("duration_secs")}
                  >
                    Duration
                  </Th>
                  <Th
                    sorted={sortBy === "row_change"}
                    reversed={reversed}
                    onSort={() => setSorting("row_change")}
                  >
                    Rows
                  </Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {sortedTables.map((table) => (
                  <TableRow key={table.fulcrum_name} table={table} />
                ))}
              </Table.Tbody>
            </Table>
          ) : (
            <Text c="dimmed">
              No per-table detail for this run (predates per-table tracking).
            </Text>
          )}
        </>
      )}
    </div>
  );
}
