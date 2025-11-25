import * as React from "react";
import { Table } from "@mantine/core";

interface TrailWaypointsProps {
  feature;
  selectedVertexIndex?: number | null;
  // geojson: string;
}

/**
 * Trail Waypoints
 * @param props
 * @returns
 */
export function TrailWaypoints(props: TrailWaypointsProps) {
  return (
    <>
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>#</Table.Th>
            <Table.Th>lat</Table.Th>
            <Table.Th>lng</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {props.feature &&
            props.feature.geometry &&
            props.feature.geometry.coordinates &&
            props.feature.geometry.coordinates.map((lat_lng, i) => (
              <Table.Tr
                key={i}
                style={{
                  backgroundColor:
                    props.selectedVertexIndex === i ? "#e3f2fd" : undefined,
                }}
              >
                <Table.Td>{i + 1}</Table.Td>
                <Table.Td>{lat_lng[0].toFixed(5)}</Table.Td>
                <Table.Td>{lat_lng[1].toFixed(5)}</Table.Td>
              </Table.Tr>
            ))}
        </Table.Tbody>
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

export default React.memo(TrailWaypoints);
