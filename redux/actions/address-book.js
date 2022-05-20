import SavedAddress from "../../models/savedAddress";

import apiClient from "../../api/apiClient";
import * as endPoints from "../../constants/end-points";

export const GET_ADDRESS_BOOK = "GET_ADDRESS_BOOK";
export const REMOVE_ADDRESS_BOOK = "REMOVE_ADDRESS_BOOK";

export const getAddressBook = () => {
  return async dispatch => {
    try {
      const response = await apiClient.get(endPoints.GET_ADDRESS_BOOK, {
        data: null,
      });

      if (response.data.status === "success") {
        const addressesData = response.data.data;
        let addresses = [];
        for (const address of addressesData) {
          addresses.push(
            new SavedAddress(
              address.contactPersonName,
              address.contactNumber,
              address.addressType,
              address.addressName,
              address.addressLine,
              address.landmark,
              address.latitude,
              address.longitude,
              address.status,
              address.placeId,
            ),
          );
        }

        dispatch({type: GET_ADDRESS_BOOK, payload: addresses});
      }
    } catch (error) {
      const status = error?.response?.status ?? 0;
      switch (status) {
        case 400:
        case 401:
        case 408:
        case 422:
          let message =
            error.response.data?.trace?.msg ?? "Something went wrong";
          throw new Error(message);
        case 500:
          message = error.response.data?.trace?.error ?? "Something went wrong";
          throw new Error(message);
        default:
          throw new Error("Something went wrong");
      }
    }
  };
};

export const removeAddressBook = () => {
  return {
    type: REMOVE_ADDRESS_BOOK,
  };
};
