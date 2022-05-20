export const DRIVER_CANCEL_RIDE = "DRIVER_CANCEL_RIDE";
export const REMOVE_DRIVER_CANCEL_RIDE = "REMOVE_DRIVER_CANCEL_RIDE";

export const saveDriverCancelRide = (payload) => {
  return {
    type: DRIVER_CANCEL_RIDE,
    payload,
  };
};

export const removeDriverCancelRide = () => {
  return {
    type: REMOVE_DRIVER_CANCEL_RIDE,
    payload: {},
  };
};
