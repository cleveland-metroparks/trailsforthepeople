import { Table } from '@mantine/core';

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
          <Table sx={{
            'thead tr th, tbody tr td': {
              fontSize: '.8em',
              padding: 0
            }
          }}>
            <thead>
              <tr>
                <th>Step</th>
                <th>Dist</th>
                <th>Hike</th>
                <th>Bike</th>
                <th>Bridle</th>
              </tr>
            </thead>
            <tbody>
              {props.directions.map(step => (
                <tr key={step.step_number}>
                  <td>{step.step_number}. {step.text}</td>
                  <td>{step.distance}</td>
                  <td>{step.time_hike}</td>
                  <td>{step.time_bike}</td>
                  <td>{step.time_bridle}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </>
      }
    </>
  );
}