export const UPDATE_SELECT_RIDE = "UPDATE_SELECT_RIDE";
export const REMOVE_SELECT_RIDE = "REMOVE_SELECT_RIDE";

export const saveSelectedRide = (ride) => {
  return {
    type: UPDATE_SELECT_RIDE,
    payload: ride,
  };
};

export const removeSelectedRide = () => {
  return {
    type: REMOVE_SELECT_RIDE,
  };
};
