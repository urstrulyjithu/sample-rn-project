import GeoCodedAddress from "../../models/geoCodedAddress";

import apiClient from "../../api/mapsAPIClient";
import * as endPoints from "../../constants/maps-end-points";
import {GOOGLE_API_KEY} from "../../constants/keys";

export const UPDATE_DESTINATION_GEO_CODED_ADDRESS =
  "UPDATE_DESTINATION_GEO_CODED_ADDRESS";
export const REMOVE_DESTINATION_GEO_CODED_ADDRESS =
  "REMOVE_DESTINATION_GEO_CODED_ADDRESS";

export const getDestinationGeoCodedAddress = (latitude, longitude) => {
  return async (dispatch) => {
    try {
      const response = await apiClient.get(endPoints.REVERSE_GEO_CODING, {
        params: {
          latlng: `${latitude},${longitude}`,
          key: GOOGLE_API_KEY,
        },
      });
      if (response.data.status === "OK") {
        const results = response.data.results ?? [];
        if (results.length > 0) {
          const result = results[0];
          const address = new GeoCodedAddress(
            result.place_id,
            result.formatted_address,
            latitude,
            longitude,
          );
          dispatch({
            type: UPDATE_DESTINATION_GEO_CODED_ADDRESS,
            payload: address,
          });
        }
      }
    } catch (error) {
      throw new Error("Something went wrong");
    }
  };
};

export const saveDestinationGeoCodedAddress = (address) => {
  return {
    type: UPDATE_DESTINATION_GEO_CODED_ADDRESS,
    payload: address,
  };
};

export const removeDestinationGeoCodedAddress = () => {
  return {
    type: REMOVE_DESTINATION_GEO_CODED_ADDRESS,
  };
};
