import React, {useState, useCallback, useRef} from "react";
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  Switch,
  StyleSheet,
} from "react-native";
import {HeaderButtons, Item} from "react-navigation-header-buttons";

import colors from "../../constants/colors";
import fonts from "../../constants/fonts";
import fontSizes from "../../constants/font-sizes";
import * as endPoints from "../../constants/end-points";
import * as routes from "../../navigation/routes/app-routes";
import {localize} from "../../translations/localized";
import {capitalize} from "../../utilities/utilities";
import HeaderTextButton from "../../components/UI/HeaderButtons/HeaderTextButton";
import InputField from "../../components/UI/Inputs/InputField";
import LinkText from "../../components/UI/Texts/LinkText";
import RoundButton from "../../components/UI/Buttons/RoundButton";
import ErrorText from "../../components/UI/Texts/ErrorText";
import WebView from "../../components/WebView/WebView";
import LeftArrow from "../../components/UI/HeaderButtons/LeftArrow";
import Loader from "../../components/UI/Loading/Loader";
import useRegistration from "../../api/registration/registration-step-one";

const SignupScreen = ({navigation}) => {
  const scrollView = useRef();

  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [corporateCustomer, setCorporateCustomer] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showTermsConditions, setShowTermsConditions] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const [onRegistration, response, responseError] = useRegistration();

  const FIRST_NAME = localize("first_name");
  const MIDDLE_NAME = localize("middle_name");
  const LAST_NAME = localize("last_name");
  const EMAIL = localize("email");
  const PHONE_NUMBER = localize("phone_number");

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: localize("sign_up"),
      headerLeft: () => (
        <LeftArrow
          onPress={() => {
            navigation.pop();
          }}
        />
      ),
      headerRight: () => (
        <HeaderButtons HeaderButtonComponent={HeaderTextButton}>
          <Item
            title={localize("log_in")}
            color={colors.primary}
            onPress={() => {
              navigation.navigate(routes.LOGIN);
            }}
          />
        </HeaderButtons>
      ),
    });
  }, [navigation]);

  React.useEffect(() => {
    if (response && response.status === "success") {
      setShowLoader(false);
      console.log(response);
      navigateVerifyOTP();
    } else if (responseError) {
      console.log(responseError);
      setShowLoader(false);
      setErrorMessage(responseError);
    }
  }, [response, responseError, navigateVerifyOTP]);

  const fieldChangeHandler = (newValue, field) => {
    setErrorMessage("");
    switch (field) {
      case FIRST_NAME:
        if (firstName.length > 0 || newValue.trim() !== "") {
          let value = newValue.replace(/[^A-Za-z _'-]/gi, "");
          setFirstName(value);
        }
        break;
      case MIDDLE_NAME:
        if (middleName.length > 0 || newValue.trim() !== "") {
          let value = newValue.replace(/[^A-Za-z _'-]/gi, "");
          setMiddleName(value);
        }
        break;
      case LAST_NAME:
        if (lastName.length > 0 || newValue.trim() !== "") {
          let value = newValue.replace(/[^A-Za-z _'-]/gi, "");
          setLastName(value);
        }
        break;
      case EMAIL:
        if (email.length > 0 || newValue.trim() !== "") {
          setEmail(newValue);
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
    setFirstName(firstName.trim());
    setMiddleName(middleName.trim());
    setLastName(lastName.trim());
    setEmail(email.trim());
    setPhoneNumber(phoneNumber.trim());
  };

  const validateFields = () => {
    const nameRegex = /^[A-Za-z ]{2,30}$/;
    const middleNameRegex = /^[A-Za-z ]{2,30}$/;
    const lastNameRegex = /^[A-Za-z]{2,30}$/;
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    const phoneRegex = /^[0-9]{10}$/;
    if (!nameRegex.test(firstName)) {
      setErrorMessage(localize("first_name_error"));
      return false;
    } else if (middleName.length > 0 && !middleNameRegex.test(middleName)) {
      setErrorMessage(localize("middle_name_error"));
      return false;
    } else if (!lastNameRegex.test(lastName)) {
      setErrorMessage(localize("last_name_error"));
      return false;
    } else if (!emailRegex.test(email)) {
      setErrorMessage(localize("email_error"));
      return false;
    } else if (!phoneRegex.test(phoneNumber)) {
      setErrorMessage(localize("phone_number_error"));
      return false;
    }
    setErrorMessage("");
    setFirstName(firstName);
    setMiddleName(middleName);
    setLastName(lastName);
    setEmail(email);
    setPhoneNumber(phoneNumber);
    return true;
  };

  const navigateVerifyOTP = useCallback(() => {
    console.log("Calling navigation");
    setTimeout(() => {
      navigation.navigate(routes.VERIFY_OTP, {
        phoneNumber: phoneNumber,
        fromLogin: false,
      });
    }, 300);
  }, [navigation, phoneNumber]);

  const signupButtonPressHandler = async () => {
    const isValid = validateFields();
    if (isValid) {
      setShowLoader(true);
      await onRegistration(
        phoneNumber,
        email,
        firstName,
        middleName,
        lastName,
        corporateCustomer ? "1" : "2",
        "CA",
      );
    } else {
      setTimeout(() => {
        scrollView.current.scrollToEnd({animated: true});
      }, 200);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : null}
      style={styles.screen}>
      <SafeAreaView style={styles.container}>
        <ScrollView ref={scrollView} showsVerticalScrollIndicator={false}>
          <View>
            <View>
              <InputField
                style={styles.field}
                autoCapitalize="sentences"
                placeholder={FIRST_NAME}
                text={firstName}
                onTextChange={newValue => {
                  fieldChangeHandler(newValue, FIRST_NAME);
                }}
                onTextSubmit={() => fieldChangeHandler(firstName, FIRST_NAME)}
                maxLength={30}
                keyboardType="default"
                onEndEditing={fieldEndEditingHandler}
              />
              <InputField
                style={styles.field}
                autoCapitalize="sentences"
                placeholder={MIDDLE_NAME}
                text={middleName}
                onTextChange={newValue => {
                  fieldChangeHandler(newValue, MIDDLE_NAME);
                }}
                onTextSubmit={() => fieldChangeHandler(middleName, MIDDLE_NAME)}
                maxLength={30}
                keyboardType="default"
                onEndEditing={fieldEndEditingHandler}
              />
              <InputField
                style={styles.field}
                autoCapitalize="sentences"
                placeholder={LAST_NAME}
                text={lastName}
                onTextChange={newValue => {
                  fieldChangeHandler(newValue, LAST_NAME);
                }}
                onTextSubmit={() => fieldChangeHandler(lastName, LAST_NAME)}
                maxLength={30}
                keyboardType="default"
                onEndEditing={fieldEndEditingHandler}
              />
              <InputField
                style={styles.field}
                placeholder={EMAIL}
                text={email}
                onTextChange={newValue => {
                  fieldChangeHandler(newValue, EMAIL);
                }}
                onTextSubmit={() => fieldChangeHandler(email, EMAIL)}
                maxLength={40}
                keyboardType="email-address"
                onEndEditing={fieldEndEditingHandler}
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
                <View style={styles.corporateSelection}>
                  <Text
                    style={{
                      ...styles.corporateText,
                      color: corporateCustomer
                        ? colors.textPrimary
                        : colors.field,
                    }}>
                    {localize("is_corporate_customer")}
                  </Text>
                  <Switch
                    trackColor={{
                      false: Platform.OS === "android" && colors.fade,
                      true: colors.primary,
                    }}
                    thumbColor={
                      Platform.OS === "android" &&
                      (corporateCustomer ? colors.primary : colors.border)
                    }
                    value={corporateCustomer}
                    onValueChange={newValue => {
                      setCorporateCustomer(newValue);
                      setErrorMessage("");
                    }}
                  />
                </View>
              </View>
              {corporateCustomer && (
                <View style={styles.elementsContainer}>
                  <Text style={styles.corporateInfo}>
                    {localize("corporate_customer_sign_up_info")}
                  </Text>
                </View>
              )}
              {errorMessage ? (
                <View style={styles.elementsContainer}>
                  <ErrorText error={errorMessage} />
                </View>
              ) : null}
              <View style={styles.privacyContainer}>
                <LinkText
                  text={localize("terms_start")}
                  link1={localize("terms_and_conditions")}
                  onPressLink1={() => setShowTermsConditions(true)}
                  textContinue={localize("as_well_as")}
                  link2={localize("privacy_policy")}
                  onPressLink2={() => setShowPrivacyPolicy(true)}
                />
              </View>
            </View>
          </View>
        </ScrollView>
        <View style={styles.buttonContainer}>
          <RoundButton
            style={styles.button}
            title={localize("sign_up").toUpperCase()}
            onPress={signupButtonPressHandler}
          />
        </View>
        <WebView
          show={showTermsConditions}
          title={capitalize(localize("terms_and_conditions"))}
          url={endPoints.TERMS_CONDITIONS}
          onClose={() => {
            setShowTermsConditions(false);
          }}
        />
        <WebView
          show={showPrivacyPolicy}
          title={capitalize(localize("privacy_policy"))}
          url={endPoints.PRIVACY_POLICY}
          onClose={() => {
            setShowPrivacyPolicy(false);
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
  field: {
    marginTop: 16,
  },
  corporateSelection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  corporateText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.body_semi_medium,
  },
  corporateInfo: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.body_semi_medium,
    color: colors.textPrimary,
  },
  elementsContainer: {
    marginTop: 16,
  },
  privacyContainer: {
    marginTop: 32,
    flex: 0.075,
  },
  buttonContainer: {
    marginVertical: 16,
    height: 50,
  },
  button: {
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
});

export default SignupScreen;
