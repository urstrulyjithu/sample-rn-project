import apiClient from "../../api/bookingsAPIClient";
import * as endPoints from "../../constants/end-points";

import Transaction from "../../models/transaction";
import WayPoint from "../../models/wayPoint";

export const GET_ACTIVE_TRANSACTIONS = "GET_ACTIVE_TRANSACTIONS";
export const REMOVE_ACTIVE_TRANSACTIONS = "REMOVE_ACTIVE_TRANSACTIONS";

export const getActiveTransactions = () => {
  return async dispatch => {
    try {
      const response = await apiClient.post(endPoints.MY_ACTIVE_TRANSACTIONS, {
        data: null,
      });

      if (response.data.status === "success") {
        const transactionsData = response.data.data;
        let transactions = [];
        for (const transactionData of transactionsData) {
          let wayPoints = [];
          const wayPointsData = transactionData.overviewPolyline ?? [];
          for (const wayPointData of wayPointsData) {
            const wayPoint = new WayPoint(wayPointData.lat, wayPointData.lng);
            wayPoints.push(wayPoint);
          }
          transactions.push(
            new Transaction(
              transactionData.bookingDetailId,
              transactionData.customerDetailId,
              transactionData.driverDetailId,
              transactionData.bookingDate,
              transactionData.bookingStatus,
              transactionData.bookingType,
              transactionData.totalBillAmount,
              transactionData.booking_locations,
              transactionData.driverDetails,
              "",
              wayPoints,
              transactionData.PickUpOtp,
              transactionData.DropOtp,
              transactionData.contactDetails.From,
              transactionData.contactDetails.To,
              transactionData.deliverAfter,
              transactionData.deliverDateTime,
              transactionData.pickUpDateTime,
              0,
              0,
              transactionData.paymentInfo?.[0],
              transactionData.serviceTypeId,
            ),
          );
        }
        console.log("transactionsData: ", transactions);
        dispatch({type: GET_ACTIVE_TRANSACTIONS, payload: transactions});
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

export const removeActiveTransactions = () => {
  return {
    type: REMOVE_ACTIVE_TRANSACTIONS,
  };
};
