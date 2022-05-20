import React, {useState, useEffect, useCallback, useRef} from "react";
import {
  View,
  SafeAreaView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  Text,
  TouchableOpacity,
  TouchableNativeFeedback,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import moment from "moment";

import {localize} from "../../translations/localized";
import colors from "../../constants/colors";
import useAddNewCard from "../../api/creditCards/addNewCard";
import useUpdatePaymentOptions from "../../api/creditCards/updatePaymentOptions";
import * as constants from "../../constants/general";
import fonts from "../../constants/fonts";
import fontSizes from "../../constants/font-sizes";
import * as routes from "../../navigation/routes/app-routes";

import LeftArrow from "../../components/UI/HeaderButtons/LeftArrow";
import RoundButton from "../../components/UI/Buttons/RoundButton";
import Loader from "../../components/UI/Loading/Loader";
import ErrorText from "../../components/UI/Texts/ErrorText";
import InputField from "../../components/UI/Inputs/InputField";
import PopupAlert from "../../components/UI/Alert/PopupAlert";
import {ScanCard} from "../../constants/image";

const AddCardScreen = ({navigation, route}) => {
  const {fromRoute, bookingId} = route.params;
  const scrollView = useRef();
  const [name, setName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCVV] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const [onAddNewCard, responseMessage, responseError] = useAddNewCard();
  const [
    onUpdatePaymentOptions,
    paymentInfoMessage,
    paymentInfoError,
  ] = useUpdatePaymentOptions();
  const [showAddNewCardAlert, setShowAddNewCardAlert] = useState(false);
  const [addNewCardMessage, setAddNewCardMessage] = useState("");
  const [showBottomSpacer, setShowBottomSpacer] = useState(false);

  const NAME = localize("card_holder_name");
  const CARD_NUMBER = localize("card_number");
  const EXPIRES = localize("expires");
  const CVV = localize("cvv");
  const ADDRESS_LINE_1 = localize("address_line_1");
  const ADDRESS_LINE_2 = localize("address_line_2");
  const CITY = localize("city");
  const POSTAL_CODE = localize("postal_code");

  const MIN_CITY_LENGTH = 3;
  const MAX_CITY_LENGTH = 25;
  const MAX_POSTAL_CODE_LENGTH = 6;

  let provinces = {};
  if (constants.PROVINCES.length > 0) {
    provinces = constants.PROVINCES.map(type => {
      return {label: type, value: type};
    });
  }

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: localize("add_new_card"),
      headerLeft: () => (
        <LeftArrow
          onPress={() => {
            navigation.pop();
          }}
        />
      ),
    });
  }, [navigation]);

  useEffect(() => {
    setShowLoader(false);
    if (responseMessage) {
      navigateBack();
    } else if (responseError) {
      console.log(responseError);
      setErrorMessage(responseError);
      setTimeout(() => {
        scrollView.current.scrollToEnd({animated: true});
      }, 200);
    }
  }, [responseMessage, responseError, navigateBack]);

  useEffect(() => {
    setShowLoader(false);
    if (paymentInfoMessage) {
      setTimeout(() => {
        setShowAddNewCardAlert(true);
        setAddNewCardMessage(paymentInfoMessage);
        console.log("paymentInfoMessage", paymentInfoMessage);
      }, 500);
    } else if (paymentInfoError) {
      console.log(paymentInfoError);
      setErrorMessage(paymentInfoError);
      setTimeout(() => {
        scrollView.current.scrollToEnd({animated: true});
      }, 200);
    }
  }, [navigation, paymentInfoError, paymentInfoMessage]);

  const navigateBack = useCallback(() => {
    if (
      fromRoute === routes.DRIVER_SEARCH &&
      (responseMessage?.cardId ?? 0) !== 0
    ) {
      setShowLoader(true);
      onUpdatePaymentOptions(bookingId, responseMessage.cardId);
    } else {
      setTimeout(() => {
        setShowAddNewCardAlert(true);
        setAddNewCardMessage(responseMessage?.msg ?? "");
      }, 500);
    }
  }, [
    bookingId,
    fromRoute,
    onUpdatePaymentOptions,
    responseMessage?.cardId,
    responseMessage?.msg,
  ]);

  const fieldChangeHandler = (newValue, field) => {
    setErrorMessage("");
    switch (field) {
      case NAME:
        if (name.length > 0 || newValue.trim() !== "") {
          const value = newValue.replace(/[^A-Za-z ]/gi, "");
          setName(value);
        }
        break;
      case CARD_NUMBER:
        if (cardNumber.length > 0 || newValue.trim() !== "") {
          const newCardNumber = newValue.replace(/-/gi, "");
          if (newCardNumber.length > 12) {
            const formattedNumber = newCardNumber.replace(
              /(\d{4})(\d{4})(\d{4})(\d+)/,
              "$1-$2-$3-$4",
            );
            setCardNumber(formattedNumber);
          } else if (newCardNumber.length > 8) {
            const formattedNumber = newCardNumber.replace(
              /(\d{4})(\d{4})(\d+)/,
              "$1-$2-$3",
            );
            setCardNumber(formattedNumber);
          } else if (newCardNumber.length >= 4) {
            const formattedNumber = newCardNumber.replace(
              /(\d{4})(\d+)/,
              "$1-$2",
            );
            setCardNumber(formattedNumber);
          } else {
            setCardNumber(newCardNumber);
          }
        }
        break;
      case EXPIRES:
        let textTemp = newValue;
        if (textTemp[0] !== "1" && textTemp[0] !== "0") {
          textTemp = "";
        }
        if (textTemp.length === 2) {
          if (
            parseInt(textTemp.substring(0, 2), 10) > 12 ||
            parseInt(textTemp.substring(0, 2), 10) === 0
          ) {
            textTemp = textTemp[0];
          } else if (expiry.length === 1) {
            textTemp += "/";
          } else {
            textTemp = textTemp[0];
          }
        }
        setExpiry(textTemp);
        break;
      case CVV:
        if (cvv.length > 0 || newValue.trim() !== "") {
          setCVV(newValue);
        }
        break;
      case ADDRESS_LINE_1:
        if (addressLine1.length > 0 || newValue.trim() !== "") {
          setAddressLine1(newValue);
        }
        break;
      case ADDRESS_LINE_2:
        if (addressLine2.length > 0 || newValue.trim() !== "") {
          setAddressLine2(newValue);
        }
        break;
      case CITY:
        if (city.length > 0 || newValue.trim() !== "") {
          let value = newValue.replace(/[^A-Za-z _'-]/gi, "");
          setCity(value);
        }
        break;
      case POSTAL_CODE:
        if (postalCode.length > 0 || newValue.trim() !== "") {
          let value = newValue.replace(/[^A-Za-z0-9]/gi, "");
          setPostalCode(value);
        }
        break;
    }
  };

  const fieldEndEditingHandler = () => {
    setName(name.trim());
    setCardNumber(cardNumber.trim());
    setExpiry(expiry.trim());
    setCVV(cvv.trim());
    setAddressLine1(addressLine1.trim());
    setAddressLine2(addressLine2.trim());
    setCity(city.trim());
    setPostalCode(postalCode.trim());
    onDropdownClose();
    setShowBottomSpacer(false);
  };

  const validateFields = () => {
    const nameRegex = /^[A-Za-z ]{3,25}$/;
    const numberRegex = /^[0-9-]{13,19}$/;
    const expiryRegex = /^(0[1-9]|1[0-2])\/?([0-9]{4}|[0-9]{2})$/;
    const cvvRegex = /^[0-9]{3,4}$/;
    const cityRegex = /^[A-Za-z ]{3,25}$/;
    const postalCodeRegex = /^[A-Z0-9]{5,6}$/;
    const expiryArray = expiry.split("/");

    if (!nameRegex.test(name)) {
      setErrorMessage(localize("card_holder_name_error"));
      return false;
    } else if (!numberRegex.test(cardNumber)) {
      setErrorMessage(localize("card_number_error"));
      return false;
    } else if (!expiryRegex.test(expiry)) {
      setErrorMessage(localize("expires_error"));
      return false;
    } else if (expiryArray?.length > 1) {
      const expiryMonth = parseInt(expiryArray[0], 10);
      const expiryYear = parseInt(
        moment(expiryArray[1], "YYYY").toDate().getFullYear(),
        10,
      );
      const currentMonth = moment().month() + 1;
      const currentYear = moment().year();
      console.log(expiryYear, currentYear, expiryMonth, currentMonth);
      if (
        expiryYear < currentYear ||
        (expiryYear < currentYear && expiryMonth < currentMonth)
      ) {
        setErrorMessage(localize("expires_error"));
        return false;
      }
    } else if (!cvvRegex.test(cvv)) {
      setErrorMessage(localize("cvv_error"));
      return false;
    } else if (
      addressLine1.length < MIN_CITY_LENGTH ||
      addressLine1.length > MAX_CITY_LENGTH
    ) {
      setErrorMessage(localize("address_line_1_error"));
      return false;
    } else if (
      addressLine2.length < MIN_CITY_LENGTH ||
      addressLine2.length > MAX_CITY_LENGTH
    ) {
      setErrorMessage(localize("address_line_2_error"));
      return false;
    } else if (!cityRegex.test(city)) {
      setErrorMessage(localize("city_error"));
      return false;
    } else if (!cityRegex.test(province)) {
      setErrorMessage(localize("province_error"));
      return false;
    } else if (!postalCodeRegex.test(postalCode)) {
      setErrorMessage(localize("postal_code_error"));
      return false;
    }
    setErrorMessage("");
    setName(name);
    setCardNumber(cardNumber);
    setExpiry(expiry);
    setCVV(cvv);
    setAddressLine1(addressLine1);
    setAddressLine2(addressLine2);
    setCity(city);
    setProvince(province);
    setPostalCode(postalCode);
    return true;
  };

  const onValidationSuccess = () => {
    setShowLoader(true);
    Keyboard.dismiss();
    const expiryArray = expiry.split("/");
    const expiryMonth = expiryArray[0];
    const expiryYear = expiryArray[1];
    const cardNum = cardNumber.replace(/-/gi, "");
    onAddNewCard(
      name,
      cardNum,
      expiryMonth,
      expiryYear,
      cvv,
      addressLine1,
      addressLine2,
      city,
      province,
      postalCode,
    );
  };

  const saveCardButtonPressHandler = () => {
    const isValid = validateFields();
    console.log("isValid", isValid);
    if (isValid) {
      onValidationSuccess();
    } else {
      setTimeout(() => {
        scrollView.current.scrollToEnd({animated: true});
      }, 200);
    }
  };

  const onDropdownOpen = () => {
    setPickerOpen(true);
    setTimeout(() => {
      scrollView.current.scrollToEnd();
    }, 100);
  };

  const onDropdownClose = () => {
    setPickerOpen(false);
  };

  const scanCardButtonPressHandler = async () => {};

  let TouchableComponent =
    Platform.OS === "android" ? TouchableNativeFeedback : TouchableOpacity;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.screen}>
      <SafeAreaView style={styles.container}>
        <ScrollView ref={scrollView} showsVerticalScrollIndicator={false}>
          <View>
            <Text style={styles.headerTitle}>{localize("credit_card")}</Text>
            {/* <TouchableComponent onPress={scanCardButtonPressHandler}>
              <View style={styles.scanContainer}>
                <ScanCard width={20} height={20} />
                <Text style={styles.scanText}>
                  {localize("scan_card").toUpperCase()}
                </Text>
              </View>
            </TouchableComponent> */}
            <InputField
              style={styles.field}
              placeholder={NAME}
              text={name}
              onTextChange={newValue => {
                fieldChangeHandler(newValue, NAME);
              }}
              onTextSubmit={() => fieldChangeHandler(name, NAME)}
              maxLength={25}
              keyboardType={
                Platform.OS === "ios" ? "default" : "visible-password"
              }
              onEndEditing={fieldEndEditingHandler}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            <InputField
              style={styles.field}
              placeholder={CARD_NUMBER}
              text={cardNumber}
              onTextChange={newValue => {
                fieldChangeHandler(newValue, CARD_NUMBER);
              }}
              onTextSubmit={() => fieldChangeHandler(cardNumber, CARD_NUMBER)}
              maxLength={19}
              keyboardType="number-pad"
              onEndEditing={fieldEndEditingHandler}
            />
            <View style={styles.horizontalContainer}>
              <InputField
                style={{...styles.field, ...styles.halfFlex}}
                placeholder={EXPIRES}
                text={expiry}
                onTextChange={newValue => {
                  fieldChangeHandler(newValue, EXPIRES);
                }}
                onTextSubmit={() => fieldChangeHandler(expiry, EXPIRES)}
                maxLength={7}
                keyboardType="number-pad"
                onEndEditing={fieldEndEditingHandler}
              />
              <InputField
                style={{...styles.field, ...styles.halfFlex}}
                placeholder={CVV}
                text={cvv}
                onTextChange={newValue => {
                  fieldChangeHandler(newValue, CVV);
                }}
                onTextSubmit={() => fieldChangeHandler(cvv, CVV)}
                maxLength={4}
                keyboardType="number-pad"
                onEndEditing={fieldEndEditingHandler}
                secureTextEntry={true}
              />
            </View>
            <Text style={styles.headerTitle}>{localize("address")}</Text>
            <InputField
              style={styles.field}
              autoCapitalize="sentences"
              placeholder={ADDRESS_LINE_1}
              text={addressLine1}
              onTextChange={newValue => {
                fieldChangeHandler(newValue, ADDRESS_LINE_1);
              }}
              onTextSubmit={() =>
                fieldChangeHandler(addressLine1, ADDRESS_LINE_1)
              }
              maxLength={MAX_CITY_LENGTH}
              keyboardType="default"
              onEndEditing={fieldEndEditingHandler}
              onFieldFocus={() => {
                setTimeout(() => {
                  scrollView.current.scrollToEnd({animated: true});
                }, 200);
              }}
            />
            <InputField
              style={styles.field}
              autoCapitalize="sentences"
              placeholder={ADDRESS_LINE_2}
              text={addressLine2}
              onTextChange={newValue => {
                fieldChangeHandler(newValue, ADDRESS_LINE_2);
              }}
              onTextSubmit={() =>
                fieldChangeHandler(addressLine2, ADDRESS_LINE_2)
              }
              maxLength={MAX_CITY_LENGTH}
              keyboardType="default"
              onEndEditing={fieldEndEditingHandler}
              onFieldFocus={() => {
                setTimeout(() => {
                  scrollView.current.scrollToEnd({animated: true});
                }, 200);
              }}
            />
            <InputField
              style={styles.field}
              autoCapitalize="sentences"
              placeholder={CITY}
              text={city}
              onTextChange={newValue => {
                fieldChangeHandler(newValue, CITY);
              }}
              onTextSubmit={() => fieldChangeHandler(city, CITY)}
              maxLength={MAX_CITY_LENGTH}
              keyboardType="default"
              onEndEditing={fieldEndEditingHandler}
              onFieldFocus={() => {
                setTimeout(() => {
                  scrollView.current.scrollToEnd({animated: true});
                }, 200);
              }}
            />
            <View style={styles.provinceContainer}>
              {province.length > 0 ? (
                <Text style={styles.label}>
                  {localize("province").toUpperCase()}
                </Text>
              ) : null}
            </View>
            <View style={Platform.OS === "ios" ? styles.pickerContainer : null}>
              <DropDownPicker
                items={provinces}
                style={styles.picker}
                containerStyle={Platform.OS === "ios" ? styles.picker : null}
                placeholder={localize("province")}
                placeholderStyle={{...styles.titleText, color: colors.fade}}
                arrowSize={25}
                arrowColor={colors.fade}
                labelStyle={{...styles.titleText, ...styles.dropDownText}}
                defaultValue={province}
                onChangeItem={item => {
                  setProvince(item.value);
                }}
                dropDownStyle={styles.dropDown}
                onOpen={onDropdownOpen}
                onClose={onDropdownClose}
              />
            </View>
            <InputField
              style={styles.field}
              placeholder={POSTAL_CODE}
              text={postalCode}
              onTextChange={newValue => {
                fieldChangeHandler(newValue, POSTAL_CODE);
              }}
              onTextSubmit={() => fieldChangeHandler(postalCode, POSTAL_CODE)}
              maxLength={MAX_POSTAL_CODE_LENGTH}
              keyboardType={
                Platform.OS === "ios" ? "default" : "visible-password"
              }
              onEndEditing={fieldEndEditingHandler}
              autoCapitalize="characters"
              autoCorrect={false}
              onFieldFocus={() => {
                setPickerOpen(false);
                setShowBottomSpacer(true);
                setTimeout(() => {
                  scrollView.current.scrollToEnd({animated: true});
                }, 200);
              }}
            />
            {pickerOpen ? <View style={styles.pickerSpacer} /> : null}
            {showBottomSpacer ? <View style={styles.additionalSpace} /> : null}
            {errorMessage ? (
              <View style={styles.errorContainer}>
                <ErrorText error={errorMessage} />
              </View>
            ) : null}
          </View>
        </ScrollView>
        <View style={styles.buttonContainer}>
          <RoundButton
            style={styles.button}
            title={localize("save").toUpperCase()}
            onPress={saveCardButtonPressHandler}
          />
        </View>
        <PopupAlert
          show={showAddNewCardAlert}
          title={
            paymentInfoMessage ? localize("payment_info") : localize("success")
          }
          message={paymentInfoMessage ? paymentInfoMessage : addNewCardMessage}
          showOk
          onOkButtonPress={() => {
            setShowAddNewCardAlert(false);
            if (paymentInfoMessage) {
              navigation.popToTop();
            } else if (fromRoute === routes.CHECK_OUT) {
              navigation.pop();
            } else {
              navigation.popToTop();
            }
          }}
        />
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
    justifyContent: "space-between",
    height: "100%",
  },
  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.header,
    color: colors.textPrimary,
    marginTop: 16,
  },
  horizontalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  halfFlex: {
    flex: 0.475,
  },
  field: {
    marginTop: 16,
  },
  errorContainer: {
    marginTop: 16,
  },
  buttonContainer: {
    marginVertical: 16,
    height: 50,
  },
  button: {
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  pickerContainer: {
    zIndex: 1,
  },
  picker: {
    height: 50,
  },
  dropDown: {
    marginTop: 4,
    paddingBottom: 10,
  },
  dropDownText: {
    paddingVertical: 2,
  },
  titleText: {
    color: colors.textPrimary,
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.body_semi_medium,
  },
  provinceContainer: {
    marginTop: 16,
  },
  label: {
    fontSize: fontSizes.body_tiny,
    fontFamily: fonts.bold,
    color: colors.field,
    marginBottom: 7,
  },
  elementsContainer: {
    marginTop: 20,
  },
  pickerSpacer: {
    height: 80,
  },
  additionalSpace: {
    height: 40,
  },
  scanContainer: {
    flexDirection: "row",
    backgroundColor: colors.primary,
    height: 40,
    width: 150,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 5,
    marginTop: 20,
  },
  scanText: {
    marginLeft: 8,
    color: colors.snow,
    fontFamily: fonts.bold,
    fontSize: fontSizes.body,
  },
});

export default AddCardScreen;
