import apiClient from "../../api/mapsAPIClient";
import * as endPoints from "../../constants/maps-end-points";
import {GOOGLE_API_KEY} from "../../constants/keys";

export const SET_DRIVER_TO_DELIVERY_WAY_POINTS =
  "SET_DRIVER_TO_DELIVERY_WAY_POINTS";
export const REMOVE_DRIVER_TO_DELIVERY_WAY_POINTS =
  "REMOVE_DRIVER_TO_DELIVERY_WAY_POINTS";

export const getDirectionsFromDriverToDelivery = (
  sourceLat,
  sourceLong,
  destinationLat,
  destinationLong,
) => {
  return async dispatch => {
    try {
      const response = await apiClient.get(endPoints.GET_DIRECTIONS, {
        params: {
          origin: `${sourceLat},${sourceLong}`,
          destination: `${destinationLat},${destinationLong}`,
          key: GOOGLE_API_KEY,
        },
      });
      let wayPoints = [];
      if (response.data.status === "OK") {
        const routes = response.data.routes ?? [];
        if (routes.length > 0) {
          const polylinePoints = routes[0].overview_polyline.points;
          wayPoints = decode(polylinePoints);
        }
      }
      dispatch({
        type: SET_DRIVER_TO_DELIVERY_WAY_POINTS,
        payload: wayPoints,
      });
    } catch (error) {
      throw new Error("Something went wrong");
    }
  };
};

export const removeDirectionsFromDriverToDelivery = () => {
  return {
    type: REMOVE_DRIVER_TO_DELIVERY_WAY_POINTS,
  };
};

const decode = (t, e) => {
  for (
    var n,
      o,
      u = 0,
      l = 0,
      r = 0,
      d = [],
      h = 0,
      i = 0,
      a = null,
      c = Math.pow(10, e || 5);
    u < t.length;

  ) {
    (a = null), (h = 0), (i = 0);
    do (a = t.charCodeAt(u++) - 63), (i |= (31 & a) << h), (h += 5);
    while (a >= 32);
    (n = 1 & i ? ~(i >> 1) : i >> 1), (h = i = 0);
    do (a = t.charCodeAt(u++) - 63), (i |= (31 & a) << h), (h += 5);
    while (a >= 32);
    (o = 1 & i ? ~(i >> 1) : i >> 1),
      (l += n),
      (r += o),
      d.push([l / c, r / c]);
  }
  return (d = d.map(function (t) {
    return {latitude: t[0], longitude: t[1]};
  }));
};
