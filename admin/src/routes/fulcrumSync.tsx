import { Fragment, useEffect, useState } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { Link, useParams, useSearchParams } from "react-router";
import {
  ActionIcon,
  Alert,
  Anchor,
  Badge,
  Box,
  Checkbox,
  Code,
  Collapse,
  Drawer,
  Group,
  Loader,
  Pagination,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Tabs,
  Text,
  TextInput,
  Title,
  Tooltip,
  UnstyledButton,
} from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import {
  IconAlertTriangle,
  IconClockExclamation,
  IconInfoCircle,
  IconRefresh,
  IconSearch,
} from "@tabler/icons-react";

import { mapsApiClient } from "../components/mapsApi";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { sortTableData, Th } from "../components/tablesort";
import {
  SyncStatusBadge,
  TableStatusBadge,
  JobStatusBadge,
  RunTypeBadge,
  formatDuration,
  formatET,
  describeRunType,
} from "../components/syncFormat";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip as ChartTooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";

import type {
  FulcrumSyncJob,
  FulcrumSyncJobListResponse,
  FulcrumSyncJobStatus,
  SyncHealth,
  SyncRunListResponse,
  SyncRunDetail,
  SyncRunStatus,
  SyncTable,
  SyncTableHistory,
  SyncTableSummary,
  TableSummarySort,
} from "../types/fulcrumSync";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ChartTooltip
);

const API_BASE = import.meta.env.VITE_MAPS_API_BASE_PATH;
const PER_PAGE = 20;

// A sync job is presumed stuck if it hasn't gotten a run_id (or been
// rejected) within this long of being enqueued — the poller/DB may be down.
const JOB_STUCK_TIMEOUT_MS = 2 * 60 * 1000;

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
// Run history tab
//
function SyncLogTab() {
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
                  <RunTypeBadge cliArgs={run.cli_args} />
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

// requested_by is a plain email string (server sets it from the
// authenticated user) — show just the local part, full address on hover.
function requesterLabel(requestedBy: string): string {
  const at = requestedBy.indexOf("@");
  return at > 0 ? requestedBy.slice(0, at) : requestedBy;
}

// A job's own status (pending/started/rejected) never reflects the outcome
// of the run it kicked off — once started, the job is just a breadcrumb
// pointing at run_id, and success/failure lives on the run. This looks that
// outcome up so the Jobs tab doesn't leave "Started" looking like a dead end.
// Shares FulcrumSyncDetail's query key so navigating there afterwards doesn't
// refetch.
function JobRunStatusBadge({ runId }: { runId: number }) {
  const { data, isLoading } = useQuery<SyncRunDetail, Error>({
    queryKey: ["fulcrum_sync_run", runId.toString()],
    queryFn: async () => {
      const response = await mapsApiClient.get<{ data: SyncRunDetail }>(
        `${API_BASE}/fulcrum_sync_runs/${runId}`
      );
      return response.data.data;
    },
  });

  if (isLoading) {
    return <Loader size="xs" />;
  }
  if (!data) {
    return null;
  }
  return <SyncStatusBadge status={data.computed_status} />;
}

//
// Jobs tab — history of sync-trigger requests (POST /fulcrum_sync_jobs). This
// is distinct from the Log tab: a job is a request to sync (which may be
// rejected before anything runs), a run is the resulting execution once the
// poller picks a non-rejected job up.
//
function JobsTab() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<FulcrumSyncJobStatus | null>(null);
  const [openErrorId, setOpenErrorId] = useState<number | null>(null);

  const getJobs = async () => {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: PER_PAGE.toString(),
    });
    if (status) {
      params.set("status", status);
    }
    const response = await mapsApiClient.get<{
      data: FulcrumSyncJobListResponse;
    }>(`${API_BASE}/fulcrum_sync_jobs?${params.toString()}`);
    return response.data.data;
  };

  const { isLoading, isError, data, error } = useQuery<
    FulcrumSyncJobListResponse,
    Error
  >({
    queryKey: ["fulcrum_sync_jobs", page, status],
    queryFn: getJobs,
    placeholderData: keepPreviousData,
  });

  const jobs = data?.data ?? [];
  const totalPages = data
    ? Math.max(1, Math.ceil(data.total / data.per_page))
    : 1;

  return (
    <div>
      <Group mb="md">
        <Select
          label="Status"
          placeholder="All"
          clearable
          data={[
            { value: "pending", label: "Pending" },
            { value: "started", label: "Started" },
            { value: "rejected", label: "Rejected" },
          ]}
          value={status}
          onChange={(value) => {
            setStatus(value as FulcrumSyncJobStatus | null);
            setPage(1);
          }}
        />
      </Group>

      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Requested</Table.Th>
            <Table.Th>Requested by</Table.Th>
            <Table.Th>Target</Table.Th>
            <Table.Th>Job Status</Table.Th>
            <Table.Th>Run Status</Table.Th>
            <Table.Th>View Run</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {jobs.length > 0 ? (
            jobs.map((job) => {
              const hasError = job.status === "rejected" && !!job.error_message;
              const open = openErrorId === job.id;
              return (
                <Fragment key={job.id}>
                  <Table.Tr
                    onClick={
                      hasError
                        ? () => setOpenErrorId(open ? null : job.id)
                        : undefined
                    }
                    style={hasError ? { cursor: "pointer" } : undefined}
                  >
                    <Table.Td>{formatET(job.requested_at)}</Table.Td>
                    <Table.Td>
                      <Tooltip label={job.requested_by}>
                        <Text size="sm">
                          {requesterLabel(job.requested_by)}
                        </Text>
                      </Tooltip>
                    </Table.Td>
                    <Table.Td>
                      <Stack gap={0}>
                        <Text size="sm">
                          {job.single_table ?? "All tables"}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {job.tables ?? "both"}
                          {job.with_assoc_photos ? " · +photos" : ""}
                          {job.aggregate_photo_tables ? " · aggregated" : ""}
                        </Text>
                      </Stack>
                    </Table.Td>
                    <Table.Td>
                      <JobStatusBadge status={job.status} />
                    </Table.Td>
                    <Table.Td>
                      {job.run_id != null ? (
                        <JobRunStatusBadge runId={job.run_id} />
                      ) : (
                        "—"
                      )}
                    </Table.Td>
                    <Table.Td>
                      {job.run_id != null ? (
                        <Anchor
                          component={Link}
                          to={`/fulcrum/${job.run_id}`}
                          fz="sm"
                        >
                          View run
                        </Anchor>
                      ) : (
                        "—"
                      )}
                    </Table.Td>
                  </Table.Tr>
                  {hasError && (
                    <Table.Tr>
                      <Table.Td colSpan={6} p={0}>
                        <Collapse in={open}>
                          <Code block m="xs">
                            {job.error_message}
                          </Code>
                        </Collapse>
                      </Table.Td>
                    </Table.Tr>
                  )}
                </Fragment>
              );
            })
          ) : (
            <Table.Tr>
              <Table.Td colSpan={6}>
                <Text fw={500} ta="center" my="md">
                  {isError
                    ? `There was a problem fetching sync jobs — ${error.message}`
                    : isLoading
                      ? "Loading…"
                      : "No sync jobs found"}
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

const TABLE_TYPE_COLOR: Record<string, string> = {
  standard: "blue",
  photo: "violet",
};

//
// Drawer showing row-count trend + run history for a single Fulcrum table.
//
function TableHistoryDrawer({
  table,
  onClose,
}: {
  table: SyncTableSummary | null;
  onClose: () => void;
}) {
  const getHistory = async () => {
    const params = new URLSearchParams({
      fulcrum_name: table!.fulcrum_name,
      limit: "30",
    });
    const response = await mapsApiClient.get<{ data: SyncTableHistory[] }>(
      `${API_BASE}/fulcrum_sync_runs/table_history?${params.toString()}`
    );
    return response.data.data;
  };

  const { isLoading, isError, data, error } = useQuery<
    SyncTableHistory[],
    Error
  >({
    queryKey: ["fulcrum_table_history", table?.fulcrum_name],
    queryFn: getHistory,
    enabled: !!table,
  });

  // API returns newest-first; chart wants oldest-first.
  const chartRows = (data ?? [])
    .filter((r) => r.rows_after !== null)
    .slice()
    .reverse();

  const chartData = {
    labels: chartRows.map((r) => formatET(r.started_at)),
    datasets: [
      {
        label: "Rows",
        data: chartRows.map((r) => r.rows_after),
        borderColor: "rgba(34, 139, 230, 1)",
        backgroundColor: "rgba(34, 139, 230, 0.1)",
        pointRadius: 3,
        fill: true,
        tension: 0.2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { maxRotation: 45, font: { size: 10 } } },
      y: { beginAtZero: false, title: { display: true, text: "Row count" } },
    },
  } as const;

  const historyRows = data ?? [];

  return (
    <Drawer
      opened={!!table}
      onClose={onClose}
      title={
        table ? (
          <Stack gap={2}>
            <Text fw={700}>{table.fulcrum_name}</Text>
            <Group gap="xs">
              <Badge
                color={TABLE_TYPE_COLOR[table.table_type] ?? "gray"}
                variant="light"
                size="sm"
              >
                {table.table_type}
              </Badge>
              <Text size="xs" c="dimmed" ff="monospace">
                {table.postgres_schema}.{table.postgres_table}
              </Text>
            </Group>
          </Stack>
        ) : null
      }
      position="right"
      size="xl"
      padding="md"
    >
      {isLoading && (
        <Group gap="xs" mt="md">
          <Loader size="sm" />
          <Text>Loading history…</Text>
        </Group>
      )}

      {isError && (
        <Alert color="red" icon={<IconAlertTriangle />} mt="md">
          Could not load table history — {error.message}
        </Alert>
      )}

      {data && (
        <Stack gap="lg" mt="xs">
          {chartRows.length > 1 ? (
            <div>
              <Text size="sm" fw={600} mb="xs">
                Row count over time
              </Text>
              <Line data={chartData} options={chartOptions} height={80} />
            </div>
          ) : (
            <Text size="sm" c="dimmed">
              Not enough successful runs to show a trend yet.
            </Text>
          )}

          <div>
            <Text size="sm" fw={600} mb="xs">
              Run history (last {historyRows.length})
            </Text>
            <Table striped>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Date</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Duration</Table.Th>
                  <Table.Th>Rows before</Table.Th>
                  <Table.Th>Rows after</Table.Th>
                  <Table.Th>Change</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {historyRows.map((r, i) => {
                  const delta =
                    r.rows_before !== null && r.rows_after !== null
                      ? r.rows_after - r.rows_before
                      : null;
                  const deltaColor =
                    delta === null
                      ? undefined
                      : delta < -50
                        ? "red"
                        : delta > 0
                          ? "green"
                          : undefined;
                  return (
                    <Table.Tr key={i}>
                      <Table.Td>
                        <Text size="sm">{formatET(r.started_at)}</Text>
                      </Table.Td>
                      <Table.Td>
                        <TableStatusBadge status={r.status} />
                      </Table.Td>
                      <Table.Td>{formatDuration(r.duration_secs)}</Table.Td>
                      <Table.Td>
                        {r.rows_before !== null
                          ? r.rows_before.toLocaleString()
                          : "—"}
                      </Table.Td>
                      <Table.Td>
                        {r.rows_after !== null
                          ? r.rows_after.toLocaleString()
                          : "—"}
                      </Table.Td>
                      <Table.Td>
                        {delta !== null ? (
                          <Text
                            size="sm"
                            c={deltaColor}
                            fw={delta !== 0 ? 600 : undefined}
                          >
                            {delta > 0 ? "+" : ""}
                            {delta.toLocaleString()}
                          </Text>
                        ) : (
                          "—"
                        )}
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </div>
        </Stack>
      )}
    </Drawer>
  );
}

type TableType = "standard" | "photo";

// single_table on POST /fulcrum_sync_jobs only accepts a parent form's own
// name — never a photo table or a repeatable sub-table's compound
// "ParentForm/child_name" fulcrum_name. Sub-tables always ride along when
// their parent form syncs, and photos are opt-in via with_assoc_photos, so
// only genuine parent-form rows get a Sync control at all.
function isSingleSyncTarget(t: SyncTableSummary) {
  return t.table_type === "standard" && !t.fulcrum_name.includes("/");
}

// Renders the "Sync" column cell for one table row. Each row gets its own
// component instance (keyed by fulcrum_name via the parent Table.Tr), so the
// enqueue mutation and job poll below are naturally scoped per-row — one
// row's in-flight request can never be confused with another's.
function TableSyncCell({
  fulcrumName,
  tabActive,
}: {
  fulcrumName: string;
  tabActive: boolean;
}) {
  const queryClient = useQueryClient();
  const [job, setJob] = useState<{ id: number; startedAt: number } | null>(
    null
  );
  const [withPhotos, setWithPhotos] = useState(false);

  const enqueueMutation = useMutation({
    mutationFn: async () => {
      const response = await mapsApiClient.post<{ data: FulcrumSyncJob }>(
        `${API_BASE}/fulcrum_sync_jobs`,
        {
          tables: "standard",
          single_table: fulcrumName,
          with_assoc_photos: withPhotos,
        }
      );
      return response.data.data;
    },
    onSuccess: (data) => {
      setJob({ id: data.id, startedAt: Date.now() });
      // Seed the poll query's cache immediately so the UI doesn't have to
      // wait for the first GET tick to show a status.
      queryClient.setQueryData(["fulcrum_sync_job", data.id], data);
    },
    onError: (err) => {
      showNotification({
        color: "red",
        title: `Could not queue sync for ${fulcrumName}`,
        message: err instanceof Error ? err.message : "Unknown error",
        autoClose: 5000,
      });
    },
  });

  // Polls until the job either gets a run_id or comes back rejected. Kept
  // running (rather than stopping once "stuck") so a job that's merely slow
  // still resolves to a run link if the backend eventually catches up; only
  // paused while this tab isn't the active one, so an expired session isn't
  // discovered via a surprise background redirect on an unrelated tab.
  const { data: polledJob } = useQuery<FulcrumSyncJob, Error>({
    queryKey: ["fulcrum_sync_job", job?.id],
    queryFn: async () => {
      const response = await mapsApiClient.get<{ data: FulcrumSyncJob }>(
        `${API_BASE}/fulcrum_sync_jobs/${job!.id}`
      );
      return response.data.data;
    },
    enabled: job !== null && tabActive,
    refetchInterval: (query) => {
      const latest = query.state.data;
      if (!latest) {
        return 2000;
      }
      return latest.run_id != null || latest.status === "rejected"
        ? false
        : 2000;
    },
  });

  // Once the job has a run, the table's row (rows/last synced) may have
  // changed once that run finishes — refresh the list.
  useEffect(() => {
    if (polledJob?.run_id != null) {
      queryClient.invalidateQueries({
        queryKey: ["fulcrum_sync_table_summary"],
      });
    }
  }, [polledJob?.run_id, queryClient]);

  const onSync = () => enqueueMutation.mutate();

  // Shared "also sync this form's photos" toggle — offered alongside every
  // sync/retry trigger below, since there's no separate per-photo-table
  // trigger in the API.
  const photosToggle = (
    <Tooltip label="Also sync this form's associated photos">
      <Checkbox
        size="xs"
        label="Photos"
        checked={withPhotos}
        onChange={(e) => setWithPhotos(e.currentTarget.checked)}
        disabled={enqueueMutation.isPending}
      />
    </Tooltip>
  );

  if (!job || !polledJob) {
    return (
      <Group gap="xs" wrap="nowrap">
        <Tooltip label={`Sync ${fulcrumName} now`}>
          <ActionIcon
            variant="light"
            onClick={onSync}
            loading={enqueueMutation.isPending || job !== null}
          >
            <IconRefresh size="1rem" stroke={1.5} />
          </ActionIcon>
        </Tooltip>
        {photosToggle}
      </Group>
    );
  }

  if (polledJob.run_id != null) {
    return (
      <Group gap="xs" wrap="nowrap">
        <Anchor component={Link} to={`/fulcrum/${polledJob.run_id}`} fz="sm">
          View run
        </Anchor>
        <Tooltip label={`Sync ${fulcrumName} again`}>
          <ActionIcon
            variant="subtle"
            onClick={onSync}
            loading={enqueueMutation.isPending}
          >
            <IconRefresh size="0.9rem" stroke={1.5} />
          </ActionIcon>
        </Tooltip>
        {photosToggle}
      </Group>
    );
  }

  const stuck =
    polledJob.status !== "rejected" &&
    Date.now() - job.startedAt > JOB_STUCK_TIMEOUT_MS;

  if (polledJob.status === "rejected" || stuck) {
    const rejected = polledJob.status === "rejected";
    return (
      <Stack gap={2}>
        <Group gap="xs" wrap="nowrap">
          <Tooltip
            label={
              rejected
                ? "Sync job was rejected — see message below"
                : "Hasn't progressed in over 2 minutes — may need attention"
            }
          >
            <Badge color={rejected ? "red" : "orange"} variant="light">
              {rejected ? "Failed" : "Stuck"}
            </Badge>
          </Tooltip>
          <ActionIcon
            variant="subtle"
            onClick={onSync}
            loading={enqueueMutation.isPending}
            title="Retry"
          >
            <IconRefresh size="0.9rem" stroke={1.5} />
          </ActionIcon>
          {photosToggle}
        </Group>
        {rejected && polledJob.error_message && (
          <Text
            size="xs"
            c="red"
            maw={280}
            lineClamp={2}
            title={polledJob.error_message}
          >
            {polledJob.error_message}
          </Text>
        )}
      </Stack>
    );
  }

  return (
    <Badge color="blue" variant="light">
      {polledJob.status === "pending" ? "Queued" : "Starting…"}
    </Badge>
  );
}

//
// Sync Tables tab — lists all Fulcrum tables with latest row count and last sync.
// The API handles the sort field; direction and type filtering are client-side.
//
function SyncTablesTab({ active }: { active: boolean }) {
  const [sort, setSort] = useState<TableSummarySort>("name");
  const [reversed, setReversed] = useState(false);
  const [tableType, setTableType] = useState<TableType | null>(null);
  const [search, setSearch] = useState("");
  const [selectedTable, setSelectedTable] = useState<SyncTableSummary | null>(
    null
  );

  const getTables = async () => {
    const response = await mapsApiClient.get<{ data: SyncTableSummary[] }>(
      `${API_BASE}/fulcrum_sync_runs/table_summary?sort=${sort}`
    );
    return response.data.data;
  };

  const { isLoading, isError, data, error } = useQuery<
    SyncTableSummary[],
    Error
  >({
    queryKey: ["fulcrum_sync_table_summary", sort],
    queryFn: getTables,
  });

  const handleSort = (field: TableSummarySort) => {
    if (field === sort) {
      setReversed((r) => !r);
    } else {
      setSort(field);
      setReversed(false);
    }
  };

  let tables = data ?? [];
  if (search.trim()) {
    const q = search.toLowerCase();
    tables = tables.filter((t) => t.fulcrum_name.toLowerCase().includes(q));
  }
  if (tableType) {
    tables = tables.filter((t) => t.table_type === tableType);
  }
  if (reversed) {
    tables = [...tables].reverse();
  }

  return (
    <div>
      <TableHistoryDrawer
        table={selectedTable}
        onClose={() => setSelectedTable(null)}
      />

      <Group mb="md" align="flex-end">
        <TextInput
          label="Search"
          placeholder="Filter by table name"
          leftSection={<IconSearch size="0.9rem" stroke={1.5} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
        />
        <Select
          label="Table Type"
          placeholder="All"
          clearable
          data={[
            { value: "standard", label: "Standard" },
            { value: "photo", label: "Photo" },
          ]}
          value={tableType}
          onChange={(value) => setTableType(value as TableType | null)}
        />
      </Group>

      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Th
              sorted={sort === "name"}
              reversed={sort === "name" ? reversed : false}
              onSort={() => handleSort("name")}
            >
              Table
            </Th>
            <Table.Th>Type</Table.Th>
            <Table.Th>DB location</Table.Th>
            <Th
              sorted={sort === "rows"}
              reversed={sort === "rows" ? reversed : false}
              onSort={() => handleSort("rows")}
            >
              Rows
            </Th>
            <Th
              sorted={sort === "last_synced_at"}
              reversed={sort === "last_synced_at" ? reversed : false}
              onSort={() => handleSort("last_synced_at")}
            >
              Last synced
            </Th>
            <Table.Th>Sync</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {tables.length > 0 ? (
            tables.map((t) => (
              <Table.Tr key={t.fulcrum_name}>
                <Table.Td>
                  <UnstyledButton
                    onClick={() => setSelectedTable(t)}
                    style={{
                      color: "var(--mantine-color-anchor)",
                      cursor: "pointer",
                    }}
                  >
                    {t.fulcrum_name}
                  </UnstyledButton>
                </Table.Td>
                <Table.Td>
                  <Tooltip
                    label={
                      t.table_type === "photo"
                        ? "Photo metadata table"
                        : "Form data table"
                    }
                  >
                    <Badge
                      color={TABLE_TYPE_COLOR[t.table_type] ?? "gray"}
                      variant="light"
                    >
                      {t.table_type}
                    </Badge>
                  </Tooltip>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" c="dimmed" ff="monospace">
                    {t.postgres_schema}.{t.postgres_table}
                  </Text>
                </Table.Td>
                <Table.Td>
                  {t.rows_after !== null ? t.rows_after.toLocaleString() : "—"}
                </Table.Td>
                <Table.Td>{formatET(t.last_synced_at)}</Table.Td>
                <Table.Td>
                  {isSingleSyncTarget(t) ? (
                    <TableSyncCell
                      fulcrumName={t.fulcrum_name}
                      tabActive={active}
                    />
                  ) : (
                    <Tooltip
                      label={
                        t.table_type === "photo"
                          ? 'Photo tables sync via their parent form\'s "Also sync photos" option'
                          : "Sub-tables sync automatically with their parent form"
                      }
                    >
                      <Text size="xs" c="dimmed">
                        —
                      </Text>
                    </Tooltip>
                  )}
                </Table.Td>
              </Table.Tr>
            ))
          ) : (
            <Table.Tr>
              <Table.Td colSpan={6}>
                <Text fw={500} ta="center" my="md">
                  {isError
                    ? `There was a problem fetching tables — ${error.message}`
                    : isLoading
                      ? "Loading…"
                      : "No tables found"}
                </Text>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </div>
  );
}

const VALID_TABS = ["log", "tables", "jobs"] as const;
type TabValue = (typeof VALID_TABS)[number];

//
// Fulcrum Sync page — health widget + tabbed view (Sync Log / Sync Tables).
// Active tab is reflected in the URL as ?tab=log or ?tab=tables.
//
export function FulcrumSyncList() {
  useDocumentTitle("Fulcrum Sync");

  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get("tab");
  const activeTab: TabValue =
    rawTab && (VALID_TABS as readonly string[]).includes(rawTab)
      ? (rawTab as TabValue)
      : "log";

  const handleTabChange = (value: string | null) => {
    if (value && (VALID_TABS as readonly string[]).includes(value)) {
      setSearchParams({ tab: value }, { replace: true });
    }
  };

  return (
    <div>
      <Title order={2} mb="md">
        Fulcrum Sync
      </Title>

      <SyncHealthWidget />

      <Tabs value={activeTab} onChange={handleTabChange} color="orange">
        <Tabs.List mb="md">
          <Tabs.Tab value="log" fz="md" fw={500}>
            Sync Log
          </Tabs.Tab>
          <Tabs.Tab value="tables" fz="md" fw={500}>
            Fulcrum Tables
          </Tabs.Tab>
          <Tabs.Tab value="jobs" fz="md" fw={500}>
            Job Queue
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="log">
          <SyncLogTab />
        </Tabs.Panel>

        <Tabs.Panel value="tables">
          <SyncTablesTab active={activeTab === "tables"} />
        </Tabs.Panel>

        <Tabs.Panel value="jobs">
          <JobsTab />
        </Tabs.Panel>
      </Tabs>
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
