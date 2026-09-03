import { useState } from "react";
import {
  useQuery,
  keepPreviousData,
} from "@tanstack/react-query";
import { Link, useParams, useSearchParams } from "react-router";
import {
  Alert,
  Anchor,
  Badge,
  Box,
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
import {
  IconAlertTriangle,
  IconClockExclamation,
  IconInfoCircle,
  IconSearch,
} from "@tabler/icons-react";

import { mapsApiClient } from "../components/mapsApi";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { sortTableData, Th } from "../components/tablesort";
import {
  SyncStatusBadge,
  formatDuration,
  formatET,
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
  ComputedStatus,
  LayerSummarySort,
  StepStatus,
  StepType,
  SyncHealth,
  SyncLayerHistory,
  SyncLayerSummary,
  SyncRunDetail,
  SyncRunListResponse,
  SyncRunStatus,
  SyncStep,
} from "../types/parcelsSync";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ChartTooltip
);

const API_BASE = import.meta.env.VITE_MAPS_API_BASE_PATH;
const PER_PAGE = 20;
const NIGHTLY_CLI_ARGS = "--download --import-to-db --post-process";
const STALE_LAST_RUN_MS = 25 * 60 * 60 * 1000;

const STEP_STATUS_COLOR: Record<StepStatus, string> = {
  success: "green",
  skipped: "gray",
  failure: "red",
};

const STEP_TYPE_COLOR: Record<StepType, string> = {
  download: "blue",
  import: "teal",
  post_process: "violet",
};

function describeRunType(cliArgs: string | null | undefined): string {
  return cliArgs?.trim() === NIGHTLY_CLI_ARGS ? "Nightly" : "Manual";
}

function RunTypeBadge({ cliArgs }: { cliArgs: string | null | undefined }) {
  const label = describeRunType(cliArgs);
  return (
    <Badge color={label === "Nightly" ? "dark" : "orange"} variant="light">
      {label}
    </Badge>
  );
}

function StepStatusBadge({ status }: { status: StepStatus }) {
  const badge = (
    <Badge color={STEP_STATUS_COLOR[status]} variant="light">
      {status}
    </Badge>
  );
  if (status === "skipped") {
    return (
      <Tooltip label="Layer skipped (often a 403 from the county server) — not a run failure">
        {badge}
      </Tooltip>
    );
  }
  return badge;
}

function SyncHealthWidget() {
  const getHealth = async () => {
    const response = await mapsApiClient.get<{ data: SyncHealth }>(
      `${API_BASE}/parcels_sync_runs/health`
    );
    return response.data.data;
  };

  const { isLoading, isError, data, error } = useQuery<SyncHealth, Error>({
    queryKey: ["parcels_sync_health"],
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

      {lastRunOverdue && last_run && (
        <Alert
          color="red"
          icon={<IconClockExclamation />}
          title="Nightly sync may not have run"
        >
          The most recent run started {formatET(last_run.started_at)} — over a
          day ago. Tonight&rsquo;s parcel data may not be fresh.
        </Alert>
      )}

      {stale_run_count > 0 && (
        <Alert color="orange" icon={<IconAlertTriangle />}>
          {stale_run_count} run{stale_run_count === 1 ? "" : "s"} appear to have
          crashed (running for over 6 hours without finishing).
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
                  <SyncStatusBadge
                    status={last_run.computed_status as ComputedStatus}
                  />
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
              Failed steps (30d)
            </Text>
            <Text
              size="xl"
              fw={700}
              mt={4}
              c={data.recent_30d.failed_steps > 0 ? "red" : undefined}
            >
              {data.recent_30d.failed_steps}
            </Text>
          </div>
        </SimpleGrid>
      </Paper>
    </Stack>
  );
}

function StepsRollup({
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
      `${API_BASE}/parcels_sync_runs?${params.toString()}`
    );
    return response.data.data;
  };

  const { isLoading, isError, data, error } = useQuery<
    SyncRunListResponse,
    Error
  >({
    queryKey: ["parcels_sync_runs", page, status],
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
            <Table.Th>Steps</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {runs.length > 0 ? (
            runs.map((run) => (
              <Table.Tr key={run.id}>
                <Table.Td>
                  <Anchor component={Link} to={`/parcels/${run.id}`}>
                    {formatET(run.started_at)}
                  </Anchor>
                  {run.source === "logfile" && (
                    <Badge size="xs" variant="light" color="gray" ml="xs">
                      from logs
                    </Badge>
                  )}
                </Table.Td>
                <Table.Td>
                  <SyncStatusBadge status={run.computed_status} />
                </Table.Td>
                <Table.Td>{formatDuration(run.duration_secs)}</Table.Td>
                <Table.Td>
                  <RunTypeBadge cliArgs={run.cli_args} />
                </Table.Td>
                <Table.Td>
                  <StepsRollup
                    total={run.steps_total}
                    failed={run.steps_failed}
                    skipped={run.steps_skipped}
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

function LayerHistoryDrawer({
  layer,
  onClose,
}: {
  layer: SyncLayerSummary | null;
  onClose: () => void;
}) {
  const getHistory = async () => {
    const params = new URLSearchParams({
      postgres_table: layer!.postgres_table,
      limit: "30",
    });
    const response = await mapsApiClient.get<{ data: SyncLayerHistory[] }>(
      `${API_BASE}/parcels_sync_runs/layer_history?${params.toString()}`
    );
    return response.data.data;
  };

  const { isLoading, isError, data, error } = useQuery<
    SyncLayerHistory[],
    Error
  >({
    queryKey: ["parcels_layer_history", layer?.postgres_table],
    queryFn: getHistory,
    enabled: !!layer,
  });

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
      opened={!!layer}
      onClose={onClose}
      title={
        layer ? (
          <Stack gap={2}>
            <Text fw={700}>{layer.postgres_table}</Text>
            <Group gap="xs">
              <Badge variant="light" size="sm">
                {layer.county}
              </Badge>
              <Text size="xs" c="dimmed" ff="monospace">
                {layer.postgres_schema}.{layer.postgres_table}
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
          Could not load layer history — {error.message}
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
              Not enough successful runs with row counts to show a trend yet.
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
                        <StepStatusBadge status={r.status} />
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

function LayersTab() {
  const [sort, setSort] = useState<LayerSummarySort>("name");
  const [reversed, setReversed] = useState(false);
  const [county, setCounty] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedLayer, setSelectedLayer] = useState<SyncLayerSummary | null>(
    null
  );

  const getLayers = async () => {
    const response = await mapsApiClient.get<{ data: SyncLayerSummary[] }>(
      `${API_BASE}/parcels_sync_runs/layer_summary?sort=${sort}`
    );
    return response.data.data;
  };

  const { isLoading, isError, data, error } = useQuery<
    SyncLayerSummary[],
    Error
  >({
    queryKey: ["parcels_sync_layer_summary", sort],
    queryFn: getLayers,
  });

  const handleSort = (field: LayerSummarySort) => {
    if (field === sort) {
      setReversed((r) => !r);
    } else {
      setSort(field);
      setReversed(false);
    }
  };

  let layers = data ?? [];
  if (search.trim()) {
    const q = search.toLowerCase();
    layers = layers.filter(
      (t) =>
        t.postgres_table.toLowerCase().includes(q) ||
        (t.name ?? "").toLowerCase().includes(q) ||
        t.county.toLowerCase().includes(q)
    );
  }
  if (county) {
    layers = layers.filter((t) => t.county === county);
  }
  if (reversed) {
    layers = [...layers].reverse();
  }

  return (
    <div>
      <LayerHistoryDrawer
        layer={selectedLayer}
        onClose={() => setSelectedLayer(null)}
      />

      <Group mb="md" align="flex-end">
        <TextInput
          label="Search"
          placeholder="Filter by table or county"
          leftSection={<IconSearch size="0.9rem" stroke={1.5} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
        />
        <Select
          label="County"
          placeholder="All"
          clearable
          data={[
            { value: "cuyahoga", label: "Cuyahoga" },
            { value: "medina", label: "Medina" },
            { value: "lake", label: "Lake" },
          ]}
          value={county}
          onChange={setCounty}
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
            <Table.Th>County</Table.Th>
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
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {layers.length > 0 ? (
            layers.map((t) => (
              <Table.Tr key={t.postgres_table}>
                <Table.Td>
                  <UnstyledButton
                    onClick={() => setSelectedLayer(t)}
                    style={{
                      color: "var(--mantine-color-anchor)",
                      cursor: "pointer",
                    }}
                  >
                    {t.postgres_table}
                  </UnstyledButton>
                </Table.Td>
                <Table.Td>
                  <Badge variant="light">{t.county}</Badge>
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
              </Table.Tr>
            ))
          ) : (
            <Table.Tr>
              <Table.Td colSpan={5}>
                <Text fw={500} ta="center" my="md">
                  {isError
                    ? `There was a problem fetching layers — ${error.message}`
                    : isLoading
                      ? "Loading…"
                      : "No layers found"}
                </Text>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </div>
  );
}

const VALID_TABS = ["log", "layers"] as const;
type TabValue = (typeof VALID_TABS)[number];

export function ParcelsSyncList() {
  useDocumentTitle("Parcels Sync");

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
        Parcels Sync
      </Title>

      <SyncHealthWidget />

      <Tabs value={activeTab} onChange={handleTabChange} color="green">
        <Tabs.List mb="md">
          <Tabs.Tab value="log" fz="md" fw={500}>
            Sync Log
          </Tabs.Tab>
          <Tabs.Tab value="layers" fz="md" fw={500}>
            Layers
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="log">
          <SyncLogTab />
        </Tabs.Panel>

        <Tabs.Panel value="layers">
          <LayersTab />
        </Tabs.Panel>
      </Tabs>
    </div>
  );
}

function StepRow({ step }: { step: SyncStep }) {
  const [open, setOpen] = useState(false);
  const hasError = !!step.error_message;

  const rowChange =
    step.rows_before !== null && step.rows_after !== null
      ? `${step.rows_before.toLocaleString()} → ${step.rows_after.toLocaleString()}`
      : step.rows_after !== null
        ? `(new) → ${step.rows_after.toLocaleString()}`
        : "—";

  return (
    <>
      <Table.Tr
        onClick={hasError ? () => setOpen((o) => !o) : undefined}
        style={hasError ? { cursor: "pointer" } : undefined}
      >
        <Table.Td>{step.county}</Table.Td>
        <Table.Td>
          <Badge
            color={STEP_TYPE_COLOR[step.step_type] ?? "gray"}
            variant="light"
          >
            {step.step_type}
          </Badge>
        </Table.Td>
        <Table.Td>{step.name}</Table.Td>
        <Table.Td>
          <StepStatusBadge status={step.status} />
        </Table.Td>
        <Table.Td>{formatDuration(step.duration_secs)}</Table.Td>
        <Table.Td>{rowChange}</Table.Td>
      </Table.Tr>
      {hasError && (
        <Table.Tr>
          <Table.Td colSpan={6} p={0}>
            <Collapse in={open}>
              <Code block m="xs">
                {step.error_message}
              </Code>
            </Collapse>
          </Table.Td>
        </Table.Tr>
      )}
    </>
  );
}

export function ParcelsSyncDetail() {
  useDocumentTitle("Parcels Sync");

  const params = useParams();
  const runId = params.runId ?? "";

  const getRun = async () => {
    const response = await mapsApiClient.get<{ data: SyncRunDetail }>(
      `${API_BASE}/parcels_sync_runs/${runId}`
    );
    return response.data.data;
  };

  const { isLoading, isError, data, error } = useQuery<SyncRunDetail, Error>({
    queryKey: ["parcels_sync_run", runId],
    queryFn: getRun,
  });

  const [sortBy, setSortBy] = useState<keyof SyncStep | "row_change" | null>(
    null
  );
  const [reversed, setReversed] = useState(false);

  const setSorting = (field: keyof SyncStep | "row_change") => {
    setReversed(field === sortBy ? !reversed : false);
    setSortBy(field);
  };

  const steps = data?.steps ?? [];
  const sortedSteps = sortBy
    ? sortTableData(
        steps.map((t) => ({
          ...t,
          row_change:
            t.rows_before !== null && t.rows_after !== null
              ? t.rows_after - t.rows_before
              : null,
        })),
        { sortBy, reversed, search: "" },
        (d) => d
      )
    : steps;

  return (
    <div>
      <Anchor component={Link} to="/parcels">
        « Parcels Sync
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
            {data.source === "logfile" && (
              <Badge variant="light" color="gray">
                from logs
              </Badge>
            )}
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

          {data.source === "logfile" && (
            <Alert color="gray" icon={<IconInfoCircle />} mb="md">
              Imported from historical log files. Durations and import row
              counts may be missing.
            </Alert>
          )}

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
            Steps
          </Title>

          {steps.length > 0 ? (
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>County</Table.Th>
                  <Table.Th>Step</Table.Th>
                  <Table.Th>Name</Table.Th>
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
                {sortedSteps.map((step, i) => (
                  <StepRow
                    key={`${step.county}-${step.step_type}-${step.name}-${i}`}
                    step={step}
                  />
                ))}
              </Table.Tbody>
            </Table>
          ) : (
            <Text c="dimmed">No per-step detail for this run.</Text>
          )}
        </>
      )}
    </div>
  );
}
