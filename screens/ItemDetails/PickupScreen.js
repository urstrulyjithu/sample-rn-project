import React, {useState, useRef, useCallback} from "react";
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
} from "react-native";
import MapView, {Marker, Polyline, PROVIDER_GOOGLE} from "react-native-maps";
import {useSelector, useDispatch} from "react-redux";
import {Modalize} from "react-native-modalize";
import moment from "moment";
import Ionicons from "react-native-vector-icons/Ionicons";

import fonts from "../../constants/fonts";
import colors from "../../constants/colors";
import fontSizes from "../../constants/font-sizes";
import {localize} from "../../translations/localized";
import * as constants from "../../constants/general";
import * as routes from "../../navigation/routes/app-routes";
import * as selectRideActions from "../../redux/actions/select-ride";
// import * as wayPointsActions from "../../redux/actions/way-points";
import {Modal} from "react-native-paper";
// import useDirections from "../../api/getDirections/get-directions";
import useAvailableRides from "../../api/getAvailableRides/getAvailableRides";

import Loader from "../../components/UI/Loading/Loader";
import BookingDetailsView from "../../components/BookingDetails/BookingDetailsView";
import ImageMarker from "../../components/UI/Marker/ImageMarker";
import LocationIndicator from "../../components/UI/LocationIndicator/LocationIndicator";
import RoundButton from "../../components/UI/Buttons/RoundButton";
import PickupTimeScreen from "./PickupTimeScreen";
import DropTimeScreen from "./DropTimeScreen";

import SavedAddress from "../../models/savedAddress";
import GeoCodedAddress from "../../models/geoCodedAddress";
import PopupAlert from "../../components/UI/Alert/PopupAlert";
import ErrorText from "../../components/UI/Texts/ErrorText";

const height = Dimensions.get("window").height;

const PickupScreen = ({navigation}) => {
  // const profile = Profile.class(
  //   useSelector((state) => state.getProfile.profile),
  // );
  const mapView = useRef();
  const sheetRef = React.useRef(null);
  const dispatch = useDispatch();
  const scrollView = useRef();

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

  const productDetails = useSelector(
    state => state.productDetails.productDetails,
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

  const [showLoader, setShowLoader] = useState(false);
  const [callAPI, setCallAPI] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [noRideSelectionError, setNoRideSelectionError] = useState(null);
  const [availableRides, setAvailableRides] = useState([]);
  const [wayPoints, setWayPoints] = useState([]);
  const [selectedRide, setSelectedRide] = useState(null);
  const [showLightStatusBar, setShowLightStatusBar] = useState(false);
  // const [onGetDirections, wayPoints, responseError] = useDirections();
  const [onGetRides, getRidesResponse, getRidesError] = useAvailableRides();
  const [showGetRidesErrorAlert, setShowGetRidesErrorAlert] = useState(false);
  const [showPickupTime, setShowPickupTime] = useState(true);
  const [openPicker, setOpenPicker] = useState(true);
  const [showDropTime, setShowDropTime] = useState(false);
  const getDirections = useCallback(async () => {
    setShowLoader(true);
    setErrorMessage(null);
    try {
      let sensitivity = null;
      if (productDetails.sensitivity === 1) {
        sensitivity = "L";
      } else if (productDetails.sensitivity === 2) {
        sensitivity = "M";
      } else if (productDetails.sensitivity === 3) {
        sensitivity = "H";
      }
      onGetRides(
        pickupLatitude.toFixed(7),
        pickupLongitude.toFixed(7),
        destinationLatitude.toFixed(7),
        destinationLongitude.toFixed(7),
        productDetails.immediatePickup,
        productDetails.immediatePickup === false ||
          productDetails.immediateDrop === false
          ? "S"
          : "N",
        productDetails.type,
        +productDetails.cost,
        sensitivity,
        productDetails.insurance > 0,
        productDetails.helpersCount,
        moment(productDetails.pickupTime).format("DD-MM-YYYY HH:mm:ss"),
        !productDetails.immediateDrop,
        moment(productDetails.dropTime).format("DD-MM-YYYY HH:mm:ss"),
      );
    } catch (error) {
      setErrorMessage(error);
    }
    setShowLoader(false);
  }, [
    onGetRides,
    pickupLatitude,
    pickupLongitude,
    destinationLatitude,
    destinationLongitude,
    productDetails,
  ]);

  const setPickupTimeButtonPressHandler = (immediatePickup, date) => {
    console.log("Pickup d", date);
    // dispatch(
    //   productDetailsActions.saveProductDetails({
    //     type: productType,
    //     description: productDescription,
    //     cost: productCost,
    //     sensitivity: sensitivity,
    //     helpersCount: shippersCount,
    //     insurance: insurance,
    //     immediatePickup: immediatePickup,
    //     pickupTime: immediatePickup ? new Date() : date,
    //     immediateDrop: true,
    //     dropTime: productDetails.dropTime,
    //     giveTip: parseFloat(driverTipAmount) > 0,
    //     tipAmount: +driverTipAmount,
    //     giveCarbonFreeTip: parseFloat(carbonFreeTipAmount) > 0,
    //     carbonFreeTipAmount: +carbonFreeTipAmount,
    //   }),
    // );
    setOpenPicker(false);
    setShowPickupTime(false);
    setTimeout(() => {
      scrollView.current.scrollToEnd({animated: true});
    }, 200);
  };

  React.useEffect(() => {
    console.log("getRidesResponse", getRidesResponse);
    if (getRidesResponse) {
      const rides = getRidesResponse.availableRides;
      const directionWayPoints = getRidesResponse.wayPoints;
      setAvailableRides(rides);
      setWayPoints(directionWayPoints);
    } else if (getRidesError) {
      console.log("getRidesError", getRidesError);
      setErrorMessage(getRidesError);
      setShowGetRidesErrorAlert(true);
    }
    setShowLoader(false);
  }, [getRidesResponse, getRidesError]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (callAPI === true) {
        getDirections();
        console.log("Calling Directions API");
        setCallAPI(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [getDirections, callAPI]);

  React.useEffect(() => {
    if (wayPoints.length > 0) {
      // dispatch(wayPointsActions.saveWayPoints(wayPoints));
      setTimeout(() => {
        if (mapView.current === null) {
          return;
        }
        mapView.current.fitToCoordinates(
          [
            {latitude: pickupLatitude ?? 0, longitude: pickupLongitude ?? 0},
            ...wayPoints,
            {
              latitude: destinationLatitude ?? 0,
              longitude: destinationLongitude ?? 0,
            },
          ],
          {
            edgePadding: {top: 50, right: 50, bottom: 100, left: 50},
            animated: true,
          },
        );
      }, 1000);
    }
  }, [
    dispatch,
    wayPoints,
    pickupLatitude,
    pickupLongitude,
    destinationLatitude,
    destinationLongitude,
  ]);

  const headerButtonPressHandler = () => {
    navigation.navigate(routes.CHOOSE_DESTINATION);
  };

  const locationIndicatorPressHandler = () => {
    mapView.current.fitToCoordinates(
      [
        {latitude: pickupLatitude, longitude: pickupLongitude},
        ...wayPoints,
        {latitude: destinationLatitude, longitude: destinationLongitude},
      ],
      {
        edgePadding: {top: 50, right: 50, bottom: 100, left: 50},
        animated: true,
      },
    );
  };

  const ridePressHandler = ride => {
    setNoRideSelectionError("");
    setSelectedRide(ride);
  };

  const bookNowButtonPressHandler = () => {
    setNoRideSelectionError("");
    if (selectedRide) {
      dispatch(selectRideActions.saveSelectedRide(selectedRide));
      navigation.navigate(routes.DROP_TIME);
    } else {
      setNoRideSelectionError(localize("ride_selection_error"));
    }
  };

  const backButtonPressHandler = () => {
    navigation.pop();
  };

  let TouchableComponent = TouchableOpacity;
  if (Platform.OS === "android" && Platform.Version >= 21) {
    TouchableComponent = TouchableNativeFeedback;
  }

  return (
    <View style={styles.screen}>
      {Platform.OS === "ios" && showLightStatusBar ? (
        <StatusBar translucent barStyle="light-content" />
      ) : null}
      <MapView
        ref={mapView}
        style={availableRides?.length > 0 ? styles.map : styles.fullMap}
        initialRegion={{
          latitude: constants.INITIAL_LATITUDE,
          longitude: constants.INITIAL_LONGITUDE,
          latitudeDelta: 0,
          longitudeDelta: 0,
        }}
        // provider={PROVIDER_GOOGLE}
        loadingIndicatorColor={colors.primary}>
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
          strokeWidth={3}
          strokeColor={colors.primary}
        />
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
      <SafeAreaView style={styles.flex_1}>
        {errorMessage ? (
          <View style={styles.errorContainer}>
            <ErrorText error={errorMessage} />
          </View>
        ) : null}
      </SafeAreaView>
      <View style={styles.locationContainer}>
        <LocationIndicator
          style={styles.locationView}
          onPress={locationIndicatorPressHandler}
        />
      </View>
      <SafeAreaView style={styles.bottomContainer}>
        <Modal
          style={styles.pickupViewContainer}
          backdropOpacity={0.5}
          isVisible={true}
          swipeDirection="down"
          onSwipeComplete={() => {
            setOpenPicker(false);
          }}
          onBackdropPress={() => {
            setOpenPicker(false);
          }}>
          {showPickupTime ? (
            <PickupTimeScreen
              isImmediatePickup={productDetails.immediatePickup}
              pickupDate={productDetails.pickupTime}
              onPickupTimeButtonPress={setPickupTimeButtonPressHandler}
              navigation={navigation}
            />
          ) : (
            <></>
          )}
        </Modal>
        <View style={styles.buttonContainer}>
          <RoundButton
            style={styles.button}
            title={localize("book_now").toUpperCase()}
            onPress={bookNowButtonPressHandler}
          />
        </View>
      </SafeAreaView>

      <Loader show={showLoader} />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "white",
  },
  pickupViewContainer: {
    margin: 0,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
    bottom: 300,
  },
  fullMap: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    flexDirection: "row",
  },
  arrowButtonContainer: {
    width: 50,
    height: 50,
    marginVertical: 10,
    marginHorizontal: 16,
  },
  locationsContainer: {
    flex: 1,
    flexDirection: "row",
    marginVertical: 10,
    marginHorizontal: 16,
    backgroundColor: "white",
    shadowColor: colors.textPrimary,
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 5},
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonContainer: {
    marginVertical: 10,
    paddingLeft: 16,
  },
  locationText: {
    color: colors.textPrimary,
    fontFamily: fonts.medium,
    fontSize: fontSizes.body_semi_medium,
    maxWidth: "40%",
  },
  forwardIcon: {
    paddingHorizontal: 8,
  },
  modal: {
    backgroundColor: "#FFFFFF",
  },
  locationContainer: {
    zIndex: 0,
    alignItems: "flex-end",
    top: height - 515,
  },
  locationView: {
    width: 40,
    height: 40,
    marginRight: 16,
    marginBottom: 16,
  },
  bottomContainer: {
    backgroundColor: "white",
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50000,
  },
  buttonContainer: {
    marginHorizontal: 16,
    marginVertical: 16,
    height: 50,
  },
  button: {
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  flex_1: {
    flex: 1,
  },
  errorContainer: {
    backgroundColor: "white",
    position: "absolute",
    bottom: 0,
    left: 16,
    right: 16,
  },
  ride_selection_error: {
    marginHorizontal: 16,
  },
});

export default PickupScreen;
