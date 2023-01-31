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
    enabled: number,
    annual: number,
    startdate: string,
    modified: string
};

const markerCategories = [
    'Trails',
    'Trail Closures and Construction',
];

export const defaultMarkerCategory = 'Trails';

export const markerCategorySelectOptions = markerCategories.map(cat => ({
    value: cat,
    label: cat,
}));

export type MarkerFormData = {
    title: string,
    content: string,
    category: string,
    enabled: boolean,
    annual: boolean,
    startDate,
    expireDate,
    latitude: number,
    longitude: number
};