import React, {useState, useEffect, useRef, useCallback} from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  TouchableNativeFeedback,
  SafeAreaView,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  BackHandler,
} from "react-native";
import MapView, {Marker, Polyline, PROVIDER_GOOGLE} from "react-native-maps";
import {useSelector, useDispatch} from "react-redux";
import Modal from "react-native-modal";
import {Modalize} from "react-native-modalize";
import Ionicons from "react-native-vector-icons/Ionicons";
import {getDistance} from "geolib";

import fonts from "../../constants/fonts";
import colors from "../../constants/colors";
import fontSizes from "../../constants/font-sizes";
import {localize} from "../../translations/localized";
import * as constants from "../../constants/general";
import * as routes from "../../navigation/routes/app-routes";
import * as cancellationReasonsActions from "../../redux/actions/cancellation-reasons";
import * as activeTransactionsActions from "../../redux/actions/active-transactions";
import * as driverToPickupWayPointsActions from "../../redux/actions/driver-to-pickup-way-points";
import * as driverToDeliveryWayPointsActions from "../../redux/actions/driver-to-delivery-way-points";
import {phoneCallService} from "../../services/phone-service";

import Loader from "../../components/UI/Loading/Loader";
import LocationIndicator from "../../components/UI/LocationIndicator/LocationIndicator";
import ImageMarker from "../../components/UI/Marker/ImageMarker";
import PopupView from "../../components/UI/Popup/PopupView";
import DriverOnTheWay from "../../components/BookingDetails/DriverOnTheWay";
import CancelSlider from "../../components/UI/Slider/CancelSlider";
import CancelRide from "../../components/BookingDetails/CancelRide";
import CancelReasonsView from "../../components/BookingDetails/CancelReasonsView";

import SavedAddress from "../../models/savedAddress";
import GeoCodedAddress from "../../models/geoCodedAddress";
import BookingAccept from "../../models/bookingAccept";
import DriverLocation from "../../models/driverLocation";
import useCancelBooking from "../../api/cancelBooking/cancelBooking";

const height = Dimensions.get("window").height;

const DriverSearchScreen = ({navigation, route}) => {
  const {
    paymentInfo,
    totalFare,
    driverOnTheWayToPickupPoint,
    driverOnTheWayToDeliveryPoint,
    serviceTypeId,
  } = route.params;

  const mapView = useRef();
  const dispatch = useDispatch();
  const sheetRef = React.useRef(null);

  const fieldsSwitched = useSelector(state => state.fieldsSwitch.switched);
  const sourceGeoCodedAddress = GeoCodedAddress.class(
    useSelector(state =>
      fieldsSwitched
        ? state.getDestinationLocation.geoCodedAddress
        : state.getSourceLocation.geoCodedAddress,
    ),
  );
  const sourceSavedAddress = SavedAddress.class(
    useSelector(state =>
      fieldsSwitched
        ? state.getDestinationLocation.address
        : state.getSourceLocation.address,
    ),
  );

  const pickupLatitude =
    sourceGeoCodedAddress?.latitude !== 0
      ? sourceGeoCodedAddress?.latitude
      : sourceSavedAddress?.latitude !== 0
      ? sourceSavedAddress?.latitude
      : 0;
  const pickupLongitude =
    sourceGeoCodedAddress?.longitude !== 0
      ? sourceGeoCodedAddress?.longitude
      : sourceSavedAddress?.longitude !== 0
      ? sourceSavedAddress?.longitude
      : 0;
  const pickupName =
    sourceGeoCodedAddress?.name?.length > 0
      ? sourceGeoCodedAddress?.name
      : sourceSavedAddress?.name?.length > 0
      ? sourceSavedAddress?.name
      : "";
  const pickupAddress =
    sourceGeoCodedAddress?.address?.length > 0
      ? sourceGeoCodedAddress?.address
      : sourceSavedAddress?.line?.length > 0
      ? sourceSavedAddress?.line
      : "";

  const destinationGeoCodedAddress = GeoCodedAddress.class(
    useSelector(state =>
      fieldsSwitched
        ? state.getSourceLocation.geoCodedAddress
        : state.getDestinationLocation.geoCodedAddress,
    ),
  );
  const destinationSavedAddress = SavedAddress.class(
    useSelector(state =>
      fieldsSwitched
        ? state.getSourceLocation.address
        : state.getDestinationLocation.address,
    ),
  );

  const cancellationReasons = useSelector(
    state => state.cancellationReasons.reasons,
  );

  // const wayPoints = useSelector(state => state.wayPoints.wayPoints);

  const driverToPickupWayPoints = useSelector(
    state => state.driverToPickupWayPoints.driverToPickupWayPoints,
  );

  const driverToDeliveryWayPoints = useSelector(
    state => state.driverToDeliveryWayPoints.driverToDeliveryWayPoints,
  );

  const pickupInfo = useSelector(state => state.pickupInfo.pickupInfo);

  const dropInfo = useSelector(state => state.dropInfo.dropInfo);

  const bookingId = useSelector(state => state.bookingId.id);

  const bookingAcceptNotification = BookingAccept.class(
    useSelector(state => state.bookingAccept.bookingAcceptNotification),
  );

  const driverLocation = DriverLocation.class(
    useSelector(state => state.driverLocation.driverLocation),
  );

  const destinationLatitude =
    destinationGeoCodedAddress?.latitude !== 0
      ? destinationGeoCodedAddress?.latitude
      : destinationSavedAddress?.latitude !== 0
      ? destinationSavedAddress?.latitude
      : 0;
  const destinationLongitude =
    destinationGeoCodedAddress?.longitude !== 0
      ? destinationGeoCodedAddress?.longitude
      : destinationSavedAddress?.longitude !== 0
      ? destinationSavedAddress?.longitude
      : 0;
  const destinationName =
    destinationGeoCodedAddress?.name?.length > 0
      ? destinationGeoCodedAddress?.name
      : destinationSavedAddress?.name?.length > 0
      ? destinationSavedAddress?.name
      : "";
  const deliveryAddress =
    destinationGeoCodedAddress?.address?.length > 0
      ? destinationGeoCodedAddress?.address
      : destinationSavedAddress?.line?.length > 0
      ? destinationSavedAddress?.line
      : "";

  const productDetails = useSelector(
    state => state.productDetails.productDetails,
  );

  const [showLoader, setShowLoader] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [showCancelRide, setShowCancelRide] = useState(false);
  const [showDrawerMenu, setShowDrawerMenu] = useState(false);
  const [
    onCancelBooking,
    cancelBookingMessage,
    cancelBookingError,
  ] = useCancelBooking();
  const [showLightStatusBar, setShowLightStatusBar] = useState(false);
  const [driverDistance, setDriverDistance] = useState(0);
  const [driverArrivalTime, setDriverArrivalTime] = useState("");
  const driverFound =
    driverOnTheWayToPickupPoint ||
    driverOnTheWayToDeliveryPoint ||
    (driverLocation.latitude !== 0 && driverLocation.longitude !== 0);
  console.log("drivers found", driverFound ? "YES" : "NO");
  const showDriverDetails =
    driverOnTheWayToPickupPoint || bookingAcceptNotification.bookingId !== 0;
  console.log("Showing driver details", showDriverDetails ? "YES" : "NO");
  console.log("driverOnTheWayToPickupPoint: ", driverOnTheWayToPickupPoint);
  console.log(
    "bookingAcceptNotification.bookingId: ",
    bookingAcceptNotification.bookingId,
  );
  const transactions = useSelector(
    state => state.activeTransactions.transactions,
  );
  const activeTransaction = transactions.filter(
    transaction =>
      transaction.bookingDetailId === bookingAcceptNotification.bookingId,
  )?.[0];
  // console.log("Present Transaction: ", activeTransaction);
  const onTheWayToPickup =
    activeTransaction?.bookingStatus === "Allocated" ?? false;
  const onTheWayToDrop =
    activeTransaction?.bookingStatus === "Pickedup" ?? false;
  const driverOnTheWayToPickup =
    ((driverOnTheWayToPickupPoint && !onTheWayToDrop) || onTheWayToPickup) &&
    driverLocation.latitude !== 0 &&
    driverLocation.longitude !== 0;
  console.log("driverOnTheWayToPickup", driverOnTheWayToPickup ? "YES" : "NO");
  const driverOnTheWayToDrop =
    (driverOnTheWayToDeliveryPoint || onTheWayToDrop) &&
    driverLocation.latitude !== 0 &&
    driverLocation.longitude !== 0;
  console.log("driverOnTheWayToDrop", driverOnTheWayToDrop ? "YES" : "NO");
  const autoCancelBooking = useSelector(
    state => state.autoCancelBooking.booking,
  );
  const [wayPoints, setWayPoints] = useState([]);

  const driverRideCancelInfo = useSelector(
    state => state.driverCancelRide.cancelInfo,
  );
  const bookingRated = useSelector(state => state.bookingRated.rated);

  React.useEffect(() => {
    if (autoCancelBooking?.bookingDetailId === bookingId) {
      console.log("Driver Search Screen: navigating to Transactions!");
      navigation.navigate(routes.TRANSACTIONS);
    } else {
      console.log("Cancel Booking Ids not matched!");
    }
  }, [autoCancelBooking?.bookingDetailId, bookingId, navigation]);

  React.useEffect(() => {
    if (driverRideCancelInfo?.bookingId === bookingId) {
      console.log("Driver Search Screen: navigating to Transactions!");
      navigation.navigate(routes.TRANSACTIONS);
    } else {
      console.log("Auto Cancel Booking Ids not matched!");
    }
  }, [driverRideCancelInfo?.bookingId, bookingId, navigation]);

  const getCancellationReasons = useCallback(async () => {
    setErrorMessage(null);
    setShowLoader(true);
    if (!onTheWayToDrop) {
      await dispatch(activeTransactionsActions.getActiveTransactions());
    }
    if (cancellationReasons?.length === 0) {
      try {
        await dispatch(cancellationReasonsActions.getCancellationReasons());
      } catch (error) {
        setErrorMessage(error.message);
      }
    }
    setShowLoader(false);
  }, [onTheWayToDrop, cancellationReasons?.length, dispatch]);

  useEffect(() => {
    getCancellationReasons();
  }, [dispatch, getCancellationReasons]);

  React.useEffect(() => {
    if (transactions.length > 0) {
      const currentTransaction = transactions.filter(
        transaction => transaction.bookingDetailId === bookingId,
      )?.[0];
      if (currentTransaction?.wayPoints?.length > 0) {
        console.log(
          "currentTransaction?.wayPoints",
          currentTransaction?.wayPoints,
        );
        setWayPoints(currentTransaction.wayPoints);
      }
      setTimeout(() => {
        fitMapCoordinates();
      }, 1000);
    }
  }, [fitMapCoordinates, transactions, bookingId, transactions.length]);

  React.useEffect(() => {
    // getDirections();
    const timer = setTimeout(
      () => {
        if (driverFound === true || onTheWayToPickup || onTheWayToDrop) {
          return;
        } else {
          navigation.navigate(routes.TRANSACTIONS);
        }
      },
      productDetails?.immediatePickup
        ? constants.DRIVER_NOT_FOUND_REDIRECTION
        : constants.DRIVER_NOT_FOUND_REDIRECTION_MIN,
    );
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [
    driverFound,
    // getDirections,
    navigation,
    onTheWayToDrop,
    onTheWayToPickup,
    productDetails?.immediatePickup,
  ]);
  /***************************************************************************************/
  /*********************** NEW UI IMPLEMENTATION FOR CUSTOMER APP *******************/
  /***************************************************************************************/
  useEffect(() => {
    getDistanceAndTime();
  }, [getDistanceAndTime, driverLocation.latitude, driverLocation.longitude]);

  const getDistanceAndTime = useCallback(async () => {
    console.log(
      "getDistanceAndTime",
      driverLocation.latitude,
      driverLocation.longitude,
      onTheWayToPickup,
      onTheWayToDrop,
    );
    if (driverLocation.latitude === 0 && driverLocation.longitude === 0) {
      return;
    }
    let distance = 0;
    if (onTheWayToPickup) {
      distance = getDistance(
        {
          latitude: driverLocation.latitude,
          longitude: driverLocation.longitude,
        },
        {
          latitude: pickupLatitude,
          longitude: pickupLongitude,
        },
      );
    } else if (onTheWayToDrop) {
      distance = getDistance(
        {
          latitude: driverLocation.latitude,
          longitude: driverLocation.longitude,
        },
        {
          latitude: destinationLatitude,
          longitude: destinationLongitude,
        },
      );
    }
    setDriverDistance(distance);
    const time = ((distance / 1000) * 60 * 60) / constants.DRIVER_AVERAGE_SPEED;
    setDriverArrivalTime(formatDuration(time));
    console.log(
      "*************** Distance ",
      distance,
      time,
      formatDuration(time),
    );
  }, [
    destinationLatitude,
    destinationLongitude,
    driverLocation.latitude,
    driverLocation.longitude,
    onTheWayToDrop,
    onTheWayToPickup,
    pickupLatitude,
    pickupLongitude,
  ]);

  const formatDuration = duration => {
    if (duration >= 60 * 60) {
      return `${Math.trunc(duration / (60 * 60))} ${localize(
        "hours",
      )} ${Math.trunc((duration % 60) % 60)} ${localize("minutes")}`;
    } else if (duration >= 60) {
      return `${Math.trunc(duration / 60)} ${localize("minutes")}`;
    } else if (duration > 0) {
      return `${Math.trunc(duration)} ${localize("seconds")}`;
    }
  };

  React.useEffect(() => {
    const backAction = () => {
      navigation.navigate(routes.TRANSACTIONS);
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction,
    );

    return () => backHandler.remove();
  }, [navigation]);

  /***************************************************************************************/
  /*********************** COMMENTED DUE TO REMOVAL OF LIVE DIRECTIONS *******************/
  /***************************************************************************************/
  // const getDirections = useCallback(async () => {
  //   if (
  //     driverOnTheWayToPickup &&
  //     driverLocation.latitude !== 0 &&
  //     driverLocation.longitude !== 0
  //   ) {
  //     // setShowLoader(true);
  //     setErrorMessage(null);
  //     await dispatch(
  //       driverToPickupWayPointsActions.getDirectionsFromDriverToPickup(
  //         driverLocation.latitude,
  //         driverLocation.longitude,
  //         pickupLatitude,
  //         pickupLongitude,
  //       ),
  //     );
  //     // setShowLoader(false);
  //   } else if (
  //     driverOnTheWayToDrop &&
  //     driverLocation.latitude !== 0 &&
  //     driverLocation.longitude !== 0
  //   ) {
  //     // setShowLoader(true);
  //     setErrorMessage(null);
  //     await dispatch(
  //       driverToDeliveryWayPointsActions.getDirectionsFromDriverToDelivery(
  //         driverLocation.latitude,
  //         driverLocation.longitude,
  //         destinationLatitude,
  //         destinationLongitude,
  //       ),
  //     );
  //     // setShowLoader(false);
  //   } else if (
  //     driverLocation.latitude === 0 &&
  //     driverLocation.longitude === 0
  //   ) {
  //     await dispatch(
  //       driverToPickupWayPointsActions.removeDirectionsFromDriverToPickup(),
  //     );
  //     await dispatch(
  //       driverToDeliveryWayPointsActions.removeDirectionsFromDriverToDelivery(),
  //     );
  //   }
  // }, [
  //   driverOnTheWayToPickup,
  //   driverLocation.latitude,
  //   driverLocation.longitude,
  //   driverOnTheWayToDrop,
  //   dispatch,
  //   pickupLatitude,
  //   pickupLongitude,
  //   destinationLatitude,
  //   destinationLongitude,
  // ]);

  // useEffect(() => {
  //   const focusSubscription = navigation.addListener("focus", getDirections);
  //   return focusSubscription;
  // }, [navigation, getDirections]);

  // React.useEffect(() => {
  //   if (driverToPickupWayPoints.length > 0) {
  //     setTimeout(() => {
  //       fitMapCoordinates();
  //     }, 1000);
  //   }
  // }, [driverToPickupWayPoints, fitMapCoordinates]);

  // React.useEffect(() => {
  //   if (driverToDeliveryWayPoints.length > 0) {
  //     setTimeout(() => {
  //       fitMapCoordinates();
  //     }, 1000);
  //   }
  // }, [driverToDeliveryWayPoints, fitMapCoordinates]);

  // const fitMapCoordinates = useCallback(() => {
  //   let locationCoordinates;
  //   if (
  //     driverFound === false ||
  //     (driverLocation.latitude === 0 && driverLocation.longitude === 0)
  //   ) {
  //     locationCoordinates = [
  //       {latitude: pickupLatitude, longitude: pickupLongitude},
  //       ...wayPoints,
  //       {latitude: destinationLatitude, longitude: destinationLongitude},
  //     ];
  //   } else if (
  //     driverOnTheWayToPickup &&
  //     driverLocation.latitude !== 0 &&
  //     driverLocation.longitude !== 0
  //   ) {
  //     locationCoordinates = [
  //       {
  //         latitude: driverLocation.latitude,
  //         longitude: driverLocation.longitude,
  //       },
  //       ...driverToPickupWayPoints,
  //       {latitude: pickupLatitude, longitude: pickupLongitude},
  //     ];
  //   } else if (
  //     driverOnTheWayToDrop &&
  //     driverLocation.latitude !== 0 &&
  //     driverLocation.longitude !== 0
  //   ) {
  //     locationCoordinates = [
  //       {
  //         latitude: driverLocation.latitude,
  //         longitude: driverLocation.longitude,
  //       },
  //       ...driverToDeliveryWayPoints,
  //       {latitude: destinationLatitude, longitude: destinationLongitude},
  //     ];
  //   }
  //   if (locationCoordinates) {
  //     mapView?.current?.fitToCoordinates(locationCoordinates, {
  //       edgePadding: {top: 50, right: 50, bottom: 100, left: 50},
  //       animated: true,
  //     });
  //   }
  // }, [
  //   driverFound,
  //   driverOnTheWayToPickup,
  //   driverOnTheWayToDrop,
  //   pickupLatitude,
  //   pickupLongitude,
  //   wayPoints,
  //   destinationLatitude,
  //   destinationLongitude,
  //   driverLocation.latitude,
  //   driverLocation.longitude,
  //   driverToPickupWayPoints,
  //   driverToDeliveryWayPoints,
  // ]);

  const fitMapCoordinates = useCallback(() => {
    let locationCoordinates;
    if (wayPoints.length > 0) {
      locationCoordinates = [
        {latitude: pickupLatitude, longitude: pickupLongitude},
        ...wayPoints,
        {latitude: destinationLatitude, longitude: destinationLongitude},
      ];
    } else {
      locationCoordinates = [
        {latitude: pickupLatitude, longitude: pickupLongitude},
        {latitude: destinationLatitude, longitude: destinationLongitude},
      ];
    }
    if (locationCoordinates) {
      mapView?.current?.fitToCoordinates(locationCoordinates, {
        edgePadding: {
          top: 50,
          right: 50,
          bottom: Dimensions.get("screen").height * 0.4,
          left: 50,
        },
        animated: true,
      });
    }
  }, [
    pickupLatitude,
    pickupLongitude,
    wayPoints,
    destinationLatitude,
    destinationLongitude,
  ]);

  useEffect(() => {
    setShowLoader(false);
    // if (cancelBookingMessage) {
    //   setShowCancelRideAlert(true);
    //   setCancelRideMessage(cancelBookingMessage);
    // } else
    if (cancelBookingError) {
      setErrorMessage(cancelBookingError);
    }
  }, [navigation, cancelBookingMessage, cancelBookingError, dispatch]);

  const cancelBooking = reasonId => {
    setShowLoader(true);
    setErrorMessage(null);
    onCancelBooking(bookingId, reasonId);
  };

  const keepRideButtonPressHandler = () => {
    setShowDrawerMenu(false);
    setShowCancelRide(false);
  };

  const cancelRideButtonPressHandler = () => {
    setShowDrawerMenu(true);
    setShowCancelRide(false);
  };

  const cancelReasonButtonPressHandler = reason => {
    setShowDrawerMenu(false);
    setShowCancelRide(false);
    cancelBooking(reason.id);
  };

  const locationIndicatorPressHandler = () => {
    fitMapCoordinates();
  };

  const backButtonPressHandler = () => {
    navigation.navigate(routes.TRANSACTIONS);
  };

  const driverCallButtonPressHandler = number => {
    console.log(number);
    phoneCallService(number);
  };

  const addNewCreditCardPressHandler = () => {
    const unwrappedBookingId =
      bookingId !== 0
        ? bookingId
        : bookingAcceptNotification.bookingId !== 0
        ? bookingAcceptNotification.bookingId
        : pickupInfo.bookingId
        ? pickupInfo.bookingId
        : 0;
    if (unwrappedBookingId) {
      navigation.navigate(routes.ADD_NEW_CARD, {
        fromRoute: routes.DRIVER_SEARCH,
        bookingId: bookingAcceptNotification.bookingId,
      });
    }
  };

  // CHECK BOOKING RATING NAVIGATION
  useEffect(() => {
    checkBookingRated();
  }, [checkBookingRated, bookingRated]);

  const checkBookingRated = useCallback(async () => {
    const timer = setTimeout(() => {
      console.log(
        "***** check booking is rated or not *****",
        bookingRated,
        bookingAcceptNotification,
      );
      if (bookingRated) {
        console.log("***** yes rated! so going to home *****");
        navigation.popToTop();
      }
    }, 500);
    return () => {
      clearTimeout(timer);
    };
  }, [bookingAcceptNotification, bookingRated, navigation]);

  let TouchableComponent = TouchableOpacity;
  if (Platform.OS === "android" && Platform.Version >= 21) {
    TouchableComponent = TouchableNativeFeedback;
  }

  return (
    <View style={styles.screen}>
      {Platform.OS === "ios" ? (
        showLightStatusBar ? (
          <StatusBar translucent barStyle="light-content" />
        ) : (
          <StatusBar translucent barStyle="dark-content" />
        )
      ) : null}
      <MapView
        ref={mapView}
        style={styles.map}
        initialRegion={{
          latitude: constants.INITIAL_LATITUDE,
          longitude: constants.INITIAL_LONGITUDE,
          latitudeDelta: 0,
          longitudeDelta: 0,
        }}
        // provider={PROVIDER_GOOGLE}
        loadingIndicatorColor={colors.primary}>
        {/* ******************************************************************** */}
        {/* ************* NEW UI IMPLEMENTATION FOR CUSTOMER APP *************** */}
        {/* ******************************************************************** */}
        <Marker
          coordinate={{
            latitude: pickupLatitude,
            longitude: pickupLongitude,
            latitudeDelta: constants.PLACE_LATITUDE_DELTA,
            longitudeDelta: constants.PLACE_LONGITUDE_DELTA,
          }}>
          <ImageMarker
            pickup={true}
            pickupText={
              pickupName.length > 0
                ? pickupName
                : pickupAddress.length > 0
                ? pickupAddress
                : null
            }
          />
        </Marker>
        <Marker
          coordinate={{
            latitude: destinationLatitude,
            longitude: destinationLongitude,
            latitudeDelta: constants.PLACE_LATITUDE_DELTA,
            longitudeDelta: constants.PLACE_LONGITUDE_DELTA,
          }}>
          <ImageMarker
            destination={true}
            destinationText={
              destinationName.length > 0
                ? destinationName
                : deliveryAddress.length > 0
                ? deliveryAddress
                : null
            }
          />
        </Marker>
        <Polyline
          coordinates={[
            {latitude: pickupLatitude, longitude: pickupLongitude},
            ...wayPoints,
            {latitude: destinationLatitude, longitude: destinationLongitude},
          ]}
          strokeWidth={4}
          strokeColor={colors.primary}
        />
        {/* ******************************************************************** */}
        {/* *********** COMMENTED DUE TO REMOVAL OF LIVE DIRECTIONS ***********  */}
        {/* ******************************************************************** */}
        {/* {driverFound === false ||
        (driverLocation.latitude === 0 && driverLocation.longitude === 0) ||
        driverOnTheWayToPickup ? (
          <Marker
            coordinate={{
              latitude: pickupLatitude,
              longitude: pickupLongitude,
              latitudeDelta: constants.PLACE_LATITUDE_DELTA,
              longitudeDelta: constants.PLACE_LONGITUDE_DELTA,
            }}>
            <ImageMarker
              pickup={true}
              pickupText={
                pickupName.length > 0
                  ? pickupName
                  : pickupAddress.length > 0
                  ? pickupAddress
                  : null
              }
            />
          </Marker>
        ) : null} */}
        {/* {driverFound === false ||
        (driverLocation.latitude === 0 && driverLocation.longitude === 0) ||
        driverOnTheWayToDrop ? (
          <Marker
            coordinate={{
              latitude: destinationLatitude,
              longitude: destinationLongitude,
              latitudeDelta: constants.PLACE_LATITUDE_DELTA,
              longitudeDelta: constants.PLACE_LONGITUDE_DELTA,
            }}>
            <ImageMarker
              destination={true}
              destinationText={
                destinationName.length > 0
                  ? destinationName
                  : deliveryAddress.length > 0
                  ? deliveryAddress
                  : null
              }
            />
          </Marker>
        ) : null} */}
        {/* {driverFound === false ||
        (driverLocation.latitude === 0 && driverLocation.longitude === 0) ? (
          <Polyline
            coordinates={[
              {latitude: pickupLatitude, longitude: pickupLongitude},
              ...wayPoints,
              {latitude: destinationLatitude, longitude: destinationLongitude},
            ]}
            strokeWidth={4}
            strokeColor={colors.primary}
          />
        ) : null} */}
        {(driverOnTheWayToPickup || driverOnTheWayToDrop) &&
        driverLocation.latitude !== 0 &&
        driverLocation.longitude !== 0 ? (
          <Marker
            coordinate={{
              latitude: driverLocation.latitude,
              longitude: driverLocation.longitude,
              latitudeDelta: constants.PLACE_LATITUDE_DELTA,
              longitudeDelta: constants.PLACE_LONGITUDE_DELTA,
            }}
            style={{
              transform: [{rotate: `${driverLocation.heading}deg`}],
            }}
            tracksViewChanges={false}>
            <ImageMarker vehicleId={driverLocation.vehicleId} />
          </Marker>
        ) : null}
        {/* {driverOnTheWayToPickup &&
        driverLocation.latitude !== 0 &&
        driverLocation.longitude !== 0 ? (
          <Polyline
            coordinates={[
              {
                latitude: driverLocation.latitude,
                longitude: driverLocation.longitude,
              },
              ...driverToPickupWayPoints,
              {latitude: pickupLatitude, longitude: pickupLongitude},
            ]}
            strokeWidth={4}
            strokeColor={colors.primary}
          />
        ) : null} */}
        {/* {driverOnTheWayToDrop &&
        driverLocation.latitude !== 0 &&
        driverLocation.longitude !== 0 ? (
          <Polyline
            coordinates={[
              {
                latitude: driverLocation.latitude,
                longitude: driverLocation.longitude,
              },
              ...driverToDeliveryWayPoints,
              {latitude: destinationLatitude, longitude: destinationLongitude},
            ]}
            strokeWidth={4}
            strokeColor={colors.primary}
          />
        ) : null} */}
      </MapView>
      <SafeAreaView>
        <View style={styles.arrowButtonContainer}>
          <TouchableComponent
            activeOpacity={0.75}
            onPress={backButtonPressHandler}>
            <View>
              <Ionicons
                name={
                  Platform.OS === "android"
                    ? "md-chevron-back"
                    : "ios-chevron-back"
                }
                size={fontSizes.headerIcon}
                color={colors.textPrimary}
              />
            </View>
          </TouchableComponent>
        </View>
      </SafeAreaView>
      {showDriverDetails ? (
        <View style={{...styles.bottomContainer, ...styles.locationAdjust}}>
          <SafeAreaView>
            <View style={{...styles.locationContainer}}>
              <LocationIndicator
                style={styles.locationView}
                onPress={locationIndicatorPressHandler}
              />
            </View>
          </SafeAreaView>
        </View>
      ) : null}
      {showDriverDetails ? (
        <Modalize
          ref={sheetRef}
          modalStyle={styles.modal}
          alwaysOpen={250}
          scrollViewProps={{showsVerticalScrollIndicator: false}}
          snapPoint={250}
          handleStyle={{backgroundColor: colors.fade}}
          disableScrollIfPossible={false}
          onPositionChange={position => {
            setShowLightStatusBar(position !== "initial");
          }}>
          <DriverOnTheWay
            fare={totalFare}
            paymentInfo={paymentInfo}
            onCancelBookingPress={() => {
              setShowDrawerMenu(true);
              setShowCancelRide(true);
            }}
            onCallButtonPress={driverCallButtonPressHandler}
            onAddNewCreditCardPress={addNewCreditCardPressHandler}
            driverOnTheWayToPickup={onTheWayToPickup}
            driverOnTheWayToDrop={onTheWayToDrop}
            serviceTypeId={serviceTypeId}
            distance={driverDistance}
            time={driverArrivalTime}
          />
        </Modalize>
      ) : (
        <View style={styles.bottomContainer}>
          <View style={styles.locationContainer}>
            <LocationIndicator
              style={styles.locationView}
              onPress={locationIndicatorPressHandler}
            />
          </View>
          <PopupView style={styles.bottomView} roundTop={true}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.title}>
              {localize("processing_booking").toUpperCase()}
            </Text>
            <Text style={styles.details}>{localize("ride_is_starting")}</Text>
            <View style={styles.sliderContainer}>
              <CancelSlider
                onCancel={() => {
                  setShowDrawerMenu(true);
                  setShowCancelRide(true);
                }}
              />
            </View>
          </PopupView>
        </View>
      )}
      <Modal
        style={styles.cancelRideContainer}
        backdropOpacity={0.5}
        isVisible={showDrawerMenu}
        swipeDirection="down"
        onSwipeComplete={() => {
          setShowCancelRide(false);
          setShowDrawerMenu(false);
        }}
        onBackdropPress={() => {
          setShowCancelRide(false);
          setShowDrawerMenu(false);
        }}>
        <SafeAreaView style={styles.flex_1}>
          <View style={styles.bottomContainer}>
            {showCancelRide ? (
              <CancelRide
                onKeepButtonPress={keepRideButtonPressHandler}
                onCancelButtonPress={cancelRideButtonPressHandler}
              />
            ) : (
              <CancelReasonsView
                onSubmitButtonPress={cancelReasonButtonPressHandler}
              />
            )}
          </View>
        </SafeAreaView>
      </Modal>
      <Loader show={showLoader} />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "white",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  arrowButtonContainer: {
    width: 50,
    // height: 50,
    marginVertical: 10,
    marginHorizontal: 16,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
    zIndex: 2,
  },
  locationAdjust: {
    top: height - 300,
  },
  bottomContainer: {
    bottom: 0,
    position: "absolute",
    width: "100%",
    zIndex: 1,
  },
  bottomView: {
    paddingTop: 25,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  locationContainer: {
    alignItems: "flex-end",
  },
  locationView: {
    width: 40,
    height: 40,
    marginRight: 16,
    marginBottom: 16,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: fontSizes.body_semi_medium,
    margin: 15,
  },
  details: {
    color: colors.textPrimary,
    fontFamily: fonts.regular,
    fontSize: fontSizes.body_semi_medium,
  },
  sliderContainer: {
    flex: 1,
    width: "100%",
    borderRadius: 25,
    height: 50,
    backgroundColor: colors.fade,
    justifyContent: "center",
    marginVertical: 30,
  },
  cancelRideContainer: {
    margin: 0,
  },
  modal: {
    backgroundColor: "#FFFFFF00",
  },
  flex_1: {
    flex: 1,
  },
});

export default DriverSearchScreen;
