export const UPDATE_SOURCE_ADDRESS = "UPDATE_SOURCE_ADDRESS";
export const REMOVE_SOURCE_ADDRESS = "REMOVE_SOURCE_ADDRESS";

export const saveSourceAddress = (address) => {
  return {
    type: UPDATE_SOURCE_ADDRESS,
    payload: address,
  };
};

export const removeSourceAddress = () => {
  return {
    type: REMOVE_SOURCE_ADDRESS,
  };
};
