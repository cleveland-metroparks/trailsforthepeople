import { useQuery } from "@tanstack/react-query";
import { LngLat, LngLatBounds } from "mapbox-gl";
import { mapsApiClient } from "../components/mapsApi";

interface ReservationData {
  pagetitle: string;
  longitude?: number;
  latitude?: number;
  boxw?: number;
  boxs?: number;
  boxe?: number;
  boxn?: number;
}

interface ReservationSelectOption {
  value: string;
  label: string;
}

interface ParkFeatureLocation {
  coords: LngLat | {};
  bounds: LngLatBounds | {};
}

export function useReservations() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["reservations"],
    queryFn: async () => {
      const response = await mapsApiClient.get<{ data: ReservationData[] }>(
        process.env.REACT_APP_MAPS_API_BASE_PATH + "/reservations"
      );
      return response.data.data;
    },
  });

  // Process reservations data
  let reservationSelectOptions: ReservationSelectOption[] = [];
  let reservationSelectOptionsWithoutNone: ReservationSelectOption[] = [];
  let reservationFilterSelectOptions: ReservationSelectOption[] = [];
  const parkFeatureLocations = new Map<string, ParkFeatureLocation>();

  if (data) {
    // Get unique reservations by name
    const uniqueReservations = [
      ...new Map(
        data.map((item) => [
          item.pagetitle,
          {
            value: item.pagetitle,
            coords: (() => {
              if (
                item.longitude &&
                item.latitude &&
                item.longitude !== 0 &&
                item.latitude !== 0
              ) {
                return new LngLat(item.longitude, item.latitude);
              }
              return {};
            })(),
            bounds: (() => {
              if (
                item.boxw &&
                item.boxs &&
                item.boxe &&
                item.boxn &&
                item.boxw !== 0 &&
                item.boxs !== 0 &&
                item.boxe !== 0 &&
                item.boxn !== 0
              ) {
                const sw = new LngLat(item.boxw, item.boxs);
                const ne = new LngLat(item.boxe, item.boxn);
                return new LngLatBounds(sw, ne);
              }
              return {};
            })(),
          },
        ])
      ).values(),
    ];

    // Create select options with "(none)" option
    reservationSelectOptions = [
      { value: "", label: "(none)" },
      ...uniqueReservations.map((item) => ({
        value: item.value,
        label: item.value,
      })),
    ];

    // Create select options without "(none)" option
    reservationSelectOptionsWithoutNone = uniqueReservations.map((item) => ({
      value: item.value,
      label: item.value,
    }));

    // Create filter select options with "(all)" option
    reservationFilterSelectOptions = [
      { value: "", label: "(all)" },
      ...uniqueReservations.map((item) => ({
        value: item.value,
        label: item.value,
      })),
    ];

    // Create Map for zoom functionality
    uniqueReservations.forEach((item) => {
      parkFeatureLocations.set(item.value, {
        coords: item.coords,
        bounds: item.bounds,
      });
    });
  }

  return {
    reservationSelectOptions,
    reservationSelectOptionsWithoutNone,
    reservationFilterSelectOptions,
    reservationData: data,
    parkFeatureLocations,
    isLoading,
    isError,
    error,
  };
}
