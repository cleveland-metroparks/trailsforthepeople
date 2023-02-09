export type Marker = {
  id: number,
  creator: string,
  created: string,
  lat: number,
  lng: number,
  content: string,
  title: string,
  expires: string,
  creatorid: number,
  geom_geojson: string,
  category: string,
  reservation: string,
  enabled: number,
  annual: number,
  startdate: string,
  modified: string
};

const defaultLat = 41.32653793921162,
      defaultLng = -81.6629620125847,
      defaultMarkerCategory = 'Events';

export const emptyMarker: Marker = {
  id: null,
  creator: '',
  created: '',
  lat: defaultLat,
  lng: defaultLng,
  content: '',
  title: '',
  expires: '',
  creatorid: null,
  geom_geojson: '',
  category: defaultMarkerCategory,
  reservation: '',
  enabled: null,
  annual: null,
  startdate: '',
  modified: '',
};

export type MarkersList = Array<Marker>;

// @TODO: Pull this list from the DB
const markerCategories = [
  '',
  'Events',
  'Trail Closures and Construction',
];

export const markerCategorySelectOptions = markerCategories.map(cat => ({
  value: cat,
  label: (cat !== '' && cat != null) ? cat : '(none)',
}));

export type MarkerFormData = {
  title: string,
  content: string,
  category: string,
  reservation: string,
  enabled: boolean,
  annual: boolean,
  startDate,
  expireDate,
  latitude: number,
  longitude: number
};

export const defaultMarkerFormData: MarkerFormData = {
  title: '',
  content: '',
  category: defaultMarkerCategory,
  reservation: '',
  enabled: false,
  annual: false,
  startDate: null,
  expireDate: null,
  latitude: defaultLat,
  longitude: defaultLng
};