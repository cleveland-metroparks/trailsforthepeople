import { LineString, GeoJsonProperties, GeoJsonObject} from 'geojson';

export type Trail = {
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
  status: number,
  date_created: string,
  date_modified: string,
  creator_username: string,
  modifier_username: string,
};

export const emptyTrail: Trail = {
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
  status: 1,
  date_created: '',
  date_modified: '',
  creator_username: '',
  modifier_username: '',
};

export type ElevationProfilePoint = {x: number, y: number};
export type ElevationProfileArray = Array<ElevationProfilePoint>;

export interface TrailProfile {
  id: number;
  elevation_profile: ElevationProfileArray;
};

export type TrailGeometry = {
  id: number,
  geom_geojson: string,
};

export interface LineStringFeature<LineString, GeoJsonProperties> extends GeoJsonObject {
  type: "Feature";
  geometry: LineString;
  id?: string | number | undefined;
  properties: GeoJsonProperties;
}

export type TrailFormData = {
  name: string,
  description: string,
  res: string,
  hike: boolean,
  bike: boolean,
  mountainbike: boolean,
  bridle: boolean,
  directions: string,
  status: boolean,
  date_created: string,
  creator_username?: string,
  modifier_username?: string,
};

export const defaultTrailFormData: TrailFormData = {
  name: '',
  description: '',
  res: '',
  hike: false,
  bike: false,
  mountainbike: false,
  bridle: false,
  directions: '',
  status: true,
  date_created: '',
  creator_username: '',
  modifier_username: '',
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