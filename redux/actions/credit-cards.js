import CreditCard from "../../models/creditCard";

import apiClient from "../../api/apiClient";
import * as endPoints from "../../constants/end-points";

export const GET_CREDIT_CARDS = "GET_CREDIT_CARDS";
export const REMOVE_CREDIT_CARD = "REMOVE_CREDIT_CARD";
export const REMOVE_CREDIT_CARDS = "REMOVE_CREDIT_CARDS";

export const getCreditCards = () => {
  return async (dispatch) => {
    try {
      const response = await apiClient.post(endPoints.GET_ALL_CARDS, {
        data: null,
      });
      if (response.data.status === "success") {
        const cardsData = response.data.data;
        let cards = [];
        if (cardsData.length > 0) {
          for (const cardData of cardsData) {
            cards.push(
              new CreditCard(
                cardData.cardDetailId,
                cardData.accountHolderId,
                cardData.cardHolderName,
                cardData.cardLast4,
                cardData.cardStatus,
                cardData.expiryMonth,
                cardData.expiryYear,
                cardData.cardBrand,
              ),
            );
          }
        }
        dispatch({type: GET_CREDIT_CARDS, payload: cards});
      }
    } catch (error) {
      const status = error?.response?.status ?? 0;
      switch (status) {
        case 400:
        case 401:
        case 408:
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

export const removeCreditCard = (id) => {
  return {
    type: REMOVE_CREDIT_CARD,
    payload: id,
  };
};

export const removeCreditCards = () => {
  return {
    type: REMOVE_CREDIT_CARDS,
  };
};
