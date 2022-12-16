import * as React from 'react';
import { Table, Text, Title, Code, Group } from '@mantine/core';

/**
 * Loop Waypoints
 * @param props 
 * @returns 
 */
export function LoopWaypoints(props) {
  let coordinates = props.feature.geometry.coordinates;

  return (
    <>
      <Table striped highlightOnHover>
        <thead>
          <tr>
            <th>lat</th>
            <th>lng</th>
          </tr>
        </thead>
        <tbody>
          {coordinates &&
            coordinates.map((lat_lng, i) => (
              <tr key={i}>
                <td>{lat_lng[0].toFixed(5)}</td>
                <td>{lat_lng[1].toFixed(5)}</td>
              </tr>
            ))
          }
        </tbody>
      </Table>
      {/* <Group mt="md">
        <Title order={6}>Waypoints GeoJSON</Title>
        <Text size="sm">
          <Code color="blue">{props.geojson}</Code>
        </Text>
      </Group> */}
    </>
  );
}

export default React.memo(LoopWaypoints);
