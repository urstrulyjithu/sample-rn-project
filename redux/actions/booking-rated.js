export const SAVE_BOOKING_RATED = "SAVE_BOOKING_RATED";
export const REMOVE_BOOKING_RATED = "REMOVE_BOOKING_RATED";

export const saveBookingRated = (rated = false) => {
  return {
    type: SAVE_BOOKING_RATED,
    payload: rated,
  };
};

export const removeBookingRated = () => {
  return {
    type: REMOVE_BOOKING_RATED,
    payload: {},
  };
};
