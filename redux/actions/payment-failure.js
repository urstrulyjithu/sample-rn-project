export const SET_PAYMENT_FAILURE = "SET_PAYMENT_FAILURE";
export const REMOVE_PAYMENT_FAILURE = "REMOVE_PAYMENT_FAILURE";

export const savePaymentFailureInfo = info => {
  return {
    type: SET_PAYMENT_FAILURE,
    payload: info,
  };
};

export const removePaymentFailureInfo = () => {
  return {
    type: REMOVE_PAYMENT_FAILURE,
  };
};
