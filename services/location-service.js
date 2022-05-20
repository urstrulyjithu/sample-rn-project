import {Alert, Platform, PermissionsAndroid} from "react-native";
import Geolocation from "react-native-geolocation-service";
import {localize} from "../translations/localized";
import {openSettings} from "../services/open-settings";

const hasLocationPermissionIOS = async () => {
  const status = await Geolocation.requestAuthorization("whenInUse");
  if (status === "granted") {
    return true;
  }
  // if (status === "denied") {
  //   Alert.alert(
  //     localize("enable_location"),
  //     localize("location_permission_denied_message"),
  //   );
  // }
  if (status === "denied" || status === "disabled" || status === "restricted") {
    Alert.alert(
      localize("need_location_title"),
      localize("need_location_message"),
      [
        {text: localize("go_settings"), onPress: openSettings},
        {text: localize("cancel"), onPress: () => {}},
      ],
    );
  }
  return false;
};

const hasLocationPermissionAndroid = async () => {
  if (Platform.OS === "android" && Platform.Version < 23) {
    return true;
  }
  const hasPermission = await PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  );
  if (hasPermission) {
    return true;
  }
  const status = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  );
  if (status === PermissionsAndroid.RESULTS.GRANTED) {
    return true;
  }
  if (
    status === PermissionsAndroid.RESULTS.DENIED ||
    status === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN
  ) {
    Alert.alert(
      localize("need_location_title"),
      localize("need_location_message"),
      [
        {text: localize("go_settings"), onPress: openSettings},
        {text: localize("cancel"), onPress: () => {}},
      ],
    );
  }
  return false;
};

export const hasLocationPermission = async () => {
  if (Platform.OS === "ios") {
    const hasPermission = await hasLocationPermissionIOS();
    return hasPermission;
  }
  if (Platform.OS === "android") {
    const hasPermission = await hasLocationPermissionAndroid();
    return hasPermission;
  }
  return false;
};
