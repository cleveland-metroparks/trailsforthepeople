import axios from 'axios';

axios.defaults.withCredentials = true;

export const mapsApiClient = axios.create({
  baseURL: process.env.REACT_APP_MAPS_API_BASE_URL,
});