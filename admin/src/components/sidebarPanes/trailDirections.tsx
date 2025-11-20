import { Table } from '@mantine/core';
import styles from './trailDirections.module.css';

/**
 * Trail Directions
 *
 * @param props
 * @returns
 */
export function TrailDirections(props) {
  return (
    <>
      {props.directions && Array.isArray(props.directions) &&
        <>
          <Table className={styles.table}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Step</Table.Th>
                <Table.Th>Dist</Table.Th>
                <Table.Th>Hike</Table.Th>
                <Table.Th>Bike</Table.Th>
                <Table.Th>Bridle</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {props.directions.map(step => (
                <Table.Tr key={step.step_number}>
                  <Table.Td>{step.step_number}. {step.text}</Table.Td>
                  <Table.Td>{step.distance}</Table.Td>
                  <Table.Td>{step.time_hike}</Table.Td>
                  <Table.Td>{step.time_bike}</Table.Td>
                  <Table.Td>{step.time_bridle}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </>
      }
    </>
  );
}