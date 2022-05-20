import {removeActiveTransactions} from "./active-transactions";
import {removeAddressBook} from "./address-book";
import {removeAuthToken} from "./auth-token";
import {removeBookingAcceptNotification} from "./booking-accept";
import {removeBookingId} from "./booking-id";
import {removeCancellationReasons} from "./cancellation-reasons";
import {removeDeliveryDetails} from "./delivery-details";
import {removeDestinationAddress} from "./destination-address";
import {removeDestinationGeoCodedAddress} from "./destination-geo-coded-address";
import {removeDestinationLocation} from "./destination-location";
import {removeDriverLocation} from "./driver-location";
import {removeDirectionsFromDriverToDelivery} from "./driver-to-delivery-way-points";
import {removeDirectionsFromDriverToPickup} from "./driver-to-pickup-way-points";
import {removeDropInfo} from "./drop-info";
import {removePickupDetails} from "./pickup-details";
import {removePickupInfo} from "./pickup-info";
import {removeProductDetails} from "./product-details";
import {removeProfile} from "./profile";
import {removeSelectedRide} from "./select-ride";
import {removeSourceAddress} from "./source-address";
import {removeSourceGeoCodedAddress} from "./source-geo-coded-address";
import {removeSourceLocation} from "./source-location";
import {removeWalletBalance} from "./wallet";
import {removeWayPoints} from "./way-points";
import {removeUpcomingTransactions} from "./upcoming-rides";
import {removeCompletedTransactions} from "./completed-rides";
import {removeCancelledTransactions} from "./cancelled-rides";
import {removeShowKYCAlert} from "./show-kyc";
import {removeCreditCards} from "./credit-cards";
import {removeDriverCancelRide} from "./driver-cancel-ride";
import {removePaymentFailureInfo} from "./payment-failure";

export const clearReduxStoreOnBooking = () => dispatch => {
  return Promise.all([
    // dispatch(removeActiveTransactions()),
    dispatch(removeAddressBook()),
    dispatch(removeBookingAcceptNotification()),
    dispatch(removeBookingId()),
    dispatch(removeDeliveryDetails()),
    dispatch(removeDestinationAddress()),
    dispatch(removeDestinationGeoCodedAddress()),
    dispatch(removeDestinationLocation()),
    dispatch(removeDriverLocation()),
    dispatch(removeDirectionsFromDriverToDelivery()),
    dispatch(removeDirectionsFromDriverToPickup()),
    dispatch(removeDropInfo()),
    dispatch(removePickupDetails()),
    dispatch(removePickupInfo()),
    dispatch(removeProductDetails()),
    dispatch(removeSelectedRide()),
    dispatch(removeSourceAddress()),
    dispatch(removeSourceGeoCodedAddress()),
    dispatch(removeSourceLocation()),
    dispatch(removeWayPoints()),
    dispatch(removeDriverCancelRide()),
    dispatch(removePaymentFailureInfo()),
  ]);
};

export const clearReduxStoreOnLogout = () => dispatch => {
  return Promise.all([
    dispatch(removeActiveTransactions()),
    dispatch(removeAddressBook()),
    dispatch(removeAuthToken()),
    dispatch(removeBookingAcceptNotification()),
    dispatch(removeBookingId()),
    dispatch(removeCancellationReasons()),
    dispatch(removeDeliveryDetails()),
    dispatch(removeDestinationAddress()),
    dispatch(removeDestinationGeoCodedAddress()),
    dispatch(removeDestinationLocation()),
    dispatch(removeDriverLocation()),
    dispatch(removeDirectionsFromDriverToDelivery()),
    dispatch(removeDirectionsFromDriverToPickup()),
    dispatch(removeDropInfo()),
    dispatch(removePickupDetails()),
    dispatch(removePickupInfo()),
    dispatch(removeProductDetails()),
    dispatch(removeProfile()),
    dispatch(removeSelectedRide()),
    dispatch(removeSourceAddress()),
    dispatch(removeSourceGeoCodedAddress()),
    dispatch(removeSourceLocation()),
    dispatch(removeWalletBalance()),
    dispatch(removeWayPoints()),
    dispatch(removeUpcomingTransactions()),
    dispatch(removeCompletedTransactions()),
    dispatch(removeCancelledTransactions()),
    dispatch(removeShowKYCAlert()),
    dispatch(removeCreditCards()),
    dispatch(removeDriverCancelRide()),
    dispatch(removePaymentFailureInfo()),
  ]);
};
