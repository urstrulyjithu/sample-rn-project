import apiClient from "../../api/bookingsAPIClient";
import * as endPoints from "../../constants/end-points";

import Transaction from "../../models/transaction";
import DriverDetails from "../../models/driver-details";
import FromContactDetails from "../../models/from-contact-details";
import ToContactDetails from "../../models/to-contact-details";
import PaymentInfo from "../../models/paymentInfo";

export const GET_COMPLETED_TRANSACTIONS = "GET_COMPLETED_TRANSACTIONS";
export const REMOVE_COMPLETED_TRANSACTIONS = "REMOVE_COMPLETED_TRANSACTIONS";

export const getCompletedTransactions = bookingStatus => {
  return async dispatch => {
    try {
      const response = await apiClient.post(endPoints.MY_TRANSACTIONS, {
        bookingStatus,
      });
      if (response.data.status === "success") {
        const transactionsData = response.data.data;
        let transactions = [];
        for (const transactionData of transactionsData) {
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
              new DriverDetails(),
              "",
              [],
              "",
              "",
              new FromContactDetails(),
              new ToContactDetails(),
              transactionData.deliverAfter,
              transactionData.deliverDateTime,
              transactionData.pickUpDateTime,
              0,
              0,
              new PaymentInfo(),
              transactionData.serviceTypeId,
            ),
          );
        }
        console.log("completed transactions: ", transactions);
        dispatch({type: GET_COMPLETED_TRANSACTIONS, payload: transactions});
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

export const removeCompletedTransactions = () => {
  return {
    type: REMOVE_COMPLETED_TRANSACTIONS,
  };
};
