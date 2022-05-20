import React, {useState, useEffect, useCallback, useRef} from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Image,
  Dimensions,
  Platform,
  TextInput,
  KeyboardAvoidingView,
  Alert,
} from "react-native";

import {localize} from "../../translations/localized";
// import {getStaticMap} from "../../api/staticMap/staticMap";
import {useSelector} from "react-redux";
import Feather from "react-native-vector-icons/Feather";

import fonts from "../../constants/fonts";
import fontSizes from "../../constants/font-sizes";
import colors from "../../constants/colors";
import * as constants from "../../constants/general";
import useTransactionDetails from "../../api/transactionDetails/transactionDetails";
import useRaiseComplaint from "../../api/raiseComplaint/raiseComplaint";
import useGetRaisedComplaint from "../../api/raiseComplaint/getComplaint";
import * as routes from "../../navigation/routes/app-routes";
import Complaint from "../../models/complaint";

import EstimationView from "../../components/BookingDetails/EstimationView";
import LeftArrow from "../../components/UI/HeaderButtons/LeftArrow";
import Loader from "../../components/UI/Loading/Loader";
import RoundButton from "../../components/UI/Buttons/RoundButton";
import DropDownPicker from "react-native-dropdown-picker";
import ErrorText from "../../components/UI/Texts/ErrorText";
import TouchableView from "../../components/UI/Buttons/TouchableView";
import ChatBubble from "../../components/UI/ChatBubble/ChatBubble";
import PopupAlert from "../../components/UI/Alert/PopupAlert";

const width = Dimensions.get("window").width;

const RideDetailsScreen = ({navigation, route}) => {
  const scrollView = useRef();
  const {transaction} = route.params;
  const [staticMapURL, setStaticMapURL] = useState("");
  const [transactionDetails, setTransactionDetails] = useState("");
  const [showLoader, setShowLoader] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [complaintType, setComplaintType] = useState("");
  const [complaintIndex, setComplaintIndex] = useState(-1);
  const [showRaiseComplaintView, setShowRaiseComplaintView] = useState(false);
  const [complaint, setComplaint] = useState("");
  const [raisedComplaint, setRaisedComplaint] = useState(new Complaint());
  const [
    onGetTransactionDetails,
    transactionDetailsResponse,
    transactionDetailsError,
  ] = useTransactionDetails();
  const [
    onRaiseComplaint,
    raiseComplaintResponse,
    raiseComplaintError,
  ] = useRaiseComplaint();
  const [
    onGetRaisedComplaint,
    raisedComplaintResponse,
    raisedComplaintError,
  ] = useGetRaisedComplaint();
  const [showComplaintAlert, setShowComplaintAlert] = useState(false);
  const [complaintMessage, setComplaintMessage] = useState("");
  const [showComplaintErrorAlert, setShowComplaintErrorAlert] = useState(false);
  const [complaintErrorMessage, setComplaintErrorMessage] = useState("");
  const [showSpacerAtBottom, setShowSpacerAtBottom] = useState(false);

  const complaintCategories = useSelector(
    state => state.masterData.ticketCategories,
  );

  let complaintNames;
  if (complaintCategories?.length > 0) {
    complaintNames = complaintCategories?.map(category => {
      return {label: category.name, value: category.name};
    });
  }

  const serviceTypes = useSelector(state => state.masterData.serviceTypes);
  const serviceType = serviceTypes?.find(
    type => type.serviceTypeId === transaction.serviceTypeId,
  );
  const attributes = serviceType?.serviceTypeDescription?.split("|");

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: localize("mic") + `${transaction.bookingDetailId}`,
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
  }, [navigation, transaction.bookingDetailId]);

  useEffect(() => {
    getData();
  }, [getData]);

  const getData = useCallback(async () => {
    setShowLoader(true);
    // const directions = await getStaticMap(
    //   transaction.bookingLocations.fromLocationLatitude,
    //   transaction.bookingLocations.fromLocationLongitude,
    //   transaction.bookingLocations.toLocationLatitude,
    //   transaction.bookingLocations.toLocationLongitude,
    //   160,
    // );
    await onGetTransactionDetails(transaction.bookingDetailId);
    await onGetRaisedComplaint(transaction.bookingDetailId);
    // setStaticMapURL(directions.staticMapURL);
    setShowLoader(false);
  }, [
    onGetRaisedComplaint,
    onGetTransactionDetails,
    transaction.bookingDetailId,
  ]);

  React.useEffect(() => {
    if (transactionDetailsResponse) {
      setTransactionDetails(transactionDetailsResponse);
    } else if (transactionDetailsError) {
      setErrorMessage(transactionDetailsError);
    }
  }, [transactionDetailsError, transactionDetailsResponse]);

  React.useEffect(() => {
    setShowLoader(false);
    if (raiseComplaintResponse) {
      console.log("raiseComplaintResponse:", raiseComplaintResponse);
      if (raiseComplaintResponse?.data?.message?.length > 0) {
        setTimeout(() => {
          setShowComplaintAlert(true);
          setComplaintMessage(raiseComplaintResponse?.data?.message ?? "");
        }, 500);
      }
    } else if (raiseComplaintError) {
      setTimeout(() => {
        setShowComplaintErrorAlert(true);
        setComplaintErrorMessage(raiseComplaintError);
      }, 500);
    }
  }, [raiseComplaintError, raiseComplaintResponse]);

  React.useEffect(() => {
    setShowLoader(false);
    if (raisedComplaintResponse) {
      console.log(raisedComplaintResponse);
      setRaisedComplaint(
        new Complaint(
          raisedComplaintResponse.subject,
          raisedComplaintResponse.description,
          raisedComplaintResponse.agentComments,
        ),
      );
    } else if (raisedComplaintError) {
    }
  }, [raisedComplaintError, raisedComplaintResponse]);

  const submitReviewHandler = () => {
    navigation.navigate(routes.RATING, {
      fromScreen: "TransactionDetails",
      transactionId: transaction.bookingDetailId,
      driverImagePath: transactionDetails?.driverDetails?.driverPic,
      driverFullName: transactionDetails?.driverDetails?.driverName,
      vehicleModel:
        transactionDetails?.driverDetails?.vehicleDetails?.vehicleModel,
      vehicleRegistrationNumber:
        transactionDetails?.driverDetails?.vehicleDetails?.driverVehicleNumber,
    });
  };

  const raiseComplaintHandler = () => {
    setErrorMessage("");
    console.log(complaintIndex);
    if (complaintIndex < 0 || complaint.length < 15) {
      if (complaintIndex < 0) {
        setErrorMessage(localize("complaint_category_error"));
      } else if (complaint.length < 15) {
        setErrorMessage(localize("complaint_error"));
      }
      setTimeout(() => {
        scrollView.current.scrollToEnd();
      }, 100);
      return;
    }
    if (complaintCategories.length > complaintIndex) {
      const complaintCategory = complaintCategories[complaintIndex];
      setShowLoader(true);
      onRaiseComplaint(
        transaction.bookingDetailId,
        complaintCategory?.id,
        complaint,
      );
    }
  };

  const boxes = [];
  for (let i = 0; i < 15; i++) {
    boxes.push(<View key={i} style={styles.smallBox} />);
  }

  const onDropdownOpen = () => {
    setErrorMessage("");
    setTimeout(() => {
      scrollView.current.scrollToEnd();
    }, 100);
  };

  const fieldEndEditingHandler = () => {
    setComplaint(complaint?.trim());
    setErrorMessage("");
  };

  const fieldChangeHandler = (newValue, field) => {
    onDropdownOpen();
    setComplaint(newValue);
  };

  const raiseComplaintPressHandler = () => {
    onDropdownOpen();
    setShowRaiseComplaintView(!showRaiseComplaintView);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.screen}>
      <SafeAreaView style={styles.screen}>
        <StatusBar translucent={false} barStyle="light-content" />
        <View style={styles.container}>
          <ScrollView ref={scrollView} showsVerticalScrollIndicator={false}>
            {/* {staticMapURL !== "" ? (
              <Image style={styles.mapImage} source={{uri: staticMapURL}} />
            ) : null} */}
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
                    {transactionDetails?.fromContactDetails?.toContactName}
                  </Text>
                  <Text style={styles.pickupDetails}>
                    {transactionDetails?.fromContactDetails?.toContactMobile}
                  </Text>
                  <Text style={styles.pickupDetails}>
                    {transaction.bookingLocations.fromLocation}
                  </Text>
                </View>
                <View style={styles.spacer_20} />
                <View>
                  <Text style={styles.pickupTitle}>
                    {localize("destination").toUpperCase()}
                  </Text>
                  <Text style={styles.pickupDetails}>
                    {transactionDetails?.toContactDetails?.fromContactName}
                  </Text>
                  <Text style={styles.pickupDetails}>
                    {transactionDetails?.toContactDetails?.fromContactMobile}
                  </Text>
                  <Text style={styles.pickupDetails}>
                    {transaction.bookingLocations.toLocation}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.separator} />
            <View style={styles.fareContainer}>
              <Text style={styles.totalFareTitle}>
                {localize("total_fare").toUpperCase()}
              </Text>
              <Text style={styles.totalFare}>
                {constants.CURRENCY_SYMBOL}
                {transaction.totalBillAmount}
              </Text>
              <Text style={styles.taxInclude}>{localize("include_tax")}</Text>
            </View>
            <View style={styles.separator} />
            {transaction.negotiatedPrice > 0 &&
            transaction.rewardPointsUsed > 0 ? (
              <View style={styles.top_12}>
                <EstimationView
                  title={localize("negotiated_price")}
                  description={
                    constants.CURRENCY_SYMBOL + transaction.negotiatedPrice
                  }
                  secondTitle={localize("rewards_used")}
                  secondDescription={`${transaction.rewardPointsUsed}`}
                />
                <View style={styles.top_12} />
                <View style={styles.separator} />
              </View>
            ) : null}
            <View style={styles.spacer_20} />
            <Text style={styles.name}>
              {serviceType?.serviceTypeName?.toUpperCase()}
            </Text>
            <View>
              {attributes?.length > 0
                ? attributes.map(attribute => (
                    <View key={attribute} style={styles.space_4}>
                      <View style={styles.rowCenterContainer}>
                        <View style={styles.attributeDot} />
                        <Text style={styles.attribute}>{attribute}</Text>
                      </View>
                    </View>
                  ))
                : null}
            </View>
            <View>
              <TouchableView
                style={styles.touchContainer}
                onPress={raiseComplaintPressHandler}>
                <View style={styles.checkDocumentsView}>
                  <Text style={styles.checkDocumentsText}>
                    {localize("raise_complaint_title")}
                  </Text>
                  <Feather
                    name={
                      showRaiseComplaintView ? "chevron-down" : "chevron-right"
                    }
                    color={colors.textPrimary}
                    size={20}
                  />
                </View>
              </TouchableView>
            </View>

            {/*********** SHOW RAISED COMPLAINT VIEW *************/}
            {showRaiseComplaintView && raisedComplaint.subject.length !== 0 ? (
              <View pointerEvents="none">
                <ChatBubble
                  messageIn={false}
                  text={`${raisedComplaint.subject}:\n${raisedComplaint.description}`}
                  backgroundColor={colors.field}
                />
                {raisedComplaint.agentComments.length > 0 ? (
                  <ChatBubble
                    messageIn
                    text={`${raisedComplaint.subject}:\n${raisedComplaint.agentComments}`}
                    backgroundColor={colors.primary}
                  />
                ) : null}

                <View style={styles.spacer_20} />
              </View>
            ) : null}

            {/*********** SHOW COMPLAINT INPUT VIEW *************/}
            {showRaiseComplaintView && raisedComplaint.subject.length === 0 ? (
              <View style={styles.complaintsContainer}>
                <Text
                  style={{...styles.pickupDetails, ...styles.complaintsText}}>
                  {localize("complaint_message")}
                </Text>
                <View
                  style={Platform.OS === "ios" ? styles.pickerContainer : null}>
                  {complaintNames.length > 0 ? (
                    <DropDownPicker
                      items={complaintNames}
                      style={styles.picker}
                      containerStyle={styles.picker}
                      placeholder={localize("select_complaint_type")}
                      placeholderStyle={{
                        ...styles.titleText,
                        color: colors.fade,
                      }}
                      arrowSize={25}
                      arrowColor={colors.fade}
                      labelStyle={{...styles.titleText, ...styles.dropDownText}}
                      defaultValue={complaintType}
                      onChangeItem={(item, index) => {
                        setComplaintType(item.value);
                        setComplaintIndex(index);
                      }}
                      dropDownStyle={styles.dropDown}
                      onOpen={() => {
                        onDropdownOpen();
                        setShowSpacerAtBottom(true);
                        setComplaintIndex(-1);
                      }}
                      defaultIndex={1}
                      onClose={() => {
                        setShowSpacerAtBottom(false);
                      }}
                    />
                  ) : null}
                </View>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholderTextColor={colors.field}
                    placeholder={localize("comments")}
                    selectionColor={colors.primary}
                    value={complaint}
                    onFocus={onDropdownOpen}
                    onChangeText={fieldChangeHandler}
                    onSubmitEditing={fieldEndEditingHandler}
                    maxLength={200}
                    onBlur={fieldEndEditingHandler}
                    multiline={true}
                  />
                </View>
                {errorMessage ? (
                  <View style={styles.errorContainer}>
                    <ErrorText error={errorMessage} />
                  </View>
                ) : null}
              </View>
            ) : null}
            {complaintIndex >= 0 &&
            showRaiseComplaintView &&
            raisedComplaint.subject.length === 0 ? (
              <View style={styles.buttonContainer}>
                <RoundButton
                  style={styles.button}
                  title={localize("raise_complaint").toUpperCase()}
                  onPress={raiseComplaintHandler}
                />
              </View>
            ) : (
              <View style={styles.spacer_20} />
            )}
            {showSpacerAtBottom ? <View style={styles.spacer_36} /> : null}
          </ScrollView>
        </View>
        {!transactionDetails?.driverDetails?.vehicleDetails
          ?.vehicleDetailId ? null : (
          <View style={styles.buttonContainer}>
            <RoundButton
              style={styles.button}
              title={localize("rate_the_ride").toUpperCase()}
              onPress={submitReviewHandler}
            />
          </View>
        )}
        <Loader show={showLoader} />
        <PopupAlert
          show={showComplaintAlert}
          title={localize("raise_complaint")}
          message={complaintMessage}
          showOk
          onOkButtonPress={() => {
            setShowComplaintAlert(false);
            getData();
          }}
        />
        <PopupAlert
          show={showComplaintErrorAlert}
          title={localize("raise_complaint")}
          message={complaintErrorMessage}
          showOk
          onOkButtonPress={() => {
            setShowComplaintErrorAlert(false);
          }}
        />
      </SafeAreaView>
    </KeyboardAvoidingView>
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
    height: 90,
    marginBottom: 8,
    paddingHorizontal: 14,
    borderRadius: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "rgba(0, 0, 0, 0.03)",
  },
  textContainer: {
    flex: 1,
    marginVertical: 12,
    justifyContent: "space-between",
  },
  rowContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontFamily: fonts.heavy,
    fontSize: fontSizes.body_semi_medium,
    color: colors.textPrimary,
  },
  mapImage: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    width: width - 32,
    height: 170,
  },
  top_12: {
    marginTop: 12,
  },
  buttonContainer: {
    marginHorizontal: 12,
    marginVertical: 16,
    height: 50,
  },
  button: {
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  outlinedButton: {
    borderRadius: 5,
    borderColor: colors.primary,
    borderWidth: 1,
  },
  pickerContainer: {
    zIndex: 1,
  },
  picker: {
    height: 50,
    zIndex: 10,
  },
  dropDown: {
    marginTop: 4,
  },
  dropDownText: {
    paddingVertical: 2,
  },
  titleText: {
    color: colors.textPrimary,
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.body_semi_medium,
  },
  complaintsContainer: {
    marginHorizontal: 16,
    marginTop: 8,
  },
  complaintsTitleText: {
    marginBottom: 16,
    color: colors.error,
    textAlign: "center",
    fontSize: fontSizes.header,
  },
  complaintsText: {
    marginBottom: 16,
    color: colors.field,
  },
  inputContainer: {
    backgroundColor: colors.field_alpha_08,
    borderColor: colors.border,
    borderRadius: 5,
    borderWidth: 1,
    marginTop: 12,
  },
  input: {
    marginVertical: 8,
    padding: 16,
    color: colors.textPrimary,
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.body_semi_medium,
    flex: 1,
    minHeight: 80,
    maxHeight: 240,
  },
  errorContainer: {
    marginTop: 16,
  },
  touchContainer: {
    marginTop: 8,
    marginHorizontal: 16,
    height: 45,
  },
  checkDocumentsView: {
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  checkDocumentsText: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: fontSizes.header,
  },
  rowCenterContainer: {
    marginHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  space_4: {
    marginTop: 4,
  },
  attributeDot: {
    marginRight: 8,
    width: 6,
    height: 6,
    backgroundColor: colors.field,
    borderRadius: 3,
  },
  attribute: {
    fontFamily: fonts.light,
    fontSize: fontSizes.body_small,
    color: colors.textPrimary,
  },
  name: {
    marginHorizontal: 16,
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: fontSizes.body_medium,
  },
  spacer_36: {
    height: 36,
  },
});

export default RideDetailsScreen;
