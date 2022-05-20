import React from "react";
import {Platform, StyleSheet} from "react-native";
import {createStackNavigator} from "@react-navigation/stack";
import {enableScreens} from "react-native-screens";
import {createNativeStackNavigator} from "react-native-screens/native-stack";
import {createDrawerNavigator} from "@react-navigation/drawer";
import {createMaterialTopTabNavigator} from "@react-navigation/material-top-tabs";

import * as routes from "./routes/app-routes";
import colors from "../constants/colors";
import fonts from "../constants/fonts";
import fontSizes from "../constants/font-sizes";

import TransactionsScreen from "../screens/Home/TransactionsScreen";
import HomeScreen from "../screens/Home/HomeScreen";
import DocumentsVerificationScreen from "../screens/DocumentsVerification/DocumentsVerificationScreen";
import AddDocumentsScreen from "../screens/DocumentsVerification/AddDocumentsScreen";
import VerifyAddressDocumentsScreen from "../screens/DocumentsVerification/VerifyAddressDocumentsScreen";
import DrawerContent from "./DrawerContent";
import ChooseDestinationScreen from "../screens/ChooseDestination/ChooseDestinationScreen";
import SetDestinationScreen from "../screens/ChooseDestination/SetDestinationScreen";
import PickupDetailsScreen from "../screens/PickupDeliveryDetails/PickupDetailsScreen";
import DeliveryDetailsScreen from "../screens/PickupDeliveryDetails/DeliveryDetailsScreen";
import ItemDetailsScreen from "../screens/ItemDetails/ItemDetailsScreen";
import BookingDetailsScreen from "../screens/BookingDetails/BookingDetailsScreen";
import BookingReviewScreen from "../screens/BookingDetails/BookingReviewScreen";
import DriverSearchScreen from "../screens/BookingDetails/DriverSearchScreen";
import UpcomingRidesScreen from "../screens/MyRides/UpcomingRidesScreen";
import CompletedRidesScreen from "../screens/MyRides/CompletedRidesScreen";
import CancelledRidesScreen from "../screens/MyRides/CancelledRidesScreen";
import ProfileScreen from "../screens/Profile/ProfileScreen";
import RatingScreen from "../screens/BookingDetails/RatingScreen";
import LeftArrow from "../components/UI/HeaderButtons/LeftArrow";
import {localize} from "../translations/localized";
import MyCardsScreen from "../screens/MyCards/MyCardsScreen";
import AddCardScreen from "../screens/MyCards/AddCardScreen";
import CheckoutScreen from "../screens/BookingDetails/CheckoutScreen";
import RideDetailsScreen from "../screens/MyRides/RideDetailsScreen";
import NotificationScreen from "../screens/Notification/NotificationScreen";
import SupportScreen from "../screens/Support/SupportScreen";
import DropScreen from "../screens/ItemDetails/DropScreen";
import PickupScreen from "../screens/ItemDetails/PickupScreen";

enableScreens();
const PostLoginStack =
  Platform.OS === "android"
    ? createStackNavigator()
    : createNativeStackNavigator();

const PostLoginNavigator = () => {
  return (
    <PostLoginStack.Navigator>
      <PostLoginStack.Screen
        name={routes.TRANSACTIONS}
        component={TransactionsScreen}
        options={defaultOptions}
      />
      <PostLoginStack.Screen
        name={routes.HOME}
        component={HomeScreen}
        options={hideNavigationBar}
      />
      <PostLoginStack.Screen
        name={routes.DOCUMENTS_VERIFICATION}
        component={DocumentsVerificationScreen}
        options={defaultOptions}
      />
      <PostLoginStack.Screen
        name={routes.ADD_DOCUMENTS}
        component={AddDocumentsScreen}
        options={defaultOptions}
      />
      <PostLoginStack.Screen
        name={routes.VERIFY_ADDRESS_DOCUMENTS}
        component={VerifyAddressDocumentsScreen}
        options={defaultOptions}
      />
      <PostLoginStack.Screen
        name={routes.CHOOSE_DESTINATION}
        component={ChooseDestinationScreen}
        options={generalOptions}
      />
      <PostLoginStack.Screen
        name={routes.SET_DESTINATION}
        component={SetDestinationScreen}
        options={generalOptions}
      />
      <PostLoginStack.Screen
        name={routes.PICKUP_DETAILS}
        component={PickupDetailsScreen}
        options={hideNavigationBar}
      />
      <PostLoginStack.Screen
        name={routes.DELIVERY_DETAILS}
        component={DeliveryDetailsScreen}
        options={hideNavigationBar}
      />
      <PostLoginStack.Screen
        name={routes.ITEM_DETAILS}
        component={ItemDetailsScreen}
        options={defaultOptions}
      />
      <PostLoginStack.Screen
        name={routes.BOOKING_DETAILS}
        component={BookingDetailsScreen}
        options={hideNavigationBar}
      />
      <PostLoginStack.Screen
        name={routes.BOOKING_REVIEW}
        component={BookingReviewScreen}
        options={defaultOptions}
      />
      <PostLoginStack.Screen
        name={routes.DRIVER_SEARCH}
        component={DriverSearchScreen}
        options={hideNavigationBar}
      />
      <PostLoginStack.Screen
        name={routes.PROFILE}
        component={ProfileScreen}
        options={generalOptions}
      />
      <PostLoginStack.Screen
        name={routes.MY_RIDES}
        component={MyRidesScreen}
        options={defaultOptions}
      />
      <PostLoginStack.Screen
        name={routes.RATING}
        component={RatingScreen}
        options={generalOptions}
      />
      <PostLoginStack.Screen
        name={routes.MY_CARDS}
        component={MyCardsScreen}
        options={defaultOptions}
      />
      <PostLoginStack.Screen
        name={routes.ADD_NEW_CARD}
        component={AddCardScreen}
        options={defaultOptions}
      />
      <PostLoginStack.Screen
        name={routes.CHECK_OUT}
        component={CheckoutScreen}
        options={defaultOptions}
      />
      <PostLoginStack.Screen
        name={routes.RIDE_DETAILS}
        component={RideDetailsScreen}
        options={defaultOptions}
      />
      <PostLoginStack.Screen
        name={routes.NOTIFICATIONS}
        component={NotificationScreen}
        options={defaultOptions}
      />
      <PostLoginStack.Screen
        name={routes.SUPPORT}
        component={SupportScreen}
        options={defaultOptions}
      />
      <PostLoginStack.Screen
        name={routes.PICK_UP}
        component={PickupScreen}
        options={hideNavigationBar}
      />
      <PostLoginStack.Screen
        name={routes.DROP_TIME}
        component={DropScreen}
        options={hideNavigationBar}
      />
    </PostLoginStack.Navigator>
  );
};

const MickaidoDrawer = createDrawerNavigator();

const MickaidoDrawerNavigator = () => {
  return (
    <MickaidoDrawer.Navigator
      drawerStyle={styles.drawer}
      drawerContent={props => <DrawerContent {...props} />}>
      <MickaidoDrawer.Screen
        name={routes.HOME_STACK}
        component={PostLoginNavigator}
      />
    </MickaidoDrawer.Navigator>
  );
};

const TopTabNavigator = createMaterialTopTabNavigator();

const MyRidesScreen = ({navigation}) => {
  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: localize("my_rides"),
      headerLeft: () => (
        <LeftArrow
          onPress={() => {
            navigation.pop();
          }}
        />
      ),
    });
  }, [navigation]);
  return (
    <TopTabNavigator.Navigator
      initialRouteName={routes.UPCOMING_RIDES}
      tabBarOptions={{
        activeTintColor: colors.primary,
        inactiveTintColor: colors.fade,
        labelStyle: {
          fontFamily: fonts.bold,
          fontSize: fontSizes.body_semi_medium,
        },
        indicatorStyle: {
          backgroundColor: colors.primary,
        },
      }}>
      <TopTabNavigator.Screen
        name={routes.UPCOMING_RIDES}
        component={UpcomingRidesScreen}
      />
      <TopTabNavigator.Screen
        name={routes.COMPLETED_RIDES}
        component={CompletedRidesScreen}
      />
      <TopTabNavigator.Screen
        name={routes.CANCELLED_RIDES}
        component={CancelledRidesScreen}
      />
    </TopTabNavigator.Navigator>
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

const generalOptions = {
  headerLargeTitle: false,
  // headerTranslucent: true,
  headerHideShadow: true,
};

const styles = StyleSheet.create({
  drawer: {
    width: "75%",
  },
});

export default MickaidoDrawerNavigator;
