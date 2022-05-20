import React, {useState, useCallback, useRef, useEffect} from "react";
import {
  View,
  Platform,
  Keyboard,
  KeyboardAvoidingView,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Text,
  Dimensions,
  Switch,
  TouchableOpacity,
  TouchableNativeFeedback,
} from "react-native";
import {useSelector, useDispatch} from "react-redux";
import DropDownPicker from "react-native-dropdown-picker";
import Modal from "react-native-modal";
import SegmentedControl from "rn-segmented-control";
import moment from "moment";

import fonts from "../../constants/fonts";
import colors from "../../constants/colors";
import fontSizes from "../../constants/font-sizes";
import {localize} from "../../translations/localized";
import * as productDetailsActions from "../../redux/actions/product-details";
import * as constants from "../../constants/general";
import * as routes from "../../navigation/routes/app-routes";
import * as masterDataActions from "../../redux/actions/master-data";

import useInsurance from "../../api/insurance/getInsurance";
import useDistanceMatrix from "../../api/distanceMatrix/distanceMatrix";

import LeftArrow from "../../components/UI/HeaderButtons/LeftArrow";
import Loader from "../../components/UI/Loading/Loader";
import InputField from "../../components/UI/Inputs/InputField";
import ErrorText from "../../components/UI/Texts/ErrorText";
import RoundButton from "../../components/UI/Buttons/RoundButton";
import RadioButton from "../../components/UI/Buttons/RadioButton";
import Stepper from "../../components/UI/Stepper/Stepper";
import PickupTimeScreen from "./PickupTimeScreen";
import DropTimeScreen from "./DropTimeScreen";

import SavedAddress from "../../models/savedAddress";
import GeoCodedAddress from "../../models/geoCodedAddress";

const width = Dimensions.get("window").width;

const ItemDetailsScreen = ({navigation}) => {
  const PRODUCT_DESCRIPTION = localize("product_description");
  const PRODUCTS_COST = localize("products_cost");
  const DRIVER_TIP = "DRIVER_TIP";
  const CARBON_FREE_TIP = "CARBON_FREE_TIP";
  const driverTips = constants.DRIVER_TIP_AMOUNTS.map(
    tip => `${constants.CURRENCY_SYMBOL}${tip}`,
  );
  const DRIVER_TIP_AMOUNTS = [...driverTips, localize("other"), localize("no")];
  const carbonFreeTips = constants.CARBON_FREE_AMOUNTS.map(
    tip => `${constants.CURRENCY_SYMBOL}${tip}`,
  );
  const CARBON_FREE_AMOUNTS = [
    ...carbonFreeTips,
    localize("other"),
    localize("no"),
  ];

  const productTypes = useSelector(state => state.masterData.productTypes);
  const productDetails = useSelector(
    state => state.productDetails.productDetails,
  );

  let items = {};
  if (productTypes !== null && productTypes.length > 0) {
    items = productTypes.map(type => {
      return {label: type, value: type};
    });
  }
  const dispatch = useDispatch();
  const scrollView = useRef();

  const [productType, setProductType] = useState(productDetails.type);
  const [productDescription, setProductDescription] = useState(
    productDetails.description,
  );
  const [productCost, setProductCost] = useState(
    productDetails.cost !== 0 ? `${productDetails.cost}` : "",
  );
  const [sensitivity, setSensitivity] = useState(productDetails.sensitivity);
  const [shippersCount, setShippersCount] = useState(
    productDetails.helpersCount,
  );
  const [insurance, setInsurance] = useState(productDetails.insurance);
  const [showLoader, setShowLoader] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [showPickupTime, setShowPickupTime] = useState(false);
  const [showDropTime, setShowDropTime] = useState(false);
  const [enableInsurance, setEnableInsurance] = useState(false);
  const [openPicker, setOpenPicker] = useState(false);
  const [tipIndex, setTipIndex] = useState(-2);
  const [showDriverTipField, setShowDriverTipField] = useState(false);
  const [driverTipAmount, setDriverTipAmount] = useState("");
  const [carbonFreeTipIndex, setCarbonFreeTipIndex] = useState(-2);
  const [showCarbonFreeTipField, setShowCarbonFreeTipField] = useState(false);
  const [carbonFreeTipAmount, setCarbonFreeTipAmount] = useState("");
  const [onGetInsurance, insuranceResponse, insuranceError] = useInsurance();
  const [
    onGetDistance,
    distanceMatrixResponse,
    distanceMatrixError,
  ] = useDistanceMatrix();
  const [durationTwoLocations, setDurationTwoLocations] = useState(0);

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
  const pickupLat =
    sourceGeoCodedAddress?.latitude !== 0
      ? sourceGeoCodedAddress?.latitude
      : sourceSavedAddress?.latitude !== 0
      ? sourceSavedAddress?.latitude
      : 0;
  const pickupLong =
    sourceGeoCodedAddress?.longitude !== 0
      ? sourceGeoCodedAddress?.longitude
      : sourceSavedAddress?.longitude !== 0
      ? sourceSavedAddress?.longitude
      : 0;
  const dropLat =
    destinationGeoCodedAddress?.latitude !== 0
      ? destinationGeoCodedAddress?.latitude
      : destinationSavedAddress?.latitude !== 0
      ? destinationSavedAddress?.latitude
      : 0;
  const dropLong =
    destinationGeoCodedAddress?.longitude !== 0
      ? destinationGeoCodedAddress?.longitude
      : destinationSavedAddress?.longitude !== 0
      ? destinationSavedAddress?.longitude
      : 0;

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: localize("add_products"),
      headerLeft: () => (
        <LeftArrow
          onPress={() => {
            Keyboard.dismiss();
            navigation.pop();
          }}
        />
      ),
    });
    getDistance();
  }, [getDistance, navigation]);

  const getInsurance = price => {
    setErrorMessage(null);
    setShowLoader(true);
    onGetInsurance(price);
  };

  React.useEffect(() => {
    setShowLoader(false);
    if (insuranceResponse > 0) {
      setInsurance(insuranceResponse);
    } else if (insuranceError) {
      setErrorMessage(insuranceError);
    }
  }, [insuranceResponse, insuranceError]);

  const getDistance = useCallback(() => {
    setErrorMessage(null);
    setShowLoader(true);
    onGetDistance(pickupLat, pickupLong, dropLat, dropLong);
  }, [dropLat, dropLong, onGetDistance, pickupLat, pickupLong]);

  React.useEffect(() => {
    setShowLoader(false);
    if (distanceMatrixResponse.duration > 0) {
      // if (
      //   distanceMatrixResponse.duration +
      //     constants.SCHEDULED_DROP_DRIVER_DELAY <
      //   constants.DEFAULT_SCHEDULED_DROP_DRIVER_DELAY
      // ) {
      //   setDurationTwoLocations(constants.DEFAULT_SCHEDULED_DROP_DRIVER_DELAY);
      // }
      setDurationTwoLocations(
        distanceMatrixResponse.duration +
          constants.DEFAULT_SCHEDULED_DROP_DRIVER_DELAY,
      );
    } else if (distanceMatrixError) {
      setErrorMessage(distanceMatrixError);
    }
  }, [distanceMatrixError, distanceMatrixResponse]);

  useEffect(() => {
    const focusSubscription = navigation.addListener("focus", resetData);
    return focusSubscription;
  }, [navigation, resetData]);

  const resetData = useCallback(() => {
    dispatch(productDetailsActions.resetPickupDropTime());
  }, [dispatch]);

  useEffect(() => {
    if (!Array.isArray(productTypes)) {
      getMasterData();
    }
  }, [getMasterData, productTypes]);

  const getMasterData = useCallback(async () => {
    try {
      await dispatch(masterDataActions.getMasterData());
    } catch (error) {
      setErrorMessage(error.message);
    }
  }, [dispatch]);

  const fieldChangeHandler = (newValue, field) => {
    setErrorMessage("");
    const regex = /^[0-9]{0,}[.]{0,1}[0-9]{0,2}$/;
    switch (field) {
      case PRODUCT_DESCRIPTION:
        if (productDescription.length > 0 || newValue.trim() !== "") {
          // let value = newValue.replace(/[^A-Za-z0-9,.#_ '-]/gi, "");
          setProductDescription(newValue);
        }
        break;
      case PRODUCTS_COST:
        if (regex.test(newValue)) {
          setProductCost(newValue);
        }
        break;
      case DRIVER_TIP:
        if (regex.test(newValue)) {
          setDriverTipAmount(newValue);
        }
        break;
      case CARBON_FREE_TIP:
        if (regex.test(newValue)) {
          setCarbonFreeTipAmount(newValue);
        }
        break;
    }
  };

  const fieldEndEditingHandler = field => {
    if (field === PRODUCTS_COST || field === PRODUCT_DESCRIPTION) {
      setProductDescription(productDescription.trim());
      if (!isNaN(parseFloat(productCost))) {
        setProductCost(`${parseFloat(productCost)}`.trim());
        if (
          field === PRODUCTS_COST &&
          enableInsurance === true &&
          parseFloat(productCost) > 0
        ) {
          getInsurance(parseFloat(productCost));
        } else {
          setInsurance(0);
        }
      } else {
        setInsurance(0);
      }
    } else if (field === DRIVER_TIP) {
      if (!isNaN(parseFloat(driverTipAmount))) {
        setDriverTipAmount(`${parseFloat(driverTipAmount)}`.trim());
      }
    } else if (field === CARBON_FREE_TIP) {
      if (!isNaN(parseFloat(carbonFreeTipAmount))) {
        setCarbonFreeTipAmount(`${parseFloat(carbonFreeTipAmount)}`.trim());
      }
    }
  };

  const validateFields = () => {
    if (productType === "") {
      setErrorMessage(localize("product_type_error"));
      return false;
    } else if (productDescription.trim().length < 3) {
      setErrorMessage(localize("product_description_error"));
      return false;
    } else if (
      isNaN(parseFloat(productCost)) ||
      parseFloat(productCost) === 0
    ) {
      setErrorMessage(localize("product_cost_error"));
      return false;
    }
    if (!productDetails.immediatePickup && productDetails.pickupTime) {
      const diff = moment(productDetails.pickupTime).diff(
        moment(new Date()),
        "minutes",
      );
      console.log("Pickup time difference", diff);
      if (diff < constants.SCHEDULED_RIDE_TIME_IN_ADVANCE) {
        setErrorMessage(
          localize("pickup_time_error", {
            time: constants.SCHEDULED_RIDE_TIME_IN_ADVANCE,
          }),
        );
        return false;
      }
    }
    if (!productDetails.immediateDrop && productDetails.dropTime) {
      const diff = moment(productDetails.dropTime).diff(
        moment(new Date()),
        "minutes",
      );
      if (diff < constants.SCHEDULED_DROP_MIN_LIMIT) {
        setErrorMessage(
          localize("drop_time_error", {
            time: constants.SCHEDULED_DROP_MIN_LIMIT / 60,
          }),
        );
        return false;
      }
    }
    if (
      !productDetails.immediatePickup &&
      !productDetails.immediateDrop &&
      productDetails.pickupTime &&
      productDetails.dropTime
    ) {
      const diff = moment(productDetails.dropTime).diff(
        moment(productDetails.pickupTime),
        "minutes",
      );
      if (diff < constants.SCHEDULED_DROP_MIN_LIMIT) {
        setErrorMessage(
          localize("equal_pickup_drop_time_message", {
            min_time: constants.SCHEDULED_DROP_MIN_LIMIT / 60,
          }),
        );
        return false;
      }
    }
    setErrorMessage("");
    setProductDescription(productDescription);
    setProductCost(productCost);
    Keyboard.dismiss();
    return true;
  };

  const onSensitivityChangeHandler = value => {
    setSensitivity(value);
  };

  const shippersIncrementPressHandler = () => {
    setShippersCount(shippersCount + 1);
  };

  const shippersDecrementPressHandler = () => {
    setShippersCount(shippersCount - 1);
  };

  const nextButtonPressHandler = async () => {
    Keyboard.dismiss();
    const isValid = validateFields();
    if (isValid) {
      dispatch(
        productDetailsActions.saveProductDetails({
          type: productType,
          description: productDescription,
          cost: productCost,
          sensitivity: sensitivity,
          helpersCount: shippersCount,
          insurance: insurance,
          immediatePickup: productDetails.immediatePickup,
          pickupTime: productDetails.pickupTime,
          immediateDrop: productDetails.immediateDrop,
          dropTime: productDetails.dropTime,
          giveTip: parseFloat(driverTipAmount) > 0,
          tipAmount: driverTipAmount,
          giveCarbonFreeTip: parseFloat(carbonFreeTipAmount) > 0,
          carbonFreeTipAmount: carbonFreeTipAmount,
          negotiated: false,
        }),
      );
      setTimeout(() => {
        console.log("fghjko");
        navigation.navigate(routes.PICK_UP);
      }, 300);
    } else {
      setTimeout(() => {
        scrollView.current.scrollToEnd({animated: true});
      }, 200);
    }
  };

  const setPickupTimeButtonPressHandler = (immediatePickup, date) => {
    console.log("Pickup d", date);
    dispatch(
      productDetailsActions.saveProductDetails({
        type: productType,
        description: productDescription,
        cost: productCost,
        sensitivity: sensitivity,
        helpersCount: shippersCount,
        insurance: insurance,
        immediatePickup: immediatePickup,
        pickupTime: immediatePickup ? new Date() : date,
        immediateDrop: true,
        dropTime: productDetails.dropTime,
        giveTip: parseFloat(driverTipAmount) > 0,
        tipAmount: +driverTipAmount,
        giveCarbonFreeTip: parseFloat(carbonFreeTipAmount) > 0,
        carbonFreeTipAmount: +carbonFreeTipAmount,
      }),
    );
    setOpenPicker(false);
    setShowPickupTime(false);
    setTimeout(() => {
      scrollView.current.scrollToEnd({animated: true});
    }, 200);
  };

  const dropTimeButtonPressHandler = (immediateDrop, date) => {
    console.log("Drop date", date);
    dispatch(
      productDetailsActions.saveProductDetails({
        type: productType,
        description: productDescription,
        cost: productCost,
        sensitivity: sensitivity,
        helpersCount: shippersCount,
        insurance: insurance,
        immediatePickup: productDetails.immediatePickup,
        pickupTime: productDetails.pickupTime,
        immediateDrop: immediateDrop,
        dropTime: immediateDrop ? new Date() : date,
        giveTip: parseFloat(driverTipAmount) > 0,
        tipAmount: driverTipAmount,
        giveCarbonFreeTip: parseFloat(carbonFreeTipAmount) > 0,
        carbonFreeTipAmount: carbonFreeTipAmount,
      }),
    );
    setOpenPicker(false);
    setShowDropTime(false);
    setTimeout(() => {
      scrollView.current.scrollToEnd({animated: true});
    }, 200);
  };

  const driverTipAmountChangeHandler = index => {
    setTipIndex(index);
    setShowDriverTipField(index === 3);
    if (index < 3) {
      setDriverTipAmount(constants.DRIVER_TIP_AMOUNTS[index].toString(10));
    } else if (index === 4) {
      setDriverTipAmount("");
    }
  };

  const carbonFreeTipAmountChangeHandler = index => {
    setCarbonFreeTipIndex(index);
    setShowCarbonFreeTipField(index === 3);
    if (index < 3) {
      setCarbonFreeTipAmount(constants.CARBON_FREE_AMOUNTS[index].toString(10));
    } else if (index === 4) {
      setCarbonFreeTipAmount("");
    }
  };

  let TouchableComponent = TouchableOpacity;
  if (Platform.OS === "android" && Platform.Version >= 21) {
    TouchableComponent = TouchableNativeFeedback;
  }

  const editPickupTimeButtonPressHandler = () => {
    setErrorMessage("");
    setOpenPicker(true);
    setShowPickupTime(true);
    setShowDropTime(false);
  };

  const editDropTimeButtonPressHandler = () => {
    setErrorMessage("");
    setOpenPicker(true);
    setShowPickupTime(false);
    setShowDropTime(true);
  };

  const formattedDate = date => {
    if (!date) {
      return "";
    }
    return moment(0, "HH").diff(date, "days") !== 0
      ? moment(date).format("MMM D, YYYY hh:mm A")
      : localize("today") + "," + moment(date).format(" hh:mm A");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : null}
      style={styles.screen}>
      <SafeAreaView style={styles.container}>
        <ScrollView ref={scrollView} showsVerticalScrollIndicator={false}>
          <View style={{...styles.topHeader, ...styles.section}}>
            <Text style={styles.headerText}>
              {localize("products_to_deliver")}
            </Text>
          </View>
          {productType.length > 0 ? (
            <Text style={styles.label}>
              {localize("select_product_type").toUpperCase()}
            </Text>
          ) : null}
          <View style={Platform.OS === "ios" ? styles.pickerContainer : null}>
            {items.length > 0 ? (
              <DropDownPicker
                items={items}
                style={styles.picker}
                containerStyle={styles.picker}
                placeholder={localize("select_product_type")}
                placeholderStyle={{...styles.titleText, color: colors.fade}}
                arrowSize={25}
                arrowColor={colors.fade}
                labelStyle={{...styles.titleText, ...styles.dropDownText}}
                defaultValue={productType}
                onChangeItem={item => {
                  setProductType(item.value);
                }}
                dropDownStyle={styles.dropDown}
              />
            ) : null}
          </View>
          <InputField
            style={styles.element}
            placeholder={PRODUCT_DESCRIPTION}
            text={productDescription}
            onTextChange={newValue => {
              fieldChangeHandler(newValue, PRODUCT_DESCRIPTION);
            }}
            onTextSubmit={() =>
              fieldChangeHandler(productDescription, PRODUCT_DESCRIPTION)
            }
            maxLength={60}
            keyboardType="default"
            onEndEditing={() => fieldEndEditingHandler(PRODUCT_DESCRIPTION)}
          />
          <Text style={{...styles.element, ...styles.detailsText}}>
            {localize("product_details_message")}
          </Text>
          <View style={styles.topHeader}>
            <Text style={styles.headerText}>
              {localize("products_total_cost")}
            </Text>
            <InputField
              style={styles.element}
              placeholder={PRODUCTS_COST}
              text={productCost}
              onTextChange={newValue => {
                fieldChangeHandler(newValue, PRODUCTS_COST);
              }}
              onTextSubmit={() =>
                fieldChangeHandler(productCost, PRODUCTS_COST)
              }
              maxLength={10}
              keyboardType="decimal-pad"
              onEndEditing={() => fieldEndEditingHandler(PRODUCTS_COST)}
              prefix={constants.CURRENCY_SYMBOL}
            />
            <Text style={{...styles.element, ...styles.detailsText}}>
              {localize("products_cost_message")}
            </Text>
          </View>
          <View style={styles.topHeader}>
            <Text style={styles.headerText}>{localize("sensitivity")}</Text>
            <View style={styles.horizontalContainer}>
              <RadioButton
                title={localize("low")}
                isOn={sensitivity === 1}
                onPress={() => onSensitivityChangeHandler(1)}
              />
              <RadioButton
                title={localize("medium")}
                isOn={sensitivity === 2}
                onPress={() => onSensitivityChangeHandler(2)}
              />
              <RadioButton
                title={localize("high")}
                isOn={sensitivity === 3}
                onPress={() => onSensitivityChangeHandler(3)}
              />
            </View>
            <View style={styles.sensitivityIndicator}>
              <View
                style={{
                  width: (width - 32) * (sensitivity / 3),
                  ...styles.sensitivityBar,
                }}
              />
            </View>
          </View>
          <View style={styles.topHeader}>
            <Text style={styles.headerText}>
              {localize("additional_helpers")}
            </Text>
            <View style={styles.horizontalContainer}>
              <Text style={styles.titleText}>
                {shippersCount} {localize("additional_shipper")}
              </Text>
              <Stepper
                minValue={constants.MIN_ADDITIONAL_SHIPPERS}
                maxValue={constants.MAX_ADDITIONAL_SHIPPERS}
                onIncrement={shippersIncrementPressHandler}
                onDecrement={shippersDecrementPressHandler}
              />
            </View>
            <Text style={{...styles.element, ...styles.detailsText}}>
              {localize("additional_helper_message")}
            </Text>
          </View>
          <View style={styles.topHeader}>
            <Text style={styles.headerText}>{localize("insurance")}</Text>
            <View style={styles.rowContainer}>
              <Text style={{...styles.element, ...styles.titleText}}>
                {constants.CURRENCY_SYMBOL}
                {insurance}
              </Text>
              <Switch
                trackColor={{
                  false: Platform.OS === "android" && colors.fade,
                  true: colors.primary,
                }}
                thumbColor={
                  Platform.OS === "android" &&
                  (enableInsurance ? colors.primary : colors.border)
                }
                value={enableInsurance}
                onValueChange={newValue => {
                  if (
                    newValue === true &&
                    !isNaN(parseFloat(productCost)) &&
                    parseFloat(productCost) > 0
                  ) {
                    getInsurance(parseFloat(productCost));
                  } else {
                    setInsurance(0);
                  }
                  setEnableInsurance(newValue);
                }}
              />
            </View>
            <Text style={{...styles.element, ...styles.detailsText}}>
              {localize("insurance_message")}
            </Text>
          </View>
          <View style={styles.topHeader}>
            <View style={styles.rowContainer}>
              <View style={styles.pickupTimeContainer}>
                <Text style={styles.headerText}>{localize("pickup_time")}</Text>
                <View style={styles.spacer_4} />
                <Text style={styles.titleText} numberOfLines={2}>
                  {productDetails.immediatePickup
                    ? localize("immediate")
                    : formattedDate(productDetails.pickupTime)}
                </Text>
              </View>
              <TouchableComponent
                activeOpacity={0.75}
                onPress={editPickupTimeButtonPressHandler}>
                <View>
                  <Text style={styles.editText}>{localize("edit")}</Text>
                </View>
              </TouchableComponent>
            </View>
            <Text style={{...styles.element, ...styles.detailsText}}>
              {localize("pickup_time_message")}
            </Text>
          </View>
          <View style={styles.topHeader}>
            <View style={styles.rowContainer}>
              <View style={styles.pickupTimeContainer}>
                <Text style={styles.headerText}>{localize("drop_time")}</Text>
                <View style={styles.spacer_4} />
                <Text style={styles.titleText} numberOfLines={2}>
                  {productDetails.immediateDrop
                    ? localize("immediate")
                    : formattedDate(productDetails.dropTime)}
                </Text>
              </View>
              <TouchableComponent
                activeOpacity={0.75}
                onPress={editDropTimeButtonPressHandler}>
                <View>
                  <Text style={styles.editText}>{localize("edit")}</Text>
                </View>
              </TouchableComponent>
            </View>
            <Text style={{...styles.element, ...styles.detailsText}}>
              {localize("drop_time_message")}
            </Text>
          </View>
          <View style={styles.topHeader}>
            <Text style={styles.headerText}>{localize("tip_title")}</Text>
            <SegmentedControl
              tabs={DRIVER_TIP_AMOUNTS}
              segmentedControlBackgroundColor={colors.border}
              activeSegmentBackgroundColor={colors.primary}
              textColor={colors.textPrimary}
              activeTextColor="white"
              paddingVertical={8}
              textStyle={styles.titleText}
              containerStyle={styles.element}
              currentIndex={tipIndex}
              onChange={driverTipAmountChangeHandler}
            />
            {showDriverTipField ? (
              <InputField
                style={styles.element}
                placeholder={localize("other")}
                text={driverTipAmount ?? ""}
                onTextChange={newValue => {
                  fieldChangeHandler(newValue, DRIVER_TIP);
                }}
                onTextSubmit={() =>
                  fieldChangeHandler(driverTipAmount, DRIVER_TIP)
                }
                maxLength={10}
                keyboardType="decimal-pad"
                onEndEditing={() => fieldEndEditingHandler(DRIVER_TIP)}
                prefix={constants.CURRENCY_SYMBOL}
              />
            ) : null}
            <Text style={{...styles.element, ...styles.detailsText}}>
              {localize("tip_message")}
            </Text>
          </View>
          <View style={styles.topHeader}>
            <Text style={styles.headerText}>
              {localize("eco_booking_title")}
            </Text>
            <SegmentedControl
              tabs={CARBON_FREE_AMOUNTS}
              segmentedControlBackgroundColor={colors.border}
              activeSegmentBackgroundColor={colors.primary}
              textColor={colors.textPrimary}
              activeTextColor="white"
              paddingVertical={8}
              textStyle={styles.titleText}
              containerStyle={styles.element}
              currentIndex={carbonFreeTipIndex}
              onChange={carbonFreeTipAmountChangeHandler}
            />
            {showCarbonFreeTipField ? (
              <InputField
                style={styles.element}
                placeholder={localize("other")}
                text={carbonFreeTipAmount ?? ""}
                onTextChange={newValue => {
                  fieldChangeHandler(newValue, CARBON_FREE_TIP);
                }}
                onTextSubmit={() =>
                  fieldChangeHandler(carbonFreeTipAmount, CARBON_FREE_TIP)
                }
                maxLength={10}
                keyboardType="decimal-pad"
                onEndEditing={() => fieldEndEditingHandler(CARBON_FREE_TIP)}
                prefix={constants.CURRENCY_SYMBOL}
              />
            ) : null}
            <Text style={{...styles.element, ...styles.detailsText}}>
              {localize("eco_booking_message")}
            </Text>
          </View>
          {errorMessage ? (
            <View style={styles.elementsContainer}>
              <ErrorText error={errorMessage} />
            </View>
          ) : null}
        </ScrollView>
        <View style={styles.nextButtonContainer}>
          <RoundButton
            style={styles.button}
            title={localize("next").toUpperCase()}
            onPress={nextButtonPressHandler}
          />
        </View>
        <Modal
          style={styles.pickupViewContainer}
          backdropOpacity={0.5}
          isVisible={openPicker}
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
          ) : showDropTime ? (
            <DropTimeScreen
              isImmediateDrop={productDetails.immediateDrop}
              dropDate={
                productDetails.immediateDrop ? null : productDetails.dropTime
              }
              onDropTimeButtonPress={dropTimeButtonPressHandler}
              dropDelayTime={durationTwoLocations}
              pickupDate={
                productDetails.immediatePickup
                  ? new Date()
                  : productDetails.pickupTime
              }
              navigation={navigation}
            />
          ) : null}
        </Modal>
        <Loader show={showLoader} />
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "white",
  },
  container: {
    flex: 1,
    marginHorizontal: 16,
    height: "100%",
    justifyContent: "space-between",
  },
  topHeader: {
    marginTop: 20,
  },
  section: {
    marginBottom: 16,
  },
  element: {
    marginTop: 12,
  },
  pickerContainer: {
    zIndex: 1,
  },
  picker: {
    height: 50,
  },
  dropDown: {
    marginTop: 4,
  },
  dropDownText: {
    paddingVertical: 2,
  },
  label: {
    fontSize: fontSizes.body_tiny,
    fontFamily: fonts.bold,
    color: colors.field,
    marginBottom: 7,
  },
  headerText: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: fontSizes.header,
  },
  titleText: {
    color: colors.textPrimary,
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.body_semi_medium,
  },
  detailsText: {
    color: colors.fade,
    fontFamily: fonts.regular,
    fontSize: fontSizes.body_small,
  },
  nextButtonContainer: {
    marginVertical: 16,
    height: 50,
  },
  button: {
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  elementsContainer: {
    marginTop: 16,
  },
  horizontalContainer: {
    marginTop: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    maxWidth: "100%",
  },
  sensitivityIndicator: {
    marginTop: 5,
    height: 15,
    backgroundColor: colors.border,
    borderRadius: 3,
  },
  sensitivityBar: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  pickupViewContainer: {
    margin: 0,
  },
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  pickupTimeContainer: {
    maxWidth: "85%",
  },
  editText: {
    paddingLeft: 18,
    paddingVertical: 12,
    color: colors.primary,
    fontFamily: fonts.bold,
    fontSize: fontSizes.body_semi_medium,
  },
  spacer_4: {
    height: 4,
  },
});

export default ItemDetailsScreen;
