import { redirect } from 'react-router';

import { mapsApiClient } from "../components/mapsApi";

const hintMapsRootPath = '/hint_maps';

export async function action({ params }) {
  await mapsApiClient.delete<any>(process.env.REACT_APP_MAPS_API_BASE_PATH + "/hint_maps/" + params.hintMapId);
  return redirect(hintMapsRootPath);
}
