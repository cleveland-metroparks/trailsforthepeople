import axios from "axios";
import { useQuery } from "react-query";
import { Table } from '@mantine/core';

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

export default function AuditLogs() {
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
            <th>IP Address</th>
            <th>User</th>
            <th>Message</th>

          </tr>
        </thead>
        <tbody>
        {data &&
          data.map(audit_log => (
            <tr key={audit_log.id}>
              <td>{audit_log.id}</td>
              <td>{audit_log.timestamp}</td>
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