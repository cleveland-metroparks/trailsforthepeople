import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { useControl } from 'react-map-gl/mapbox';
import type { ControlPosition } from 'react-map-gl/mapbox';
import type { MapContextValue } from '@vis.gl/react-mapbox/dist/components/map';
import { useEffect, useCallback, useRef } from 'react';

/**
 * See:
 * https://github.com/visgl/react-map-gl/blob/7.0-release/examples/draw-polygon/src/draw-control.ts
 * ( https://visgl.github.io/react-map-gl/examples/mapbox/draw-polygon )
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
  onVertexClick?: (e: {lngLat: {lng: number; lat: number}; vertexIndex: number; featureId: string}) => void;
};

export default function DrawControl(props: DrawControlProps) {
  const mouseDownRef = useRef<{x: number; y: number; time: number} | null>(null);
  const isDraggingRef = useRef(false);

  let draw = useControl<MapboxDraw>(

    // useControl onCreate:
    ({ map }: MapContextValue) => {
      return new MapboxDraw(props);
    },

    // useControl onAdd:
    ({ map }: MapContextValue) => {
      map.on('draw.create', props.onCreate);
      map.on('draw.update', props.onUpdate);
      map.on('draw.delete', props.onDelete);

      map.on('load', function () {
        // Draw initial waypoints
        if (props.initialData.geometry) {
          setDrawFeature(props.initialData);
        }
      });

      // Track mouse down to distinguish clicks from drags
      const handleMouseDown = (e: any) => {
        mouseDownRef.current = {
          x: e.originalEvent.clientX,
          y: e.originalEvent.clientY,
          time: Date.now()
        };
        isDraggingRef.current = false;
      };

      const handleMouseMove = () => {
        if (mouseDownRef.current) {
          isDraggingRef.current = true;
        }
      };

      const handleMouseUp = (e: any) => {
        if (!mouseDownRef.current || isDraggingRef.current) {
          mouseDownRef.current = null;
          return;
        }

        // Check if this was a click (not a drag) and if a vertex was clicked
        const clickThreshold = 5; // pixels
        const timeThreshold = 300; // milliseconds
        const deltaX = Math.abs(e.originalEvent.clientX - mouseDownRef.current.x);
        const deltaY = Math.abs(e.originalEvent.clientY - mouseDownRef.current.y);
        const deltaTime = Date.now() - mouseDownRef.current.time;

        if (deltaX < clickThreshold && deltaY < clickThreshold && deltaTime < timeThreshold) {
          // This was a click, check if a vertex was clicked
          // Get all features (not just selected ones) to handle cases where feature isn't selected
          const allFeatures = draw.getAll();
          const clickPoint: [number, number] = [e.lngLat.lng, e.lngLat.lat];

          // Find the closest vertex across all LineString features
          let closestFeature = null;
          let closestIndex = -1;
          let minPixelDistance = Infinity;
          // Threshold in screen pixels (more reliable than geographic distance)
          const pixelThreshold = 15;

          allFeatures.features.forEach((feature: any) => {
            if (feature.geometry.type === 'LineString' && feature.geometry.coordinates) {
              const coordinates = feature.geometry.coordinates;

              coordinates.forEach((coord: number[], index: number) => {
                // Convert vertex coordinates to screen pixels
                const vertexCoord: [number, number] = [coord[0], coord[1]];
                const vertexPoint = map.project(vertexCoord);
                const clickPixelPoint = map.project(clickPoint);

                // Calculate pixel distance
                const pixelDistance = Math.sqrt(
                  Math.pow(vertexPoint.x - clickPixelPoint.x, 2) +
                  Math.pow(vertexPoint.y - clickPixelPoint.y, 2)
                );

                if (pixelDistance < minPixelDistance && pixelDistance < pixelThreshold) {
                  minPixelDistance = pixelDistance;
                  closestIndex = index;
                  closestFeature = feature;
                }
              });
            }
          });

          if (closestFeature && closestIndex >= 0 && props.onVertexClick) {
            // Prevent map click from firing
            e.originalEvent?.stopPropagation?.();

            // Select the feature if it's not already selected
            if (!draw.getSelectedIds().includes(closestFeature.id)) {
              draw.changeMode('simple_select', { featureIds: [closestFeature.id] });
            }

            props.onVertexClick({
              lngLat: { lng: clickPoint[0], lat: clickPoint[1] },
              vertexIndex: closestIndex,
              featureId: closestFeature.id as string
            });
          }
        }

        mouseDownRef.current = null;
        isDraggingRef.current = false;
      };

      map.on('mousedown', handleMouseDown);
      map.on('mousemove', handleMouseMove);
      map.on('mouseup', handleMouseUp);

      // Store cleanup handlers
      (map as any)._drawControlCleanup = () => {
        map.off('mousedown', handleMouseDown);
        map.off('mousemove', handleMouseMove);
        map.off('mouseup', handleMouseUp);
      };
    },

    // useControl onRemove:
    ({ map }: MapContextValue) => {
      map.off('draw.create', props.onCreate);
      map.off('draw.update', props.onUpdate);
      map.off('draw.delete', props.onDelete);

      // Clean up vertex click handlers
      if ((map as any)._drawControlCleanup) {
        (map as any)._drawControlCleanup();
        delete (map as any)._drawControlCleanup;
      }
    },

    // useControl opts:
    {
      position: props.position
    }
  );

  // Replace the draw component's feature(s) with a given one
  const setDrawFeature = useCallback((feature) => {
    // @TODO: It might be more efficient to pass a FeatureCollection
    // and call Draw.set(). See:
    // https://github.com/mapbox/mapbox-gl-draw/blob/main/docs/API.md

    // Delete the initial empty feature that Draw initiates with
    draw.deleteAll();
    // Add our waypoints linestring as a new Draw feature
    const addedFeatureIds = draw.add(feature);
    // Select the feature so vertices are clickable
    if (addedFeatureIds && addedFeatureIds.length > 0) {
      draw.changeMode('simple_select', { featureIds: [addedFeatureIds[0]] });
    }
  }, [draw]);

  //
  useEffect(() => {
    if (props.waypointsGeom.geometry.coordinates.length) {
      setDrawFeature(props.waypointsGeom);
    }
  }, [props.waypointsGeom, setDrawFeature]);

  return null;
}

DrawControl.defaultProps = {
  onCreate: () => {},
  onUpdate: () => {},
  onDelete: () => {},
  onVertexClick: () => {}
};
