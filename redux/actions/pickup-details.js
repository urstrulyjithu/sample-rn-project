export const SET_PICKUP_DETAILS = "SET_PICKUP_DETAILS";
export const REMOVE_PICKUP_DETAILS = "REMOVE_PICKUP_DETAILS";

export const savePickupDetails = (pickupDetails) => {
  return {
    type: SET_PICKUP_DETAILS,
    payload: pickupDetails,
  };
};

export const removePickupDetails = () => {
  return {
    type: REMOVE_PICKUP_DETAILS,
  };
};
