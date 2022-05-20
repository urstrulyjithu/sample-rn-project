export const SET_DROP_INFO = "SET_DROP_INFO";
export const REMOVE_DROP_INFO = "REMOVE_DROP_INFO";

export const saveDropInfo = (dropInfo) => {
  return {
    type: SET_DROP_INFO,
    payload: dropInfo,
  };
};

export const removeDropInfo = () => {
  return {
    type: REMOVE_DROP_INFO,
  };
};
