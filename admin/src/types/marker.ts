export type Marker = {
  id: number,
  lat: number,
  lng: number,
  content: string,
  title: string,
  expires: string,
  geom_geojson: string,
  category: string,
  reservation: string,
  enabled: number,
  annual: number,
  startdate: string,
  date_created: string,
  date_modified: string,
  creator_username: string,
  modifier_username: string,
};

const defaultLat = parseFloat(process.env.REACT_APP_MAP_DEFAULT_CENTER_LAT),
      defaultLng = parseFloat(process.env.REACT_APP_MAP_DEFAULT_CENTER_LNG),
      defaultMarkerCategory = 'Events';

export const emptyMarker: Marker = {
  id: null,
  lat: defaultLat,
  lng: defaultLng,
  content: '',
  title: '',
  expires: '',
  geom_geojson: '',
  category: defaultMarkerCategory,
  reservation: '',
  enabled: null,
  annual: null,
  startdate: '',
  date_created: '',
  date_modified: '',
  creator_username: '',
  modifier_username: '',
};

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
  longitude: number,
  date_created: string,
  creator_username?: string,
  modifier_username?: string,
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
  longitude: defaultLng,
  date_created: '',
  creator_username: '',
  modifier_username: '',
};