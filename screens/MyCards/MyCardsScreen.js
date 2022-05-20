import React, {useState, useCallback} from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Alert,
  BackHandler,
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

const MyCardsScreen = ({navigation}) => {
  const dispatch = useDispatch();
  const [showLoader, setShowLoader] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState(-1);
  const [errorMessage, setErrorMessage] = useState(null);
  const [onRemoveCard, responseMessage, responseError] = useRemoveCard();
  const [showRemoveCardAlert, setShowRemoveCardAlert] = useState(false);
  const [removeCardMessage, setRemoveCardMessage] = useState("");
  const [showConfirmRemoveCardAlert, setConfirmShowRemoveCardAlert] = useState(
    false,
  );

  const cards = useSelector(state => state.cards.cards);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: localize("my_cards"),
      headerLeft: () => (
        <LeftArrow
          onPress={() => {
            navigation.popToTop();
          }}
        />
      ),
    });
  }, [navigation]);

  React.useEffect(() => {
    const backAction = () => {
      navigation.popToTop();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction,
    );

    return () => backHandler.remove();
  }, [navigation]);

  React.useEffect(() => {
    const focusSubscription = navigation.addListener("focus", getData);
    return focusSubscription;
  }, [navigation, getData]);

  const getData = useCallback(async () => {
    setErrorMessage(null);
    setShowLoader(true);
    try {
      await dispatch(creditCardActions.getCreditCards());
    } catch (error) {
      setErrorMessage(error.message);
    }
    setShowLoader(false);
  }, [dispatch, setShowLoader, setErrorMessage]);

  React.useEffect(() => {
    setShowLoader(false);
    if (responseMessage) {
      showRemoveMessage();
    } else if (responseError) {
      console.log(responseError);
      setErrorMessage(responseError);
    }
  }, [responseMessage, responseError, showRemoveMessage]);

  const showRemoveMessage = useCallback(() => {
    setTimeout(() => {
      setShowRemoveCardAlert(true);
      setRemoveCardMessage(responseMessage);
    }, 500);
  }, [responseMessage]);

  const ListHeader = () => {
    return (
      <View>
        <Text style={styles.message}>{localize("cards_message")}</Text>
      </View>
    );
  };

  const removeCardButtonPressHandler = () => {
    setErrorMessage("");
    setConfirmShowRemoveCardAlert(true);
  };

  const removeSelectedCard = () => {
    if (selectedCardId === -1) {
      return;
    }
    setErrorMessage("");
    setShowLoader(true);
    onRemoveCard(selectedCardId);
  };

  const renderItem = ({item, index}) => {
    return (
      <CreditCardView
        card={item}
        selected={item.cardDetailId === selectedCardId}
        onPress={() => creditCardViewOnPressHandler(item.cardDetailId)}
        onRemovePress={removeCardButtonPressHandler}
        showRemove
      />
    );
  };

  const creditCardViewOnPressHandler = index => {
    setSelectedCardId(index);
  };

  const addCardButtonPressHandler = () => {
    navigation.navigate(routes.ADD_NEW_CARD, {
      fromRoute: routes.MY_CARDS,
      bookingId: null,
    });
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.container}>
        {cards?.length > 0 ? (
          <FlatList
            style={styles.list}
            showsVerticalScrollIndicator={false}
            data={cards}
            keyExtractor={(item, index) => {
              return item.cardDetailId;
            }}
            renderItem={renderItem}
            ListHeaderComponent={ListHeader}
          />
        ) : (
          <View style={styles.noCardsContainer}>
            <Text style={styles.message}>{localize("no_cards_message")}</Text>
          </View>
        )}
        {errorMessage ? (
          <View style={styles.errorContainer}>
            <ErrorText error={errorMessage} />
          </View>
        ) : null}
        <View style={styles.buttonContainer}>
          <RoundButton
            style={styles.button}
            title={localize("add_new_card").toUpperCase()}
            onPress={addCardButtonPressHandler}
          />
        </View>
        <Loader show={showLoader} />
        <PopupAlert
          show={showRemoveCardAlert}
          title={localize("success")}
          message={removeCardMessage}
          showOk
          onOkButtonPress={() => {
            setShowRemoveCardAlert(false);
            getData();
          }}
        />
        <PopupAlert
          show={showConfirmRemoveCardAlert}
          title={localize("remove_new_card")}
          message={localize("remove_card_message")}
          showOk
          showCancel
          onOkButtonPress={() => {
            setConfirmShowRemoveCardAlert(false);
            setTimeout(() => {
              removeSelectedCard();
            }, 200);
          }}
          onCancelButtonPress={() => {
            setConfirmShowRemoveCardAlert(false);
          }}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    justifyContent: "space-between",
    height: "100%",
  },
  message: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.body_semi_medium,
    color: colors.textPrimary,
    paddingVertical: 16,
  },
  noCardsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  list: {
    marginHorizontal: 12,
  },
  buttonContainer: {
    margin: 16,
    height: 50,
  },
  button: {
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  errorContainer: {
    marginHorizontal: 16,
    marginTop: 8,
  },
});

export default MyCardsScreen;
