// Types for the parcels sync run-history API (/api/v1/parcels_sync_runs).
// See parcels-sync-app docs/maps-admin-sync-runs.md.

export type SyncRunStatus = "running" | "success" | "failure";

export type ComputedStatus = SyncRunStatus | "stale";

export type StepStatus = "success" | "skipped" | "failure";

export type StepType = "download" | "import" | "post_process";

export type RunSource = "pipeline" | "logfile";

export interface SyncRunSummary {
  id: number;
  started_at: string;
  finished_at: string | null;
  status: SyncRunStatus;
  computed_status: ComputedStatus;
  duration_secs: number | null;
  cli_args: string;
  source: RunSource;
  steps_total: number;
  steps_failed: number;
  steps_skipped: number;
}

export interface SyncStep {
  county: string;
  step_type: StepType;
  layer_number: number | null;
  name: string;
  description: string | null;
  postgres_schema: string | null;
  postgres_table: string | null;
  started_at: string;
  duration_secs: number | null;
  status: StepStatus;
  rows_before: number | null;
  rows_after: number | null;
  error_message: string | null;
}

export interface SyncRunDetail {
  id: number;
  started_at: string;
  finished_at: string | null;
  status: SyncRunStatus;
  computed_status: ComputedStatus;
  duration_secs: number | null;
  cli_args: string;
  source: RunSource;
  error_message: string | null;
  steps: SyncStep[];
}

export interface SyncRunListResponse {
  data: SyncRunSummary[];
  total: number;
  per_page: number;
  page: number;
}

export type LayerSummarySort = "name" | "last_synced_at" | "rows";

export interface SyncLayerHistory {
  started_at: string;
  status: StepStatus;
  duration_secs: number | null;
  rows_before: number | null;
  rows_after: number | null;
  step_type: StepType;
}

export interface SyncLayerSummary {
  county: string;
  name: string;
  description: string | null;
  postgres_schema: string | null;
  postgres_table: string;
  step_type: StepType;
  rows_after: number | null;
  last_synced_at: string | null;
}

export interface SyncHealth {
  last_run: SyncRunSummary | null;
  last_successful_run: {
    id: number;
    started_at: string;
    duration_secs: number | null;
    cli_args: string;
    source?: RunSource;
  } | null;
  active_run: SyncRunSummary | null;
  stale_run_count: number;
  recent_30d: {
    failed_runs: number;
    total_runs: number;
    failed_steps: number;
  };
}
