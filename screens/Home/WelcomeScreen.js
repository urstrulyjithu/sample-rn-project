import React from "react";
import {View, Text, Dimensions, SafeAreaView, StyleSheet} from "react-native";

import fonts from "../../constants/fonts";
import colors from "../../constants/colors";
import fontSizes from "../../constants/font-sizes";
import {localize} from "../../translations/localized";
import * as routes from "../../navigation/routes/app-routes";
import RoundButton from "../../components/UI/Buttons/RoundButton";
import {MickaidoLogo} from "../../constants/image";

const width = Dimensions.get("window").width;

const WelcomeScreen = ({navigation}) => {
  const getStartedButtonHandler = () => {
    navigation.navigate(routes.POST_LOGIN);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.messageContainer}>
        <MickaidoLogo width={width - 100} height={width - 100} />
        <Text style={styles.welcome}>{localize("welcome")}</Text>
        <Text style={styles.welcomeMessage}>{localize("welcome_message")}</Text>
      </View>
      <View style={styles.width_100}>
        <View style={styles.buttonContainer}>
          <RoundButton
            style={styles.button}
            title={localize("get_started").toUpperCase()}
            onPress={getStartedButtonHandler}
          />
        </View>
      </View>
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
  messageContainer: {
    marginVertical: 30,
    height: "60%",
    marginHorizontal: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  welcome: {
    marginTop: 25,
    fontFamily: fonts.bold,
    fontSize: fontSizes.hugeTitle,
    color: colors.textPrimary,
  },
  welcomeMessage: {
    marginTop: 14,
    fontFamily: fonts.regular,
    fontSize: fontSizes.header,
    color: colors.textPrimary,
    textAlign: "center",
  },
  buttonContainer: {
    marginVertical: 16,
    height: 50,
    marginHorizontal: 16,
  },
  button: {
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  width_100: {
    width: "100%",
  },
});

export default WelcomeScreen;
