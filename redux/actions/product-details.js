export const SET_PRODUCT_DETAILS = "SET_PRODUCT_DETAILS";
export const REMOVE_PRODUCT_DETAILS = "REMOVE_PRODUCT_DETAILS";
export const SET_FARE_NEGOTIATE = "SET_FARE_NEGOTIATE";
export const RESET_PICKUP_DROP_TIME = "RESET_PICKUP_DROP_TIME";

export const saveProductDetails = productDetails => {
  return {
    type: SET_PRODUCT_DETAILS,
    payload: productDetails,
  };
};

export const removeProductDetails = () => {
  return {
    type: REMOVE_PRODUCT_DETAILS,
  };
};

export const saveFareNegotiate = fareNegotiate => {
  return {
    type: SET_FARE_NEGOTIATE,
    payload: fareNegotiate,
  };
};

export const resetPickupDropTime = () => {
  return {
    type: RESET_PICKUP_DROP_TIME,
  };
};
