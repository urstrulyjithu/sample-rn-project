export const BOOKING_ACCEPT = "BOOKING_ACCEPT";
export const REMOVE_BOOKING_ACCEPT = "REMOVE_BOOKING_ACCEPT";

export const saveBookingAcceptNotification = payload => {
  return {
    type: BOOKING_ACCEPT,
    payload,
  };
};

export const removeBookingAcceptNotification = () => {
  return {
    type: REMOVE_BOOKING_ACCEPT,
    payload: {},
  };
};
