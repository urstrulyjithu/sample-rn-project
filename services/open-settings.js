import {Linking, Alert} from "react-native";
import {localize} from "../translations/localized";

export const openSettings = () => {
  Linking.openSettings().catch(() => {
    Alert.alert(localize("settings_not_opened"));
  });
};

export const showMediaOptionsOpenAlert = (reason, message) => {
  if (reason === "Error: Invalid image selected") {
    Alert.alert(localize("error"), localize("invalid_format"), [
      {text: localize("ok"), onPress: () => {}},
    ]);
  } else if (reason === "permission") {
    Alert.alert(localize("error"), message, [
      {text: localize("go_settings"), onPress: openSettings},
      {text: localize("cancel"), onPress: () => {}},
    ]);
  }
};
