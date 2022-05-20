import React, {useState, useEffect, useCallback} from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  FlatList,
  StatusBar,
  SafeAreaView,
  ScrollView,
} from "react-native";
import {useSelector, useDispatch} from "react-redux";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import {AirbnbRating} from "react-native-ratings";

import colors from "../../constants/colors";
import fontSizes from "../../constants/font-sizes";
import fonts from "../../constants/fonts";
import {localize} from "../../translations/localized";
import useBookingFeedback from "../../api/rating/booking-feedback";

import BookingAccept from "../../models/bookingAccept";

import RoundButton from "../../components/UI/Buttons/RoundButton";
import CloseButton from "../../components/UI/HeaderButtons/CloseButton";
import TouchableView from "../../components/UI/Buttons/TouchableView";
import Loader from "../../components/UI/Loading/Loader";
import PopupAlert from "../../components/UI/Alert/PopupAlert";

const RatingScreen = ({navigation, route}) => {
  const dispatch = useDispatch();
  const {
    fromScreen,
    transactionId,
    driverImagePath,
    driverFullName,
    vehicleModel,
    vehicleRegistrationNumber,
  } = route.params;
  console.log("******", transactionId, vehicleModel);
  const [rating, setRating] = useState(4);
  const [selectedReasons, setSelectedReasons] = useState([]);
  const [onSubmitFeedback, response, responseError] = useBookingFeedback();
  const [showLoader, setShowLoader] = useState(false);
  const [showSelectReasonAlert, setShowSelectReasonAlert] = useState(false);
  const [selectReasonMessage, setSelectReasonMessage] = useState("");
  const [showFeedbackAlert, setShowFeedbackAlert] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [showFeedbackErrorAlert, setShowFeedbackErrorAlert] = useState(false);
  const [feedbackErrorMessage, setFeedbackErrorMessage] = useState("");

  const feedbackOptions = useSelector(
    state => state.masterData.feedbackOptions,
  );
  const bookingAcceptNotification = BookingAccept.class(
    useSelector(state => state.bookingAccept.bookingAcceptNotification),
  );
  const bookingRated = useSelector(state => state.bookingRated.rated);
  console.log("******>>>", bookingRated, bookingAcceptNotification);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: localize("rating"),
      headerLeft: () => (
        <CloseButton color="white" onPress={() => navigateBack()} />
      ),
      headerStyle: {
        backgroundColor: colors.textPrimary,
      },
      headerTintColor: "white",
      headerTitleStyle: {
        fontFamily: fonts.bold,
        fontSize: fontSizes.header,
      },
    });
  }, [navigateBack, navigation]);

  const navigateBack = useCallback(() => {
    const timer = setTimeout(() => {
      navigation.pop();
    }, 500);
    return () => {
      clearTimeout(timer);
    };
  }, [navigation]);

  const lines = [];
  for (let i = 0; i < 20; i++) {
    lines.push(<View key={i} style={{...styles.semiDot, ...styles.line}} />);
  }

  const boxes = [];
  for (let i = 0; i < 15; i++) {
    boxes.push(<View key={i} style={styles.smallBox} />);
  }

  const ratingChangeHandler = newRating => {
    setRating(newRating);
    setSelectedReasons([]);
  };

  const submitReviewHandler = () => {
    if (selectedReasons.length > 0) {
      onSubmitFeedback(transactionId, `${rating}`, selectedReasons);
    } else {
      setShowSelectReasonAlert(true);
      setSelectReasonMessage(localize("select_reason_message"));
    }
  };

  useEffect(() => {
    if (response && response.status === "success") {
      setShowLoader(false);
      setShowFeedbackAlert(true);
      setFeedbackMessage(response.data?.msg ?? "");
    } else if (responseError) {
      setShowLoader(false);
      setShowFeedbackErrorAlert(true);
      setFeedbackErrorMessage(response.data?.msg ?? "");
    }
  }, [dispatch, navigateBack, navigation, response, responseError]);

  const renderItem = ({item, index}) => {
    return (
      <TouchableView
        style={styles.reasonContainer}
        onPress={() => {
          if (selectedReasons.includes(item)) {
            const reasons = selectedReasons.filter(reason => reason !== item);
            setSelectedReasons(reasons);
          } else {
            setSelectedReasons([...selectedReasons, item]);
          }
        }}>
        <View>
          <Text
            style={
              selectedReasons.includes(item)
                ? {...styles.reasonText, ...styles.highlightReasonText}
                : styles.reasonText
            }>
            {item}
          </Text>
        </View>
      </TouchableView>
    );
  };

  return (
    <View style={styles.screen}>
      <StatusBar translucent barStyle="light-content" />
      <SafeAreaView style={styles.screen}>
        <View style={styles.container}>
          <View style={{...styles.rowContainer, ...styles.margin_16}}>
            <View style={{...styles.rowContainer}}>
              <View
                style={{
                  ...styles.driverPicture,
                  ...styles.driverPictureContainer,
                }}>
                {driverImagePath ? (
                  <Image
                    source={{
                      uri: driverImagePath,
                      headers: {
                        Accept: "*/*",
                      },
                    }}
                    style={styles.driverPicture}
                  />
                ) : (
                  <View style={styles.driverPicture}>
                    <FontAwesome
                      name="user-circle"
                      size={pictureSize}
                      color={colors.fade}
                    />
                  </View>
                )}
              </View>
              <View style={styles.driverDetails}>
                <Text style={styles.driverName}>{driverFullName}</Text>
                <Text style={styles.cabName}>{vehicleModel}</Text>
                <Text style={styles.cabNumber}>
                  {vehicleRegistrationNumber}
                </Text>
              </View>
            </View>
          </View>
          <View style={{...styles.rowContainer, ...styles.lineContainer}}>
            <View style={{...styles.semiDot, ...styles.leftDot}} />
            {lines}
            <View style={{...styles.semiDot, ...styles.rightDot}} />
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View>
              <View style={styles.pickupDestinationContainer}>
                <Text style={styles.bookingTitle}>
                  {feedbackOptions[rating - 1].title.toUpperCase()}
                </Text>
                <Text style={styles.bookingMessage}>
                  {localize("ask_booking_message")}
                </Text>
                <AirbnbRating
                  starContainerStyle={styles.ratingView}
                  showRating={false}
                  selectedColor={colors.rating}
                  unSelectedColor={colors.border}
                  defaultRating={rating}
                  fractions={0}
                  onFinishRating={ratingChangeHandler}
                />
                <FlatList
                  style={styles.reasonsView}
                  scrollEnabled={false}
                  data={feedbackOptions[rating - 1].options}
                  keyExtractor={(item, index) => index}
                  renderItem={renderItem}
                />
              </View>
            </View>
          </ScrollView>
          <View style={styles.buttonContainer}>
            <RoundButton
              style={styles.button}
              title={localize("submit_review").toUpperCase()}
              onPress={submitReviewHandler}
            />
          </View>
        </View>
        <Loader show={showLoader} />
        <PopupAlert
          show={showSelectReasonAlert}
          title={localize("booking")}
          message={selectReasonMessage}
          showOk
          onOkButtonPress={() => {
            setShowSelectReasonAlert(false);
          }}
        />
        <PopupAlert
          show={showFeedbackAlert}
          title={localize("booking")}
          message={feedbackMessage}
          showOk
          onOkButtonPress={async () => {
            setShowFeedbackAlert(false);
            navigateBack();
          }}
        />
        <PopupAlert
          show={showFeedbackErrorAlert}
          title={localize("booking")}
          message={feedbackErrorMessage}
          showOk
          onOkButtonPress={() => {
            setShowFeedbackErrorAlert(false);
          }}
        />
      </SafeAreaView>
    </View>
  );
};

const dotWidth = (Dimensions.get("window").width - 50) / 35;
const dotAdjustingFactor = 3;
const pictureSize = 80;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.textPrimary,
  },
  headerText: {
    marginHorizontal: 16,
    marginVertical: 30,
    color: "white",
    fontFamily: fonts.bold,
    fontSize: fontSizes.body_semi_medium,
    textAlign: "center",
  },
  container: {
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 16,
    backgroundColor: "white",
    flex: 1,
    justifyContent: "space-between",
  },
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  margin_16: {
    margin: 16,
  },
  driverPictureContainer: {
    shadowRadius: 5,
    shadowOpacity: 0.0,
    shadowColor: "black",
    shadowOffset: {width: 0, height: 0},
  },
  driverPicture: {
    width: pictureSize,
    height: pictureSize,
    borderRadius: pictureSize / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  driverDetails: {
    marginHorizontal: 16,
    justifyContent: "space-around",
  },
  driverName: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: fontSizes.header,
  },
  cabName: {
    color: colors.fade,
    fontFamily: fonts.medium,
    fontSize: fontSizes.body_semi_medium,
  },
  cabNumber: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: fontSizes.body_semi_medium,
  },
  lineContainer: {
    marginVertical: 12,
    alignItems: "center",
    justifyContent: "space-between",
  },
  semiDot: {
    backgroundColor: colors.textPrimary,
    width: dotWidth + dotAdjustingFactor,
    height: dotWidth + dotAdjustingFactor,
  },
  leftDot: {
    left: -(dotWidth + dotAdjustingFactor) / 2,
    borderTopRightRadius: (dotWidth + dotAdjustingFactor) / 2,
    borderBottomRightRadius: (dotWidth + dotAdjustingFactor) / 2,
  },
  rightDot: {
    right: -(dotWidth + dotAdjustingFactor) / 2,
    borderTopLeftRadius: (dotWidth + dotAdjustingFactor) / 2,
    borderBottomLeftRadius: (dotWidth + dotAdjustingFactor) / 2,
  },
  line: {
    height: 1,
    width: dotWidth,
  },
  separator: {
    backgroundColor: colors.border,
    height: 1,
  },
  pickupDestinationContainer: {
    padding: 16,
    alignItems: "center",
  },
  bookingTitle: {
    marginTop: 24,
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: fontSizes.header,
    textAlign: "center",
  },
  bookingMessage: {
    marginTop: 12,
    color: colors.fade,
    fontFamily: fonts.regular,
    fontSize: fontSizes.body_semi_medium,
    textAlign: "center",
  },
  ratingView: {
    marginTop: 30,
  },
  reasonsView: {
    marginTop: 30,
  },
  reasonContainer: {
    height: 40,
  },
  reasonText: {
    color: colors.fade,
    fontFamily: fonts.bold,
    fontSize: fontSizes.header,
    textAlign: "center",
  },
  highlightReasonText: {
    color: colors.primary,
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
});

export default RatingScreen;
