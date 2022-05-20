import {Dimensions, Platform} from "react-native";

export const iphoneXSeries = () => {
  const dimensions = Dimensions.get("window");
  return (
    Platform.OS === "ios" &&
    !Platform.isPad &&
    !Platform.isTVOS &&
    !Platform.isTV &&
    (dimensions.height === 812 ||
      dimensions.width === 812 ||
      dimensions.height === 896 ||
      dimensions.width === 896)
  );
};

export const capitalize = (string) => {
  if (string.length > 0) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
  return string;
};

export const stringToFloat = (string) => {
  const num = parseFloat(string);
  if (!isNaN(num)) {
    return num;
  }
  return 0;
};
