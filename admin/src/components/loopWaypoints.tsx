import * as React from 'react';

import { Table, Text, Title, Code } from '@mantine/core';

import { LngLat } from 'mapbox-gl';

import { lineString } from '@turf/helpers';

//
//
function LoopWaypoints(props) {
  let coordinates = [];
  let coordsString = '';

  // Mapbox GL Draw returns an object with a randomly-named member inside
  // that stores the feature. Get that member name.
  const key_id = Object.keys(props.waypoints)[0];
  if (key_id) {
    if (props.waypoints[key_id].geometry.coordinates) {
      coordinates = props.waypoints[key_id].geometry.coordinates;

      // Turn into GeoJSON string for DB storage
      const coordsLinestring = lineString(coordinates); // turf
      coordsString = JSON.stringify(coordsLinestring);
    }
  }

  return (
    <>
      <Title order={4} sx={{marginTop: '1em'}}>Waypoints</Title>
      <Table striped highlightOnHover sx={{marginTop: '1em'}}>
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
      <Text size="sm" sx={{marginTop: '1em'}}>
        <Code color="blue">{coordsString}</Code>
      </Text>
    </>
  );
}

export default React.memo(LoopWaypoints);
