import { Box } from '@mantine/core';

// type LoopStatsStruct = {
//   distance_text : string,
//   distance_feet : string,
//   durationtext_hike : string,
//   durationtext_bike : string,
//   durationtext_bridle : string
// };

//
export function LoopStats(props) {
  return (
    <>
      <Box>
        <span><strong>Distance:</strong></span> <span>{props.stats.distance_text} ({props.stats.distance_feet} ft)</span><br />
        <span><strong>Hiking:</strong></span> <span>{props.stats.durationtext_hike}</span><br />
        <span><strong>Bicycling:</strong></span> <span>{props.stats.durationtext_bike}</span><br />
        <span><strong>Horseback:</strong></span> <span>{props.stats.durationtext_bridle}</span><br />
      </Box>
    </>
  );
}