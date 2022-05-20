export const SET_SHOW_KYC_MESSAGE = "SET_SHOW_KYC_MESSAGE";
export const REMOVE_SHOW_KYC_MESSAGE = "REMOVE_SHOW_KYC_MESSAGE";

export const showKYCAlert = (show) => {
  return {
    type: SET_SHOW_KYC_MESSAGE,
    payload: show,
  };
};

export const removeShowKYCAlert = () => {
  return {
    type: REMOVE_SHOW_KYC_MESSAGE,
  };
};
