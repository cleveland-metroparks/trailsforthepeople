import axios from "axios";
import { useQuery } from "react-query";
import { Link, Outlet, useParams } from "react-router-dom";
import { Table, Anchor } from '@mantine/core';
import { default as dayjs } from 'dayjs';

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
            <h2>{dayjs(data.timestamp).format('YYYY-MM-DD HH:mm:ss Z')}</h2>
            <span><strong>ID:</strong></span> <span>{data.id}</span><br />
            <span><strong>IP Address:</strong></span> <span>{data.ipaddress}</span><br />
            <span><strong>Username:</strong></span> <span>{data.username}</span><br />
            <span><strong>Message:</strong></span> <span>{data.message}</span><br />
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
            <th>ID</th>
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
              <td>{audit_log.id}</td>
              <td>
                <Anchor
                  component={Link}
                  to={`/logs/${audit_log.id}`}
                  key={audit_log.id}
                >
                  {dayjs(audit_log.timestamp).format('YYYY-MM-DD HH:mm:ss Z')}
                </Anchor>
              </td>
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