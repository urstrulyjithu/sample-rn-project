import React, {useEffect, useState, useCallback, useRef} from "react";
import {View, StyleSheet, Dimensions, Text, AppState} from "react-native";
import {useSelector, useDispatch} from "react-redux";
import messaging from "@react-native-firebase/messaging";
import notifee, {IOSAuthorizationStatus} from "@notifee/react-native";
import {showMessage} from "react-native-flash-message";
import PushNotification from "react-native-push-notification";

import {MickaidoLogo} from "../../constants/image";
import * as routes from "../../navigation/routes/app-routes";
import NotificationService from "../../services/notification-service";
import * as storage from "../../cache/storage";
import storageKeys from "../../cache/storage-keys";
import * as masterDataActions from "../../redux/actions/master-data";
import * as profileActions from "../../redux/actions/profile";
import * as authErrorActions from "../../redux/actions/auth-error";
import Profile from "../../models/profile";
import Loader from "../../components/UI/Loading/Loader";
import colors from "../../constants/colors";
import {localize} from "../../translations/localized";
import fonts from "../../constants/fonts";
import fontSizes from "../../constants/font-sizes";

const width = Dimensions.get("window").width;

const SplashScreen = ({navigation}) => {
  const [showSpinner, setShowSpinner] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [appDeviceToken, setAppDeviceToken] = useState(null);
  const dispatch = useDispatch();
  const appState = useRef(AppState.currentState);
  const [appIsActive, setAppIsActive] = useState(false);
  const [masterDataFetched, setMasterDataFetched] = useState(false);
  const profile = Profile.class(useSelector(state => state.getProfile.profile));

  const onRegister = useCallback(async tokenData => {
    console.log("TOKEN: " + JSON.stringify(tokenData));
    const deviceToken = tokenData.token ?? "";
    setAppDeviceToken(deviceToken);
    await storage.saveSecureData(storageKeys.deviceToken, deviceToken);
  }, []);

  const onNotification = useCallback(
    notification => {
      if (!appIsActive && notification?.message?.length > 0) {
        getMasterData();
      }
    },
    [appIsActive, getMasterData],
  );

  useEffect(() => {
    const pushService = new NotificationService(onRegister, onNotification);
    if (!pushService) {
      pushService.requestPermissions().then(permission => {
        console.log("Given permission: " + JSON.stringify(permission));
      });
    }
  }, [onNotification, onRegister]);

  useEffect(() => {
    console.log("Navigating from splash...");
    if (profile.id !== 0) {
      navigation.navigate(routes.POST_LOGIN, {screen: routes.TRANSACTIONS});
      dispatch(authErrorActions.hideAuthError());
    } else {
      navigation.navigate(routes.PRE_LOGIN, {
        screen: routes.SIGNING,
        params: {
          authError: false,
        },
      });
    }
  }, [dispatch, navigation, profile.id]);

  const getMasterData = useCallback(async () => {
    setErrorMessage("");
    setShowSpinner(true);
    try {
      await dispatch(profileActions.getProfile());
    } catch (error) {
      setErrorMessage(error.message);
    }
    setShowSpinner(false);
    try {
      await dispatch(masterDataActions.getMasterData());
    } catch (error) {
      setErrorMessage(error.message);
    }
  }, [dispatch]);

  const checkDeviceToken = useCallback(
    async deviceToken => {
      if (!masterDataFetched) {
        setMasterDataFetched(true);
        setTimeout(() => {
          getMasterData();
        }, 500);
      }
      if (!deviceToken) {
        return;
      }
    },
    [getMasterData, masterDataFetched],
  );

  // ************************************************************************************ //
  // *********************************** FCM Configuration ****************************** //
  // ************************************************************************************ //
  messaging().setBackgroundMessageHandler(async remoteMessage => {
    console.log("Message handled in the background!", remoteMessage);
  });

  useEffect(() => {
    requestNotifeePermission();
  }, [requestNotifeePermission]);

  const requestNotifeePermission = useCallback(() => {
    requestUserPermission();
    if (appDeviceToken?.length !== 0) {
      const unsubscribe = messaging().onMessage(async remoteMessage => {
        // Alert.alert("A new FCM message arrived!", JSON.stringify(remoteMessage));
        await displayNotification(remoteMessage);
      });
      return unsubscribe;
    }
  }, [appDeviceToken?.length, requestUserPermission]);

  const requestUserPermission = useCallback(async () => {
    const authStatus = await messaging().requestPermission({
      sound: true,
      alert: true,
      badge: true,
    });
    const settings = await notifee.requestPermission({
      sound: true,
      alert: true,
      badge: true,
    });
    if (settings.authorizationStatus === IOSAuthorizationStatus.DENIED) {
      console.log("User denied permissions request");
    } else if (
      settings.authorizationStatus === IOSAuthorizationStatus.AUTHORIZED
    ) {
      console.log("User granted permissions request");
    } else if (
      settings.authorizationStatus === IOSAuthorizationStatus.PROVISIONAL
    ) {
      console.log("User provisionally granted permissions request");
    }
    console.log("Auth status", authStatus);
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    getFcmToken();
    if (enabled) {
      console.log("Authorization status:", authStatus);
    }
  }, [getFcmToken]);

  const getFcmToken = useCallback(async () => {
    const fcmToken = await messaging().getToken();
    if (fcmToken) {
      console.log("FCM Token: ", fcmToken);
      storage.saveSecureData(storageKeys.fcmToken, fcmToken).then(() => {
        checkDeviceToken(null);
      });
      console.log("Your Firebase Token is:", fcmToken);
    } else {
      console.log("Failed", "No token received");
    }
  }, [checkDeviceToken]);

  const displayNotification = async notification => {
    console.log("displayNotification", notification);
    PushNotification.createChannel(
      {
        channelId: notification?.collapseKey ?? "Special Key", // (required)
        channelName: notification?.from ?? "Special message", // (required)
        channelDescription: "Notification for special message", // (optional) default: undefined.
        importance: 4, // (optional) default: 4. Int value of the Android notification importance
        vibrate: true, // (optional) default: true. Creates the default vibration patten if true.
        playSound: true,
      },
      created => console.log(`createChannel returned '${created}'`), // (optional) callback returns whether the channel was created, false means it already existed.
    );
    PushNotification.localNotification({
      channelId: notification?.collapseKey ?? "Special Key", //This must be same with channelId in createChannel
      title: notification.notification?.title ?? "",
      message: notification.notification?.body ?? "",
    });
    showMessage({
      message: notification.notification?.title ?? "",
      description: notification.notification?.body ?? "",
      type: "info",
      backgroundColor: colors.primary,
      icon: "info",
      duration: 3000,
    });
  };

  // ************************************************************************************ //
  // ********************************* Application State ******************************** //
  // ************************************************************************************ //
  React.useEffect(() => {
    const subscription = AppState.addEventListener("change", nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        console.log("App has come to the foreground!");
      }

      appState.current = nextAppState;
      console.log("AppState", appState.current);
      setAppIsActive(appState.current === "active");
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <View style={styles.screen}>
      <MickaidoLogo width={width - 100} height={width - 100} />
      <Text style={styles.title}>{localize("consumer_customer")}</Text>
      <Loader show={showSpinner} />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },
  spinner: {
    height: "10%",
  },
  title: {
    marginTop: 12,
    color: colors.primary,
    fontFamily: fonts.light,
    fontSize: fontSizes.hugeTitle,
  },
});

export default SplashScreen;
