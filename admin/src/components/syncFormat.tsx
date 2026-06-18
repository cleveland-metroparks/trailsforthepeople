import { Badge, Tooltip } from "@mantine/core";

import type { ComputedStatus, TableStatus } from "../types/fulcrumSync";

// The standard nightly run's cli_args (per maps-admin-sync-runs.md). Anything
// else was a manual/partial run.
const NIGHTLY_CLI_ARGS =
  "--tables both --with-assoc-photos --aggregate-photo-tables";

// Format a wall-clock duration in seconds as "Xm Ys" (or "Ys" under a minute).
export function formatDuration(secs: number | null | undefined): string {
  if (secs === null || secs === undefined) {
    return "—";
  }
  const total = Math.round(secs);
  const mins = Math.floor(total / 60);
  const remSecs = total % 60;
  return mins > 0 ? `${mins}m ${remSecs}s` : `${remSecs}s`;
}

// Render a UTC ISO timestamp in Eastern Time for display. Uses Intl rather than
// a dayjs timezone plugin (which isn't installed).
export function formatET(iso: string | null | undefined): string {
  if (!iso) {
    return "—";
  }
  return new Date(iso).toLocaleString("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

// "Nightly" for the standard run, "Manual" otherwise. The raw args are still
// worth showing; callers can render `cli_args` alongside this label.
export function describeRunType(cliArgs: string | null | undefined): string {
  return cliArgs?.trim() === NIGHTLY_CLI_ARGS ? "Nightly" : "Manual";
}

const RUN_STATUS_COLOR: Record<ComputedStatus, string> = {
  success: "green",
  failure: "red",
  running: "blue",
  stale: "orange",
};

const RUN_STATUS_LABEL: Record<ComputedStatus, string> = {
  success: "Success",
  failure: "Failure",
  running: "Running",
  stale: "Stale",
};

// Badge for a run's computed_status. "stale" = a running row older than 2h
// (a crashed run).
export function SyncStatusBadge({ status }: { status: ComputedStatus }) {
  const badge = (
    <Badge color={RUN_STATUS_COLOR[status]} variant="light">
      {RUN_STATUS_LABEL[status]}
    </Badge>
  );
  if (status === "stale") {
    return (
      <Tooltip label="Started over 2 hours ago and never finished — likely crashed">
        {badge}
      </Tooltip>
    );
  }
  return badge;
}

const TABLE_STATUS_COLOR: Record<TableStatus, string> = {
  success: "green",
  skipped: "gray",
  failure: "red",
};

// Badge for a per-table status. "skipped" = Fulcrum had no data (informational).
export function TableStatusBadge({ status }: { status: TableStatus }) {
  const badge = (
    <Badge color={TABLE_STATUS_COLOR[status]} variant="light">
      {status}
    </Badge>
  );
  if (status === "skipped") {
    return (
      <Tooltip label="Fulcrum had no data for this table — not an error">
        {badge}
      </Tooltip>
    );
  }
  return badge;
}
