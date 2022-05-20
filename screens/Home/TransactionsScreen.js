import React, {useState, useEffect, useCallback} from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ImageBackground,
  FlatList,
  BackHandler,
  Dimensions,
  Platform,
} from "react-native";
import {useDispatch, useSelector} from "react-redux";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import PresentModal from "react-native-modal";
import moment from "moment";

import fonts from "../../constants/fonts";
import colors from "../../constants/colors";
import fontSizes from "../../constants/font-sizes";
import {localize} from "../../translations/localized";
import * as constants from "../../constants/general";
import * as routes from "../../navigation/routes/app-routes";
import * as profileActions from "../../redux/actions/profile";
import * as walletActions from "../../redux/actions/wallet";
import * as activeTransactionsActions from "../../redux/actions/active-transactions";
import * as sourceGeoCodedAddressActions from "../../redux/actions/source-geo-coded-address";
import * as destinationGeoCodedAddressActions from "../../redux/actions/destination-geo-coded-address";
import * as wayPointsActions from "../../redux/actions/way-points";
import * as bookingIdActions from "../../redux/actions/booking-id";
import * as pickupDetailsActions from "../../redux/actions/pickup-details";
import * as deliveryDetailsActions from "../../redux/actions/delivery-details";
import * as bookingAcceptActions from "../../redux/actions/booking-accept";
import * as showKYCActions from "../../redux/actions/show-kyc";
import * as driverLocationActions from "../../redux/actions/driver-location";
import * as creditCardActions from "../../redux/actions/credit-cards";
import {clearReduxStoreOnBooking} from "../../redux/actions/clear-redux-storage";
import * as authErrorActions from "../../redux/actions/auth-error";
import * as driverCancelRideActions from "../../redux/actions/driver-cancel-ride";
import * as autoCancelBookingActions from "../../redux/actions/auto-cancel-booking";
import * as pickupInfoActions from "../../redux/actions/pickup-info";
import * as dropInfoActions from "../../redux/actions/drop-info";
import * as bookingRatedActions from "../../redux/actions/booking-rated";

import Profile from "../../models/profile";
import Wallet from "../../models/wallet";
import GeoCodedAddress from "../../models/geoCodedAddress";
import SocketConnection from "../../services/socket-service";

import Loader from "../../components/UI/Loading/Loader";
import NoRide from "../../components/Ride/NoRide";
import MenuButton from "../../components/UI/HeaderButtons/MenuButton";
import VerifyKYC from "../../components/DocumentsVerification/VerifyKYC";
import BookingAccept from "../../models/bookingAccept";
import PopupAlert from "../../components/UI/Alert/PopupAlert";
import RideOverview from "../../components/Ride/RideOverview";
import { NotificationBell } from "../../constants/image";


const TransactionsScreen = ({navigation}) => {
  const dispatch = useDispatch();
  const [showLoader, setShowLoader] = useState(false);
  const [loadSocket, setLoadSocket] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [showKYCView, setShowKYCView] = useState(false);
  const showKYCAlert = useSelector(state => state.showKYC.showKYC);
  const [showHaltMessageAlert, setShowHaltMessageAlert] = useState(false);
  const [haltMessage, setHaltMessage] = useState("");
  const [showExitAlert, setShowExitAlert] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const profile = Profile.class(useSelector(state => state.getProfile.profile));
  const wallet = Wallet.class(useSelector(state => state.wallet.wallet));
  const transactions = useSelector(
    state => state.activeTransactions.transactions,
  );
  const cards = useSelector(state => state.cards.cards);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: localize("home"),
      headerLeft: () => (
        <MenuButton
          onPress={() => {
            navigation.toggleDrawer();
          }}
        />
      ),
      headerRight: () => (
        <NotificationBell style={styles.bellIcon} onPress={()=> navigation.navigate(routes.NOTIFICATIONS)} />
      )
    });
  }, [navigation]);

  useEffect(() => {
    const focusSubscription = navigation.addListener("focus", getData);
    return focusSubscription;
  }, [navigation, getData]);

  const getData = useCallback(async () => {
    console.log(
      "********************** CALLING GET DATA ***********************",
    );
    if (!navigation.isFocused()) {
      return;
    }
    dispatch(activeTransactionsActions.removeActiveTransactions());
    dispatch(bookingRatedActions.saveBookingRated(false));
    setErrorMessage(null);
    setShowLoader(true);
    try {
      await dispatch(profileActions.getProfile());
      setLoadSocket(true);
    } catch (error) {
      setErrorMessage(error.message);
      if (error.message === constants.AUTH_ERROR) {
        dispatch(clearReduxStoreOnBooking());
        navigation.navigate(routes.PRE_LOGIN, {
          screen: routes.SIGNING,
          params: {
            authError: false,
          },
        });
      }
    }
    setShowLoader(false);
    try {
      await dispatch(walletActions.getWalletBalance());
      await dispatch(activeTransactionsActions.getActiveTransactions());
      if (cards?.length === 0) {
        await dispatch(creditCardActions.getCreditCards());
      }
    } catch (error) {
      setErrorMessage(error.message);
    }
  }, [cards?.length, dispatch, navigation]);

  const hardwareBackButtonPressHandler = useCallback(() => {
    if (navigation.isFocused()) {
      if (Platform.OS === "android") {
        setShowExitAlert(true);
      }
      return true;
    }
  }, [navigation]);

  React.useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      hardwareBackButtonPressHandler,
    );

    return () => {
      backHandler.remove();
    };
  }, [navigation, hardwareBackButtonPressHandler]);

  const onRideTouchHandler = item => {
    const sourceAddress = new GeoCodedAddress(
      item.bookingLocations.fromLocationPlaceId,
      item.bookingLocations.fromLocation,
      item.bookingLocations.fromLocationLatitude,
      item.bookingLocations.fromLocationLongitude,
    );
    dispatch(
      sourceGeoCodedAddressActions.saveSourceGeoCodedAddress(sourceAddress),
    );
    const destinationAddress = new GeoCodedAddress(
      item.bookingLocations.toLocationPlaceId,
      item.bookingLocations.toLocation,
      item.bookingLocations.toLocationLatitude,
      item.bookingLocations.toLocationLongitude,
    );
    dispatch(
      destinationGeoCodedAddressActions.saveDestinationGeoCodedAddress(
        destinationAddress,
      ),
    );
    dispatch(wayPointsActions.saveWayPoints(item.wayPoints));
    dispatch(bookingIdActions.saveBookingId(item.bookingDetailId));
    dispatch(
      pickupDetailsActions.savePickupDetails({
        locationDetails: item.fromContactDetails.toContactLandmark,
        senderName: item.toContactDetails.fromContactName,
        phoneNumber: item.toContactDetails.fromContactMobile,
        saveAddress: false,
      }),
    );
    dispatch(
      deliveryDetailsActions.saveDeliveryDetails({
        locationDetails: item.toContactDetails.fromContactLandmark,
        recipientName: item.fromContactDetails.toContactName,
        phoneNumber: item.fromContactDetails.toContactMobile,
        saveAddress: false,
      }),
    );
    dispatch(driverLocationActions.removeDriverLocation());
    if (
      item.bookingStatus === "Allocated" ||
      item.bookingStatus === "Pickedup"
    ) {
      const bookingAcceptNotification = new BookingAccept(
        item.PickUpOtp,
        item.bookingDetailId,
        item.driverDetailId,
        item.driverDetails.driverName,
        "",
        item.driverDetails.driverMobileNumber,
        item.driverDetails.driverGender,
        item.vehicleDetailId,
        item.driverDetails.vehicleDetails.vehicleColor,
        item.driverDetails.vehicleDetails.driverVehicleNumber,
        item.driverDetails.vehicleDetails.vehicleBrandDetails,
        item.driverDetails.vehicleDetails.vehicleModel,
        item.driverDetails.driverPic,
      );
      dispatch(
        bookingAcceptActions.saveBookingAcceptNotification(
          bookingAcceptNotification,
        ),
      );
    }
    if (item.bookingStatus === "Initiated") {
      dispatch(bookingAcceptActions.removeBookingAcceptNotification());
      navigation.navigate(routes.DRIVER_SEARCH, {
        driverOnTheWayToPickupPoint: false,
        driverOnTheWayToDeliveryPoint: false,
        totalFare: item.totalBillAmount,
        paymentInfo: item.paymentInfo,
        serviceTypeId: item.serviceTypeId,
      });
    } else if (item.bookingStatus === "Allocated") {
      navigation.navigate(routes.DRIVER_SEARCH, {
        driverOnTheWayToPickupPoint: true,
        driverOnTheWayToDeliveryPoint: false,
        totalFare: item.totalBillAmount,
        paymentInfo: item.paymentInfo,
        serviceTypeId: item.serviceTypeId,
      });
    } else if (item.bookingStatus === "Pickedup") {
      navigation.navigate(routes.DRIVER_SEARCH, {
        driverOnTheWayToPickupPoint: false,
        driverOnTheWayToDeliveryPoint: true,
        totalFare: item.totalBillAmount,
        paymentInfo: item.paymentInfo,
        serviceTypeId: item.serviceTypeId,
      });
    } else if (item.bookingStatus === "Halted") {
      setShowHaltMessageAlert(true);
      setHaltMessage(
        localize("package_halt_message") +
          moment(item.deliverDateTime).format("DD MMM YYYY hh:mm A"),
      );
    }
  };

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (profile.id !== 0) {
        // checkForKYCVerification();
      }
    }, 500);
    return () => {
      clearTimeout(timer);
    };
  }, [checkForKYCVerification, profile.id]);

  const checkForKYCVerification = useCallback(() => {
    dispatch(authErrorActions.showAuthError());
    if (profile?.documentVerified === null || showKYCAlert === true) {
      return;
    }
    if (profile.documentVerified === "NU" && showKYCAlert === false) {
      dispatch(showKYCActions.showKYCAlert(true));
      setShowKYCView(true);
    }
  }, [dispatch, profile, showKYCAlert]);

  const getStartedButtonPressHandler = () => {
    // if (profile.documentVerified === "NU") {
    //   setShowKYCView(true);
    // } else {
    dispatch(clearReduxStoreOnBooking());
    navigation.navigate(routes.HOME);
    // }
  };

  const renderItem = ({item, index}) => {
    return (
      <RideOverview ride={item} onPress={() => onRideTouchHandler(item)} />
    );
  };

  const iconSize = Dimensions.get("window").width > 375 ? 45 : 30;
  const ListHeader = () => {
    return (
      <View>
        <View style={styles.topContainer}>
          <View style={styles.walletContainer}>
            <MaterialCommunityIcons
              name="flash-circle"
              color={colors.primary}
              size={iconSize}
            />
            <View style={styles.ridesContainer}>
              <Text style={styles.ridesText}>{localize("rewards")}</Text>
              <Text style={styles.ridesText}>
                {parseFloat(wallet.accountRewardPoints).toFixed(2)}
              </Text>
            </View>
          </View>
          <View style={styles.walletContainer}>
            <Ionicons name="wallet" size={iconSize} color={colors.primary} />
            <View style={styles.ridesContainer}>
              <Text style={styles.ridesText}>{localize("wallet_balance")}</Text>
              <Text style={styles.ridesText}>
                {constants.CURRENCY_SYMBOL}
                {wallet.accountBalance.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.carbonReductionContainer}>
          <ImageBackground
            source={require("../../assets/images/reduced-carbon-background.png")}
            imageStyle={styles.carbonReductionImageOuter}
            style={styles.carbonReductionImage}>
            <View style={styles.carbonReductionTextContainer}>
              <Text style={styles.carbonReductionText}>
                {localize("reduced_carbon").toUpperCase()}
              </Text>
              <Text style={styles.ridesText}>
                {profile.reducedCarbon} {localize("tonnes")}
              </Text>
            </View>
          </ImageBackground>
        </View>
        <Text style={styles.recentRidesText}>
          {localize("ongoing_rides").toUpperCase()}
        </Text>
        <NoRide
          noRidesText={
            transactions.length === 0
              ? localize("no_ongoing_rides")
              : localize("start_a_new_ride")
          }
          onGetStartedPress={getStartedButtonPressHandler}
        />
      </View>
    );
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

  const onRefresh = async () => {
    setRefreshing(true);
    setShowLoader(true);
    await dispatch(activeTransactionsActions.getActiveTransactions());
    setShowLoader(false);
    setRefreshing(false);
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.screen}>
        <FlatList
          showsVerticalScrollIndicator={false}
          data={transactions}
          keyExtractor={(item, index) => `${item.bookingDetailId}`}
          renderItem={renderItem}
          ListHeaderComponent={ListHeader}
          ListFooterComponent={<View style={styles.carbonReductionContainer} />}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      </SafeAreaView>
      <PresentModal
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
      </PresentModal>
      <PopupAlert
        show={showHaltMessageAlert}
        title={localize("booking")}
        message={haltMessage}
        showOk
        onOkButtonPress={() => {
          setShowHaltMessageAlert(false);
        }}
      />
      <PopupAlert
        show={showExitAlert}
        title={localize("exit")}
        message={localize("exit_message")}
        showOk
        showCancel
        onOkButtonPress={() => {
          BackHandler.exitApp();
        }}
        onCancelButtonPress={() => {
          setShowExitAlert(false);
        }}
      />
      <Loader show={showLoader} />
      {loadSocket === true ? (
        <SocketConnection
          onNewBookingReceived={(newBookingReceived, data) => {
            if (newBookingReceived) {
              console.log("onNewBookingReceived", data);
              const bookingId = data?.bookingId ?? "";
              const pickupLocation = data?.fromLocationName ?? "";
              const deliverLocation = data?.toLocationName ?? "";
              const productName = data?.productName ?? "";
              const productDetails = data?.productDetails ?? "";
              const status = "NEW_BOOKING";
              const pickUpDateTime = data?.pickUpDateTime ?? "";
              const deliverDateTime = data?.deliverDateTime ?? "";

              navigation.navigate(routes.BOOKING_INFO, {
                bookingInfo: {
                  title: localize("driver_allocated_alert_title"),
                  message: localize("driver_accept_booking_message", {
                    driver_name: data.driverName,
                  }),
                  bookingId,
                  pickupLocation,
                  deliverLocation,
                  status,
                  vehicleName:
                    data.vehicleBrandDetails + " " + data.vehicleModel,
                  vehicleNumber: data.vehicleNumber,
                  productName,
                  productDetails,
                  okButtonPress: async () => {
                    // getData();
                    await dispatch(
                      activeTransactionsActions.getActiveTransactions(),
                    );
                  },
                  pickUpDateTime,
                  deliverDateTime,
                },
              });
            }
          }}
          onDriverCancelBooking={(cancelled, data) => {
            if (cancelled) {
              console.log("onDriverCancelBooking", data);
              const message = data?.msg ?? "";
              const bookingId = data?.bookingId ?? "";
              const pickupLocation = data?.fromLocationName ?? "";
              const deliverLocation = data?.toLocationName ?? "";
              const productName = data?.productName ?? "";
              const productDetails = data?.productDetails ?? "";
              const status = "CANCELLED";
              dispatch(bookingRatedActions.saveBookingRated(true));
              const pickUpDateTime = data?.pickUpDateTime ?? "";
              const deliverDateTime = data?.deliverDateTime ?? "";

              navigation.navigate(routes.BOOKING_INFO, {
                bookingInfo: {
                  title: localize("cancel_booking_alert_title"),
                  message,
                  bookingId,
                  pickupLocation,
                  deliverLocation,
                  status,
                  productName,
                  productDetails,
                  okButtonPress: () => {
                    // getData();
                    // dispatch(clearReduxStoreOnBooking());
                    dispatch(driverCancelRideActions.removeDriverCancelRide());
                  },
                  pickUpDateTime,
                  deliverDateTime,
                },
              });
            }
          }}
          onReceiveAutoCancelBooking={(received, data) => {
            if (received) {
              console.log("onReceiveAutoCancelBooking", data);
              const message = data?.message ?? "";
              const bookingId = data?.bookingId ?? "";
              const pickupLocation = data?.fromLocationName ?? "";
              const deliverLocation = data?.toLocationName ?? "";
              const productName = data?.productName ?? "";
              const productDetails = data?.productDetails ?? "";
              const status = "CANCELLED";
              const pickUpDateTime = data?.pickUpDateTime ?? "";
              const deliverDateTime = data?.deliverDateTime ?? "";

              navigation.navigate(routes.BOOKING_INFO, {
                bookingInfo: {
                  title: localize("auto_cancel_booking_alert_title"),
                  message,
                  bookingId,
                  pickupLocation,
                  deliverLocation,
                  status,
                  productName,
                  productDetails,
                  okButtonPress: () => {
                    // getData();
                    // dispatch(clearReduxStoreOnBooking());
                    dispatch(
                      autoCancelBookingActions.removeAutoCancelBookingAlert(),
                    );
                  },
                  pickUpDateTime,
                  deliverDateTime,
                },
              });
            }
          }}
          onPackagePickedUp={(received, data) => {
            if (received) {
              console.log("onPackagePickedUp", data);
              const message = data?.msg ?? "";
              const bookingId = data?.bookingId ?? "";
              const pickupLocation = data?.fromLocationName ?? "";
              const deliverLocation = data?.toLocationName ?? "";
              const productName = data?.productName ?? "";
              const productDetails = data?.productDetails ?? "";
              const bookingStatus = data?.bookingStatus ?? "";
              const status = "PICKED_UP";
              if (bookingStatus === "Halted") {
                dispatch(bookingRatedActions.saveBookingRated(true));
              }
              const pickUpDateTime = data?.pickUpDateTime ?? "";
              const deliverDateTime = data?.deliverDateTime ?? "";

              navigation.navigate(routes.BOOKING_INFO, {
                bookingInfo: {
                  title: localize("package_picked_alert_title"),
                  message,
                  bookingId,
                  pickupLocation,
                  deliverLocation,
                  status,
                  productName,
                  productDetails,
                  okButtonPress: () => {
                    // getData();
                    dispatch(pickupInfoActions.removePickupInfo());
                  },
                  pickUpDateTime,
                  deliverDateTime,
                },
              });
            }
          }}
          onPackageDelivered={(received, data) => {
            if (received) {
              console.log("onPackageDelivered", data, navigation);
              const message = data?.msg ?? "";
              const bookingId = data?.bookingId ?? "";
              const pickupLocation = data?.fromLocationName ?? "";
              const deliverLocation = data?.toLocationName ?? "";
              const productName = data?.productName ?? "";
              const productDetails = data?.productDetails ?? "";
              const status = "DELIVERED";
              console.log("message", message);
              dispatch(bookingRatedActions.saveBookingRated(true));
              const pickUpDateTime = data?.pickUpDateTime ?? "";
              const deliverDateTime = data?.deliverDateTime ?? "";

              navigation.navigate(routes.BOOKING_INFO, {
                bookingInfo: {
                  title: localize("package_delivered_alert_title"),
                  message,
                  bookingId,
                  pickupLocation,
                  deliverLocation,
                  status,
                  productName,
                  productDetails,
                  okButtonPress: () => {
                    dispatch(dropInfoActions.removeDropInfo());
                  },
                  pickUpDateTime,
                  deliverDateTime,
                },
              });
            }
          }}
          onHaltBookingResumed={(received, data) => {
            if (received) {
              console.log("onHaltBookingResumed", data);
              const message = data?.msg ?? "";
              const bookingId = data?.bookingId ?? "";
              const pickupLocation = data?.fromLocationName ?? "";
              const deliverLocation = data?.toLocationName ?? "";
              const productName = data?.productName ?? "";
              const productDetails = data?.productDetails ?? "";
              const status = "HALT_BOOKING";
              const pickUpDateTime = data?.pickUpDateTime ?? "";
              const deliverDateTime = data?.deliverDateTime ?? "";

              navigation.navigate(routes.BOOKING_INFO, {
                bookingInfo: {
                  title: localize("package_halt_resume_alert_title"),
                  message,
                  bookingId,
                  pickupLocation,
                  deliverLocation,
                  status,
                  productName,
                  productDetails,
                  okButtonPress: () => {},
                  pickUpDateTime,
                  deliverDateTime,
                },
              });
            }
          }}
          onLookingForNewDriver={(received, data) => {
            if (received) {
              console.log("onLookingForNewDriver", data);
              const message = data?.msg ?? "";
              const bookingId = data?.bookingId ?? "";
              const pickupLocation = data?.fromLocationName ?? "";
              const deliverLocation = data?.toLocationName ?? "";
              const productName = data?.productName ?? "";
              const productDetails = data?.productDetails ?? "";
              const pickUpDateTime = data?.pickUpDateTime ?? "";
              const deliverDateTime = data?.deliverDateTime ?? "";
              const status = "LOOKING_FOR_NEW_DRIVER";
              dispatch(bookingRatedActions.saveBookingRated(true));

              navigation.navigate(routes.BOOKING_INFO, {
                bookingInfo: {
                  title: localize("looking_for_new_driver"),
                  message,
                  bookingId,
                  pickupLocation,
                  deliverLocation,
                  status,
                  productName,
                  productDetails,
                  okButtonPress: () => {},
                  pickUpDateTime,
                  deliverDateTime,
                },
              });
            }
          }}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "white",
  },
  bellIcon:{
      right: 16
  },
  topContainer: {
    flexDirection: "row",
    margin: 16,
    justifyContent: "space-between",
  },
  walletContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.cardBack,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  ridesContainer: {
    marginLeft: 10,
    justifyContent: "center",
  },
  ridesText: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: fontSizes.body_semi_medium,
  },
  carbonReductionContainer: {
    marginTop: 16,
    marginHorizontal: 16,
  },
  carbonReductionImageOuter: {
    borderRadius: 8,
  },
  carbonReductionImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  carbonReductionTextContainer: {
    marginVertical: 16,
    alignItems: "center",
  },
  carbonReductionText: {
    color: colors.carbonReduction,
    fontFamily: fonts.bold,
    fontSize: fontSizes.header,
    marginBottom: 4,
  },
  recentRidesText: {
    marginTop: 30,
    marginHorizontal: 16,
    color: colors.primary,
    fontFamily: fonts.bold,
    fontSize: fontSizes.header,
  },
  kycVerifyContainer: {
    margin: 0,
  },
});

export default TransactionsScreen;
