import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { useControl } from 'react-map-gl';

import type { MapRef, ControlPosition } from 'react-map-gl';

type DrawControlProps = ConstructorParameters<typeof MapboxDraw>[0] & {
  position?: ControlPosition;

  initialData?: any; // The geojson linestring feature to display initially

  onInitial?: (evt: {features: object[]}) => void;

  onCreate?: (evt: {features: object[]}) => void;
  onUpdate?: (evt: {features: object[]; action: string}) => void;
  onDelete?: (evt: {features: object[]}) => void;
};

export default function DrawControl(props: DrawControlProps) {
  let draw = useControl<MapboxDraw>(
    () => new MapboxDraw(props),

    ({ map }: { map: MapRef }) => {

      map.on('draw.create', props.onCreate);
      map.on('draw.update', props.onUpdate);
      map.on('draw.delete', props.onDelete);

      map.on('load', function () {
        // Draw initial waypoints
        if (props.initialData.waypoints) {
          // console.log("props.initialData.waypoints", props.initialData.waypoints);
          const key_id = Object.keys(props.initialData.waypoints)[0]; // Should be "dummyKey"
          if (key_id) { // Get sole object member
            if (props.initialData.waypoints[key_id].geometry) {
              var feature = props.initialData.waypoints[key_id].geometry;
              // console.log("initial feature", feature);

              // Delete the initial empty feature that Draw initiates with
              // console.log('draw.getAll() pre-delete', draw.getAll());
              draw.deleteAll();
              // console.log('draw.getAll() post-delete', draw.getAll());

              // Add our waypoints linestring as a new Draw feature

              // Get our new Draw feature ID
              var featureId = draw.add(feature);
              // console.log('featureId', featureId);

              var drawFeatures = draw.getAll();
              // console.log('drawFeatures', drawFeatures.features);

              // Initialize the Draw control with these features
              props.onInitial(drawFeatures);
            }
          }
        }
      })
    },

    {
      position: props.position
    }
  );

  return null;
}

DrawControl.defaultProps = {
  onInitial: () => {},
  onCreate: () => {},
  onUpdate: () => {},
  onDelete: () => {}
};
