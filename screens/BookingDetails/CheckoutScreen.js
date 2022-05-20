import React, {useState, useCallback} from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Switch,
  Platform,
  Modal,
} from "react-native";
import {useSelector, useDispatch} from "react-redux";
import moment from "moment";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

import colors from "../../constants/colors";
import fontSizes from "../../constants/font-sizes";
import fonts from "../../constants/fonts";
import {localize} from "../../translations/localized";
import * as routes from "../../navigation/routes/app-routes";
import * as creditCardActions from "../../redux/actions/credit-cards";
import useBookingConfirm from "../../api/bookingConfirm/bookingConfirm";
import * as bookingIdActions from "../../redux/actions/booking-id";
import * as constants from "../../constants/general";
import useConsumeRewards from "../../api/rewardPoints/rewardPoints";

import RoundButton from "../../components/UI/Buttons/RoundButton";
import CreditCardView from "../../components/UI/CreditCard/CreditCardView";
import LeftArrow from "../../components/UI/HeaderButtons/LeftArrow";
import Loader from "../../components/UI/Loading/Loader";

import SavedAddress from "../../models/savedAddress";
import GeoCodedAddress from "../../models/geoCodedAddress";
import PriceNegotiateView from "../../components/BookingDetails/PriceNegotiateView";
import ErrorText from "../../components/UI/Texts/ErrorText";
import PopupAlert from "../../components/UI/Alert/PopupAlert";

const CheckoutScreen = ({route, navigation}) => {
  const {priceBreakupDetails} = route.params;
  const dispatch = useDispatch();
  const [showLoader, setShowLoader] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [selectedCardId, setSelectedCardId] = useState(-1);
  const [enablePriceNegotiate, setEnablePriceNegotiate] = useState(false);
  const [newTotalFare, setNewTotalFare] = useState(0);
  const [newBaseFare, setNewBaseFare] = useState(0);
  const [isPriceNegotiated, setIsPriceNegotiated] = useState(false);
  const [isRewardsApplied, setIsRewardsApplied] = useState(false);
  const [showBookingConfirmAlert, setShowBookingConfirmAlert] = useState(false);
  const cards = useSelector(state => state.cards.cards);
  const [
    onBookingConfirm,
    confirmBookingResponse,
    confirmBookingError,
  ] = useBookingConfirm();
  const [
    onConsumeRewards,
    consumeRewards,
    consumeRewardsError,
  ] = useConsumeRewards();
  const [appliedRewards, setAppliedRewards] = useState(0);

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
  const pickupDetails = useSelector(state => state.pickupDetails.pickupDetails);
  const pickupAddress =
    sourceGeoCodedAddress?.address?.length > 0
      ? sourceGeoCodedAddress?.address
      : sourceSavedAddress?.line?.length > 0
      ? sourceSavedAddress?.line
      : "";
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
  const selectedRide = useSelector(state => state.selectRide.rides)[0];
  const deliveryAddress =
    destinationGeoCodedAddress?.address?.length > 0
      ? destinationGeoCodedAddress?.address
      : destinationSavedAddress?.line?.length > 0
      ? destinationSavedAddress?.line
      : "";
  const deliveryLatitude =
    destinationGeoCodedAddress?.latitude !== 0
      ? destinationGeoCodedAddress?.latitude
      : destinationSavedAddress?.latitude !== 0
      ? destinationSavedAddress?.latitude
      : 0;
  const deliveryLongitude =
    destinationGeoCodedAddress?.longitude !== 0
      ? destinationGeoCodedAddress?.longitude
      : destinationSavedAddress?.longitude !== 0
      ? destinationSavedAddress?.longitude
      : 0;
  const sourcePlaceId =
    sourceGeoCodedAddress.placeId.length > 0
      ? sourceGeoCodedAddress.placeId
      : sourceSavedAddress.placeId.length > 0
      ? sourceSavedAddress.placeId
      : "";

  const destinationPlaceId =
    destinationGeoCodedAddress.placeId.length > 0
      ? destinationGeoCodedAddress.placeId
      : destinationSavedAddress.placeId.length > 0
      ? destinationSavedAddress.placeId
      : "";
  const productDetails = useSelector(
    state => state.productDetails.productDetails,
  );
  const wallet = useSelector(state => state.wallet.wallet);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: localize("check_out"),
      headerLeft: () => (
        <LeftArrow
          onPress={() => {
            navigation.pop();
          }}
        />
      ),
    });
  }, [navigation]);

  React.useEffect(() => {
    const focusSubscription = navigation.addListener("focus", getData);
    return focusSubscription;
  }, [navigation, getData]);

  const getData = useCallback(async () => {
    setErrorMessage(null);
    setShowLoader(true);
    try {
      await dispatch(creditCardActions.getCreditCards());
    } catch (error) {
      setErrorMessage(error.message);
    }
    setShowLoader(false);
  }, [dispatch, setShowLoader, setErrorMessage]);

  React.useEffect(() => {
    let timer;
    if (confirmBookingResponse) {
      setShowLoader(false);
      console.log(
        "confirmBookingResponse -->",
        JSON.stringify(confirmBookingResponse),
      );
      dispatch(
        bookingIdActions.saveBookingId(
          confirmBookingResponse.bookingId,
          confirmBookingResponse.fareBreakUpId,
          confirmBookingResponse.preBookingId,
        ),
      );
      if (productDetails?.immediatePickup === false) {
        timer = setTimeout(() => {
          setShowBookingConfirmAlert(true);
        }, 500);
      } else {
        navigation.navigate(routes.DRIVER_SEARCH, {
          driverOnTheWayToPickupPoint: false,
          driverOnTheWayToDeliveryPoint: false,
          totalFare: priceBreakupDetails.totalFare,
          serviceTypeId: selectedRide.serviceTypeId,
        });
      }
    } else if (confirmBookingError) {
      setShowLoader(false);
      setErrorMessage(confirmBookingError);
    }
    return () => {
      clearTimeout(timer);
    };
  }, [
    navigation,
    dispatch,
    confirmBookingResponse,
    confirmBookingError,
    priceBreakupDetails.totalFare,
    selectedRide.serviceTypeId,
    productDetails?.immediatePickup,
  ]);

  const addCardHandler = () => {
    setErrorMessage("");
    navigation.navigate(routes.ADD_NEW_CARD, {
      fromRoute: routes.CHECK_OUT,
      bookingId: null,
    });
  };

  const orderNowButtonPressHandler = () => {
    setErrorMessage("");
    let sensitivity = null;
    if (productDetails.sensitivity === 1) {
      sensitivity = "L";
    } else if (productDetails.sensitivity === 2) {
      sensitivity = "M";
    } else if (productDetails.sensitivity === 3) {
      sensitivity = "H";
    }
    const paymentMode = selectedCardId === -100 ? "wallet" : "creditCard";
    const cardId = selectedCardId === -100 ? 0 : selectedCardId;
    if (
      (paymentMode === "creditCard" && cards.length === 0) ||
      selectedCardId === -1
    ) {
      setErrorMessage(localize("no_payment_methods_message"));
      return;
    } else if (paymentMode === "wallet" && wallet.currentBalance === 0) {
      setErrorMessage(localize("no_wallet_balance_message"));
      return;
    }
    setShowLoader(true);
    const pickupTime = productDetails?.pickupTime ?? new Date();
    const formattedPickupTime = moment(pickupTime)
      .set("seconds", 0)
      .format("DD-MM-YYYY HH:mm:ss");
    const dropTime = productDetails?.dropTime ?? new Date();
    const formattedDropTime = moment(dropTime)
      .set("seconds", 0)
      .format("DD-MM-YYYY HH:mm:ss");
    onBookingConfirm(
      "1",
      "1",
      pickupLatitude,
      pickupLongitude,
      deliveryLatitude,
      deliveryLongitude,
      productDetails.immediatePickup === false ||
        productDetails.immediateDrop === false
        ? "S"
        : "N",
      productDetails.type,
      +productDetails.cost,
      sensitivity,
      productDetails.insurance > 0,
      productDetails.helpersCount,
      productDetails.immediatePickup === false ? formattedPickupTime : null,
      selectedRide.priceId,
      pickupAddress,
      deliveryAddress,
      deliveryDetails.recipientName,
      deliveryDetails.phoneNumber,
      deliveryDetails.locationDetails,
      pickupDetails.senderName,
      pickupDetails.phoneNumber,
      pickupDetails.locationDetails,
      "S",
      sourcePlaceId,
      destinationPlaceId,
      "S",
      pickupDetails.locationDetails,
      deliveryDetails.locationDetails,
      "B",
      "B",
      selectedRide.vehicleTypeId,
      paymentMode,
      cardId,
      isPriceNegotiated,
      newTotalFare,
      isRewardsApplied,
      productDetails.immediateDrop === false,
      productDetails.immediateDrop === false ? formattedDropTime : null,
      productDetails.giveTip,
      productDetails.giveCarbonFreeTip,
      productDetails.tipAmount,
      productDetails.carbonFreeTipAmount,
      selectedRide.serviceTypeId,
      productDetails.description,
    );
  };

  const renderItem = item => {
    return (
      <CreditCardView
        card={item}
        selected={item.cardDetailId === selectedCardId}
        onPress={() => creditCardViewOnPressHandler(item.cardDetailId)}
        showRemove={false}
        showTickMark={true}
      />
    );
  };

  const ListFooter = () => {
    return (
      <View style={styles.buttonContainer}>
        <RoundButton
          style={{...styles.button, ...styles.addButton}}
          titleColor={colors.primary}
          title={localize("add_new_card").toUpperCase()}
          onPress={addCardHandler}
        />
      </View>
    );
  };

  const creditCardViewOnPressHandler = cardId => {
    setErrorMessage("");
    setSelectedCardId(cardId);
  };

  const totalFareAfterRewardsApplied = () => {
    const result =
      priceBreakupDetails.totalFare - (isRewardsApplied ? appliedRewards : 0);
    return addTipAndCarbonFreeSupport(result).toFixed(2);
  };

  const fareAfterRewardsApplied = () => {
    const result = newTotalFare - (isRewardsApplied ? appliedRewards : 0);
    return addTipAndCarbonFreeSupport(result).toFixed(2);
  };

  const addTipAndCarbonFreeSupport = amount => {
    const tip = parseFloat(productDetails.tipAmount);
    const carbonFreeTip = parseFloat(productDetails.carbonFreeTipAmount);
    let totalAmount = parseFloat(amount);
    // if (!isNaN(tip)) {
    //   totalAmount += tip;
    // }
    // if (!isNaN(carbonFreeTip)) {
    //   totalAmount += carbonFreeTip;
    // }
    return totalAmount;
  };

  const consumeRewardsPressHandler = () => {
    if (!isRewardsApplied) {
      setShowLoader(true);
      onConsumeRewards(selectedRide.priceId);
    }
    setIsRewardsApplied(!isRewardsApplied);
    setErrorMessage("");
  };

  React.useEffect(() => {
    setShowLoader(false);
    if (consumeRewards > 0) {
      setAppliedRewards(consumeRewards);
    } else if (consumeRewardsError) {
      setErrorMessage(consumeRewardsError);
    }
  }, [consumeRewardsError, consumeRewards]);

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

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar translucent={false} barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.separator} />
        <View style={styles.fareContainer}>
          <Text style={styles.totalFareTitle}>
            {productDetails.negotiated
              ? localize("total_fare_negotiated").toUpperCase()
              : localize("total_fare").toUpperCase()}
          </Text>
          {isPriceNegotiated ? (
            <View style={styles.fareTextContainer}>
              <Text style={{...styles.totalFareStrike, ...styles.strike}}>
                {constants.CURRENCY_SYMBOL}
                {addTipAndCarbonFreeSupport(priceBreakupDetails.totalFare)}
              </Text>
              <Text style={styles.totalFare}>
                {constants.CURRENCY_SYMBOL}
                {fareAfterRewardsApplied()}
              </Text>
              {isRewardsApplied ? (
                <View style={styles.priceNegotiateContainer}>
                  <Text style={styles.totalFare}> + </Text>
                  <MaterialCommunityIcons
                    name="flash-circle"
                    color={colors.primary}
                    size={25}
                  />
                  <Text style={styles.totalFare}>{appliedRewards}</Text>
                </View>
              ) : null}
            </View>
          ) : (
            <View style={styles.priceNegotiateContainer}>
              <Text style={styles.totalFare}>
                {constants.CURRENCY_SYMBOL}
                {totalFareAfterRewardsApplied()}
              </Text>
              {isRewardsApplied ? (
                <View style={styles.priceNegotiateContainer}>
                  <Text style={styles.totalFare}> + </Text>
                  <MaterialCommunityIcons
                    name="flash-circle"
                    color={colors.primary}
                    size={25}
                  />
                  <Text style={styles.totalFare}>{appliedRewards}</Text>
                </View>
              ) : null}
            </View>
          )}
          <Text style={styles.taxInclude}>{localize("include_tax")}</Text>
        </View>
        <View style={styles.separator} />
        {productDetails.tipAmount > 0 ||
        productDetails.carbonFreeTipAmount > 0 ? (
          <View>
            <View style={styles.centerContainer}>
              {productDetails.tipAmount > 0 ? (
                <Text style={styles.taxInclude}>
                  {localize("driver_tip").toUpperCase()}:{" "}
                  <Text style={styles.driverTipAmount}>
                    {constants.CURRENCY_SYMBOL}
                    {productDetails.tipAmount}
                  </Text>{" "}
                </Text>
              ) : null}
              {productDetails.carbonFreeTipAmount > 0 ? (
                <Text style={styles.taxInclude}>
                  {localize("carbon_free_tip").toUpperCase()}:{" "}
                  <Text style={styles.driverTipAmount}>
                    {constants.CURRENCY_SYMBOL}
                    {productDetails.carbonFreeTipAmount}
                  </Text>
                </Text>
              ) : null}
            </View>
            <View style={styles.separator} />
          </View>
        ) : null}
        {priceBreakupDetails.totalFare > constants.MIN_BARGAIN_FARE &&
        (selectedRide.serviceTypeId === 2 ||
          selectedRide.serviceTypeId === 3) &&
        productDetails.negotiated === false ? (
          <View style={styles.elementsContainer}>
            <View style={styles.priceNegotiateContainer}>
              <Text
                style={{
                  ...styles.totalFareTitle,
                  color:
                    isPriceNegotiated || isRewardsApplied
                      ? colors.field
                      : colors.textPrimary,
                }}>
                {localize("price_negotiate")}
              </Text>
              <Switch
                disabled={isPriceNegotiated || isRewardsApplied}
                trackColor={{
                  false: Platform.OS === "android" && colors.fade,
                  true: colors.primary,
                }}
                thumbColor={
                  Platform.OS === "android" &&
                  (enablePriceNegotiate ? colors.primary : colors.border)
                }
                value={enablePriceNegotiate}
                onValueChange={newValue => {
                  setEnablePriceNegotiate(newValue);
                  setErrorMessage("");
                }}
              />
            </View>
          </View>
        ) : null}
        <Text style={styles.headerTitle}>
          {localize("select_cards_message")}
        </Text>
        <View>
          {cards.map(card => (
            <View style={styles.list} key={card.cardDetailId}>
              {renderItem(card)}
            </View>
          ))}
        </View>
        <ListFooter />
        <Text style={styles.headerTitle}>
          {localize("select_wallet_message")}
        </Text>
        <View style={styles.wallet}>
          <CreditCardView
            card={null}
            selected={selectedCardId === -100}
            onPress={() => creditCardViewOnPressHandler(-100)}
            cashPayment
            balance={wallet.accountBalance}
          />
        </View>
        {wallet.currentRewardPoints > 0 ? (
          <View>
            <Text style={{...styles.headerTitle, ...styles.nagMargin}}>
              {localize("select_rewards_message")}
            </Text>
            <View style={styles.wallet}>
              <CreditCardView
                card={null}
                selected={isRewardsApplied}
                onPress={consumeRewardsPressHandler}
                rewardPayment
                balance={wallet.currentRewardPoints}
              />
            </View>
          </View>
        ) : null}
      </ScrollView>
      {priceBreakupDetails === null ? null : (
        <View>
          <Text style={styles.estimationTimeText}>
            {localize("estimated_time_for_delivery")}{" "}
            <Text style={styles.estimationTime}>
              {formatDuration(priceBreakupDetails.duration)}
            </Text>
          </Text>
        </View>
      )}
      {errorMessage ? (
        <View style={styles.elementsContainer}>
          <ErrorText error={errorMessage} />
        </View>
      ) : null}
      <View style={styles.buttonContainer}>
        <RoundButton
          style={styles.button}
          title={localize("order_now").toUpperCase()}
          onPress={orderNowButtonPressHandler}
        />
      </View>
      <Modal
        animationType="fade"
        transparent
        visible={enablePriceNegotiate}
        onDismiss={() => {
          setEnablePriceNegotiate(false);
        }}>
        <PriceNegotiateView
          priceId={selectedRide?.priceId}
          totalFare={priceBreakupDetails.totalFare}
          previousNegotiatedPrice={newBaseFare}
          baseFare={priceBreakupDetails.basePrice}
          onTotalFareChange={(totalPrice, totalBasePrice) => {
            setNewTotalFare(totalPrice);
            setNewBaseFare(totalBasePrice);
            setEnablePriceNegotiate(false);
            setIsPriceNegotiated(true);
            setErrorMessage("");
          }}
          onDismiss={() => {
            setEnablePriceNegotiate(false);
            setErrorMessage("");
          }}
        />
      </Modal>
      <PopupAlert
        show={showBookingConfirmAlert}
        title={localize("success")}
        message={localize("booking_confirm_success")}
        showOk
        onOkButtonPress={() => {
          setShowBookingConfirmAlert(false);
          navigation.navigate(routes.TRANSACTIONS);
        }}
      />
      <Loader show={showLoader} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "white",
  },
  wallet: {
    marginHorizontal: 12,
    marginBottom: 16,
  },
  headerTitle: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.body_medium,
    color: colors.textPrimary,
    margin: 16,
  },
  estimationTimeText: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.body_small,
    color: colors.primary,
    textAlign: "center",
    paddingTop: 12,
  },
  estimationTime: {
    fontFamily: fonts.bold,
  },
  list: {
    marginHorizontal: 12,
  },
  buttonContainer: {
    marginVertical: 16,
    marginHorizontal: 16,
    height: 50,
  },
  button: {
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  addButton: {
    backgroundColor: "white",
    borderColor: colors.primary,
    borderWidth: 1,
  },
  fareTextContainer: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  fareContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  separator: {
    backgroundColor: colors.border,
    height: 1,
  },
  totalFareTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.body_semi_medium,
    color: colors.fade,
  },
  totalFare: {
    fontFamily: fonts.heavy,
    fontSize: fontSizes.heavy,
    color: colors.primary,
    marginTop: 4,
  },
  taxInclude: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.body_small,
    color: colors.fade,
  },
  totalFareStrike: {
    fontFamily: fonts.heavy,
    fontSize: fontSizes.header,
    color: colors.field,
    marginTop: 4,
    marginRight: 4,
  },
  strike: {
    textDecorationLine: "line-through",
  },
  elementsContainer: {
    marginTop: 16,
    marginHorizontal: 16,
  },
  field: {
    marginTop: 16,
  },
  priceNegotiateContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  nagMargin: {
    marginTop: -4,
  },
  driverTipAmount: {
    marginTop: 8,
    fontFamily: fonts.bold,
    fontSize: fontSizes.body_small,
    color: colors.primary,
  },
  centerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    margin: 8,
  },
});

export default CheckoutScreen;
