import { Box } from '@mantine/core';

/**
 * Trail Stats
 */
export function TrailStats(props) {
  return (
    <>
      <Box>
        <span><strong>Distance:</strong></span> <span>{props.stats.distancetext} ({props.stats.distance_feet} ft)</span><br />
        <span><strong>Hiking:</strong></span> <span>{props.stats.durationtext_hike}</span><br />
        <span><strong>Bicycling:</strong></span> <span>{props.stats.durationtext_bike}</span><br />
        <span><strong>Horseback:</strong></span> <span>{props.stats.durationtext_bridle}</span><br />
      </Box>
    </>
  );
}