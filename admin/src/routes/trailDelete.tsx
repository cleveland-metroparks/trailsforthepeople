import { redirect } from 'react-router-dom';

import { mapsApiClient } from "../components/mapsApi";

const trailsRootPath = '/trails';

export async function action({ params }) {
  const response = await mapsApiClient.delete<any>(process.env.REACT_APP_MAPS_API_BASE_PATH + "/trails/" + params.trailId);
  console.log('Delete Trail response:', response);
  return redirect(trailsRootPath);
}
