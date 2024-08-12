export type HintMap = {
  id: number,
  title: string,
  image_filename_local: string,
  last_edited: string,
  last_refreshed: string,
  url_external: string,
  latitude: number,
  longitude: number,
  zoom: number,
};

export const emptyHintMap: HintMap = {
  id: null,
  title: '',
  image_filename_local: '',
  last_edited: '',
  last_refreshed: '',
  url_external: '',
  latitude: parseFloat(process.env.REACT_APP_MAP_DEFAULT_CENTER_LAT),
  longitude: parseFloat(process.env.REACT_APP_MAP_DEFAULT_CENTER_LNG),
  zoom: parseFloat(process.env.REACT_APP_MAP_DEFAULT_ZOOM),
};

export type HintMapFormData = {
  title: string,
  filenameLocal: string,
  urlExternal: string,
  latitude: number,
  longitude: number,
  zoom: number,
};

export const defaultHintMapFormData: HintMapFormData = {
  title: '',
  filenameLocal: '',
  urlExternal: '',
  latitude: parseFloat(process.env.REACT_APP_MAP_DEFAULT_CENTER_LAT),
  longitude: parseFloat(process.env.REACT_APP_MAP_DEFAULT_CENTER_LNG),
  zoom: parseFloat(process.env.REACT_APP_MAP_DEFAULT_ZOOM),
};

/**
 * Build the link to the hint map image on the maps API server.
 *
 * ex:
 *   https://maps-api.clevelandmetroparks.com/images/hint-maps/hint-22.png
 *
 * @param filename
 *   The filename of the hint map image
 * @returns
 *   URL to the hint map image
 */
export const formatMapsHintMapLink = (filename: string) =>
  process.env.REACT_APP_MAPS_API_BASE_URL + process.env.REACT_APP_HINTMAPS_BASEPATH + filename;

/**
 * Build the link to the hint map image
 * WHERE IT WAS PREVIOUSLY STORED
 * stored on the maps server.
 *
 * ex:
 *   https://maps.clevelandmetroparks.com/static/images/hint_maps/hint-22.png
 *
 * @param filename
 *   The filename of the hint map image
 * @returns
 *   URL to the hint map image
 */
export const formatMapsHintMapLinkOld = (filename: string) =>
  process.env.REACT_APP_HINTMAPS_BASEURL_OLD + process.env.REACT_APP_HINTMAPS_BASEPATH_OLD + filename;