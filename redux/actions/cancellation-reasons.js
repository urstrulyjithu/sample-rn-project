import CancellationReason from "../../models/cancellationReason";

import apiClient from "../../api/bookingsAPIClient";
import * as endPoints from "../../constants/end-points";

export const GET_CANCELLATION_REASONS = "GET_CANCELLATION_REASONS";
export const REMOVE_CANCELLATION_REASONS = "REMOVE_CANCELLATION_REASONS";

export const getCancellationReasons = () => {
  return async (dispatch) => {
    try {
      const response = await apiClient.get(
        endPoints.BOOKING_CANCELLATION_REASONS,
        {
          data: null,
        },
      );

      if (response.data.status === "success") {
        const reasonsData = response.data.data;
        let reasons = [];
        for (const reason of reasonsData) {
          reasons.push(
            new CancellationReason(
              reason.cancellationReasonId,
              reason.reasonName,
              reason.reasonDescription,
            ),
          );
        }
        dispatch({type: GET_CANCELLATION_REASONS, payload: reasons});
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

export const removeCancellationReasons = () => {
  return {
    type: REMOVE_CANCELLATION_REASONS,
  };
};
