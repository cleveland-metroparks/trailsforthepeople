import { redirect } from 'react-router-dom';

import { mapsApiClient } from "../components/mapsApi";

const trailsRootPath = '/trails';

export async function action({ params }) {
  await mapsApiClient.delete<any>(process.env.REACT_APP_MAPS_API_BASE_PATH + "/trails/" + params.trailId);
  return redirect(trailsRootPath);
}
