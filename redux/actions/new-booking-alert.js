export const SHOW_NEW_BOOKING_ALERT = "SHOW_NEW_BOOKING_ALERT";

export const triggerNewBookingAlert = payload => {
  return {
    type: SHOW_NEW_BOOKING_ALERT,
    payload,
  };
};
