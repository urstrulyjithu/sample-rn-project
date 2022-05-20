export const GET_BOOKING_ID = "GET_BOOKING_ID";
export const REMOVE_BOOKING_ID = "REMOVE_BOOKING_ID";

export const saveBookingId = (
  id = "",
  fareBreakUpId = "",
  preBookingId = "",
) => {
  return {
    type: GET_BOOKING_ID,
    payload: {
      id,
      fareBreakUpId,
      preBookingId,
    },
  };
};

export const removeBookingId = () => {
  return {
    type: GET_BOOKING_ID,
    payload: {},
  };
};
