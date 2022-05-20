import React, {useState, useEffect, useCallback} from "react";
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
} from "react-native";
import {HeaderButtons, Item} from "react-navigation-header-buttons";

import colors from "../../constants/colors";
import fontSizes from "../../constants/font-sizes";
import * as routes from "../../navigation/routes/app-routes";
import {localize} from "../../translations/localized";
import HeaderTextButton from "../../components/UI/HeaderButtons/HeaderTextButton";
import InputField from "../../components/UI/Inputs/InputField";
import RoundButton from "../../components/UI/Buttons/RoundButton";
import ErrorText from "../../components/UI/Texts/ErrorText";
import LeftArrow from "../../components/UI/HeaderButtons/LeftArrow";
import fonts from "../../constants/fonts";
import useLogin from "../../api/login/login-step-one";
import Loader from "../../components/UI/Loading/Loader";

const LoginScreen = ({navigation}) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showLoader, setShowLoader] = useState(false);
  const [onLogin, response, responseError] = useLogin();
  const PHONE_NUMBER = localize("phone_number");

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: localize("your_phone_number"),
      headerLeft: () => (
        <LeftArrow
          onPress={() => {
            navigation.navigate(routes.SIGNING);
          }}
        />
      ),
      headerRight: () => (
        <HeaderButtons HeaderButtonComponent={HeaderTextButton}>
          <Item
            title={localize("sign_up")}
            color={colors.primary}
            onPress={() => {
              navigation.navigate(routes.SIGNUP);
            }}
          />
        </HeaderButtons>
      ),
    });
  }, [navigation]);

  useEffect(() => {
    if (response && response.status === "success") {
      console.log(response);
      navigateVerifyOTP();
    } else if (responseError) {
      console.log(responseError);
      setErrorMessage(responseError);
      setShowLoader(false);
    }
  }, [response, responseError, navigateVerifyOTP]);

  const fieldChangeHandler = (newValue) => {
    setErrorMessage("");
    let regex = /^[0-9]{0,10}$/;
    if (regex.test(newValue)) {
      setPhoneNumber(newValue);
    }
  };

  const fieldEndEditingHandler = () => {
    setPhoneNumber(phoneNumber.trim());
  };

  const validateFields = () => {
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phoneNumber)) {
      setErrorMessage(localize("phone_number_error"));
      return;
    }
    setErrorMessage("");
    setPhoneNumber(phoneNumber);
    onValidationSuccess();
  };

  const onValidationSuccess = () => {
    setShowLoader(true);
    onLogin(phoneNumber);
  };

  const navigateVerifyOTP = useCallback(() => {
    setShowLoader(false);
    setTimeout(() => {
      navigation.navigate(routes.VERIFY_OTP, {
        phoneNumber: phoneNumber,
        fromLogin: true,
      });
    }, 500);
  }, [navigation, phoneNumber]);

  const signupButtonPressHandler = () => {
    validateFields();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : null}
      style={styles.screen}>
      <SafeAreaView style={styles.container}>
        <ScrollView>
          <View>
            <Text style={styles.message}>{localize("login_message")}</Text>
            <View>
              <InputField
                style={styles.field}
                placeholder={PHONE_NUMBER}
                text={phoneNumber}
                onTextChange={(newValue) => {
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
              {errorMessage ? (
                <View style={styles.errorContainer}>
                  <ErrorText error={errorMessage} />
                </View>
              ) : null}
            </View>
          </View>
        </ScrollView>
        <View style={styles.buttonContainer}>
          <RoundButton
            style={styles.button}
            title={localize("log_in").toUpperCase()}
            onPress={signupButtonPressHandler}
          />
        </View>
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
  message: {
    marginTop: 32,
    color: colors.textPrimary,
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.body_semi_medium,
  },
  field: {
    marginTop: 32,
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
});

export default LoginScreen;
