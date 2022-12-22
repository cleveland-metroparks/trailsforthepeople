import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { useControl } from 'react-map-gl';
import type { MapRef, ControlPosition } from 'react-map-gl';
import { useEffect } from 'react';

/**
 * See:
 * https://github.com/visgl/react-map-gl/blob/7.0-release/examples/draw-polygon/src/draw-control.ts
 * ( https://visgl.github.io/react-map-gl/examples/draw-polygon )
 */

type DrawControlProps = ConstructorParameters<typeof MapboxDraw>[0] & {
  position?: ControlPosition;

  initialData?: any; // The GeoJSON linestring feature to display initially
  waypointsGeom?: any; // Updated waypoints data

  // See mapbox-gl-draw API for create/update/delete events
  //   https://github.com/mapbox/mapbox-gl-draw/blob/main/docs/API.md
  onCreate?: (e: {features: object[]}) => void;
  onUpdate?: (e: {features: object[]; action: string}) => void;
  onDelete?: (e: {features: object[]}) => void;
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
        if (props.initialData.geometry) {
          setDrawFeature(props.initialData);
        }
      })
    },
    {
      position: props.position
    }
  );

  // Replace the draw component's feature(s) with a given one
  const setDrawFeature = (feature) => {
    // @TODO: It might be more efficient to pass a FeatureCollection
    // and call Draw.set(). See:
    // https://github.com/mapbox/mapbox-gl-draw/blob/main/docs/API.md

    // Delete the initial empty feature that Draw initiates with
    draw.deleteAll();
    // Add our waypoints linestring as a new Draw feature
    draw.add(feature);
  }

  //
  useEffect(() => {
    if (props.waypointsGeom.geometry.coordinates.length) {
      setDrawFeature(props.waypointsGeom);
    }
  }, [props.waypointsGeom]);

  return null;
}

DrawControl.defaultProps = {
  onCreate: () => {},
  onUpdate: () => {},
  onDelete: () => {}
};
