import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Title, Table, Anchor, Button } from '@mantine/core';

import type { Loop } from "../types/loop";

//
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_MAPS_API_BASE_URL,
});

/**
 * Loop List
 */
export function LoopList() {
    // Get all loops from the API
    const getAllLoops = async () => {
      const response = await apiClient.get<any>("/trails");
      return response.data.data;
    }

    const { isLoading, isSuccess, isError, data, error, refetch } = useQuery<Loop[], Error>(['loops'], getAllLoops);

    return (<>
      <Title order={2}>Loops</Title>

      {isLoading && <div>Loading...</div>}
      {isError && (
        <div>{`There is a problem fetching the post data - ${error.message}`}</div>
      )}

      <Button component={Link} to="/loops/new"  variant="outline" sx={{ margin: '1em 0' }}>
        + Add Loop
      </Button>

      <Table striped highlightOnHover>
        <thead>
          <tr>
            <th>Name</th>
            <th>Reservation</th>
            <th>Distance</th>
          </tr>
        </thead>
        <tbody>
        {data &&
          data.map((loop, index) => (
            // @TODO: Keying by loop.id is for some reason causing a duplicate key error:
            (<tr key={index}>
              <td>
                <Anchor
                  component={Link}
                  to={`/loops/${loop.id}`}
                  // key={index}
                >
                  {loop.name}
                </Anchor>
              </td>
              <td>{loop.res}</td>
              <td>{loop.distance_text}</td>
            </tr>)
          ))}
        </tbody>
      </Table>
    </>);
  }