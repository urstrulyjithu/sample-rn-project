import React, {useCallback, useState, useRef} from "react";
import {View, Text, StyleSheet, Dimensions, SafeAreaView} from "react-native";
import {useDispatch} from "react-redux";
import MapView, {PROVIDER_GOOGLE} from "react-native-maps";
import {useDebouncedCallback} from "use-debounce";

import fonts from "../../constants/fonts";
import colors from "../../constants/colors";
import fontSizes from "../../constants/font-sizes";
import {localize} from "../../translations/localized";
import * as constants from "../../constants/general";
import {PLACE_SELECTION_DEBOUNCE_DELAY} from "../../constants/general";
import * as sourceAddressActions from "../../redux/actions/source-address";
import * as sourceGeoCodedAddressActions from "../../redux/actions/source-geo-coded-address";
import * as destinationAddressActions from "../../redux/actions/destination-address";
import * as destinationGeoCodedAddressActions from "../../redux/actions/destination-geo-coded-address";

import LeftArrow from "../../components/UI/HeaderButtons/LeftArrow";
import Loader from "../../components/UI/Loading/Loader";
import PopupView from "../../components/UI/Popup/PopupView";
import LocationIndicator from "../../components/UI/LocationIndicator/LocationIndicator";
import RoundButton from "../../components/UI/Buttons/RoundButton";
import {MarkerSelect} from "../../constants/image";

import useGetAddress from "../../api/getAddress/getAddress";
import GeoCodedAddress from "../../models/geoCodedAddress";

const SetDestinationScreen = ({navigation, route}) => {
  const {isDestination, address, userLocation} = route.params;
  const dispatch = useDispatch();
  const mapView = useRef();

  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAnimation, setShowAnimation] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [disableButton, setDisableButton] = useState(false);
  const [onGetAddress, response, responseError] = useGetAddress();
  const addressName =
    selectedAddress?.name?.length > 0
      ? selectedAddress.name
      : selectedAddress?.address?.length > 0
      ? selectedAddress?.address
      : "";
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <LeftArrow
          onPress={() => {
            navigation.pop();
          }}
        />
      ),
      title: localize(""),
      headerRight: () => <View style={styles.rightBarButton} />,
    });
    setTimeout(() => {
      navigation.setOptions({
        title: addressName,
      });
      if (!showAnimation) {
        animateUserLocation();
      }
    }, 1000);
  }, [
    navigation,
    showAnimation,
    animateUserLocation,
    selectedAddress,
    userLocation,
    addressName,
  ]);

  React.useEffect(() => {
    setSelectedAddress(address);
  }, [address]);

  React.useEffect(() => {
    setShowLoader(false);
    setDisableButton(false);
    if (response) {
      console.log(response);
      setSelectedAddress(response);
    } else if (responseError) {
      setErrorMessage(responseError);
      console.log(responseError);
    }
  }, [response, responseError]);

  const animateUserLocation = useCallback(() => {
    setShowAnimation(true);
    setTimeout(() => {
      mapView?.current?.animateToRegion(
        {
          latitude: selectedAddress?.latitude ?? userLocation.latitude,
          longitude: selectedAddress?.longitude ?? userLocation.longitude,
          latitudeDelta: constants.PLACE_LATITUDE_DELTA,
          longitudeDelta: constants.PLACE_LONGITUDE_DELTA,
        },
        1000,
      );
    }, 500);
  }, [selectedAddress, userLocation]);

  const setDestinationButtonPressHandler = () => {
    const geoCodedAddress = GeoCodedAddress.class(selectedAddress);
    if (isDestination === false) {
      dispatch(sourceAddressActions.saveSourceAddress({}));
      dispatch(
        sourceGeoCodedAddressActions.saveSourceGeoCodedAddress(geoCodedAddress),
      );
    } else {
      dispatch(destinationAddressActions.saveDestinationAddress({}));
      dispatch(
        destinationGeoCodedAddressActions.saveDestinationGeoCodedAddress(
          geoCodedAddress,
        ),
      );
    }
    navigation.pop();
  };

  const locationIndicatorPressHandler = () => {
    mapView?.current?.animateToRegion(
      {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: constants.PLACE_LATITUDE_DELTA,
        longitudeDelta: constants.PLACE_LONGITUDE_DELTA,
      },
      1000,
    );
  };

  const onRegionChangeHandler = useDebouncedCallback(reg => {
    console.log(reg);
    setShowLoader(true);
    onGetAddress(reg.latitude, reg.longitude);
  }, PLACE_SELECTION_DEBOUNCE_DELAY);

  return (
    <View style={styles.screen}>
      <MapView
        ref={mapView}
        style={styles.map}
        initialRegion={{
          latitude: constants.INITIAL_LATITUDE,
          longitude: constants.INITIAL_LONGITUDE,
          latitudeDelta: 0,
          longitudeDelta: 0,
        }}
        showsUserLocation
        showsMyLocationButton
        showsCompass
        // zoomEnabled={false}
        // provider={PROVIDER_GOOGLE}
        loadingIndicatorColor={colors.primary}
        onRegionChangeComplete={region => {
          onRegionChangeHandler.callback(region);
          setDisableButton(true);
        }}
      />
      <View style={styles.markerFixed}>
        <MarkerSelect width={55} height={75} />
      </View>
      <View style={styles.bottomContainer}>
        <View style={styles.locationContainer}>
          <LocationIndicator
            style={styles.locationView}
            onPress={locationIndicatorPressHandler}
          />
        </View>
        <PopupView style={styles.bottomView} roundTop={true}>
          <SafeAreaView style={styles.flex_1}>
            <Text style={styles.title}>
              {isDestination
                ? localize("choose_a_destination")
                : localize("choose_a_source")}
            </Text>
            <Text style={styles.details}>
              {isDestination
                ? localize("select_destination_info")
                : localize("select_source_info")}
            </Text>
            <View
              style={styles.buttonContainer}
              pointerEvents={
                addressName === "" || disableButton ? "none" : "auto"
              }>
              <RoundButton
                style={
                  addressName === "" || disableButton
                    ? styles.fadedButton
                    : styles.button
                }
                title={
                  isDestination
                    ? localize("set_destination").toUpperCase()
                    : localize("set_source").toUpperCase()
                }
                onPress={setDestinationButtonPressHandler}
              />
            </View>
          </SafeAreaView>
        </PopupView>
      </View>
      <Loader show={showLoader} />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    ...StyleSheet.absoluteFillObject,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  rightBarButton: {
    width: 50,
    height: 50,
  },
  markerFixed: {
    position: "absolute",
    left: Dimensions.get("window").width / 2 - 55 / 2,
    bottom: Dimensions.get("window").height / 2 - 75 / 2 + 5,
  },
  bottomContainer: {
    bottom: 0,
    position: "absolute",
    width: "100%",
  },
  bottomView: {
    paddingTop: 30,
    paddingHorizontal: 16,
    height: "100%",
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
    fontFamily: fonts.bold,
    fontSize: fontSizes.bigTitle,
    color: colors.textPrimary,
    paddingBottom: 8,
  },
  details: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.body_semi_medium,
    color: colors.textPrimary,
    paddingBottom: 15,
  },
  destinationContainer: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 5,
    height: 50,
  },
  buttonContainer: {
    marginVertical: 16,
    height: 50,
  },
  button: {
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  fadedButton: {
    borderRadius: 5,
    backgroundColor: colors.fade,
  },
  flex_1: {
    flex: 1,
    // backgroundColor: "white",
  },
});

export default SetDestinationScreen;
