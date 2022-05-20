import React, {useState, useCallback} from "react";
import {
  Image,
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Alert,
  BackHandler,
  TouchableOpacity,
} from "react-native";
import {useDispatch, useSelector} from "react-redux";
import {localize} from "../../translations/localized";
import fonts from "../../constants/fonts";
import fontSizes from "../../constants/font-sizes";
import colors from "../../constants/colors";
import * as routes from "../../navigation/routes/app-routes";
import * as creditCardActions from "../../redux/actions/credit-cards";
import useRemoveCard from "../../api/creditCards/removeCard";

import LeftArrow from "../../components/UI/HeaderButtons/LeftArrow";
import RoundButton from "../../components/UI/Buttons/RoundButton";
import Loader from "../../components/UI/Loading/Loader";
import CreditCardView from "../../components/UI/CreditCard/CreditCardView";
import PopupAlert from "../../components/UI/Alert/PopupAlert";
import ErrorText from "../../components/UI/Texts/ErrorText";

const Data = [
  {
    image: "https://reactnative.dev/img/tiny_logo.png",
    name: "jithu",
    description:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Maxime mollitia, molestiae quas vel sint commodi repudiandae consequuntur voluptatum laborum",
  },
  {
    image: "https://reactnative.dev/img/tiny_logo.png",
    name: "himan",
    description:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Maxime mollitia, molestiae quas vel sint commodi repudiandae consequuntur voluptatum laborum",
  },
  {
    image: "https://reactnative.dev/img/tiny_logo.png",
    name: "rahul",
    description:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Maxime mollitia, molestiae quas vel sint commodi repudiandae consequuntur voluptatum laborum",
  },
  {
    image: "https://reactnative.dev/img/tiny_logo.png",
    name: "sanjay",
    description:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Maxime mollitia, molestiae quas vel sint commodi repudiandae consequuntur voluptatum laborum",
  },
  {
    image: "https://reactnative.dev/img/tiny_logo.png",
    name: "wowre",
    description:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Maxime mollitia, molestiae quas vel sint commodi repudiandae consequuntur voluptatum laborum",
  },
  {
    image: "https://reactnative.dev/img/tiny_logo.png",
    name: "heman",
    description:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Maxime mollitia, molestiae quas vel sint commodi repudiandae consequuntur voluptatum laborum",
  },
  {
    image: "https://reactnative.dev/img/tiny_logo.png",
    name: "heman",
    description:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Maxime mollitia, molestiae quas vel sint commodi repudiandae consequuntur voluptatum laborum",
  },
  {
    image: "https://reactnative.dev/img/tiny_logo.png",
    name: "heman",
    description:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Maxime mollitia, molestiae quas vel sint commodi repudiandae consequuntur voluptatum laborum",
  },
];

const Item = ({item}) => {
  return (
    <TouchableOpacity style={styles.listView}>
      <View style={styles.cardView}>
        <Image
          style={styles.image}
          source={{
            uri: item.image,
          }}
        />
        <View style={styles.detailView}>
          <View style={styles.nameView}>
            <Text style={styles.nameStyle}>{item.name}</Text>
            <Text style={styles.timeStamp}>1h</Text>
          </View>
          <View style={styles.descriptionViewStyle}>
            <Text style={styles.descriptionStyle} numberOfLines={2}>
              {item.description}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};
const NotificationScreen = ({navigation}) => {
  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: localize("notifications"),
      headerLeft: () => (
        <LeftArrow
          onPress={() => {
            navigation.popToTop();
          }}
        />
      ),
    });
  }, [navigation]);

  const renderItem = ({item}) => <Item item={item} />;
  return (
    <SafeAreaView style={styles.parentView}>
      <FlatList
        data={Data}
        renderItem={renderItem}
        keyExtractor={item => item.id}
      />
    </SafeAreaView>
  );
};

export default NotificationScreen;

const styles = StyleSheet.create({
  parentView: {
    backgroundColor: "white",
    height: "100%",
  },
  image: {
    width: 50,
    height: 50,
    borderRadius: 50,
    alignSelf: "center",
  },
  listView: {
    marginHorizontal: 12,
    marginVertical: 6,
  },
  cardView: {
    padding: 10,
    flexDirection: "row",
    width: "99%",
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  detailView: {
    width: "88%",
    flexDirection: "column",
    paddingHorizontal: 5,
  },
  nameStyle: {
    fontSize: fontSizes.body_medium,
    fontFamily: fonts.semiBold,
    color: "black",
  },
  descriptionStyle: {
    fontSize: fontSizes.body_small,
    fontFamily: fonts.light,
    color: colors.mercury,
  },
  nameView: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  descriptionViewStyle: {
    width: "95%",
  },
  timeStamp: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.body_small,
    alignSelf: "center",
  },
});
