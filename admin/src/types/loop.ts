export type Loop = {
  id: number,
  name: string,
  res: string,
  bike: string,
  hike: string,
  bridle: string,
  mountainbike: string,
  description: string,
  distance_feet: number,
  distance_text: string,
  durationtext_hike: string,
  durationtext_bike: string,
  durationtext_bridle: string,
  lat: number,
  lng: number,
  boxw: number,
  boxs: number,
  boxe: number,
  boxn: number,
  waypoints_geojson: string,
  dest_id: number,
  dd_lat: number,
  dd_lng: number
};

export type ElevationProfilePoint = {x: number, y: number};
export type ElevationProfileArray = Array<ElevationProfilePoint>;

export interface LoopProfile {
  id: number;
  elevation_profile: ElevationProfileArray;
};

export type LoopGeometry = {
  id: number,
  geom_geojson: string
};