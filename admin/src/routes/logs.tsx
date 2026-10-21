import { useEffect, useState, type MouseEvent } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  Link,
  useHref,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router";
import {
  Table,
  Anchor,
  Box,
  Pagination,
  Text,
  Badge,
  Group,
  Select,
  TextInput,
  Code,
  Collapse,
  Button,
} from "@mantine/core";
import { default as dayjs } from "dayjs";

import { mapsApiClient } from "../components/mapsApi";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

type FieldChange = {
  from: string | number | boolean | null;
  to: string | number | boolean | null;
};

type AuditDetails = {
  changed?: string[];
  fields?: Record<string, FieldChange>;
  tables?: string;
  single_table?: string | null;
  with_assoc_photos?: boolean;
  aggregate_photo_tables?: boolean;
};

type AuditLog = {
  id: number;
  created_at: string;
  ip_address: string | null;
  username: string;
  user_name: string | null;
  user_role: string | null;
  action: string;
  subject_type: string | null;
  subject_id: string | null;
  subject_name: string | null;
  details: AuditDetails | null;
  summary: string;
};

type AuditLogPage = {
  data: AuditLog[];
  total: number;
  page: number;
  per_page: number;
};

const ACTION_OPTIONS = [
  { value: "created", label: "Created" },
  { value: "updated", label: "Updated" },
  { value: "deleted", label: "Deleted" },
  { value: "enqueued", label: "Enqueued" },
  { value: "login", label: "Login" },
  { value: "logout", label: "Logout" },
  { value: "login_failed", label: "Failed login" },
];

const TYPE_OPTIONS = [
  { value: "trail", label: "Trail" },
  { value: "marker", label: "Marker" },
  { value: "fulcrum_job", label: "Fulcrum sync" },
  { value: "token", label: "API token" },
  { value: "hint_map", label: "Hint map" },
];

const SUBJECT_LABELS: Record<string, string> = {
  trail: "trail",
  marker: "marker",
  fulcrum_job: "Fulcrum sync",
  token: "API token",
  hint_map: "hint map",
};

function actionColor(action: string): string {
  switch (action) {
    case "created":
      return "green";
    case "updated":
      return "blue";
    case "deleted":
      return "red";
    case "login_failed":
    case "enqueued":
      return "orange";
    default:
      return "gray";
  }
}

function actionLabel(action: string): string {
  return (
    ACTION_OPTIONS.find((option) => option.value === action)?.label ?? action
  );
}

function subjectHref(
  log: Pick<AuditLog, "subject_type" | "subject_id">
): string | null {
  if (log.subject_type === "trail" && log.subject_id) {
    return `/trails/${log.subject_id}`;
  }
  if (log.subject_type === "marker" && log.subject_id) {
    return `/markers/${log.subject_id}`;
  }
  if (log.subject_type === "fulcrum_job") {
    return "/fulcrum";
  }
  return null;
}

function subjectText(
  log: Pick<AuditLog, "subject_type" | "subject_id" | "subject_name">
): string {
  const label =
    SUBJECT_LABELS[log.subject_type ?? ""] ?? log.subject_type ?? "item";
  const quoted = log.subject_name ? ` “${log.subject_name}”` : "";
  const idBit = log.subject_id ? ` (#${log.subject_id})` : "";
  return `${label}${quoted}${idBit}`;
}

function formatValue(value: FieldChange["from"]): string {
  if (value === null || value === undefined) {
    return "—";
  }
  return String(value);
}

// The summary sentence is built server-side (AuditLog::getSummaryAttribute);
// only add the link here so the wording lives in one place.
function SummaryCell({ log }: { log: AuditLog }) {
  const href = subjectHref(log);
  if (!href) {
    return <span>{log.summary}</span>;
  }
  return (
    <Anchor component={Link} to={href}>
      {log.summary}
    </Anchor>
  );
}

function Actor({ log }: { log: AuditLog }) {
  if (log.user_name && log.user_name !== log.username) {
    return (
      <span>
        {log.username}
        <Text span c="dimmed" size="sm">
          {" "}
          · {log.user_name}
        </Text>
      </span>
    );
  }
  return <span>{log.username}</span>;
}

export function AuditLogView() {
  useDocumentTitle("Logs");
  const params = useParams();
  const [rawOpen, setRawOpen] = useState(false);

  const logId =
    params.logId && !isNaN(parseFloat(params.logId))
      ? params.logId.toString()
      : "";

  const getAuditLog = async (id: string) => {
    const response = await mapsApiClient.get<{ data: AuditLog }>(
      import.meta.env.VITE_MAPS_API_BASE_PATH + "/audit_logs/" + id
    );
    return response.data.data;
  };

  const { isLoading, isError, data, error } = useQuery<AuditLog, Error>({
    queryKey: ["audit_log", logId],
    queryFn: () => getAuditLog(logId),
    enabled: logId !== "",
  });

  const fieldEntries = data?.details?.fields
    ? Object.entries(data.details.fields)
    : [];
  const flagged = (data?.details?.changed ?? []).filter(
    (name) => !fieldEntries.some(([key]) => key === name)
  );
  const href = data ? subjectHref(data) : null;

  return (
    <div>
      <Anchor component={Link} to="/logs">
        « Logs
      </Anchor>

      {!logId && <Text mt="md">Invalid log ID</Text>}
      {isLoading && <div>Loading...</div>}
      {isError && (
        <div>{`There is a problem fetching the log - ${error.message}`}</div>
      )}

      {data && (
        <Box mt="md">
          <Group gap="sm" mb="sm">
            <Badge color={actionColor(data.action)} variant="light">
              {actionLabel(data.action)}
            </Badge>
            <Text fw={600}>{data.summary}</Text>
          </Group>

          <Text fz="sm">
            <strong>Time: </strong>
            {dayjs(data.created_at).format("YYYY-MM-DD HH:mm:ss Z")}
          </Text>
          <Text fz="sm">
            <strong>User: </strong>
            <Actor log={data} />
            {data.user_role ? ` (${data.user_role})` : ""}
          </Text>
          <Text fz="sm">
            <strong>IP: </strong>
            {data.ip_address || "—"}
          </Text>
          <Text fz="sm">
            <strong>Subject: </strong>
            {href ? (
              <Anchor component={Link} to={href}>
                {subjectText(data)}
              </Anchor>
            ) : data.subject_type ? (
              subjectText(data)
            ) : (
              "—"
            )}
          </Text>

          {fieldEntries.length > 0 && (
            <Table mt="md" striped>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Field</Table.Th>
                  <Table.Th>From</Table.Th>
                  <Table.Th>To</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {fieldEntries.map(([field, change]) => (
                  <Table.Tr key={field}>
                    <Table.Td>{field}</Table.Td>
                    <Table.Td>{formatValue(change.from)}</Table.Td>
                    <Table.Td>{formatValue(change.to)}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}

          {flagged.length > 0 && (
            <Group mt="md" gap="xs">
              {flagged.map((name) => (
                <Badge key={name} variant="outline" color="gray">
                  {name}
                </Badge>
              ))}
            </Group>
          )}

          {data.details && (
            <Box mt="md">
              <Button
                variant="subtle"
                size="xs"
                onClick={() => setRawOpen((open) => !open)}
              >
                {rawOpen ? "Hide details" : "Show details"}
              </Button>
              <Collapse in={rawOpen}>
                <Code block mt="xs">
                  {JSON.stringify(data.details, null, 2)}
                </Code>
              </Collapse>
            </Box>
          )}
        </Box>
      )}
    </div>
  );
}

export function AuditLogsList() {
  useDocumentTitle("Logs");
  const navigate = useNavigate();
  const logsHref = useHref("/logs");
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const action = searchParams.get("action") || "";
  const subjectType = searchParams.get("subject_type") || "";
  const subjectId = searchParams.get("subject_id") || "";
  const username = searchParams.get("username") || "";
  const [usernameDraft, setUsernameDraft] = useState(username);

  useEffect(() => {
    setUsernameDraft(username);
  }, [username]);

  const setFilters = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(changes)) {
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
    }
    next.delete("page");
    setSearchParams(next);
  };

  const setPage = (nextPage: number, replace = false) => {
    const next = new URLSearchParams(searchParams);
    if (nextPage <= 1) {
      next.delete("page");
    } else {
      next.set("page", String(nextPage));
    }
    setSearchParams(next, { replace });
  };

  const openLog = (event: MouseEvent<HTMLTableRowElement>, id: number) => {
    // Links inside the row handle their own clicks.
    if ((event.target as HTMLElement).closest("a")) {
      return;
    }
    // Don't navigate away when the user is selecting text.
    if (window.getSelection()?.toString()) {
      return;
    }
    if (
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.button === 1
    ) {
      window.open(`${logsHref}/${id}`, "_blank", "noopener");
      return;
    }
    navigate(`/logs/${id}`);
  };

  const getAuditLogs = async () => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("per_page", "25");
    if (action) params.set("action", action);
    if (subjectType) params.set("subject_type", subjectType);
    if (subjectId) params.set("subject_id", subjectId);
    if (username) params.set("username", username);

    const response = await mapsApiClient.get<{ data: AuditLogPage }>(
      import.meta.env.VITE_MAPS_API_BASE_PATH +
        "/audit_logs?" +
        params.toString()
    );
    return response.data.data;
  };

  const { isLoading, isError, data, error } = useQuery<AuditLogPage, Error>({
    queryKey: ["audit_logs", page, action, subjectType, subjectId, username],
    queryFn: getAuditLogs,
    placeholderData: keepPreviousData,
  });

  const rows = data?.data ?? [];
  const totalPages = data
    ? Math.max(1, Math.ceil(data.total / data.per_page))
    : 1;

  // A page past the end (stale link, or filters narrowed the results) would
  // show "No logs found" with no pagination to get back; jump to the last page.
  const pastEnd = !!data && data.total > 0 && data.page > totalPages;
  useEffect(() => {
    if (pastEnd) {
      setPage(totalPages, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pastEnd, totalPages]);

  return (
    <div>
      <h2>Logs</h2>

      <Group mb="md" align="flex-end">
        <Select
          label="Action"
          placeholder="All"
          clearable
          data={ACTION_OPTIONS}
          value={action || null}
          onChange={(value) => setFilters({ action: value })}
        />
        <Select
          label="Type"
          placeholder="All"
          clearable
          data={TYPE_OPTIONS}
          value={subjectType || null}
          // A subject ID only means something alongside its type.
          onChange={(value) =>
            setFilters({ subject_type: value, subject_id: null })
          }
        />
        <TextInput
          label="User"
          placeholder="username"
          value={usernameDraft}
          onChange={(event) => setUsernameDraft(event.currentTarget.value)}
          onBlur={() => {
            if ((usernameDraft || "") !== username) {
              setFilters({ username: usernameDraft || null });
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              setFilters({ username: usernameDraft || null });
            }
          }}
        />
      </Group>

      {subjectId && (
        <Group mb="sm">
          <Badge
            variant="light"
            style={{ cursor: "pointer" }}
            onClick={() => setFilters({ subject_id: null })}
          >
            {SUBJECT_LABELS[subjectType] ?? subjectType ?? "subject"} #
            {subjectId} ×
          </Badge>
        </Group>
      )}

      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Time</Table.Th>
            <Table.Th>User</Table.Th>
            <Table.Th>Action</Table.Th>
            <Table.Th>Summary</Table.Th>
            <Table.Th>IP</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.length > 0 ? (
            rows.map((log) => (
              <Table.Tr
                key={log.id}
                style={{ cursor: "pointer" }}
                onClick={(event) => openLog(event, log.id)}
                onAuxClick={(event) => {
                  if (event.button === 1) {
                    openLog(event, log.id);
                  }
                }}
              >
                <Table.Td>
                  <Anchor component={Link} to={`/logs/${log.id}`}>
                    {dayjs(log.created_at).format("YYYY-MM-DD HH:mm Z")}
                  </Anchor>
                </Table.Td>
                <Table.Td>
                  <Actor log={log} />
                </Table.Td>
                <Table.Td>
                  <Badge color={actionColor(log.action)} variant="light">
                    {actionLabel(log.action)}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <SummaryCell log={log} />
                </Table.Td>
                <Table.Td>{log.ip_address || "—"}</Table.Td>
              </Table.Tr>
            ))
          ) : (
            <Table.Tr>
              <Table.Td colSpan={5}>
                <Text fw={500} ta="center" my="md">
                  {isError
                    ? `There was a problem fetching the logs - ${error.message}`
                    : isLoading
                      ? "Loading..."
                      : "No logs found"}
                </Text>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>

      {data && data.total > data.per_page && (
        <Box mt="md">
          <Pagination
            value={page}
            onChange={(nextPage) => setPage(nextPage)}
            total={totalPages}
          />
        </Box>
      )}
    </div>
  );
}
