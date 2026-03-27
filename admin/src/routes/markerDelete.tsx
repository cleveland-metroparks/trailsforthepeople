import { redirect } from "react-router";

import { mapsApiClient } from "../components/mapsApi";

const markersRootPath = "/markers";

export async function action({ params }) {
  await mapsApiClient.delete<any>(
    import.meta.env.VITE_MAPS_API_BASE_PATH + "/markers/" + params.markerId
  );
  return redirect(markersRootPath);
}
