import { redirect } from 'react-router-dom';

import { mapsApiClient } from "../components/mapsApi";

const loopsRootPath = '/loops';

export async function action({ params }) {
  const response = await mapsApiClient.delete<any>(process.env.REACT_APP_MAPS_API_BASE_PATH + "/trails/" + params.loopId);
  console.log('Delete Loop response:', response);
  return redirect(loopsRootPath);
}
