export const SET_PICKUP_INFO = "SET_PICKUP_INFO";
export const REMOVE_PICKUP_INFO = "REMOVE_PICKUP_INFO";

export const savePickupInfo = (pickupInfo) => {
  return {
    type: SET_PICKUP_INFO,
    payload: pickupInfo,
  };
};

export const removePickupInfo = () => {
  return {
    type: REMOVE_PICKUP_INFO,
  };
};
