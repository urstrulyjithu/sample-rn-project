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
import {SupportWoman} from "../../constants/image";

const SupportScreen = ({navigation}) => {
  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: localize("support"),
      headerLeft: () => (
        <LeftArrow
          onPress={() => {
            navigation.popToTop();
          }}
        />
      ),
    });
  }, [navigation]);

  return (
    <SafeAreaView style={styles.parentView}>
      <View style={styles.imageView}>
        <SupportWoman style={styles.image} />
      </View>
      <View style={styles.descriptionViewStyle}>
        <Text style={styles.descriptionStyle}>{localize("support_text")}</Text>
      </View>
    </SafeAreaView>
  );
};

export default SupportScreen;

const styles = StyleSheet.create({
  parentView: {
    backgroundColor: "white",
    height: "100%",
  },
  imageView: {
    justifyContent: "center",
    alignItems: "center",
    marginTop: 70,
  },
  image: {
    alignSelf: "center",
    paddingTop: 40,
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
    fontSize: fontSizes.body_medium,
    fontFamily: fonts.medium,
    color: colors.textPrimary,
    textAlign: "center",
  },
  nameView: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  descriptionViewStyle: {
    margin: 40,
  },
  timeStamp: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.body_small,
    alignSelf: "center",
  },
});
