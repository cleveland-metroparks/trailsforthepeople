import { redirect } from 'react-router-dom';

import { mapsApiClient } from "../components/mapsApi";

const hintMapsRootPath = '/hint_maps';

export async function action({ params }) {
  const response = await mapsApiClient.delete<any>(process.env.REACT_APP_MAPS_API_BASE_PATH + "/hint_maps/" + params.hintMapId);
  console.log('Delete Hint Map response:', response);
  return redirect(hintMapsRootPath);
}
