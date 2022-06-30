import axios from "axios";
import { useQuery } from "react-query";
import { Link, Outlet, useParams } from "react-router-dom";
import { Table, Anchor } from '@mantine/core';

type AuditLog = {
  id: number,
  timestamp: string,
  ipaddress: string,
  username: string,
  message: string
};

const apiClient = axios.create({
  baseURL: "https://maps-api-dev2.clevelandmetroparks.com/api/v1",
  headers: {
    "Content-type": "application/json",
  },
});

const getAllAuditLogs = async () => {
  const response = await apiClient.get<any>("/audit_logs");
  return response.data.data;
}

//
const getAuditLog = async (id: string) => {
  const response = await apiClient.get<any>("/audit_logs/" + id);
  return response.data.data;
}

//
export function AuditLog() {
  let params = useParams();
  let logId = params.logId ? params.logId.toString() : '';
  const { isLoading, isSuccess, isError, data, error, refetch } = useQuery<AuditLog, Error>(['audit_log', params.logId], () => getAuditLog(logId));
  return (
    <div>
      <Anchor component={Link} to={`/logs`}>Logs</Anchor>
      {isLoading && <div>Loading...</div>}
      {isError && (
        <div>{`There is a problem fetching the post data - ${error.message}`}</div>
      )}
        {data &&
          <div>
            <h2>{data.timestamp}</h2>
            <dl>
              <dt><strong>id:</strong></dt><dd>{data.id}</dd>
              <dt><strong>timestamp:</strong></dt><dd>{data.timestamp}</dd>
              <dt><strong>ipaddress:</strong></dt><dd>{data.ipaddress}</dd>
              <dt><strong>username:</strong></dt><dd>{data.username}</dd>
              <dt><strong>message:</strong></dt><dd>{data.message}</dd>
            </dl>
          </div>
        }
    </div>
  );
}

export function AuditLogsList() {
  const { isLoading, isSuccess, isError, data, error, refetch } = useQuery<AuditLog[], Error>('audit_logs', getAllAuditLogs);
  return (
    <div>
      <h2>Logs</h2>
      {isLoading && <div>Loading...</div>}
      {isError && (
        <div>{`There is a problem fetching the post data - ${error.message}`}</div>
      )}
      <Table striped highlightOnHover>
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>IP address</th>
            <th>User</th>
            <th>Message</th>
          </tr>
        </thead>
        <tbody>
        {data &&
          data.map(audit_log => (
            <tr key={audit_log.id}>
                <Anchor
                  component={Link}
                  to={`/logs/${audit_log.id}`}
                  key={audit_log.id}
                >
                  {audit_log.timestamp}
                </Anchor>
              <td>{audit_log.ipaddress}</td>
              <td>{audit_log.username}</td>
              <td>{audit_log.message}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}