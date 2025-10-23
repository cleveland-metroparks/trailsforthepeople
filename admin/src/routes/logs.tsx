import { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { Table, Anchor, Box, Pagination, Text } from '@mantine/core';
import { default as dayjs } from 'dayjs';

import { mapsApiClient } from "../components/mapsApi";

type AuditLog = {
  id: number,
  timestamp: string,
  ipaddress: string,
  username: string,
  message: string
};

//
export function AuditLogView() {
  //
  const getAuditLog = async (id: string) => {
    const response = await mapsApiClient.get<any>(process.env.REACT_APP_MAPS_API_BASE_PATH + "/audit_logs/" + id);
    return response.data.data;
  }

  let params = useParams();

  let logId = '';
  if (params.logId) {
    if (!isNaN(parseFloat(params.logId))) { // Ensure marker ID is an int
      logId = params.logId.toString();
    } else {
      throw new Error("Invalid Log ID");
    }
  }
  // let logId = params.logId ? params.logId.toString() : '';

  const {
    isLoading: logIsLoading,
    isError: logIsError,
    data: logData,
    error: logError
  } = useQuery<AuditLog, Error>(['audit_log', params.logId], () => getAuditLog(logId));

  return (
    <div>
      <Anchor component={Link} to={`/logs`}>« Logs</Anchor>

      {logIsLoading && <div>Loading...</div>}

      {logIsError && (
        <div>{`There is a problem fetching the post data - ${logError.message}`}</div>
      )}

      {logData &&
        <div>
          <h2>{dayjs(logData.timestamp).format('YYYY-MM-DD HH:mm:ss Z')}</h2>
          <span><strong>ID:</strong></span> <span>{logData.id}</span><br />
          <span><strong>IP Address:</strong></span> <span>{logData.ipaddress}</span><br />
          <span><strong>Username:</strong></span> <span>{logData.username}</span><br />
          <span><strong>Message:</strong></span> <span>{logData.message}</span><br />
        </div>
      }
    </div>
  );
}

//
export function AuditLogsList() {
  //
  const getAuditLogs = async (page: number) => {
    const limit = 20;
    const skip = (page - 1) * limit;
    let requestPath = "/audit_logs?limit=" + limit;
    if (skip > 0) {
      requestPath += "&skip=" + skip;
    }
    const response = await mapsApiClient.get<any>(process.env.REACT_APP_MAPS_API_BASE_PATH + requestPath);
    return response.data.data;
  }

  const [page, setPage] = useState(1);

  const {
    isLoading: logsIsLoading,
    isError: logsIsError,
    data: logsData,
    error: logsError,
  } = useQuery<AuditLog[], Error>(['audit_logs', page], () => getAuditLogs(page), { keepPreviousData : true });

  return (
    <div>
      <h2>Logs</h2>

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
        {
          logsData && logsData.length > 0 ?
            logsData.map(audit_log => (
              <tr key={audit_log.id}>
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
            ))
          :
          <tr>
            <td colSpan={4}>
              <Text weight={500} align="center">
                {logsIsError ?
                  <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>{`There was a problem fetching the logs data - ${logsError.message}`}</div>
                :
                logsIsLoading ? <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>Loading...</div>: <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>No logs found</div>
                }
              </Text>
            </td>
          </tr>
        }
        </tbody>

      </Table>

      <Box sx={{marginTop: '1em' }}>
        <Pagination value={page} onChange={setPage} total={200} />
      </Box>

    </div>
  );
}