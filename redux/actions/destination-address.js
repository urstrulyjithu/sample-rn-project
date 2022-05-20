export const UPDATE_DESTINATION_ADDRESS = "UPDATE_DESTINATION_ADDRESS";
export const REMOVE_DESTINATION_ADDRESS = "REMOVE_DESTINATION_ADDRESS";

export const saveDestinationAddress = (address) => {
  return {
    type: UPDATE_DESTINATION_ADDRESS,
    payload: address,
  };
};

export const removeDestinationAddress = () => {
  return {
    type: REMOVE_DESTINATION_ADDRESS,
  };
};
