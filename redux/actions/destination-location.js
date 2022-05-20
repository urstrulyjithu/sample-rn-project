export const UPDATE_DESTINATION_LOCATION = "UPDATE_DESTINATION_LOCATION";
export const REMOVE_DESTINATION_LOCATION = "REMOVE_DESTINATION_LOCATION";

export const saveDestinationLocation = (location) => {
  return {
    type: UPDATE_DESTINATION_LOCATION,
    payload: location,
  };
};

export const removeDestinationLocation = () => {
  return {
    type: REMOVE_DESTINATION_LOCATION,
  };
};
