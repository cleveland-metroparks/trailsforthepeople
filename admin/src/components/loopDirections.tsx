import { Table, Text } from '@mantine/core';

export function LoopDirections(props) {
  return (
    <>
      {props.directions && Array.isArray(props.directions) &&
        <>
          <h3>Directions</h3>
          <Table sx={{
            "tbody tr th, tbody tr td": {
              fontSize: '.8em'
            }
          }}>
            <thead>
              <tr>
                <th><Text>Step</Text></th>
                <th><Text>Dist</Text></th>
                <th><Text>Hike</Text></th>
                <th><Text>Bike</Text></th>
                <th><Text>Bridle</Text></th>
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