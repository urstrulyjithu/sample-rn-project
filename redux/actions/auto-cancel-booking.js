export const SHOW_AUTO_CANCEL_BOOKING = "SHOW_AUTO_CANCEL_BOOKING";
export const REMOVE_AUTO_CANCEL_BOOKING = "REMOVE_AUTO_CANCEL_BOOKING";

export const showAutoCancelBookingAlert = payload => {
  return {
    type: SHOW_AUTO_CANCEL_BOOKING,
    payload,
  };
};

export const removeAutoCancelBookingAlert = () => {
  return {
    type: REMOVE_AUTO_CANCEL_BOOKING,
    payload: {},
  };
};
