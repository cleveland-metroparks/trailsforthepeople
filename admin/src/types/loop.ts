import { LineString, GeoJsonProperties, GeoJsonObject} from 'geojson';

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
  distancetext: string,
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
  dd_lng: number,
  directions: string,
  modified: string,
};

export const emptyLoop: Loop = {
  id: null,
  name: '',
  res: '',
  bike: '',
  hike: '',
  bridle: '',
  mountainbike: '',
  description: '',
  distance_feet: null,
  distancetext: '',
  durationtext_hike: '',
  durationtext_bike: '',
  durationtext_bridle: '',
  lat: null,
  lng: null,
  boxw: null,
  boxs: null,
  boxe: null,
  boxn: null,
  waypoints_geojson: '',
  dest_id: null,
  dd_lat: null,
  dd_lng: null,
  directions: '',
  modified: '',
};

export type ElevationProfilePoint = {x: number, y: number};
export type ElevationProfileArray = Array<ElevationProfilePoint>;

export interface LoopProfile {
  id: number;
  elevation_profile: ElevationProfileArray;
};

export type LoopGeometry = {
  id: number,
  geom_geojson: string,
};

export interface LineStringFeature<LineString, GeoJsonProperties> extends GeoJsonObject {
  type: "Feature";
  geometry: LineString;
  id?: string | number | undefined;
  properties: GeoJsonProperties;
}

export type LoopFormData = {
  name: string,
  description: string,
  res: string,
  hike: boolean,
  bike: boolean,
  mountainbike: boolean,
  bridle: boolean,
  directions: string,
};

export const defaultLoopFormData: LoopFormData = {
  name: '',
  description: '',
  res: '',
  hike: false,
  bike: false,
  mountainbike: false,
  bridle: false,
  directions: '',
};

export const travelModeSelectOptions = [
  {
    value: 'hike',
    label: 'Hiking',
  },
  {
    value: 'bike',
    label: 'Biking',
  },
  {
    value: 'mountainbike',
    label: 'Mountain Biking',
  },
  {
    value: 'bridle',
    label: 'Horseback/Equestrian',
  },
  {
    value: 'buckeyetrail',
    label: 'Buckeye Trail only',
  },
];