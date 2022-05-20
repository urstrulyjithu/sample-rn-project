export const DRIVER_LOCATION = "DRIVER_LOCATION";
export const REMOVE_DRIVER_LOCATION = "REMOVE_DRIVER_LOCATION";

export const saveDriverLocation = (payload) => {
  return {
    type: DRIVER_LOCATION,
    payload,
  };
};

export const removeDriverLocation = () => {
  return {
    type: REMOVE_DRIVER_LOCATION,
    payload: {},
  };
};
