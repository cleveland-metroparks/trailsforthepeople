import { useState, useRef, useCallback, useEffect } from "react";
import { LngLat, LngLatBounds } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import { Source, NavigationControl, Layer } from "react-map-gl/mapbox";
import type { LineLayerSpecification } from "mapbox-gl";
import * as ReactMapGl from "react-map-gl/mapbox"; // For "Map", to avoid collision
import type { MapRef, ViewStateChangeEvent } from "react-map-gl/mapbox";
import type { MapEvent } from "mapbox-gl";
import {
  Text,
  Button,
  Group,
  Box,
  Flex,
  Select,
  Loader,
  Popover,
  Tooltip,
} from "@mantine/core";
import DrawControl from "./draw-control";
import { IconTrash } from "@tabler/icons-react";

import type { Trail } from "../types/trail";
import { travelModeSelectOptions } from "../types/trail";
import { useReservations } from "../hooks/useReservations";
import styles from "./trailMap.module.css";

interface TrailMapProps {
  trail: Trail;
  trailGeom: string;
  mapBounds: LngLatBounds;
  waypointsFeature: Object;
  waypointsForDraw: Object;
  onDrawCreate: (e: { features: object[] }) => void;
  onDrawUpdate: (e: { features: object[]; action: string }) => void;
  onDrawDelete: (e: { features: object[] }) => void;
  doCompleteTrail: () => void;
  doRecalculateRoute: () => void;
  activeTab: string;
  onTravelModeChange: (string) => void;
  onElevationProfileToggle: () => void;
  showElevationProfile: boolean;
  isRouting: boolean;
  onVertexSelect?: (index: number | null) => void;
}

/**
 * Trail Map
 *
 * @param props
 * @returns
 */
export function TrailMap(props: TrailMapProps) {
  // if (props.trailGeom == null) {
  //   props.trailGeom = '{"type":"MultiLineString","coordinates":[]}';
  // }
  const mapRef = useRef<MapRef>(null);

  const [currentTab, setCurrentTab] = useState(props.activeTab);

  // Map resize functionality
  const [mapHeight, setMapHeight] = useState(600);
  const [isDragging, setIsDragging] = useState(false);
  const dragStateRef = useRef({
    startY: 0,
    startHeight: 600,
    isDragging: false,
  });

  const [mapViewState, setMapViewState] = useState({
    longitude: parseFloat(process.env.REACT_APP_MAP_DEFAULT_CENTER_LNG),
    latitude: parseFloat(process.env.REACT_APP_MAP_DEFAULT_CENTER_LAT),
    zoom: parseFloat(process.env.REACT_APP_MAP_DEFAULT_ZOOM),
  });

  // Trigger map resize when height changes
  useEffect(() => {
    if (mapRef.current) {
      // Small delay to ensure DOM has updated
      const timeoutId = setTimeout(() => {
        mapRef.current?.resize();
      }, 10);

      return () => clearTimeout(timeoutId);
    }
  }, [mapHeight]);

  // Drag handlers for map resize
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragStateRef.current.isDragging) return;

    const deltaY = e.clientY - dragStateRef.current.startY;
    const newHeight = Math.max(200, dragStateRef.current.startHeight + deltaY);
    setMapHeight(newHeight);
  }, []);

  const handleMouseUp = useCallback(() => {
    dragStateRef.current.isDragging = false;
    setIsDragging(false);

    // Remove document-level event listeners
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseMove]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      dragStateRef.current.isDragging = true;
      dragStateRef.current.startY = e.clientY;
      dragStateRef.current.startHeight = mapHeight;
      setIsDragging(true);

      // Add document-level event listeners
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [mapHeight, handleMouseMove, handleMouseUp]
  );

  // Get reservations data from shared hook
  const { reservationSelectOptionsWithoutNone, parkFeatureLocations } =
    useReservations();
  // Current value of the zoomTo field
  const [zoomToValue, setZoomToValue] = useState("");

  // Vertex popover state
  const [popoverOpened, setPopoverOpened] = useState(false);
  const [vertexInfo, setVertexInfo] = useState<{
    lngLat: { lng: number; lat: number };
    vertexIndex: number;
    featureId: string;
  } | null>(null);
  const [popoverPosition, setPopoverPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const isHandlingVertexClickRef = useRef(false);

  // Update popover position when map moves/resizes/zooms
  const updatePopoverPosition = useCallback(() => {
    if (mapRef.current && vertexInfo && popoverOpened) {
      const point = mapRef.current.project([
        vertexInfo.lngLat.lng,
        vertexInfo.lngLat.lat,
      ]);
      setPopoverPosition({ x: point.x, y: point.y });
    }
  }, [vertexInfo, popoverOpened]);

  // Update popover position when map height changes (after resize completes)
  useEffect(() => {
    if (mapRef.current && popoverOpened) {
      const timeoutId = setTimeout(() => {
        updatePopoverPosition();
      }, 20); // Slightly longer delay to ensure resize is complete

      return () => clearTimeout(timeoutId);
    }
  }, [mapHeight, popoverOpened, updatePopoverPosition]);

  // Map needs repaint to size correctly when user switches tabs,
  // else the map shows up as 400 x 300
  if (currentTab === "general" && props.activeTab === "route") {
    // Changed to Route tab in parent; trigger map repaint
    if (mapRef.current) {
      // @TODO: This still doesn't work if we start with the "General" tab
      mapRef.current.triggerRepaint();
      // mapRef.current.resize(); // <-- This actually breaks it
    }
    setCurrentTab("route");
  } else if (currentTab === "route" && props.activeTab === "general") {
    setCurrentTab("general");
  }

  // Zoom map to (a park location)
  const zoomMapTo = (coords: LngLat, bounds: LngLatBounds) => {
    if (Object.keys(bounds).length !== 0) {
      mapRef.current.fitBounds(bounds, { padding: 10 });
    } else {
      if (coords.lng && coords.lat) {
        // Or, flyto coords with default zoom
        const DEFAULT_POI_ZOOM = 15;
        mapRef.current.flyTo({
          center: coords,
          zoom: DEFAULT_POI_ZOOM,
        });
      }
    }
  };

  const onMapMove = (event: ViewStateChangeEvent) => {
    setMapViewState(event.viewState);
    updatePopoverPosition();
  };

  const onMapLoad = (event: MapEvent) => {
    // @TODO: Not sure why we were doing the following...
    // React is automatically putting props.trailGeom data into the <Source> data.
    // const trailSource = mapRef.current.getSource('trail-data') as GeoJSONSource;
    // trailSource.setData(props.trailGeom);

    // Fit map bounds to trail bounds
    if (mapRef.current) {
      mapRef.current.fitBounds(props.mapBounds, { padding: 40 });
    }
  };

  // Close popover when map is clicked (but not on a vertex)
  const onMapClick = useCallback(() => {
    // Don't close if we're in the middle of handling a vertex click
    if (isHandlingVertexClickRef.current) {
      return;
    }
    if (popoverOpened) {
      setPopoverOpened(false);
      setVertexInfo(null);
      setPopoverPosition(null);
      // Clear selection
      if (props.onVertexSelect) {
        props.onVertexSelect(null);
      }
    }
  }, [popoverOpened, props]);

  const onMapRender = (event: MapEvent) => {
    updatePopoverPosition();
  };
  const onMapResize = (event: MapEvent) => {
    updatePopoverPosition();
  };

  // Handle vertex click - show popover
  const handleVertexClick = useCallback(
    (e: {
      lngLat: { lng: number; lat: number };
      vertexIndex: number;
      featureId: string;
    }) => {
      // Prevent map click from clearing the popover
      isHandlingVertexClickRef.current = true;

      if (mapRef.current) {
        // Convert lng/lat to pixel coordinates for popover positioning
        const point = mapRef.current.project([e.lngLat.lng, e.lngLat.lat]);
        setPopoverPosition({ x: point.x, y: point.y });
        setVertexInfo(e);
        setPopoverOpened(true);

        // Notify parent of selected vertex
        if (props.onVertexSelect) {
          props.onVertexSelect(e.vertexIndex);
        }

        // Reset the flag after a short delay to allow state updates to complete
        setTimeout(() => {
          isHandlingVertexClickRef.current = false;
        }, 100);
      }
    },
    [mapRef, props]
  );

  // Handle vertex deletion
  const { waypointsFeature, onDrawUpdate } = props;
  const handleDeleteVertex = useCallback(() => {
    if (!vertexInfo || !waypointsFeature) {
      return;
    }

    const feature = waypointsFeature as any;
    if (
      feature.geometry &&
      feature.geometry.type === "LineString" &&
      feature.geometry.coordinates
    ) {
      const coordinates = [...feature.geometry.coordinates];

      // Don't allow deleting if there are 2 vertices or fewer
      if (coordinates.length <= 2) {
        setPopoverOpened(false);
        return;
      }

      // Remove the vertex at the specified index
      coordinates.splice(vertexInfo.vertexIndex, 1);

      // Create updated feature
      const updatedFeature = {
        ...feature,
        geometry: {
          ...feature.geometry,
          coordinates: coordinates,
        },
      };

      // Trigger update with the modified feature (matching the pattern from trailEdit.tsx)
      const featureId = feature.id || "0";
      onDrawUpdate({
        features: { [featureId]: updatedFeature } as any,
        action: "delete_vertex",
      });

      setPopoverOpened(false);
      setVertexInfo(null);
      // Clear selection
      if (props.onVertexSelect) {
        props.onVertexSelect(null);
      }
    }
  }, [vertexInfo, waypointsFeature, onDrawUpdate, props]);

  const trailLayer: LineLayerSpecification = {
    id: "trail-line",
    type: "line",
    source: "geojson",
    layout: {
      "line-join": "round",
      "line-cap": "round",
    },
    paint: {
      "line-color": "#01B3FD",
      "line-width": 6,
      "line-opacity": 0.75,
    },
  };

  return (
    <>
      <Box className={styles.mapContainer}>
        <ReactMapGl.Map
          // "reuseMaps" bypasses initialization when a map is removed and re-added
          // (switching screens, tabs, etc.) in order to avoid MapBox
          // generating a billable event with every map initialization
          // https://visgl.github.io/react-map-gl/docs/get-started/tips-and-tricks#minimize-cost-from-frequent-re-mounting
          //
          // @TODO:
          // However, it also seems to break the re-loading of the DrawControl
          // when the map is removed and re-rendered.
          // Maybe this is relevant:? https://github.com/visgl/react-map-gl/issues/699
          //
          // reuseMaps={true}

          ref={mapRef}
          {...mapViewState}
          style={{ width: "100%", height: mapHeight }}
          mapStyle={process.env.REACT_APP_MAPBOX_STYLE_URL}
          mapboxAccessToken={process.env.REACT_APP_MAPBOX_TOKEN}
          onLoad={onMapLoad}
          onMove={onMapMove}
          onRender={onMapRender}
          onResize={onMapResize}
          onClick={onMapClick}
        >
          <Source
            id="trail-data"
            type="geojson"
            data={
              props.trailGeom
                ? JSON.parse(props.trailGeom)
                : { type: "MultiLineString", coordinates: [] }
            }
          >
            <Layer {...trailLayer} />
          </Source>
          <NavigationControl showCompass={true} visualizePitch={true} />
          <DrawControl
            position="top-left"
            displayControlsDefault={false}
            controls={{
              line_string: true,
              // trash: true
            }}
            initialData={props.waypointsFeature}
            waypointsGeom={props.waypointsForDraw}
            styles={[
              // Mapbox GL Draw styling
              // @see https://github.com/mapbox/mapbox-gl-draw/blob/main/docs/EXAMPLES.md

              // Line, active
              {
                id: "gl-draw-line",
                type: "line",
                filter: [
                  "all",
                  ["==", "$type", "LineString"],
                  ["!=", "mode", "static"],
                ],
                layout: {
                  "line-cap": "round",
                  "line-join": "round",
                },
                paint: {
                  "line-color": "#d20000",
                  "line-dasharray": [1, 2],
                  "line-width": 2,
                },
              },
              // Line, inactive
              {
                id: "gl-draw-line-inactive",
                type: "line",
                filter: [
                  "all",
                  ["==", "active", "false"],
                  ["==", "$type", "LineString"],
                  ["!=", "mode", "static"],
                ],
                layout: {
                  "line-cap": "round",
                  "line-join": "round",
                },
                paint: {
                  "line-color": "#d20000",
                  "line-dasharray": [1, 2],
                  "line-width": 2,
                },
              },
              // Active (selected) points
              {
                id: "gl-draw-point-active",
                type: "circle",
                filter: [
                  "all",
                  ["==", "$type", "Point"],
                  ["==", "active", "true"],
                ],
                paint: {
                  "circle-radius": 12,
                  "circle-color": "#000000",
                },
              },
              // Vertex point halos
              {
                id: "gl-draw-polygon-and-line-vertex-halo-active",
                type: "circle",
                filter: [
                  "all",
                  ["==", "meta", "vertex"],
                  ["==", "$type", "Point"],
                  ["!=", "mode", "static"],
                ],
                paint: {
                  "circle-radius": 8,
                  "circle-color": "#ffffff",
                },
              },
              // Vertex points
              {
                id: "gl-draw-polygon-and-line-vertex-active",
                type: "circle",
                filter: [
                  "all",
                  ["==", "meta", "vertex"],
                  ["==", "$type", "Point"],
                  ["!=", "mode", "static"],
                ],
                paint: {
                  "circle-radius": 6,
                  "circle-color": "#d20000",
                },
              },
              // Midpoint halos
              {
                id: "gl-draw-polygon-midpoint-halo",
                type: "circle",
                filter: [
                  "all",
                  ["==", "$type", "Point"],
                  ["==", "meta", "midpoint"],
                ],
                paint: {
                  "circle-radius": 5,
                  "circle-color": "#ffffff",
                },
              },
              // Midpoints
              {
                id: "gl-draw-polygon-midpoint",
                type: "circle",
                filter: [
                  "all",
                  ["==", "$type", "Point"],
                  ["==", "meta", "midpoint"],
                ],
                paint: {
                  "circle-radius": 4,
                  "circle-color": "#d20000",
                },
              },
            ]}
            onUpdate={props.onDrawUpdate} // draw.update
            onCreate={props.onDrawCreate} // draw.create
            onDelete={props.onDrawDelete} // draw.delete
            onVertexClick={handleVertexClick}
          />
        </ReactMapGl.Map>

        {/* Routing spinner overlay */}
        {props.isRouting && (
          <Box className={styles.routingOverlay}>
            <Loader size="sm" />
          </Box>
        )}

        {/* Vertex deletion popover */}
        {popoverPosition && vertexInfo && (
          <Popover
            opened={popoverOpened}
            onChange={setPopoverOpened}
            position="top"
            withArrow
            shadow="md"
            withinPortal
          >
            <Popover.Target>
              <div
                style={{
                  position: "absolute",
                  left: `${popoverPosition.x}px`,
                  top: `${popoverPosition.y}px`,
                  width: "1px",
                  height: "1px",
                  pointerEvents: "none",
                }}
              />
            </Popover.Target>
            <Popover.Dropdown>
              <Box p={4}>
                <Text
                  size="xs"
                  fw={500}
                  style={{ fontSize: "11px", marginBottom: "4px" }}
                >
                  Waypoint {vertexInfo.vertexIndex + 1}
                </Text>
                <Button
                  size="xs"
                  color="red"
                  onClick={handleDeleteVertex}
                  leftSection={
                    <IconTrash size={14} style={{ marginRight: -3 }} />
                  }
                  style={{
                    fontSize: "11px",
                    padding: "2px 8px",
                    height: "24px",
                  }}
                >
                  Delete
                </Button>
              </Box>
            </Popover.Dropdown>
          </Popover>
        )}
      </Box>

      {/* Resize bar */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          height: "10px",
          backgroundColor: isDragging ? "#339af0" : "#e9ecef",
          cursor: "ns-resize",
          borderTop: "1px solid #dee2e6",
          borderBottom: "1px solid #dee2e6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          transition: isDragging ? "none" : "background-color 0.2s ease",
        }}
        onMouseEnter={(e) => {
          if (!isDragging) {
            e.currentTarget.style.backgroundColor = "#ced4da";
          }
        }}
        onMouseLeave={(e) => {
          if (!isDragging) {
            e.currentTarget.style.backgroundColor = "#e9ecef";
          }
        }}
      >
        {/* Grip indicator */}
        <div
          style={{
            width: "40px",
            height: "4px",
            backgroundColor: isDragging ? "#ffffff" : "#6c757d",
            borderRadius: "2px",
            display: "flex",
            gap: "2px",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: "2px",
              height: "2px",
              backgroundColor: "currentColor",
              borderRadius: "50%",
            }}
          />
          <div
            style={{
              width: "2px",
              height: "2px",
              backgroundColor: "currentColor",
              borderRadius: "50%",
            }}
          />
          <div
            style={{
              width: "2px",
              height: "2px",
              backgroundColor: "currentColor",
              borderRadius: "50%",
            }}
          />
        </div>
      </div>

      {/* Extra controls beneath map */}
      <Group justify="space-between" mt="xs" mb="xs">
        {/* Zoom to reservation */}
        <Flex gap="sm" justify="flex-start" align="flex-end">
          <Select
            label={
              <span
                style={{
                  fontWeight: 500,
                  marginTop: "8px",
                  marginBottom: "8px",
                  display: "block",
                }}
              >
                Zoom to reservation
              </span>
            }
            placeholder="Select a reservation..."
            data={reservationSelectOptionsWithoutNone}
            value={zoomToValue}
            onChange={setZoomToValue}
            searchable
          />
          <Button
            variant="light"
            onClick={() => {
              if (zoomToValue) {
                const parkFeatureLocation =
                  parkFeatureLocations.get(zoomToValue);
                if (parkFeatureLocation) {
                  const coords = parkFeatureLocation.coords;
                  const bounds = parkFeatureLocation.bounds;
                  // Type guard: check if we have valid coords and bounds
                  if (bounds instanceof LngLatBounds) {
                    // If bounds is valid, use it (zoomMapTo will handle empty bounds)
                    zoomMapTo(
                      coords instanceof LngLat ? coords : new LngLat(0, 0),
                      bounds
                    );
                  } else if (coords instanceof LngLat) {
                    // If we have coords but no bounds, use coords with empty bounds
                    zoomMapTo(coords, new LngLatBounds());
                  }
                }
              }
            }}
          >
            Zoom
          </Button>
        </Flex>

        {/* Travel mode ("via") filter */}
        <Box>
          <Select
            label={
              <span
                style={{
                  fontWeight: 500,
                  marginTop: "8px",
                  marginBottom: "8px",
                  display: "block",
                }}
              >
                Travel mode
              </span>
            }
            data={travelModeSelectOptions}
            defaultValue="hike"
            onChange={props.onTravelModeChange}
          />
        </Box>

        {/* Recalculate route */}
        <Box>
          <Text size="sm" fw={500} mt="xs" mb="xs">
            Recalculate route
          </Text>
          <Tooltip label="Recalculate the route over the current waypoints">
            <Button variant="light" onClick={props.doRecalculateRoute}>
              Recalculate
            </Button>
          </Tooltip>
        </Box>

        {/* Back to start */}
        <Box>
          <Text size="sm" fw={500} mt="xs" mb="xs">
            Complete trail
          </Text>
          <Tooltip label="Add the starting point to the end of the waypoints">
            <Button variant="light" onClick={props.doCompleteTrail}>
              Back to start
            </Button>
          </Tooltip>
        </Box>

        {/* Show/hide Elevation Profile */}
        <Box>
          <Text size="sm" fw={500} mt="xs" mb="xs">
            Elevation Profile
          </Text>
          <Button variant="light" onClick={props.onElevationProfileToggle}>
            {props.showElevationProfile ? "▲ Hide" : "▼ Show"}
          </Button>
        </Box>
      </Group>
    </>
  );
}
