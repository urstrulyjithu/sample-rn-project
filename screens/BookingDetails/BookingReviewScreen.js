import React, {useCallback, useState} from "react";
import {
  View,
  Text,
  StatusBar,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from "react-native";
import {useSelector, useDispatch} from "react-redux";
import moment from "moment";

import fonts from "../../constants/fonts";
import colors from "../../constants/colors";
import fontSizes from "../../constants/font-sizes";
import {localize} from "../../translations/localized";
import * as constants from "../../constants/general";
import * as routes from "../../navigation/routes/app-routes";
import * as creditCardActions from "../../redux/actions/credit-cards";

import useEstimationBreakup from "../../api/estimationBreakup/estimationBreakup";

import Loader from "../../components/UI/Loading/Loader";
import RoundButton from "../../components/UI/Buttons/RoundButton";
import LeftArrow from "../../components/UI/HeaderButtons/LeftArrow";
import EstimationView from "../../components/BookingDetails/EstimationView";

import SavedAddress from "../../models/savedAddress";
import GeoCodedAddress from "../../models/geoCodedAddress";
import {stringToFloat} from "../../utilities/utilities";
import ServiceView from "../../components/BookingDetails/ServiceView";

const BookingReviewScreen = ({navigation}) => {
  const dispatch = useDispatch();
  const [showLoader, setShowLoader] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [priceBreakupDetails, setPriceBreakupDetails] = useState(null);
  const [
    getPriceBreakup,
    priceBreakupResponse,
    priceBreakupError,
  ] = useEstimationBreakup();

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
  const productDetails = useSelector(
    state => state.productDetails.productDetails,
  );

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: localize("booking_review"),
      headerStyle: {
        backgroundColor: colors.textPrimary,
      },
      headerLeft: () => (
        <LeftArrow
          color="white"
          onPress={() => {
            navigation.pop();
          }}
        />
      ),
      headerTintColor: "white",
      headerLargeTitle: false,
    });
  }, [navigation]);

  React.useEffect(() => {
    const focusSubscription = navigation.addListener(
      "focus",
      getBreakupEstimation,
    );
    return focusSubscription;
  }, [navigation, getBreakupEstimation]);

  const getBreakupEstimation = useCallback(async () => {
    setShowLoader(true);
    if (selectedRide.priceId.length > 0) {
      try {
        await getPriceBreakup(selectedRide.priceId);
      } catch (error) {
        setErrorMessage(error);
        setShowLoader(false);
      }
    }
  }, [selectedRide?.priceId, getPriceBreakup]);

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
    if (priceBreakupResponse) {
      setShowLoader(false);
      console.log(
        "priceBreakupResponse -->",
        JSON.stringify(priceBreakupResponse),
      );
      setPriceBreakupDetails(priceBreakupResponse);
    } else if (priceBreakupError) {
      setShowLoader(false);
      setErrorMessage(priceBreakupError);
    }
  }, [priceBreakupResponse, priceBreakupError]);

  const checkoutHandler = () => {
    navigation.navigate(routes.CHECK_OUT, {
      priceBreakupDetails,
    });
  };

  const boxes = [];
  for (let i = 0; i < 20; i++) {
    boxes.push(<View key={i} style={styles.smallBox} />);
  }

  const formattedDate = date => {
    if (!date) {
      return "";
    }
    return moment(0, "HH").diff(date, "days") !== 0
      ? moment(date).format("hh:mm A MMM D, YYYY")
      : moment(date).format("hh:mm A") + " " + localize("today");
  };

  const totalFarePrice = () => {
    const tip = parseFloat(productDetails.tipAmount);
    const carbonFreeTip = parseFloat(productDetails.carbonFreeTipAmount);
    let totalAmount = parseFloat(priceBreakupDetails.totalFare);
    if (!isNaN(tip)) {
      totalAmount += tip;
    }
    if (!isNaN(carbonFreeTip)) {
      totalAmount += carbonFreeTip;
    }
    return totalAmount;
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar translucent={false} barStyle="light-content" />
      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.pickupDestinationContainer}>
            <View style={styles.dotsContainer}>
              <View style={styles.dot} />
              {boxes}
              <View style={styles.box} />
            </View>
            <View style={styles.pickupDestinationView}>
              <View>
                <Text style={styles.pickupTitle}>
                  {localize("pick_up").toUpperCase()}
                </Text>
                <Text style={styles.pickupDetails}>
                  {pickupDetails.senderName}
                </Text>
                <Text style={styles.pickupDetails}>
                  {pickupDetails.phoneNumber}
                </Text>
                <Text style={styles.pickupDetails} numberOfLines={2}>
                  {pickupAddress}
                </Text>
                {productDetails.immediatePickup === false ? (
                  <Text style={styles.totalFareTitle}>
                    {localize("scheduled_on")}{" "}
                    <Text style={styles.pickupDetails}>
                      {formattedDate(productDetails.pickupTime)}
                    </Text>
                  </Text>
                ) : null}
              </View>
              <View style={styles.spacer_20} />
              <View>
                <Text style={styles.pickupTitle}>
                  {localize("destination").toUpperCase()}
                </Text>
                <Text style={styles.pickupDetails}>
                  {deliveryDetails.recipientName}
                </Text>
                <Text style={styles.pickupDetails}>
                  {deliveryDetails.phoneNumber}
                </Text>
                <Text style={styles.pickupDetails} numberOfLines={2}>
                  {deliveryAddress}
                </Text>
                {productDetails.immediateDrop === false ? (
                  <Text style={styles.totalFareTitle}>
                    {localize("delivery_start")}{" "}
                    <Text style={styles.pickupDetails}>
                      {formattedDate(productDetails.dropTime)}
                    </Text>
                  </Text>
                ) : null}
              </View>
            </View>
          </View>
          {priceBreakupDetails === null ? null : (
            <View>
              <View style={styles.separator} />
              <View style={styles.fareContainer}>
                <Text style={styles.totalFareTitle}>
                  {productDetails.negotiated
                    ? localize("total_fare_negotiated").toUpperCase()
                    : localize("total_fare").toUpperCase()}
                </Text>
                <Text style={styles.totalFare}>
                  {constants.CURRENCY_SYMBOL}
                  {priceBreakupDetails.totalFare}
                  {/* {totalFarePrice()} */}
                </Text>
                <Text style={styles.taxInclude}>{localize("include_tax")}</Text>
              </View>
              <View style={styles.separator} />
              <View style={styles.vehicleDetailsContainer}>
                <View style={styles.rideContainer}>
                  <ServiceView
                    selected={true}
                    serviceTypeId={priceBreakupDetails.serviceTypeId}
                    serviceTypeName={priceBreakupDetails.serviceTypeName}
                    lowEstimate={priceBreakupDetails.totalFare}
                    highEstimate={null}
                    duration={priceBreakupDetails.duration}
                  />
                </View>
              </View>
              <EstimationView
                title={localize("ride_type")}
                description={
                  productDetails.immediatePickup === true
                    ? localize("immediate")
                    : localize("scheduled")
                }
                secondTitle={localize("select_product_type")}
                secondDescription={
                  priceBreakupDetails.priceBreakUp.productType.productName
                }
              />
              <EstimationView
                title={localize("price")}
                description={
                  constants.CURRENCY_SYMBOL + priceBreakupDetails.basePrice
                }
                secondTitle={localize("distance")}
                secondDescription={
                  priceBreakupDetails.distance.toFixed(2) + " " + localize("km")
                }
              />
              <EstimationView
                title={localize("insurance")}
                description={
                  constants.CURRENCY_SYMBOL +
                  priceBreakupDetails.insuranceAmount.toString()
                }
                secondTitle={localize("tax")}
                secondDescription={
                  constants.CURRENCY_SYMBOL + priceBreakupDetails.tax.toString()
                }
              />
              <EstimationView
                title={localize("carbon_free_tip")}
                description={
                  constants.CURRENCY_SYMBOL +
                  stringToFloat(productDetails.carbonFreeTipAmount)
                }
                secondTitle={localize("driver_tip")}
                secondDescription={
                  constants.CURRENCY_SYMBOL +
                  stringToFloat(productDetails.tipAmount)
                }
              />
              <EstimationView
                title={localize("cancellation_fare")}
                redDescription={true}
                description={
                  constants.CURRENCY_SYMBOL +
                  priceBreakupDetails.cancellationPrice.toFixed(2).toString()
                }
                secondTitle={localize("additional_helpers")}
                secondDescription={
                  productDetails.helpersCount?.toString() ?? ""
                }
              />
              <View style={styles.spacer_20} />
            </View>
          )}
        </ScrollView>
        <View>
          <View style={styles.buttonContainer}>
            <RoundButton
              style={styles.button}
              title={localize("check_out").toUpperCase()}
              onPress={checkoutHandler}
            />
          </View>
        </View>
      </View>
      <Loader show={showLoader} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.textPrimary,
  },
  container: {
    flex: 1,
    marginTop: 25,
    marginBottom: 12,
    marginHorizontal: 16,
    borderRadius: 16,
    backgroundColor: "white",
  },
  pickupDestinationContainer: {
    padding: 16,
    flexDirection: "row",
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
  pickupDestinationView: {
    marginLeft: 16,
  },
  pickupTitle: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.body_tiny,
    color: colors.fade,
    marginBottom: 4,
  },
  pickupDetails: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.body_semi_medium,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  spacer_20: {
    height: 20,
  },
  separator: {
    backgroundColor: colors.border,
    height: 1,
  },
  fareContainer: {
    alignItems: "center",
    paddingVertical: 20,
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
  vehicleDetailsContainer: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  rideContainer: {
    marginBottom: 8,
    paddingHorizontal: 14,
    borderRadius: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "rgba(0, 0, 0, 0.03)",
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
});

export default BookingReviewScreen;
