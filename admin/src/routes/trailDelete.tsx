import { redirect } from "react-router";

import { mapsApiClient } from "../components/mapsApi";

const trailsRootPath = "/trails";

export async function action({ params }) {
  await mapsApiClient.delete<any>(
    import.meta.env.VITE_MAPS_API_BASE_PATH + "/trails/" + params.trailId
  );
  return redirect(trailsRootPath);
}
