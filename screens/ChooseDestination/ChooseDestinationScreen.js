import React, {useState, useEffect, useCallback, useRef} from "react";
import {
  View,
  Text,
  SafeAreaView,
  TextInput,
  Platform,
  SectionList,
  StyleSheet,
  Keyboard,
  TouchableOpacity,
  Image,
} from "react-native";
import {useSelector, useDispatch} from "react-redux";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import "react-native-get-random-values";
import {useDebouncedCallback} from "use-debounce";

import fonts from "../../constants/fonts";
import colors from "../../constants/colors";
import fontSizes from "../../constants/font-sizes";
import {localize} from "../../translations/localized";
import * as addressBookActions from "../../redux/actions/address-book";
import * as constants from "../../constants/general";
import * as routes from "../../navigation/routes/app-routes";
import {LocationMark} from "../../constants/image";
import * as sourceGeoCodedAddressActions from "../../redux/actions/source-geo-coded-address";
import * as sourceSavedAddressActions from "../../redux/actions/source-address";
import * as destinationGeoCodedAddressActions from "../../redux/actions/destination-geo-coded-address";
import * as destinationSavedAddressActions from "../../redux/actions/destination-address";
import * as pickupDeliverySwitchActions from "../../redux/actions/pickup-delivery-switch";
import {SEARCH_DEBOUNCE_DELAY} from "../../constants/general";

import Loader from "../../components/UI/Loading/Loader";
import PopupView from "../../components/UI/Popup/PopupView";
import TouchableView from "../../components/UI/Buttons/TouchableView";
import CloseButton from "../../components/UI/HeaderButtons/CloseButton";
import MapButton from "../../components/UI/HeaderButtons/MapButton";
import RoundButton from "../../components/UI/Buttons/RoundButton";

import SavedAddress from "../../models/savedAddress";
import GeoCodedAddress from "../../models/geoCodedAddress";
import usePlaceSearch from "../../api/placeSearch/place-search";

const ChooseDestinationScreen = ({navigation, route}) => {
  const {userLocation} = route.params;
  const sourceGeoCodedAddress = GeoCodedAddress.class(
    useSelector(state => state.getSourceLocation.geoCodedAddress),
  );
  const sourceSavedAddress = SavedAddress.class(
    useSelector(state => state.getSourceLocation.address),
  );
  const destinationGeoCodedAddress = GeoCodedAddress.class(
    useSelector(state => state.getDestinationLocation.geoCodedAddress),
  );
  const destinationSavedAddress = SavedAddress.class(
    useSelector(state => state.getDestinationLocation.address),
  );
  const addressBookData =
    useSelector(state => state.getAddressBook.addressBook) ?? [];
  let addressBook = [];
  for (const address of addressBookData) {
    addressBook.push(SavedAddress.class(address));
  }

  const SOURCE = "Source";
  const DESTINATION = "Destination";

  const dispatch = useDispatch();
  const sourceInput = useRef();
  const destinationInput = useRef();

  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [showFavorites, setShowFavorites] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showLoader, setShowLoader] = useState(false);
  const [switchFields, setSwitchFields] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [
    onPlaceSearch,
    placeSearchResults,
    placeSearchError,
  ] = usePlaceSearch();
  const [previousInput, setPreviousInput] = useState(SOURCE);
  const [refresh, setRefresh] = useState(false);

  let sectionData = [];
  if (addressBook) {
    sectionData.push({
      title: localize("favorites"),
      data: showFavorites ? addressBook : [],
    });
  }
  if (searchResults.length > 0) {
    sectionData.push({
      title: localize("locations"),
      data: searchResults ?? [],
    });
  }

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: "",
      headerLeft: () => (
        <CloseButton
          onPress={() => {
            Keyboard.dismiss();
            navigation.pop();
          }}
        />
      ),
    });
  }, [navigation]);

  const navigateToSource = () => {
    Keyboard.dismiss();
    let address;
    if (switchFields) {
      if (destinationSavedAddress.line.length > 0) {
        address = destinationSavedAddress;
      } else if (destinationGeoCodedAddress.address.length > 0) {
        address = destinationGeoCodedAddress;
      }
    } else {
      if (sourceSavedAddress.line.length > 0) {
        address = sourceSavedAddress;
      } else if (sourceGeoCodedAddress.address.length > 0) {
        address = sourceGeoCodedAddress;
      }
    }
    navigation.navigate(routes.SET_DESTINATION, {
      isDestination: false,
      address,
      userLocation,
    });
  };

  const navigateToDestination = () => {
    Keyboard.dismiss();
    let address;
    if (switchFields) {
      if (sourceSavedAddress.line.length > 0) {
        address = sourceSavedAddress;
      } else if (sourceGeoCodedAddress.address.length > 0) {
        address = sourceGeoCodedAddress;
      }
    } else {
      if (destinationSavedAddress.line.length > 0) {
        address = destinationSavedAddress;
      } else if (destinationGeoCodedAddress.address.length > 0) {
        address = destinationGeoCodedAddress;
      }
    }
    navigation.navigate(routes.SET_DESTINATION, {
      isDestination: true,
      address,
      userLocation,
    });
  };

  const getAddressBook = useCallback(async () => {
    setErrorMessage(null);
    setShowLoader(true);
    try {
      await dispatch(addressBookActions.getAddressBook());
    } catch (error) {
      setErrorMessage(error.message);
    }
    setShowLoader(false);
  }, [dispatch, setShowLoader, setErrorMessage]);

  useEffect(() => {
    getAddressBook();
  }, [dispatch, getAddressBook]);

  React.useEffect(() => {
    getGeoCodedAddress();
  }, [dispatch, getGeoCodedAddress]);

  const getGeoCodedAddress = useCallback(async () => {
    setShowLoader(true);
    try {
      setErrorMessage(null);
      await dispatch(
        sourceGeoCodedAddressActions.getSourceGeoCodedAddress(
          userLocation?.latitude ?? 0,
          userLocation?.longitude ?? 0,
        ),
      );
    } catch (error) {
      setErrorMessage(error.message);
    }
    setShowLoader(false);
  }, [dispatch, userLocation]);

  React.useEffect(() => {
    if (sourceGeoCodedAddress?.address?.length > 0 && refresh === true) {
      setSource(
        sourceGeoCodedAddress?.name?.length > 0
          ? sourceGeoCodedAddress.name
          : sourceGeoCodedAddress.address,
      );
      setRefresh(false);
    } else if (sourceSavedAddress?.address?.length > 0 && refresh === true) {
      setSource(
        sourceSavedAddress.name?.length > 0
          ? sourceSavedAddress.name
          : sourceSavedAddress.address,
      );
      setRefresh(false);
    }
  }, [refresh, sourceGeoCodedAddress, sourceSavedAddress]);

  React.useEffect(() => {
    if (destinationGeoCodedAddress?.address?.length > 0 && refresh === true) {
      setDestination(
        destinationGeoCodedAddress?.name?.length > 0
          ? destinationGeoCodedAddress.name
          : destinationGeoCodedAddress.address,
      );
      setRefresh(false);
    } else if (
      destinationSavedAddress?.address?.length > 0 &&
      refresh === true
    ) {
      setDestination(
        destinationSavedAddress.name?.length > 0
          ? destinationSavedAddress.name
          : destinationSavedAddress.address,
      );
      setRefresh(false);
    }
  }, [refresh, destinationGeoCodedAddress, destinationSavedAddress]);

  const refreshSourceAndDestinationSelections = useCallback(() => {
    console.log("Refresh");
    setRefresh(true);
  }, []);

  React.useEffect(() => {
    const focusSubscription = navigation.addListener(
      "focus",
      refreshSourceAndDestinationSelections,
    );
    return focusSubscription;
  }, [navigation, refreshSourceAndDestinationSelections]);

  const changeTextHandler = (text, field) => {
    setShowFavorites(false);
    if (field === SOURCE) {
      setSource(text);
    } else if (field === DESTINATION) {
      setDestination(text);
    }
  };

  const searchGooglePlace = async (text, field) => {
    setErrorMessage(null);
    // setShowLoader(true);
    await onPlaceSearch(
      text,
      userLocation?.latitude ?? 0,
      userLocation?.longitude ?? 0,
    );
  };

  React.useEffect(() => {
    if (placeSearchResults.length > 0) {
      console.log(placeSearchResults);
      setSearchResults(placeSearchResults);
    } else if (placeSearchError) {
      console.log(placeSearchError);
      setErrorMessage(placeSearchError);
    }
    // setShowLoader(false);
  }, [placeSearchResults, placeSearchError]);

  const searchLocationHandler = useDebouncedCallback((text, field) => {
    if (text.length > 0) {
      searchGooglePlace(text, field);
    }
  }, SEARCH_DEBOUNCE_DELAY);

  const fieldFocusHandler = inputType => {
    if (inputType === SOURCE) {
      setPreviousInput(SOURCE);
    } else if (inputType === DESTINATION) {
      setPreviousInput(DESTINATION);
    }
    setSearchResults([]);
  };

  const onBlurHandler = inputType => {
    if (inputType === SOURCE) {
      if (source?.length > 0) {
        setSource(source.trim());
      }
    } else if (inputType === DESTINATION) {
      if (destination?.length > 0) {
        setDestination(destination.trim());
      }
    }
  };

  const locationItemPressHandler = (item, section) => {
    const sectionIndex = sectionData.indexOf(section);
    if (sourceInput.current.isFocused() || previousInput === SOURCE) {
      if (sectionIndex === 0 && addressBook.length > 0) {
        const address = SavedAddress.class(item);
        setSource(address.name);
        dispatch(sourceSavedAddressActions.saveSourceAddress(address));
        dispatch(sourceGeoCodedAddressActions.saveSourceGeoCodedAddress({}));
      } else {
        setSearchResults([]);
        setSource(item.address);
        const address = GeoCodedAddress.class(item);
        dispatch(sourceSavedAddressActions.saveSourceAddress({}));
        dispatch(
          sourceGeoCodedAddressActions.saveSourceGeoCodedAddress(address),
        );
      }
    } else if (
      destinationInput.current.isFocused() ||
      previousInput === DESTINATION
    ) {
      if (sectionIndex === 0 && addressBook.length > 0) {
        setDestination(item.name);
        const address = SavedAddress.class(item);
        dispatch(
          destinationSavedAddressActions.saveDestinationAddress(address),
        );
        dispatch(
          destinationGeoCodedAddressActions.saveDestinationGeoCodedAddress({}),
        );
      } else {
        setSearchResults([]);
        setDestination(item.name);
        dispatch(destinationSavedAddressActions.saveDestinationAddress({}));
        const address = GeoCodedAddress.class(item);
        dispatch(
          destinationGeoCodedAddressActions.saveDestinationGeoCodedAddress(
            address,
          ),
        );
      }
    }
    Keyboard.dismiss();
  };

  const setNextButtonPressHandler = () => {
    if (
      (sourceSavedAddress?.address?.length > 0 ||
        sourceGeoCodedAddress?.address?.length > 0 ||
        sourceSavedAddress?.line?.length > 0 ||
        sourceGeoCodedAddress?.line?.length > 0) &&
      (destinationSavedAddress?.address?.length > 0 ||
        destinationGeoCodedAddress?.address?.length > 0 ||
        destinationSavedAddress?.line?.length > 0 ||
        destinationGeoCodedAddress?.line?.length > 0)
    ) {
      navigation.navigate(routes.DROP_TIME);
    }
  };

  const locationSwapButtonPressHandler = () => {
    Keyboard.dismiss();
    dispatch(pickupDeliverySwitchActions.saveFieldsSwitched(!switchFields));
    setSwitchFields(!switchFields);
  };

  const renderItem = ({item, index, section}) => {
    const sectionIndex = sectionData.indexOf(section);
    return (
      <TouchableView
        style={styles.screen}
        onPress={() => locationItemPressHandler(item, section)}>
        <View>
          <View style={styles.locationContainer}>
            <View style={styles.locationMark}>
              <LocationMark width={20} height={22} />
            </View>
            <View>
              <Text style={styles.locationTitle}>
                {sectionIndex === 0 && addressBook.length > 0
                  ? item.name
                  : item.name}
              </Text>
              <Text style={styles.locationDetail}>
                {sectionIndex === 0 && addressBook.length > 0
                  ? item.line
                  : item.address}
              </Text>
            </View>
          </View>
          <View style={styles.separator} />
        </View>
      </TouchableView>
    );
  };

  const renderSectionHeader = ({section}) => {
    const index = sectionData.indexOf(section);
    if (index === 0 && addressBook.length > 0) {
      return (
        <View style={styles.header}>
          <TouchableView
            onPress={() => {
              setShowFavorites(!showFavorites);
            }}>
            <View
              style={{
                ...styles.favoritesContainer,
                ...styles.paddingHeaderContainer,
              }}>
              <View style={styles.headerContainer}>
                <Ionicons
                  name={Platform.OS === "ios" ? "ios-star" : "md-star"}
                  color={colors.primary}
                  size={30}
                />
                <Text style={styles.headerText}>{section.title}</Text>
              </View>
              <Ionicons
                name={
                  showFavorites
                    ? Platform.OS === "ios"
                      ? "ios-chevron-up"
                      : "md-chevron-up"
                    : Platform.OS === "ios"
                    ? "ios-chevron-down"
                    : "md-chevron-down"
                }
                color={colors.textPrimary}
                size={30}
              />
            </View>
          </TouchableView>
        </View>
      );
    } else if (index === 1) {
      return (
        <View style={{...styles.header, ...styles.paddingHeaderContainer}}>
          <View style={styles.headerContainer}>
            <MaterialIcons
              name="location-searching"
              color={colors.primary}
              size={30}
            />
            <Text style={styles.headerText}>{section.title}</Text>
          </View>
        </View>
      );
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <PopupView style={styles.topView} roundBottom={true}>
        <View style={styles.container}>
          <View style={styles.dotsContainer}>
            <View style={styles.dot} />
            <View style={styles.smallBox} />
            <View style={styles.smallBox} />
            <View style={styles.smallBox} />
            <View style={styles.smallBox} />
            <View style={styles.smallBox} />
            <View style={styles.smallBox} />
            <View style={styles.smallBox} />
            <View style={styles.box} />
          </View>
          <View style={styles.fieldContainer}>
            <View style={styles.addressContainer}>
              <TextInput
                ref={switchFields ? destinationInput : sourceInput}
                style={styles.input}
                placeholderTextColor={colors.field}
                placeholder={localize("enter_source")}
                autoCapitalize="none"
                autoCorrect={false}
                selectionColor={colors.primary}
                value={switchFields ? destination : source}
                onChangeText={newValue => {
                  changeTextHandler(
                    newValue,
                    switchFields ? DESTINATION : SOURCE,
                  );
                  searchLocationHandler.callback(
                    newValue,
                    switchFields ? DESTINATION : SOURCE,
                  );
                }}
                maxLength={100}
                contextMenuHidden={true}
                onFocus={() =>
                  fieldFocusHandler(switchFields ? DESTINATION : SOURCE)
                }
                onBlur={() =>
                  onBlurHandler(switchFields ? DESTINATION : SOURCE)
                }
                clearButtonMode="while-editing"
              />
              <View style={styles.spacer_12} />
              <TouchableOpacity onPress={navigateToSource}>
                <Ionicons
                  name={
                    Platform.OS === "android"
                      ? "md-map-outline"
                      : "ios-map-outline"
                  }
                  size={28}
                  color={colors.textPrimary}
                />
              </TouchableOpacity>
            </View>
            <View style={styles.spacer} />
            <View style={styles.addressContainer}>
              <TextInput
                ref={switchFields ? sourceInput : destinationInput}
                style={styles.input}
                placeholderTextColor={colors.field}
                placeholder={localize("enter_destination")}
                autoCapitalize="none"
                autoCorrect={false}
                selectionColor={colors.primary}
                value={switchFields ? source : destination}
                onChangeText={newValue => {
                  changeTextHandler(
                    newValue,
                    switchFields ? SOURCE : DESTINATION,
                  );
                  searchLocationHandler.callback(
                    newValue,
                    switchFields ? SOURCE : DESTINATION,
                  );
                }}
                maxLength={100}
                contextMenuHidden={true}
                clearButtonMode="while-editing"
                onFocus={() =>
                  fieldFocusHandler(switchFields ? SOURCE : DESTINATION)
                }
                onBlur={() =>
                  onBlurHandler(switchFields ? SOURCE : DESTINATION)
                }
              />
              <View style={styles.spacer_12} />
              <TouchableOpacity onPress={navigateToDestination}>
                <Ionicons
                  name={
                    Platform.OS === "android"
                      ? "md-map-outline"
                      : "ios-map-outline"
                  }
                  size={28}
                  color={colors.textPrimary}
                />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.spacer_12} />
          {source.length > 0 && destination.length > 0 ? (
            <View style={styles.header}>
              <TouchableView onPress={locationSwapButtonPressHandler}>
                <MaterialIcons
                  name="swap-vertical-circle"
                  color={colors.textPrimary}
                  size={30}
                />
              </TouchableView>
            </View>
          ) : null}
        </View>
      </PopupView>
      <View style={styles.list}>
        <SectionList
          sections={sectionData}
          keyExtractor={(item, index) => index}
          keyboardShouldPersistTaps="handled"
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
        />
        {source.length > 0 && destination.length > 0 ? (
          <View style={styles.buttonContainer}>
            <RoundButton
              style={styles.button}
              title={localize("next").toUpperCase()}
              onPress={setNextButtonPressHandler}
            />
          </View>
        ) : null}
      </View>
      <Loader show={showLoader} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "white",
  },
  topView: {
    paddingTop: 15,
    paddingHorizontal: 12,
    paddingBottom: 25,
    zIndex: 1,
  },
  container: {
    flexDirection: "row",
    marginLeft: 8,
    alignItems: "center",
  },
  dotsContainer: {
    alignItems: "center",
    paddingVertical: 10,
  },
  dot: {
    width: 12,
    height: 12,
    backgroundColor: colors.textPrimary,
    borderRadius: 6,
  },
  smallBox: {
    width: 2,
    height: 2,
    backgroundColor: colors.textPrimary,
    marginTop: 4,
  },
  box: {
    marginTop: 4,
    width: 12,
    height: 12,
    backgroundColor: colors.primary,
  },
  fieldContainer: {
    marginLeft: 22,
    flex: 1,
  },
  input: {
    color: colors.textPrimary,
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.header,
    flex: 1,
    paddingVertical: 4,
  },
  spacer: {
    height: 1,
    backgroundColor: colors.field,
    marginVertical: 10,
  },
  list: {
    flex: 1,
    paddingTop: 8,
    backgroundColor: "white",
  },
  header: {
    height: 50,
  },
  favoritesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "white",
    alignItems: "center",
  },
  paddingHeaderContainer: {
    paddingHorizontal: 12,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    height: 50,
  },
  headerText: {
    paddingLeft: 8,
    color: colors.textPrimary,
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.largeTitle,
  },
  locationContainer: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  locationMark: {
    top: -5,
  },
  locationTitle: {
    paddingHorizontal: 15,
    fontFamily: fonts.regular,
    fontSize: fontSizes.header,
    color: colors.textPrimary,
  },
  locationDetail: {
    paddingHorizontal: 15,
    paddingTop: 4,
    paddingBottom: 12,
    fontFamily: fonts.regular,
    fontSize: fontSizes.body_semi_medium,
    color: colors.fade,
  },
  separator: {
    backgroundColor: colors.border,
    height: 1,
    marginLeft: 40,
    width: "100%",
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
  addressContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 35,
  },
  spacer_12: {
    width: 12,
  },
});

export default ChooseDestinationScreen;
