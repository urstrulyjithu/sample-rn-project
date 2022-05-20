export const SET_FIELDS_SWITCHED = "SET_FIELDS_SWITCHED";

export const saveFieldsSwitched = switched => {
  return {
    type: SET_FIELDS_SWITCHED,
    payload: switched,
  };
};
