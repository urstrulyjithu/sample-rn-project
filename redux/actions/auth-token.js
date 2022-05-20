export const AUTH_TOKEN = "AUTH_TOKEN";
export const REMOVE_AUTH_TOKEN = "REMOVE_AUTH_TOKEN";

export const saveAuthToken = (authToken, type, expiresIn) => {
  return {
    type: AUTH_TOKEN,
    payload: {
      authToken,
      type,
      expiresIn,
    },
  };
};

export const removeAuthToken = () => {
  return {
    type: REMOVE_AUTH_TOKEN,
    payload: {},
  };
};
