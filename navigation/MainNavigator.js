import React from "react";
import {NavigationContainer} from "@react-navigation/native";
import {enableScreens} from "react-native-screens";
import {createStackNavigator} from "@react-navigation/stack";

import * as routes from "./routes/app-routes";
import SplashScreen from "../screens/Splash/SplashScreen";
import PreLoginNavigator from "./PreLoginNavigator";
import PostLoginNavigator from "./PostLoginNavigator";
import SettingsScreen from "../screens/Settings/SettingsScreen";
import colors from "../constants/colors";
import fonts from "../constants/fonts";
import fontSizes from "../constants/font-sizes";
import {navigationRef} from "./RootNavigation";
import BookingInfoView from "../components/BookingDetails/BookingInfoView";

enableScreens();
const MainStack = createStackNavigator();

const MainNavigator = () => {
  return (
    <NavigationContainer ref={navigationRef}>
      <MainStack.Navigator mode="modal" screenOptions={modalOptions}>
        {/* <MainStack.Screen
          name={routes.SETTINGS}
          component={SettingsScreen}
          options={navigationOptions}
        /> */}
        <MainStack.Screen
          name={routes.SPLASH}
          component={SplashScreen}
          options={defaultOptions}
        />
        <MainStack.Screen
          name={routes.PRE_LOGIN}
          component={PreLoginNavigator}
          options={defaultOptions}
        />
        <MainStack.Screen
          independent={true}
          name={routes.POST_LOGIN}
          component={PostLoginNavigator}
          options={defaultOptions}
        />
        <MainStack.Screen
          name={routes.BOOKING_INFO}
          component={BookingInfoView}
          options={defaultOptions}
        />
      </MainStack.Navigator>
    </NavigationContainer>
  );
};

const defaultOptions = {
  headerShown: false,
  animationEnabled: false,
};

const navigationOptions = {
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

const modalOptions = {
  headerShown: false,
  cardStyle: {
    backgroundColor: "transparent",
    opacity: 1,
  },
  cardOverlayEnabled: true,
};

export default MainNavigator;
