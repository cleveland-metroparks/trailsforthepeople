import axios from 'axios';

axios.defaults.withCredentials = true;

export const mapsApiClient = axios.create({
  baseURL: process.env.REACT_APP_MAPS_API_BASE_URL,
  withCredentials: true,
});

// Add an interceptor to attach the CSRF token to each request
mapsApiClient.interceptors.request.use((config) => {
  // Get the CSRF token from the cookies
  const token = document.cookie.split('; ').find(row => row.startsWith('XSRF-TOKEN='))?.split('=')[1];

  // Add it to the request headers,
  // decoding it first to change "%3D" to "="
  if (token) {
    config.headers['X-XSRF-TOKEN'] = decodeURIComponent(token);
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});