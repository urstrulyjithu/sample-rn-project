import React, {useState, useEffect, useCallback, Fragment} from "react";
import {
  View,
  Platform,
  StyleSheet,
  TouchableOpacity,
  TouchableNativeFeedback,
  SafeAreaView,
} from "react-native";
import {DrawerContentScrollView, DrawerItem} from "@react-navigation/drawer";
import {Title, Caption, Drawer} from "react-native-paper";
import {useSelector} from "react-redux";
import Feather from "react-native-vector-icons/Feather";
import AntDesign from "react-native-vector-icons/AntDesign";
import Ionicons from "react-native-vector-icons/Ionicons";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

import colors from "../constants/colors";
import fonts from "../constants/fonts";
import fontSizes from "../constants/font-sizes";
import {localize} from "../translations/localized";
import * as routes from "../navigation/routes/app-routes";
import * as endPoints from "../constants/end-points";
import {iphoneXSeries} from "../utilities/utilities";
import {ShareContent} from "../services/share-service";

import {
  Bell,
  Chat,
  Favorites,
  MyRides,
  Promotions,
  Wallet,
} from "../constants/image";

import Profile from "../models/profile";
import useLogout from "../api/login/logout";
import Loader from "../components/UI/Loading/Loader";
import AvatarView from "../components/SideMenu/AvatarView";
import PopupAlert from "../components/UI/Alert/PopupAlert";

const DrawerContent = props => {
  const profile = Profile.class(useSelector(state => state.getProfile.profile));

  const [showLoader, setShowLoader] = useState(false);
  const [onLogout, response, responseError] = useLogout();
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);
  const [showLogoutErrorAlert, setShowLogoutErrorAlert] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  useEffect(() => {
    let timer;
    if (response && response.status === "success") {
      console.log(response);
      timer = setTimeout(() => {
        setShowLoader(false);
        navigatePreLogin();
      }, 500);
    } else if (responseError) {
      console.log(responseError);
      setShowLoader(false);
      timer = setTimeout(() => {
        setShowLogoutErrorAlert(true);
        setLogoutError(responseError);
      }, 500);
      return () => {
        clearTimeout(timer);
      };
    }
    props.navigation.closeDrawer();
  }, [navigatePreLogin, props.navigation, response, responseError]);

  const navigatePreLogin = useCallback(() => {
    props.navigation.closeDrawer();
    props.navigation.navigate(routes.PRE_LOGIN, {
      screen: routes.SIGNING,
      params: {
        authError: false,
      },
    });
  }, [props.navigation]);

  const profilePressHandler = () => {
    props.navigation.navigate(routes.PROFILE);
  };

  const logoutPressHandler = () => {
    setShowLogoutAlert(true);
  };

  const sharePressHandler = async () => {
    const title = localize("share_title");
    const message = localize("share_message");
    const icon = "data:<data_type>/<file_extension>;base64,<base64_data>";
    const url = endPoints.WEBSITE;
    await ShareContent(title, message, icon, url);
  };

  let TouchableComponent = TouchableOpacity;
  if (Platform.OS === "android" && Platform.Version >= 21) {
    TouchableComponent = TouchableNativeFeedback;
  }
  return (
    <Fragment>
      <SafeAreaView style={styles.topContainer} />
      <SafeAreaView style={styles.mainContainer}>
        <DrawerContentScrollView
          {...props}
          contentContainerStyle={styles.container}>
          <View>
            <TouchableComponent
              style={styles.drawerContent}
              activeOpacity={0.85}
              onPress={profilePressHandler}>
              <View style={styles.userInfoSection}>
                <AvatarView
                  avatarSize={50}
                  profile={profile}
                  onPressProfile={profilePressHandler}
                />

                <View style={styles.personContent}>
                  <View>
                    <Title style={styles.title}>
                      {profile.firstName}
                      {profile.middleName?.length > 0
                        ? ` ${profile.middleName} `
                        : " "}
                      {profile.lastName}
                    </Title>
                    <Caption style={styles.caption}>{profile.mobile}</Caption>
                  </View>
                  <View style={styles.arrowContent}>
                    <Feather name="chevron-right" color="white" size={20} />
                  </View>
                </View>
              </View>
            </TouchableComponent>
            <Drawer.Section style={styles.drawerSection}>
              {/* <DrawerItem
                icon={({size}) =>
                  profile.documentVerified === "AC" ? (
                    <Ionicons
                      name={
                        Platform.OS === "android"
                          ? "md-checkmark-circle"
                          : "ios-checkmark-circle"
                      }
                      color={colors.success}
                      size={25}
                    />
                  ) : profile.documentVerified === "NU" ? (
                    <MaterialIcons
                      name="error"
                      color={colors.error}
                      size={25}
                    />
                  ) : (
                    <FontAwesome
                      name="question-circle"
                      color={colors.yellow}
                      size={25}
                    />
                  )
                }
                labelStyle={styles.drawerItem}
                label={localize("kyc_documents")}
                onPress={() => {
                  props.navigation.navigate(routes.DOCUMENTS_VERIFICATION, {
                    customerType: profile.type,
                  });
                }}
              /> */}
              <DrawerItem
                icon={({size}) => <Wallet width={size} height={size} />}
                labelStyle={styles.drawerItem}
                label={localize("my_cards")}
                onPress={() => {
                  props.navigation.navigate(routes.MY_CARDS);
                }}
              />
              <DrawerItem
                icon={({size}) => <MyRides width={size} height={size} />}
                labelStyle={styles.drawerItem}
                label={localize("my_rides")}
                onPress={() => {
                  props.navigation.navigate(routes.MY_RIDES);
                }}
              />
              <DrawerItem
                icon={({size}) => (
                  <Ionicons
                    name="share-social-sharp"
                    size={size}
                    color={colors.mercury}
                  />
                )}
                labelStyle={styles.drawerItem}
                label={localize("refer_friend")}
                onPress={sharePressHandler}
              />
              {/* <DrawerItem
              icon={({size}) => <Promotions width={size} height={size} />}
              labelStyle={styles.drawerItem}
              label={localize("promotion")}
              onPress={() => {}}
            />
            <DrawerItem
              icon={({size}) => <Favorites width={size} height={size} />}
              labelStyle={styles.drawerItem}
              label={localize("my_favorites")}
              onPress={() => {}}
            />
            <DrawerItem
              icon={({size}) => <Bell width={size} height={size} />}
              labelStyle={styles.drawerItem}
              label={localize("notification")}
              onPress={() => {}}
            /> */}
              <DrawerItem
                icon={({size}) => <Chat width={size} height={size} />}
                labelStyle={styles.drawerItem}
                label={localize("support")}
                onPress={() => {
                  props.navigation.navigate(routes.SUPPORT);
                }}
              />
            </Drawer.Section>
          </View>
        </DrawerContentScrollView>
        <Drawer.Section style={styles.bottomDrawerSection}>
          <DrawerItem
            style={styles.bottom}
            icon={({color, size}) => (
              <AntDesign name="logout" color={colors.field} size={size} />
            )}
            labelStyle={styles.drawerItem}
            label={localize("logout")}
            onPress={logoutPressHandler}
          />
        </Drawer.Section>
        <Loader show={showLoader} />
        <PopupAlert
          show={showLogoutAlert}
          title={localize("logout")}
          message={localize("logout_message")}
          showCancel
          showOk
          onCancelButtonPress={() => {
            setShowLogoutAlert(false);
          }}
          onOkButtonPress={() => {
            setShowLogoutAlert(false);
            setShowLoader(true);
            props.navigation.closeDrawer();
            onLogout();
          }}
        />
        <PopupAlert
          show={showLogoutErrorAlert}
          title={localize("error")}
          message={logoutError}
          showOk
          onOkButtonPress={() => {
            setShowLogoutErrorAlert(false);
          }}
        />
      </SafeAreaView>
    </Fragment>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  topContainer: {
    flex: 0,
    backgroundColor: colors.primary,
  },
  container: {
    paddingTop:
      Platform.OS === "ios" ? (iphoneXSeries === true ? -64 : -20) : -5,
    bottom: 0,
  },
  drawerContent: {
    backgroundColor: colors.primary,
    paddingTop: Platform.OS === "ios" ? (iphoneXSeries === true ? 64 : 20) : 5,
  },
  userInfoSection: {
    paddingLeft: 32,
    paddingTop: 20,
    backgroundColor: colors.primary,
  },
  personContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    marginTop: 20,
    color: "white",
    fontWeight: "bold",
    fontFamily: fonts.bold,
    fontSize: fontSizes.title,
  },
  caption: {
    lineHeight: 14,
    paddingBottom: 20,
    fontFamily: fonts.regular,
    color: colors.lightPrimary,
  },
  arrowContent: {
    marginRight: 25,
    marginTop: 2,
  },
  drawerSection: {
    marginTop: 25,
    paddingLeft: 15,
    backgroundColor: "white",
  },
  drawerItem: {
    fontSize: fontSizes.title,
    fontFamily: fonts.semiBold,
    left: -20,
    color: colors.textPrimary,
  },
  bottomDrawerSection: {
    marginBottom: iphoneXSeries() ? 15 : 0,
  },
  bottom: {
    paddingLeft: 15,
  },
});

export default DrawerContent;
