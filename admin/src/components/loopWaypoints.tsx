import * as React from 'react';

import { Table } from '@mantine/core';

//
//
function LoopWaypoints(props) {
  // console.log("LoopWaypoints() props:", props);
  const key_id = Object.keys(props.waypoints)[0];
  let coordinates = [];

  if (key_id) {
    if (props.waypoints[key_id].geometry.coordinates) {
      coordinates = props.waypoints[key_id].geometry.coordinates;
    }
  }

  return (
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
  );
}

export default React.memo(LoopWaypoints);
