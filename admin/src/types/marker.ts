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

export type MarkersList = Array<Marker>;

// @TODO: Pull this list from the DB
const markerCategories = [
    '',
    'Events',
    'Trail Closures and Construction',
];

export const defaultMarkerCategory = 'Events';

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