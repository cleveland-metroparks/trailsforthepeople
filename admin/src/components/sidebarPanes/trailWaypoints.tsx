import * as React from "react";
import { Table, Tooltip, ActionIcon } from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";

interface TrailWaypointsProps {
  feature;
  selectedVertexIndex?: number | null;
  onVertexHover?: (index: number | null) => void;
  onVertexClick?: (index: number) => void;
  onVertexDelete?: (index: number) => void;
  // geojson: string;
}

/**
 * Trail Waypoints
 * @param props
 * @returns
 */
export function TrailWaypoints(props: TrailWaypointsProps) {
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
  const [hoveredIconIndex, setHoveredIconIndex] = React.useState<number | null>(
    null
  );

  // Check if there are 2 or fewer points (disable delete if so)
  const canDelete = React.useMemo(() => {
    if (!props.feature?.geometry?.coordinates) {
      return false;
    }
    return props.feature.geometry.coordinates.length > 2;
  }, [props.feature]);

  return (
    <>
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>#</Table.Th>
            <Table.Th>lat</Table.Th>
            <Table.Th>lng</Table.Th>
            <Table.Th></Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {props.feature &&
            props.feature.geometry &&
            props.feature.geometry.coordinates &&
            props.feature.geometry.coordinates.map((lat_lng, i) => {
              const isSelected = props.selectedVertexIndex === i;
              const isHovered = hoveredIndex === i;
              const isIconHovered = hoveredIconIndex === i;

              let backgroundColor: string | undefined;
              if (isSelected) {
                backgroundColor = "#e3f2fd"; // Selected: darker blue
              } else if (isHovered) {
                backgroundColor = "#f0f7ff"; // Hovered: lighter blue
              }

              // Determine icon color based on priority:
              let iconColor: string;
              let actionIconColor: string | undefined;
              if (isIconHovered) {
                iconColor = "#fa5252"; // Red
                actionIconColor = "red";
              } else if (isSelected || isHovered) {
                iconColor = "#000000"; // Black
                actionIconColor = "dark";
              } else {
                iconColor = "#868e96"; // Gray lighter than text
                actionIconColor = "gray";
              }

              return (
                <Table.Tr
                  key={i}
                  style={{
                    backgroundColor,
                    cursor: "pointer",
                  }}
                  onMouseEnter={() => {
                    setHoveredIndex(i);
                    if (props.onVertexHover) {
                      props.onVertexHover(i);
                    }
                  }}
                  onMouseLeave={() => {
                    setHoveredIndex(null);
                    if (props.onVertexHover) {
                      props.onVertexHover(null);
                    }
                  }}
                  onClick={() => {
                    if (props.onVertexClick) {
                      props.onVertexClick(i);
                    }
                  }}
                >
                  <Table.Td>{i + 1}</Table.Td>
                  <Table.Td>{lat_lng[0].toFixed(5)}</Table.Td>
                  <Table.Td>{lat_lng[1].toFixed(5)}</Table.Td>
                  <Table.Td>
                    <Tooltip
                      label={
                        canDelete
                          ? "Delete Waypoint"
                          : "Cannot delete: need at least 2 waypoints"
                      }
                    >
                      <ActionIcon
                        variant="subtle"
                        color={actionIconColor}
                        disabled={!canDelete}
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent row click
                          if (props.onVertexDelete && canDelete) {
                            props.onVertexDelete(i);
                          }
                        }}
                        onMouseEnter={() => {
                          setHoveredIconIndex(i);
                        }}
                        onMouseLeave={() => {
                          setHoveredIconIndex(null);
                        }}
                        style={{
                          color: iconColor,
                        }}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Tooltip>
                  </Table.Td>
                </Table.Tr>
              );
            })}
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
