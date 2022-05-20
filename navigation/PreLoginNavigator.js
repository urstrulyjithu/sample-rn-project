import React from "react";
import {Platform} from "react-native";
import {createStackNavigator} from "@react-navigation/stack";
import {enableScreens} from "react-native-screens";
import {createNativeStackNavigator} from "react-native-screens/native-stack";

import * as routes from "./routes/app-routes";
import colors from "../constants/colors";
import fonts from "../constants/fonts";
import fontSizes from "../constants/font-sizes";

import PreLoginScreen from "../screens/Splash/PreLoginScreen";
import SignupScreen from "../screens/Signup/SignupScreen";
import LoginScreen from "../screens/Login/LoginScreen";
import VerifyOTPScreen from "../screens/VerifyOTP/VerifyOTPScreen";
import WelcomeScreen from "../screens/Home/WelcomeScreen";

enableScreens();
const PreLoginStack =
  Platform.OS === "android"
    ? createStackNavigator()
    : createNativeStackNavigator();

const PreLoginNavigator = () => {
  return (
    <PreLoginStack.Navigator>
      <PreLoginStack.Screen
        name={routes.SIGNING}
        component={PreLoginScreen}
        options={hideNavigationBar}
      />
      <PreLoginStack.Screen
        name={routes.SIGNUP}
        component={SignupScreen}
        options={defaultOptions}
      />
      <PreLoginStack.Screen
        name={routes.LOGIN}
        component={LoginScreen}
        options={defaultOptions}
      />
      <PreLoginStack.Screen
        name={routes.VERIFY_OTP}
        component={VerifyOTPScreen}
        options={defaultOptions}
      />
      <PreLoginStack.Screen
        name={routes.WELCOME}
        component={WelcomeScreen}
        options={hideNavigationBar}
      />
    </PreLoginStack.Navigator>
  );
};

const hideNavigationBar = {
  headerShown: false,
  animationEnabled: false,
};

const defaultOptions = {
  headerTintColor: colors.textPrimary,
  headerTitleStyle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.title,
  },
  headerLargeTitle: true,
  headerLargeTitleStyle: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
  },
  // headerTranslucent: true,
  headerHideShadow: true,
  // headerStyle: {
  //   elevation: 0,
  //   shadowOpacity: 0,
  // },
};

export default PreLoginNavigator;
