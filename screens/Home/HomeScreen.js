import React, {useCallback, useState, useRef} from "react";
import {
  View,
  SafeAreaView,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  TouchableNativeFeedback,
  AppState,
} from "react-native";
import Geolocation from "react-native-geolocation-service";
import MapView, {PROVIDER_GOOGLE} from "react-native-maps";
import Feather from "react-native-vector-icons/Feather";
import Ionicons from "react-native-vector-icons/Ionicons";

import fonts from "../../constants/fonts";
import colors from "../../constants/colors";
import fontSizes from "../../constants/font-sizes";
import {localize} from "../../translations/localized";
import * as constants from "../../constants/general";
import * as routes from "../../navigation/routes/app-routes";

import {hasLocationPermission} from "../../services/location-service";

import Loader from "../../components/UI/Loading/Loader";
import PopupView from "../../components/UI/Popup/PopupView";
import LocationIndicator from "../../components/UI/LocationIndicator/LocationIndicator";
import TouchableView from "../../components/UI/Buttons/TouchableView";

const HomeScreen = ({navigation}) => {
  const mapView = useRef();
  const [showLoader, setShowLoader] = useState(false);
  const [userLocation, setUserLocation] = useState(null); // GeoCoordinates
  const appState = useRef(AppState.currentState);

  React.useEffect(() => {
    const subscription = AppState.addEventListener("change", nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        console.log("App has come to the foreground!");
      }

      appState.current = nextAppState;
      console.log("AppState", appState.current);
      if (appState.current === "active") {
        getCurrentPosition();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [getCurrentPosition]);

  const getCurrentPosition = useCallback(() => {
    setShowLoader(true);
    Geolocation.getCurrentPosition(
      position => {
        setUserLocation(position.coords);
        setShowLoader(false);
        console.log(position);
        mapView?.current?.animateToRegion(
          {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            latitudeDelta: constants.LATITUDE_DELTA,
            longitudeDelta: constants.LONGITUDE_DELTA,
          },
          1000,
        );
      },
      error => {
        setShowLoader(false);
        console.log(error);
      },
      {
        accuracy: {
          android: "high",
          ios: "best",
        },
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
        // distanceFilter: 0,
        useSignificantChanges: true,
      },
    );
  }, []);

  const getLocation = useCallback(async () => {
    const locationEnabled = await hasLocationPermission();
    if (!locationEnabled) {
      return;
    }
    getCurrentPosition();
  }, [getCurrentPosition]);

  React.useEffect(() => {
    const focusSubscription = navigation.addListener("focus", getLocation);
    return focusSubscription;
  }, [navigation, getLocation]);

  const destinationPressHandler = async () => {
    const locationEnabled = await hasLocationPermission();
    if (!locationEnabled) {
      return;
    }
    navigation.navigate(routes.CHOOSE_DESTINATION, {
      userLocation: userLocation,
    });
  };

  const locationIndicatorPressHandler = () => {
    mapView?.current?.animateToRegion(
      {
        latitude: userLocation?.latitude ?? 0,
        longitude: userLocation?.longitude ?? 0,
        latitudeDelta: constants.LATITUDE_DELTA,
        longitudeDelta: constants.LONGITUDE_DELTA,
      },
      1000,
    );
  };

  let TouchableComponent = TouchableOpacity;
  if (Platform.OS === "android" && Platform.Version >= 21) {
    TouchableComponent = TouchableNativeFeedback;
  }

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
        showsMyLocationButton={false}
        showsCompass
        // provider={PROVIDER_GOOGLE}
        loadingIndicatorColor={colors.primary}
      />
      <SafeAreaView>
        <View style={styles.backButtonContainer}>
          <TouchableComponent
            activeOpacity={0.75}
            onPress={() => {
              navigation.navigate(routes.TRANSACTIONS);
            }}>
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
      <View style={styles.bottomContainer}>
        <View style={styles.locationContainer}>
          <LocationIndicator
            style={styles.locationView}
            onPress={locationIndicatorPressHandler}
          />
        </View>
        <SafeAreaView style={styles.flex_1}>
          <PopupView style={styles.bottomView} roundTop={true}>
            <Text style={styles.title}>
              {localize("where_are_you_sending")}
            </Text>
            <Text style={styles.details}>
              {localize("book_on_demand_rides")}
            </Text>
            <TouchableView
              style={styles.destinationContainer}
              onPress={destinationPressHandler}>
              <View style={styles.buttonContainer}>
                <Text style={styles.buttonText}>
                  {localize("enter_destination")}
                </Text>
                <Feather name="search" size={15} color={colors.primary} />
              </View>
            </TouchableView>
          </PopupView>
        </SafeAreaView>
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
    bottom: 150,
  },
  backButtonContainer: {
    width: 50,
    height: 50,
    marginVertical: 10,
    marginHorizontal: 16,
  },
  bottomContainer: {
    bottom: 0,
    position: "absolute",
    width: "100%",
  },
  bottomView: {
    paddingTop: 30,
    paddingHorizontal: 16,
    paddingBottom: 24,
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
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 15,
  },
  buttonText: {
    color: colors.field,
    fontFamily: fonts.regular,
    fontSize: fontSizes.body_semi_medium,
  },
  flex_1: {
    flex: 1,
    backgroundColor: "white",
  },
});

export default HomeScreen;
