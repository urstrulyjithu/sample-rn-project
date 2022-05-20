export const AUTH_ERROR = "AUTH_ERROR";
export const REMOVE_AUTH_ERROR = "REMOVE_AUTH_ERROR";

export const showAuthError = () => {
  return {
    type: AUTH_ERROR,
    payload: true,
  };
};

export const hideAuthError = () => {
  return {
    type: AUTH_ERROR,
    payload: false,
  };
};
