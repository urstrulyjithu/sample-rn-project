import React, {useCallback} from "react";
import {useDispatch, useSelector} from "react-redux";

import * as constants from "../constants/socket";
import * as bookingAcceptActions from "../redux/actions/booking-accept";
import * as driverLocationActions from "../redux/actions/driver-location";
import * as pickupInfoActions from "../redux/actions/pickup-info";
import * as dropInfoActions from "../redux/actions/drop-info";
import * as driverCancelRideActions from "../redux/actions/driver-cancel-ride";
import * as paymentFailureActions from "../redux/actions/payment-failure";
import * as newBookingAlertActions from "../redux/actions/new-booking-alert";
import * as autoCancelBookingActions from "../redux/actions/auto-cancel-booking";

import SocketConfig from "../config/socketConfig";
import Profile from "../models/profile";
import BookingAccept from "../models/bookingAccept";
import DriverLocation from "../models/driverLocation";

const SocketConnection = ({
  onDriverCancelBooking,
  onReceiveAutoCancelBooking,
  onPackagePickedUp,
  onPackageDelivered,
  onNewBookingReceived,
  onHaltBookingResumed,
  onLookingForNewDriver,
}) => {
  const dispatch = useDispatch();

  const profile = Profile.class(useSelector(state => state.getProfile.profile));

  React.useEffect(() => {
    const pusherInstance = createChannels();
    return () => {
      console.log("************* CLEARING PUSHER *************");
      pusherInstance.then(pusher => {
        pusher.disconnect();
      });
    };
  }, [createChannels]);

  const createChannels = useCallback(async () => {
    const pusher = await SocketConfig();

    let customerChannel;

    console.log("Subscribing Channels...");

    //Subscribing channels
    customerChannel = pusher.subscribe(
      `${constants.CUSTOMER_CHANNEL}.${profile.id}`,
    );

    console.log("Unbinding Channels...");

    //Un-binding channels
    customerChannel?.unbind();

    console.log("Binding Channels...");

    //Binding channels
    customerChannel?.bind(constants.BOOKING_ACCEPTANCE_EVENT, data => {
      console.log("Booking Accept Socket Data: ", JSON.stringify(data));
      const bookingAcceptNotification = new BookingAccept(
        data.PickUpOtp,
        data.bookingId,
        data.driverId,
        data.driverName,
        data.driverEmail,
        data.driverMobile,
        data.driverGender,
        data.vehicleTypeId,
        data.vehicleColor,
        data.vehicleNumber,
        data.vehicleBrandDetails,
        data.vehicleModel,
        data.profileImagePath,
      );
      dispatch(
        bookingAcceptActions.saveBookingAcceptNotification(
          bookingAcceptNotification,
        ),
      );
      dispatch(newBookingAlertActions.triggerNewBookingAlert(true));
      onNewBookingReceived(true, data);
    });
    customerChannel?.bind(constants.DRIVER_LOCATION_EVENT, data => {
      console.log("Driver Location Socket Data: ", JSON.stringify(data));
      const location = new DriverLocation(
        data.driverId,
        data.longitude,
        data.latitude,
        data.customerId,
        data.bookingId,
        data.vehicleId,
        data.heading,
      );
      dispatch(driverLocationActions.saveDriverLocation(location));
    });
    customerChannel?.bind(constants.PICKUP_INFO_EVENT, data => {
      console.log("Pickup Socket Data: ", JSON.stringify(data));
      dispatch(pickupInfoActions.savePickupInfo(data));
      onPackagePickedUp(true, data);
    });
    customerChannel?.bind(constants.DROP_INFO_EVENT, data => {
      console.log("Drop Socket Data: ", JSON.stringify(data));
      dispatch(dropInfoActions.saveDropInfo(data));
      onPackageDelivered(true, data);
    });
    customerChannel?.bind(constants.CANCEL_BOOKING_EVENT, data => {
      console.log("Cancel Booking Data: ", JSON.stringify(data));
      dispatch(driverCancelRideActions.saveDriverCancelRide(data));
      onDriverCancelBooking(true, data);
    });
    customerChannel?.bind(constants.PAYMENT_FAILURE_EVENT, data => {
      console.log("Payment Failure Data: ", JSON.stringify(data));
      dispatch(paymentFailureActions.savePaymentFailureInfo(data));
    });
    customerChannel?.bind(constants.AUTO_CANCEL_BOOKING_EVENT, data => {
      console.log("Auto cancel booking Data: ", JSON.stringify(data));
      dispatch(autoCancelBookingActions.showAutoCancelBookingAlert(data));
      onReceiveAutoCancelBooking(true, data);
    });
    customerChannel?.bind(constants.HALT_BOOKING_INFO_EVENT, data => {
      console.log("Halt Booking Socket Data: ", JSON.stringify(data));
      onHaltBookingResumed(true, data);
    });
    customerChannel?.bind(constants.LOOKING_FOR_NEW_DRIVER, data => {
      console.log("Looking for new driver Socket Data: ", JSON.stringify(data));
      onLookingForNewDriver(true, data);
    });
    return pusher;
  }, [
    dispatch,
    onDriverCancelBooking,
    onHaltBookingResumed,
    onLookingForNewDriver,
    onNewBookingReceived,
    onPackageDelivered,
    onPackagePickedUp,
    onReceiveAutoCancelBooking,
    profile.id,
  ]);

  return null;
};

export default SocketConnection;
