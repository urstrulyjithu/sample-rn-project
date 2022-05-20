export const SET_DELIVERY_DETAILS = "SET_DELIVERY_DETAILS";
export const REMOVE_DELIVERY_DETAILS = "REMOVE_DELIVERY_DETAILS";

export const saveDeliveryDetails = (deliveryDetails) => {
  return {
    type: SET_DELIVERY_DETAILS,
    payload: deliveryDetails,
  };
};

export const removeDeliveryDetails = () => {
  return {
    type: REMOVE_DELIVERY_DETAILS,
  };
};
