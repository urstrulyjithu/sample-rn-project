import React, {useState, useEffect, useCallback} from "react";
import {
  View,
  Text,
  KeyboardAvoidingView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
} from "react-native";
import {useDispatch} from "react-redux";

import colors from "../../constants/colors";
import fontSizes from "../../constants/font-sizes";
import * as routes from "../../navigation/routes/app-routes";
import {localize} from "../../translations/localized";
import RoundButton from "../../components/UI/Buttons/RoundButton";
import ErrorText from "../../components/UI/Texts/ErrorText";
import LeftArrow from "../../components/UI/HeaderButtons/LeftArrow";
import fonts from "../../constants/fonts";
import OTPInputView from "@twotalltotems/react-native-otp-input";
import * as constants from "../../constants/general";
import * as storage from "../../cache/storage";
import storageKeys from "../../cache/storage-keys";
import useVerifyOTP from "../../api/login/verify-otp";
import resendOTP from "../../api/login/resend-otp";
import Loader from "../../components/UI/Loading/Loader";
import {saveAuthToken} from "../../redux/actions/auth-token";

const VerifyOTPScreen = ({route, navigation}) => {
  const [otp, setOTP] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [disableResendCode, setDisableResendCode] = useState(false);
  const [maxAttempts, setMaxAttempts] = useState(constants.MAX_ATTEMPTS_NUMBER);
  const {phoneNumber, fromLogin} = route.params;
  const [showLoader, setShowLoader] = useState(false);
  const [
    onVerifyOTP,
    verifyOTPResponse,
    verifyOTPResponseError,
  ] = useVerifyOTP();
  const [counter, setCounter] = useState(0);
  const [resendSuccessInfo, setResendSuccessInfo] = useState("");
  const [onResendOTP, resendOTPResponse, resendOTPResponseError] = resendOTP();

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: localize("verify_phone_number"),
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
    if (verifyOTPResponse && verifyOTPResponse.status === "success") {
      console.log(verifyOTPResponse);
      saveAuthData(verifyOTPResponse.data);
      setShowLoader(false);
      navigateHome();
    } else if (verifyOTPResponseError) {
      console.log(verifyOTPResponseError);
      setErrorMessage(verifyOTPResponseError);
      setShowLoader(false);
      setOTP("");
    }
  }, [verifyOTPResponse, verifyOTPResponseError, navigateHome, saveAuthData]);

  useEffect(() => {
    if (resendOTPResponse && resendOTPResponse.status === "success") {
      console.log(resendOTPResponse);
      setShowLoader(false);
      setResendSuccessInfo(resendOTPResponse.data?.msg);
      setErrorMessage("");
    } else if (resendOTPResponseError) {
      console.log(resendOTPResponseError);
      setErrorMessage(resendOTPResponseError);
      setShowLoader(false);
      setOTP("");
    }
  }, [resendOTPResponse, resendOTPResponseError]);

  useEffect(() => {
    if (counter > 0) {
      let timer = setInterval(() => {
        setCounter(counter - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else {
      console.log("Timer not set!");
    }
  }, [counter]);

  const dispatch = useDispatch();

  const saveAuthData = useCallback(
    async data => {
      const {access_token, token_type, expires_in} = data;
      await storage.saveSecureData(storageKeys.authToken, access_token);
      await storage.saveSecureData(storageKeys.tokenType, token_type);
      await storage.saveSecureData(storageKeys.expiresIn, `${expires_in}`);
      dispatch(saveAuthToken(access_token, token_type, expires_in));
    },
    [dispatch],
  );

  const codeChangeHandler = code => {
    setErrorMessage("");
    setOTP(code);
    setResendSuccessInfo("");
  };

  const resendCodeHandler = () => {
    setResendSuccessInfo("");
    setOTP("");
    startResendCodeTimer();
  };

  const startResendCodeTimer = () => {
    setDisableResendCode(true);
    if (maxAttempts >= 1) {
      setCounter(constants.OTP_TIMEOUT_INTERVAL);
      setShowLoader(true);
      onResendOTP(fromLogin, phoneNumber);
    }
    if (maxAttempts > 1) {
      setTimeout(() => {
        setMaxAttempts(maxAttempts - 1);
        setDisableResendCode(false);
        setCounter(0);
      }, constants.OTP_TIMEOUT_INTERVAL * 1000);
    }
  };

  const validateFields = () => {
    const phoneRegex = /^[0-9]{4}$/;
    if (!phoneRegex.test(otp)) {
      setErrorMessage(localize("pin_error"));
      return false;
    }
    setErrorMessage("");
    setOTP(otp);
    return true;
  };

  const verifyButtonPressHandler = () => {
    setResendSuccessInfo("");
    const isValid = validateFields();
    if (isValid) {
      setShowLoader(true);
      onVerifyOTP(fromLogin, phoneNumber, otp);
    }
  };

  const navigateHome = useCallback(() => {
    storage.getJSON(storageKeys.showWelcome).then(showWelcome => {
      if (showWelcome === true) {
        navigation.navigate(routes.POST_LOGIN);
      } else {
        storage.saveJSON(storageKeys.showWelcome, true).then(() => {
          navigation.navigate(routes.WELCOME);
        });
      }
    });
  }, [navigation]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : null}
      style={styles.screen}>
      <SafeAreaView style={styles.container}>
        <ScrollView>
          <View>
            <View style={styles.messageContainer}>
              <Text style={styles.message}>
                {localize("check_sms_for_pin")}
                <Text style={{...styles.message, ...styles.phone}}>
                  {phoneNumber}
                </Text>
              </Text>
            </View>
            <View style={styles.pinContainer}>
              <OTPInputView
                pinCount={4}
                code={otp}
                onCodeChanged={codeChangeHandler}
                autoFocusOnLoad={false}
                codeInputFieldStyle={styles.field}
                codeInputHighlightStyle={styles.field}
                onCodeFilled={codeChangeHandler}
                selectionColor={colors.primary}
              />
            </View>
            {errorMessage ? (
              <View style={styles.errorContainer}>
                <ErrorText error={errorMessage} />
              </View>
            ) : null}
            {resendSuccessInfo.length > 0 ? (
              <View style={styles.errorContainer}>
                <ErrorText error={resendSuccessInfo} info={true} />
              </View>
            ) : null}
            <View style={styles.resendCodeMainContainer}>
              <View style={styles.resendCodeContainer}>
                <Text style={styles.message}>
                  {localize("sms_not_received")}
                </Text>
                <TouchableOpacity
                  onPress={resendCodeHandler}
                  disabled={disableResendCode}>
                  <Text
                    style={
                      disableResendCode
                        ? {...styles.message, ...styles.disableResendCode}
                        : {...styles.message, ...styles.resendCode}
                    }>
                    {localize("resend_code")}
                  </Text>
                </TouchableOpacity>
              </View>
              {counter < 30 && counter > 0 ? (
                <Text style={{...styles.message, color: colors.fade}}>
                  00:{("0" + counter).slice(-2)}
                </Text>
              ) : null}
            </View>
          </View>
        </ScrollView>
        <View style={styles.buttonContainer}>
          <RoundButton
            style={styles.button}
            title={localize("verify").toUpperCase()}
            onPress={verifyButtonPressHandler}
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
  messageContainer: {
    marginTop: 32,
  },
  message: {
    color: colors.textPrimary,
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.body_semi_medium,
  },
  phone: {
    color: colors.fade,
  },
  pinContainer: {
    marginTop: 30,
    height: 80,
  },
  field: {
    borderColor: colors.border,
    borderRadius: 5,
    borderWidth: 1,
    width: 70,
    height: 80,
    fontSize: fontSizes.hugeTitle,
    color: colors.textPrimary,
    fontFamily: fonts.bold,
  },
  errorContainer: {
    marginTop: 16,
  },
  resendCodeMainContainer: {
    marginTop: 30,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  resendCodeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  resendCode: {
    color: colors.primary,
    left: 5,
  },
  disableResendCode: {
    color: colors.fade,
    left: 5,
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

export default VerifyOTPScreen;
