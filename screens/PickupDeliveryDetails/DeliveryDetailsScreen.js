import React, {useCallback, useState, useRef} from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableNativeFeedback,
  TouchableOpacity,
  KeyboardAvoidingView,
  Keyboard,
  Switch,
  PermissionsAndroid,
  Alert,
  Dimensions,
  SafeAreaView,
} from "react-native";
import {useSelector, useDispatch} from "react-redux";
import MapView, {PROVIDER_GOOGLE, Marker} from "react-native-maps";
import AntDesign from "react-native-vector-icons/AntDesign";
import {selectContactPhone} from "react-native-select-contact";
import Ionicons from "react-native-vector-icons/Ionicons";

import fonts from "../../constants/fonts";
import colors from "../../constants/colors";
import fontSizes from "../../constants/font-sizes";
import {localize} from "../../translations/localized";
import * as constants from "../../constants/general";
import * as routes from "../../navigation/routes/app-routes";
import * as deliveryDetailsActions from "../../redux/actions/delivery-details";
import useAddFavoriteAddress from "../../api/addFavoriteAddress/addFavoriteAddress";
import * as addressBookActions from "../../redux/actions/address-book";

import PopupView from "../../components/UI/Popup/PopupView";
import PickupMarker from "../../components/UI/Marker/PickupMarker";
import RoundButton from "../../components/UI/Buttons/RoundButton";
import InputField from "../../components/UI/Inputs/InputField";
import ErrorText from "../../components/UI/Texts/ErrorText";
import Loader from "../../components/UI/Loading/Loader";

import SavedAddress from "../../models/savedAddress";
import GeoCodedAddress from "../../models/geoCodedAddress";
import PopupAlert from "../../components/UI/Alert/PopupAlert";

const DeliveryDetailsScreen = ({navigation}) => {
  const LOCATION_DETAILS = localize("location_details");
  const PHONE_NUMBER = localize("phone_number");
  const RECIPIENT_NAME = localize("recipient_name");
  const SAVE_ADDRESS = localize("save_the_address");

  const dispatch = useDispatch();
  const mapView = useRef();

  const fieldsSwitched = useSelector(state => state.fieldsSwitch.switched);
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
  const deliveryDetails = useSelector(
    state => state.deliveryDetails.deliveryDetails,
  );

  const latitude =
    destinationGeoCodedAddress?.latitude !== 0
      ? destinationGeoCodedAddress?.latitude
      : destinationSavedAddress?.latitude !== 0
      ? destinationSavedAddress?.latitude
      : 0;
  const longitude =
    destinationGeoCodedAddress?.longitude !== 0
      ? destinationGeoCodedAddress?.longitude
      : destinationSavedAddress?.longitude !== 0
      ? destinationSavedAddress?.longitude
      : 0;

  const name =
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

  const placeId =
    destinationGeoCodedAddress?.placeId?.length > 0
      ? destinationGeoCodedAddress?.placeId
      : destinationSavedAddress?.placeId?.length > 0
      ? destinationSavedAddress?.placeId
      : "";

  const [errorMessage, setErrorMessage] = useState(null);
  const [showMarker, setShowMarker] = useState(false);
  const [locationDetails, setLocationDetails] = useState(
    deliveryDetails.locationDetails,
  );
  const [recipientName, setSenderName] = useState(
    deliveryDetails.recipientName,
  );
  const [phoneNumber, setPhoneNumber] = useState(deliveryDetails.phoneNumber);
  const [saveAddress, setSaveAddress] = useState(deliveryDetails.saveAddress);
  const [showLoader, setShowLoader] = useState(false);
  const [showContactsAlert, setShowContactsAlert] = useState(false);
  const [
    showAddFavoriteAddressAlert,
    setShowAddFavoriteAddressAlert,
  ] = useState(false);
  const [showFavoriteAddressAlert, setShowFavoriteAddressAlert] = useState(
    false,
  );
  const [favoriteAddressMessage, setFavoriteAddressMessage] = useState("");
  const [
    saveFavoriteAddress,
    favoriteAddressResponse,
    favoriteAddressResponseError,
  ] = useAddFavoriteAddress();

  React.useEffect(() => {
    const timer = setTimeout(() => {
      loadMapWithPickupDetails();
    }, 1000);
    const timer_2 = setTimeout(() => {
      setShowMarker(true);
    }, 2000);
    return () => {
      clearTimeout(timer);
      clearTimeout(timer_2);
    };
  }, [loadMapWithPickupDetails, latitude, longitude]);

  const loadMapWithPickupDetails = useCallback(() => {
    mapView?.current?.animateToRegion(
      {
        latitude: latitude - constants.LATITUDE_CORRECTION,
        longitude: longitude,
        latitudeDelta: constants.MARKER_LATITUDE_DELTA,
        longitudeDelta: constants.MARKER_LONGITUDE_DELTA,
      },
      1000,
    );
  }, [latitude, longitude]);

  const fieldChangeHandler = (newValue, field) => {
    setErrorMessage("");
    switch (field) {
      case LOCATION_DETAILS:
        if (locationDetails.length > 0 || newValue.trim() !== "") {
          let value = newValue.replace(/[^A-Za-z0-9. _'-]/gi, "");
          setLocationDetails(value);
        }
        break;
      case RECIPIENT_NAME:
        if (recipientName.length > 0 || newValue.trim() !== "") {
          let value = newValue.replace(/[^A-Za-z. _'-]/gi, "");
          setSenderName(value);
        }
        break;
      case PHONE_NUMBER:
        let regex = /^[0-9]{0,10}$/;
        if (regex.test(newValue)) {
          setPhoneNumber(newValue);
        }
    }
  };

  const fieldEndEditingHandler = () => {
    setLocationDetails(locationDetails.trim());
    setSenderName(recipientName.trim());
    setPhoneNumber(phoneNumber.trim());
  };

  const validateFields = () => {
    const nameRegex = /^[A-Za-z. _'-]{3,}$/;
    const phoneRegex = /^[0-9]{10}$/;
    if (locationDetails.trim().length < 3) {
      setErrorMessage(localize("location_details_error"));
      return false;
    } else if (!nameRegex.test(recipientName.trim())) {
      setErrorMessage(localize("recipient_name_error"));
      return false;
    } else if (!phoneRegex.test(phoneNumber.trim())) {
      setErrorMessage(localize("phone_number_error"));
      return false;
    }
    setErrorMessage("");
    setLocationDetails(locationDetails);
    setSenderName(recipientName);
    setPhoneNumber(phoneNumber);
    return true;
  };

  const nextButtonPressHandler = async () => {
    Keyboard.dismiss();
    const isValid = validateFields();
    if (isValid) {
      dispatch(
        deliveryDetailsActions.saveDeliveryDetails({
          locationDetails,
          recipientName,
          phoneNumber,
          saveAddress,
        }),
      );
      navigation.navigate(routes.ITEM_DETAILS);
    }
  };

  const backButtonPressHandler = () => {
    navigation.pop();
  };

  const editButtonPressHandler = () => {
    navigation.navigate(routes.CHOOSE_DESTINATION);
  };

  const contactsPressHandler = async () => {
    Keyboard.dismiss();
    if (Platform.OS === "android") {
      PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_CONTACTS, {
        title: localize("contacts"),
        message: localize("contacts_access_message"),
        buttonPositive: localize("ok"),
        buttonNegative: localize("cancel"),
      })
        .then(value => {
          switch (value) {
            case "denied":
            case "never_ask_again":
              setShowContactsAlert(true);
              break;
            case "granted":
              selectContactPhone().then(contact => {
                if (contact !== null) {
                  setSenderName(
                    contact.contact.name.replace(/[^A-Za-z. _'-]/g, ""),
                  );
                  const number = contact.selectedPhone.number.replace(
                    /[^0-9]/g,
                    "",
                  );
                  if (number.length >= 10) {
                    setPhoneNumber(number.substr(number.length - 10));
                  } else {
                    setPhoneNumber(
                      contact.selectedPhone.number.replace(/[^0-9]/g, ""),
                    );
                  }
                }
              });
              break;
          }
        })
        .catch(reason => {
          console.log("reason", reason);
          setShowContactsAlert(true);
        });
    } else {
      selectContactPhone().then(contact => {
        if (contact !== null) {
          setSenderName(contact.contact.name.replace(/[^A-Za-z. _'-]/g, ""));
          const number = contact.selectedPhone.number.replace(/[^0-9]/g, "");
          if (number.length >= 10) {
            setPhoneNumber(number.substr(number.length - 10));
          } else {
            setPhoneNumber(contact.selectedPhone.number.replace(/[^0-9]/g, ""));
          }
        }
      });
    }
  };

  let TouchableComponent = TouchableOpacity;
  if (Platform.OS === "android" && Platform.Version >= 21) {
    TouchableComponent = TouchableNativeFeedback;
  }

  React.useEffect(() => {
    setShowLoader(false);
    if (favoriteAddressResponse) {
      console.log("favoriteAddressResponse", favoriteAddressResponse);
      setTimeout(() => {
        setShowFavoriteAddressAlert(true);
        setFavoriteAddressMessage(favoriteAddressResponse?.msg ?? "");
      }, 500);
    } else if (favoriteAddressResponseError) {
      setErrorMessage(favoriteAddressResponseError);
      console.log("favoriteAddressResponseError", favoriteAddressResponseError);
    }
  }, [favoriteAddressResponse, favoriteAddressResponseError]);

  const addFavoriteAddress = () => {
    setShowAddFavoriteAddressAlert(true);
  };

  const getAddressBook = () => {
    setErrorMessage(null);
    setShowLoader(true);
    try {
      dispatch(addressBookActions.getAddressBook());
    } catch (error) {
      setErrorMessage(error.message);
    }
    setShowLoader(false);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : null}
      style={styles.screen}>
      <View style={styles.screen}>
        <MapView
          ref={mapView}
          style={styles.map}
          pointerEvents="none"
          initialRegion={{
            latitude: constants.INITIAL_LATITUDE,
            longitude: constants.INITIAL_LONGITUDE,
            latitudeDelta: 0,
            longitudeDelta: 0,
          }}
          showsUserLocation
          showsMyLocationButton
          showsCompass
          // provider={PROVIDER_GOOGLE}
          loadingIndicatorColor={colors.primary}>
          {showMarker ? (
            <Marker
              coordinate={{
                latitude: latitude,
                longitude: longitude,
                latitudeDelta: constants.MARKER_LATITUDE_DELTA,
                longitudeDelta: constants.MARKER_LONGITUDE_DELTA,
              }}
              isPreselected>
              <PickupMarker
                isPickup={false}
                address={
                  destinationGeoCodedAddress.address.length > 0
                    ? destinationGeoCodedAddress.address
                    : destinationSavedAddress.line.length > 0
                    ? destinationSavedAddress.line
                    : ""
                }
              />
            </Marker>
          ) : null}
        </MapView>
        <SafeAreaView>
          <View style={styles.backButtonContainer}>
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
        <SafeAreaView style={styles.bottomContainer}>
          <TouchableOpacity activeOpacity={1.0} onPress={Keyboard.dismiss}>
            <PopupView style={styles.bottomView} roundTop={true}>
              <Text style={styles.title}>{localize("delivery_details")}</Text>
              <View style={styles.pickupLocationContainer}>
                <View style={styles.pickupDetailsContainer}>
                  {name.length > 0 ? (
                    <Text style={styles.pickupName} numberOfLines={2}>
                      {name}
                    </Text>
                  ) : null}
                  {deliveryAddress.length > 0 ? (
                    <Text style={styles.pickupDetails} numberOfLines={2}>
                      {deliveryAddress}
                    </Text>
                  ) : null}
                </View>
                <TouchableComponent
                  activeOpacity={0.75}
                  onPress={editButtonPressHandler}>
                  <View>
                    <Text style={styles.editText}>{localize("edit")}</Text>
                  </View>
                </TouchableComponent>
              </View>
              <InputField
                style={styles.field}
                placeholder={LOCATION_DETAILS}
                text={locationDetails}
                onTextChange={newValue => {
                  fieldChangeHandler(newValue, LOCATION_DETAILS);
                }}
                onTextSubmit={() =>
                  fieldChangeHandler(locationDetails, LOCATION_DETAILS)
                }
                maxLength={40}
                keyboardType="default"
                onEndEditing={fieldEndEditingHandler}
              />
              <InputField
                style={styles.field}
                placeholder={RECIPIENT_NAME}
                text={recipientName}
                onTextChange={newValue => {
                  fieldChangeHandler(newValue, RECIPIENT_NAME);
                }}
                onTextSubmit={() =>
                  fieldChangeHandler(recipientName, RECIPIENT_NAME)
                }
                maxLength={25}
                keyboardType="default"
                onEndEditing={fieldEndEditingHandler}
                suffix={
                  <AntDesign name="contacts" size={30} color={colors.primary} />
                }
                onSuffixPress={contactsPressHandler}
              />
              <InputField
                style={{...styles.field, ...styles.phone}}
                placeholder={PHONE_NUMBER}
                text={phoneNumber}
                onTextChange={newValue => {
                  fieldChangeHandler(newValue, PHONE_NUMBER);
                }}
                onTextSubmit={() =>
                  fieldChangeHandler(phoneNumber, PHONE_NUMBER)
                }
                maxLength={10}
                keyboardType="phone-pad"
                onEndEditing={fieldEndEditingHandler}
                prefix="+1"
              />
              <View style={styles.elementsContainer}>
                <View style={styles.saveAddressContainer}>
                  <Text style={styles.saveAddress}>{SAVE_ADDRESS}</Text>
                  <Switch
                    disabled={
                      locationDetails.toString().length === 0 ||
                      recipientName.length === 0 ||
                      phoneNumber.length === 0
                    }
                    trackColor={{
                      false: Platform.OS === "android" && colors.fade,
                      true: colors.primary,
                    }}
                    thumbColor={
                      Platform.OS === "android" &&
                      (saveAddress ? colors.primary : colors.border)
                    }
                    value={saveAddress}
                    onValueChange={newValue => {
                      if (newValue) {
                        addFavoriteAddress();
                      }
                      setSaveAddress(newValue);
                      setErrorMessage("");
                      Keyboard.dismiss();
                    }}
                  />
                </View>
              </View>
              {errorMessage ? (
                <View style={styles.elementsContainer}>
                  <ErrorText error={errorMessage} />
                </View>
              ) : null}
              <View style={styles.nextButtonContainer}>
                <RoundButton
                  style={styles.button}
                  title={localize("next").toUpperCase()}
                  onPress={nextButtonPressHandler}
                />
              </View>
            </PopupView>
          </TouchableOpacity>
        </SafeAreaView>
        <Loader show={showLoader} />
        <PopupAlert
          show={showContactsAlert}
          title={localize("error")}
          message={localize("contacts_access_message")}
          showOk
          onOkButtonPress={() => {
            setShowContactsAlert(false);
          }}
        />
        <PopupAlert
          show={showAddFavoriteAddressAlert}
          title={localize("success")}
          message={localize("save_address_message")}
          showOk
          showCancel
          onOkButtonPress={() => {
            setShowAddFavoriteAddressAlert(false);
            setShowLoader(true);
            saveFavoriteAddress(
              recipientName,
              phoneNumber,
              "S",
              `${recipientName}'s Address`,
              deliveryAddress,
              locationDetails,
              +parseFloat(longitude).toFixed(9),
              +parseFloat(latitude).toFixed(9),
              placeId,
            );
          }}
          onCancelButtonPress={() => {
            setShowAddFavoriteAddressAlert(false);
            setSaveAddress(false);
          }}
        />
        <PopupAlert
          show={showFavoriteAddressAlert}
          title={localize("success")}
          message={favoriteAddressMessage}
          showOk
          onOkButtonPress={() => {
            setShowFavoriteAddressAlert(false);
            getAddressBook();
          }}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "white",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
    bottom: Dimensions.get("window").height / 1.95,
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
    paddingBottom: 16,
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
  pickupLocationContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.bigTitle,
    color: colors.textPrimary,
    paddingBottom: 8,
  },
  pickupName: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.header,
    color: colors.textPrimary,
    paddingBottom: 8,
  },
  pickupDetailsContainer: {
    maxWidth: "85%",
  },
  pickupDetails: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.body_semi_medium,
    color: colors.textPrimary,
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
  editText: {
    paddingLeft: 18,
    paddingVertical: 12,
    color: colors.primary,
    fontFamily: fonts.bold,
    fontSize: fontSizes.body_semi_medium,
  },
  nextButtonContainer: {
    marginTop: 16,
    height: 50,
  },
  button: {
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  field: {
    marginTop: 16,
  },
  elementsContainer: {
    marginTop: 16,
  },
  saveAddressContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  saveAddress: {
    color: colors.textPrimary,
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.header,
  },
});

export default DeliveryDetailsScreen;
