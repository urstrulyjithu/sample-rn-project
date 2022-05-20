import {Platform} from "react-native";
import Share from "react-native-share";

export const ShareContent = async (title, message, icon, url) => {
  const options = Platform.select({
    ios: {
      activityItemSources: [
        {
          placeholderItem: {type: "text", content: title},
          item: {default: {type: "text", content: `${message}\n${url}`}},
          linkMetadata: {title, icon},
        },
      ],
    },
    default: {
      title,
      subject: title,
      message: `${message}\n${url}`,
    },
  });
  try {
    const shareResult = await Share.open(options);
    console.log(shareResult);
  } catch (error) {
    console.log(error);
  }
};
