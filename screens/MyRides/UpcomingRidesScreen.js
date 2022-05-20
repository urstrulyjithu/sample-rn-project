import React, {useState, useEffect, useCallback} from "react";
import {SafeAreaView, FlatList, Alert, StyleSheet} from "react-native";
import {useSelector, useDispatch} from "react-redux";
import Modal from "react-native-modal";
import moment from "moment";

import colors from "../../constants/colors";
import {localize} from "../../translations/localized";
import * as routes from "../../navigation/routes/app-routes";
import * as upcomingRidesActions from "../../redux/actions/upcoming-rides";
import * as sourceGeoCodedAddressActions from "../../redux/actions/source-geo-coded-address";
import * as destinationGeoCodedAddressActions from "../../redux/actions/destination-geo-coded-address";
import * as wayPointsActions from "../../redux/actions/way-points";
import * as bookingIdActions from "../../redux/actions/booking-id";
import * as pickupDetailsActions from "../../redux/actions/pickup-details";
import * as deliveryDetailsActions from "../../redux/actions/delivery-details";
import * as bookingAcceptActions from "../../redux/actions/booking-accept";
import useTransactionDetails from "../../api/transactionDetails/transactionDetails";

import Loader from "../../components/UI/Loading/Loader";
import NoRide from "../../components/Ride/NoRide";
import Profile from "../../models/profile";
import VerifyKYC from "../../components/DocumentsVerification/VerifyKYC";
import GeoCodedAddress from "../../models/geoCodedAddress";
import BookingAccept from "../../models/bookingAccept";
import PopupAlert from "../../components/UI/Alert/PopupAlert";
import RideOverview from "../../components/Ride/RideOverview";

const UpcomingRidesScreen = ({navigation}) => {
  const dispatch = useDispatch();
  const [showLoader, setShowLoader] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [showKYCView, setShowKYCView] = useState(false);
  const profile = Profile.class(useSelector(state => state.getProfile.profile));

  const upcomingTransactions = useSelector(
    state => state.myRides.upcomingTransactions,
  );
  const [
    onGetTransactionDetails,
    transactionDetailsResponse,
    transactionDetailsError,
  ] = useTransactionDetails();
  const [showHaltPackageAlert, setShowHaltPackageAlert] = useState(false);
  const [haltPackageMessage, setHaltPackageMessage] = useState("");

  console.log("UPCOMING ==>", upcomingTransactions);

  useEffect(() => {
    navigation.setOptions({
      title: localize("upcoming"),
    });
  }, [navigation]);

  useEffect(() => {
    getData();
  }, [dispatch, getData]);

  const getData = useCallback(async () => {
    setErrorMessage(null);
    setShowLoader(true);
    try {
      await dispatch(upcomingRidesActions.getUpcomingTransactions("Active"));
    } catch (error) {
      setErrorMessage(error.message);
    }
    setShowLoader(false);
  }, [dispatch]);

  const getStartedButtonPressHandler = () => {
    if (profile.documentVerified === "NU") {
      setShowKYCView(true);
    } else {
      navigation.navigate(routes.HOME);
    }
  };

  const verifyKYCHandler = () => {
    setShowKYCView(false);
    navigation.navigate(routes.DOCUMENTS_VERIFICATION, {
      customerType: profile.type,
    });
  };

  const cancelVerifyKYCHandler = () => {
    setShowKYCView(false);
  };

  const onRideTouchHandler = async item => {
    setShowLoader(true);
    await onGetTransactionDetails(item.bookingDetailId);
  };

  const navigateToRideDetails = useCallback(
    transaction => {
      const sourceAddress = new GeoCodedAddress(
        transaction.bookingLocations.fromLocationPlaceId,
        transaction.bookingLocations.fromLocation,
        transaction.bookingLocations.fromLocationLatitude,
        transaction.bookingLocations.fromLocationLongitude,
      );
      dispatch(
        sourceGeoCodedAddressActions.saveSourceGeoCodedAddress(sourceAddress),
      );
      const destinationAddress = new GeoCodedAddress(
        transaction.bookingLocations.toLocationPlaceId,
        transaction.bookingLocations.toLocation,
        transaction.bookingLocations.toLocationLatitude,
        transaction.bookingLocations.toLocationLongitude,
      );
      dispatch(
        destinationGeoCodedAddressActions.saveDestinationGeoCodedAddress(
          destinationAddress,
        ),
      );
      // dispatch(wayPointsActions.saveWayPoints(transaction.wayPoints));
      dispatch(bookingIdActions.saveBookingId(transaction.bookingDetailId));
      dispatch(
        pickupDetailsActions.savePickupDetails({
          locationDetails: transaction.fromContactDetails.toContactLandmark,
          senderName: transaction.toContactDetails.fromContactName,
          phoneNumber: transaction.toContactDetails.fromContactMobile,
          saveAddress: false,
        }),
      );
      dispatch(
        deliveryDetailsActions.saveDeliveryDetails({
          locationDetails: transaction.toContactDetails.fromContactLandmark,
          recipientName: transaction.fromContactDetails.toContactName,
          phoneNumber: transaction.fromContactDetails.toContactMobile,
          saveAddress: false,
        }),
      );
      if (
        transaction.bookingStatus === "Allocated" ||
        transaction.bookingStatus === "Pickedup"
      ) {
        const bookingAcceptNotification = new BookingAccept(
          transaction.PickUpOtp,
          transaction.bookingDetailId,
          transaction.driverDetailId,
          transaction.driverDetails.driverName,
          "",
          transaction.driverDetails.driverMobileNumber,
          transaction.driverDetails.driverGender,
          transaction.vehicleDetailId,
          transaction.driverDetails.vehicleDetails.vehicleColor,
          transaction.driverDetails.vehicleDetails.driverVehicleNumber,
          transaction.driverDetails.vehicleDetails.vehicleBrandDetails,
          transaction.driverDetails.vehicleDetails.vehicleModel,
          transaction.driverDetails.driverPic,
        );
        dispatch(
          bookingAcceptActions.saveBookingAcceptNotification(
            bookingAcceptNotification,
          ),
        );
      }
      if (transaction.bookingStatus === "Initiated") {
        navigation.navigate(routes.DRIVER_SEARCH, {
          driverOnTheWayToPickupPoint: false,
          driverOnTheWayToDeliveryPoint: false,
          totalFare: transaction.totalBillAmount,
          serviceTypeId: transaction.serviceTypeId,
        });
      } else if (transaction.bookingStatus === "Allocated") {
        navigation.navigate(routes.DRIVER_SEARCH, {
          driverOnTheWayToPickupPoint: true,
          driverOnTheWayToDeliveryPoint: false,
          totalFare: transaction.totalBillAmount,
          serviceTypeId: transaction.serviceTypeId,
        });
      } else if (transaction.bookingStatus === "Pickedup") {
        navigation.navigate(routes.DRIVER_SEARCH, {
          driverOnTheWayToPickupPoint: false,
          driverOnTheWayToDeliveryPoint: true,
          totalFare: transaction.totalBillAmount,
          serviceTypeId: transaction.serviceTypeId,
        });
      } else if (transaction.bookingStatus === "Halted") {
        setShowHaltPackageAlert(true);
        setHaltPackageMessage(
          localize("package_halt_message") +
            moment(transaction.deliverDateTime).format("DD MMM YYYY hh:mm A"),
        );
      }
    },
    [dispatch, navigation],
  );

  React.useEffect(() => {
    setShowLoader(false);
    if (transactionDetailsResponse) {
      console.log("transactionDetailsResponse: ", transactionDetailsResponse);
      navigateToRideDetails(transactionDetailsResponse);
    } else if (transactionDetailsError) {
      setErrorMessage(transactionDetailsError);
    }
  }, [
    navigateToRideDetails,
    transactionDetailsError,
    transactionDetailsResponse,
  ]);

  const renderItem = ({item, index}) => {
    return (
      <RideOverview ride={item} onPress={() => onRideTouchHandler(item)} />
    );
  };

  return (
    <SafeAreaView style={styles.screen}>
      {upcomingTransactions.length === 0 ? (
        <NoRide
          noRidesText={localize("no_upcoming_rides")}
          onGetStartedPress={getStartedButtonPressHandler}
        />
      ) : null}
      <FlatList
        data={upcomingTransactions}
        keyExtractor={(item, index) => `${item.bookingDetailId}`}
        renderItem={renderItem}
      />
      <Modal
        style={styles.kycVerifyContainer}
        backdropOpacity={0.5}
        isVisible={showKYCView}
        swipeDirection="down"
        onSwipeComplete={cancelVerifyKYCHandler}
        onBackdropPress={cancelVerifyKYCHandler}>
        <VerifyKYC
          profile={profile}
          onVerifyButtonPress={verifyKYCHandler}
          onCancelButtonPress={cancelVerifyKYCHandler}
        />
      </Modal>
      <Loader show={showLoader} />
      <PopupAlert
        show={showHaltPackageAlert}
        title={localize("booking")}
        message={haltPackageMessage}
        showOk
        onOkButtonPress={() => {
          setShowHaltPackageAlert(false);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  kycVerifyContainer: {
    margin: 0,
  },
});

export default UpcomingRidesScreen;
