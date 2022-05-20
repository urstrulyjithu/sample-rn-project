import {Linking, Alert, Platform} from "react-native";

export const phoneCallService = number => {
  const phoneNumber =
    Platform.OS === "android" ? `tel:${number}` : `telprompt:${number}`;
  Linking.canOpenURL(phoneNumber)
    .then(supported => {
      if (!supported) {
        Alert.alert("Phone number is not available");
      } else {
        return Linking.openURL(phoneNumber);
      }
    })
    .catch(err => console.log(err));
};
