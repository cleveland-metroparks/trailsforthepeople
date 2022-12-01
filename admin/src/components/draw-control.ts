import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { useControl } from 'react-map-gl';
import type { MapRef, ControlPosition } from 'react-map-gl';

/**
 * See:
 * https://github.com/visgl/react-map-gl/blob/7.0-release/examples/draw-polygon/src/draw-control.ts
 * ( https://visgl.github.io/react-map-gl/examples/draw-polygon )
 */

type DrawControlProps = ConstructorParameters<typeof MapboxDraw>[0] & {
  position?: ControlPosition;

  initialData?: any; // The geojson linestring feature to display initially

  // See mapbox-gl-draw API for create/update/delete events
  //   https://github.com/mapbox/mapbox-gl-draw/blob/main/docs/API.md
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

              // Add the geometry to the Drawing
              draw.add(feature);

              var drawFeatures = draw.getAll();

              // Initialize the Draw control with these features
              props.onCreate(drawFeatures);
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
  onCreate: () => {},
  onUpdate: () => {},
  onDelete: () => {}
};
