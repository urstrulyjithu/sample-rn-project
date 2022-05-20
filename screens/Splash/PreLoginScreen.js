import React, {useCallback, useState} from "react";
import {
  View,
  BackHandler,
  Dimensions,
  StyleSheet,
  SafeAreaView,
  Platform,
} from "react-native";
import {useSelector} from "react-redux";

import colors from "../../constants/colors";
import * as routes from "../../navigation/routes/app-routes";
import {MickaidoLogo} from "../../constants/image";
import {localize} from "../../translations/localized";
import RoundButton from "../../components/UI/Buttons/RoundButton";
import {Text} from "react-native";
import fonts from "../../constants/fonts";
import fontSizes from "../../constants/font-sizes";
import PopupAlert from "../../components/UI/Alert/PopupAlert";
import * as constants from "../../constants/general";
import ErrorText from "../../components/UI/Texts/ErrorText";

const width = Dimensions.get("window").width;

const PreLoginScreen = ({navigation, route}) => {
  const {authError} = route.params;
  const showAuthError = useSelector(state => state.authError.showAuthError);

  const [showExitAlert, setShowExitAlert] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const signupButtonPressHandler = () => {
    setErrorMessage("");
    navigation.navigate(routes.PRE_LOGIN, {
      screen: routes.SIGNUP,
    });
  };

  const loginButtonPressHandler = () => {
    setErrorMessage("");
    navigation.navigate(routes.PRE_LOGIN, {
      screen: routes.LOGIN,
    });
  };

  const hardwareBackButtonPressHandler = useCallback(() => {
    if (navigation.isFocused()) {
      if (Platform.OS === "android") {
        setShowExitAlert(true);
        setErrorMessage("");
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

  React.useEffect(() => {
    setErrorMessage("");
    if (authError && showAuthError) {
      setErrorMessage(localize("session_error"));
    }
  }, [authError, showAuthError]);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.screen}>
        <View />
        <View style={styles.logo}>
          <MickaidoLogo width={width - 100} height={width - 100} />
          <Text style={styles.title}>{localize("consumer_customer")}</Text>
        </View>
        {errorMessage ? (
          <View style={styles.elementsContainer}>
            <ErrorText error={errorMessage} />
          </View>
        ) : null}
        <View style={styles.buttonsContainer}>
          <View style={styles.innerButtonContainer}>
            <RoundButton
              style={styles.button}
              title={localize("sign_up")}
              onPress={signupButtonPressHandler}
            />
            <RoundButton
              style={styles.button}
              title={localize("log_in")}
              onPress={loginButtonPressHandler}
            />
          </View>
        </View>
      </View>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: {
    alignItems: "center",
  },
  title: {
    marginTop: 12,
    color: colors.primary,
    fontFamily: fonts.light,
    fontSize: fontSizes.hugeTitle,
  },
  bottomContainer: {
    position: "absolute",
    height: "15%",
    alignItems: "center",
    justifyContent: "center",
    bottom: 0,
  },
  buttonsContainer: {
    height: width > 375 ? 75 : 70,
    width: "100%",
    alignItems: "center",
    flexDirection: "row",
    bottom: 16,
  },
  innerButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    width: "100%",
    height: "70%",
  },
  button: {
    width: "40%",
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  elementsContainer: {
    position: "absolute",
    bottom: 100,
    zIndex: 1,
    marginHorizontal: 16,
  },
});

export default PreLoginScreen;
