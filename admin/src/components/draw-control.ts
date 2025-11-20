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

  // Function to update the line button state based on whether features exist
  const updateLineButtonState = useCallback((drawInstance: MapboxDraw) => {
    // Use setTimeout to ensure the DOM has been updated
    setTimeout(() => {
      const data = drawInstance.getAll();
      const hasFeatures = data.features.some((feature: any) =>
        feature.geometry.type === 'LineString' &&
        feature.geometry.coordinates &&
        feature.geometry.coordinates.length > 0
      );

      // Find the line_string button (Mapbox Draw uses class name mapbox-gl-draw_line)
      const lineButton = document.querySelector('button.mapbox-gl-draw_line') as HTMLButtonElement;
      if (lineButton) {
        if (hasFeatures) {
          lineButton.disabled = true;
          lineButton.classList.add('mapbox-gl-draw_line-disabled');
          lineButton.style.opacity = '0.3';
          lineButton.style.cursor = 'not-allowed';
        } else {
          lineButton.disabled = false;
          lineButton.classList.remove('mapbox-gl-draw_line-disabled');
          lineButton.style.opacity = '1';
          lineButton.style.cursor = 'pointer';
        }
      }
    }, 0);
  }, []);

  let draw = useControl<MapboxDraw>(

    // useControl onCreate:
    ({ map }: MapContextValue) => {
      return new MapboxDraw(props);
    },

    // useControl onAdd:
    ({ map }: MapContextValue) => {
      // Function to set draw feature (defined here to have access to draw instance)
      const setDrawFeature = (feature: any) => {
        // Delete the initial empty feature that Draw initiates with
        draw.deleteAll();
        // Add our waypoints linestring as a new Draw feature
        const addedFeatureIds = draw.add(feature);
        // Select the feature so vertices are clickable
        if (addedFeatureIds && addedFeatureIds.length > 0) {
          draw.changeMode('simple_select', { featureIds: [addedFeatureIds[0]] });
        }
        // Update button state after setting feature
        updateLineButtonState(draw);
      };

      // Wrap the original handlers to also update button state
      const handleCreate = (e: {features: object[]}) => {
        props.onCreate?.(e);
        updateLineButtonState(draw);
      };

      const handleUpdate = (e: {features: object[]; action: string}) => {
        props.onUpdate?.(e);
        updateLineButtonState(draw);
      };

      const handleDelete = (e: {features: object[]}) => {
        props.onDelete?.(e);
        updateLineButtonState(draw);
      };

      map.on('draw.create', handleCreate);
      map.on('draw.update', handleUpdate);
      map.on('draw.delete', handleDelete);

      map.on('load', function () {
        // Draw initial waypoints
        if (props.initialData?.geometry) {
          setDrawFeature(props.initialData);
        }
        // Update button state after initial load
        updateLineButtonState(draw);
      });

      // Store setDrawFeature for use in useEffect
      (map as any)._setDrawFeature = setDrawFeature;

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
            // Get the current draw mode - only show popover when editing, not during creation
            const currentMode = draw.getMode();

            // Only trigger vertex click when in edit modes, not during drawing
            // draw_line_string = actively drawing a new feature
            // simple_select = selecting/editing an existing feature
            // direct_select = directly selecting vertices of a feature
            if (currentMode === 'draw_line_string') {
              // Don't show popover during creation - let the draw tool handle the click
              return;
            }

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

      // Store handlers for cleanup
      (map as any)._drawControlHandlers = {
        create: handleCreate,
        update: handleUpdate,
        delete: handleDelete
      };
    },

    // useControl onRemove:
    ({ map }: MapContextValue) => {
      const handlers = (map as any)._drawControlHandlers;
      if (handlers) {
        map.off('draw.create', handlers.create);
        map.off('draw.update', handlers.update);
        map.off('draw.delete', handlers.delete);
        delete (map as any)._drawControlHandlers;
      }

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
  const setDrawFeature = useCallback((feature: any) => {
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
    // Update button state after setting feature
    updateLineButtonState(draw);
  }, [draw, updateLineButtonState]);

  //
  useEffect(() => {
    if (props.waypointsGeom?.geometry?.coordinates?.length) {
      setDrawFeature(props.waypointsGeom);
    } else {
      // If no waypoints, update button state to enable it
      updateLineButtonState(draw);
    }
  }, [props.waypointsGeom, setDrawFeature, updateLineButtonState, draw]);

  return null;
}

DrawControl.defaultProps = {
  onCreate: () => {},
  onUpdate: () => {},
  onDelete: () => {},
  onVertexClick: () => {}
};
