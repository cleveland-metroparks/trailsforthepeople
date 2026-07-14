// Types for the Fulcrum sync run-history API (/api/v1/fulcrum_sync_runs).
// See maps-admin-sync-runs.md. All API field names are lowercased and responses
// use the standard { success, data, message } envelope.

export type SyncRunStatus = "running" | "success" | "failure";

// computed_status equals status except a `running` row older than 2 hours,
// which the API reports as "stale".
export type ComputedStatus = SyncRunStatus | "stale";

export type TableStatus = "success" | "skipped" | "failure";

export type TableType = "standard" | "photo";

// A run as it appears in the paginated list (rollups, no error_message).
export interface SyncRunSummary {
  id: number;
  started_at: string;
  finished_at: string | null;
  status: SyncRunStatus;
  computed_status: ComputedStatus;
  duration_secs: number | null;
  cli_args: string;
  tables_total: number;
  tables_failed: number;
  tables_skipped: number;
}

// One table processed within a run.
export interface SyncTable {
  fulcrum_name: string;
  postgres_schema: string;
  postgres_table: string;
  table_type: TableType;
  started_at: string;
  duration_secs: number | null;
  status: TableStatus;
  rows_before: number | null; // null = table was newly created
  rows_after: number | null; // null for skipped or failed tables
  error_message: string | null;
}

// Full run detail, including per-table rows and error_message.
export interface SyncRunDetail {
  id: number;
  started_at: string;
  finished_at: string | null;
  status: SyncRunStatus;
  computed_status: ComputedStatus;
  duration_secs: number | null;
  cli_args: string;
  error_message: string | null;
  tables: SyncTable[];
}

// Paginated list response `data`.
export interface SyncRunListResponse {
  data: SyncRunSummary[];
  total: number;
  per_page: number;
  page: number;
}

// table_summary sort options (handled server-side).
export type TableSummarySort = "name" | "last_synced_at" | "rows";

// One record from GET /fulcrum_sync_runs/table_history.
export interface SyncTableHistory {
  started_at: string;
  status: TableStatus;
  duration_secs: number | null;
  rows_before: number | null;
  rows_after: number | null;
}

// One record from GET /fulcrum_sync_runs/table_summary.
export interface SyncTableSummary {
  fulcrum_name: string;
  postgres_schema: string;
  postgres_table: string;
  table_type: TableType;
  rows_after: number | null;
  last_synced_at: string | null;
}

// Types for the sync-trigger API (/api/v1/fulcrum_sync_jobs). Enqueuing is
// fire-and-forget: it creates a job row that a poller on postgis-prod picks
// up, which then sets run_id once the run actually starts.

export type FulcrumSyncJobStatus = "pending" | "started" | "rejected";

export type FulcrumSyncJobTables = "standard" | "photos" | "both";

// POST /fulcrum_sync_jobs body. Omit `tables`/`single_table` for a full sync
// of both table sets. `requested_by` is set server-side from the session user.
export interface EnqueueSyncJobRequest {
  tables?: FulcrumSyncJobTables;
  single_table?: string;
  with_assoc_photos?: boolean;
  aggregate_photo_tables?: boolean;
}

// A job row, returned by POST /fulcrum_sync_jobs, GET /fulcrum_sync_jobs/{id},
// and GET /fulcrum_sync_jobs (list). This is a fixed 10-field whitelist
// enforced server-side — it won't grow or drift silently.
export interface FulcrumSyncJob {
  id: number;
  requested_at: string;
  requested_by: string;
  status: FulcrumSyncJobStatus;
  run_id: number | null;
  tables: FulcrumSyncJobTables | null;
  single_table: string | null;
  with_assoc_photos: boolean;
  aggregate_photo_tables: boolean;
  error_message: string | null;
}

// Paginated GET /fulcrum_sync_jobs response `data`. Always ordered by
// requested_at DESC server-side — there's no sort param.
export interface FulcrumSyncJobListResponse {
  data: FulcrumSyncJob[];
  total: number;
  per_page: number;
  page: number;
}

// Dashboard summary response `data`.
export interface SyncHealth {
  last_run: SyncRunSummary | null;
  last_successful_run: {
    id: number;
    started_at: string;
    duration_secs: number | null;
    cli_args: string;
  } | null;
  active_run: SyncRunSummary | null;
  stale_run_count: number;
  recent_30d: {
    failed_runs: number;
    total_runs: number;
    failed_tables: number;
  };
}
