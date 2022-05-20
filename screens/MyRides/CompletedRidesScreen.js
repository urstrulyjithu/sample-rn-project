import React, {useState, useEffect, useCallback} from "react";
import {SafeAreaView, FlatList, StyleSheet} from "react-native";
import {useSelector, useDispatch} from "react-redux";
import Modal from "react-native-modal";

import colors from "../../constants/colors";
import {localize} from "../../translations/localized";
import * as routes from "../../navigation/routes/app-routes";
import * as completedRidesActions from "../../redux/actions/completed-rides";

import Loader from "../../components/UI/Loading/Loader";
import NoRide from "../../components/Ride/NoRide";
import Profile from "../../models/profile";
import VerifyKYC from "../../components/DocumentsVerification/VerifyKYC";
import RideOverview from "../../components/Ride/RideOverview";

const CompletedRidesScreen = ({navigation}) => {
  const dispatch = useDispatch();
  const [showLoader, setShowLoader] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [showKYCView, setShowKYCView] = useState(false);
  const profile = Profile.class(useSelector(state => state.getProfile.profile));

  const completedTransactions = useSelector(
    state => state.myRides.completedTransactions,
  );

  useEffect(() => {
    navigation.setOptions({
      title: localize("completed"),
    });
  }, [navigation]);

  useEffect(() => {
    getData();
  }, [dispatch, getData]);

  const getData = useCallback(async () => {
    setErrorMessage(null);
    setShowLoader(true);
    try {
      await dispatch(
        completedRidesActions.getCompletedTransactions("Delivered"),
      );
    } catch (error) {
      setErrorMessage(error.message);
    }
    setShowLoader(false);
  }, [dispatch]);

  const getStartedButtonPressHandler = () => {
    if (profile.documentVerified === "NU") {
      setShowKYCView(true);
    } else {
      navigation.navigate(routes.HOME);
    }
  };

  const verifyKYCHandler = () => {
    setShowKYCView(false);
    navigation.navigate(routes.DOCUMENTS_VERIFICATION, {
      customerType: profile.type,
    });
  };

  const cancelVerifyKYCHandler = () => {
    setShowKYCView(false);
  };

  const onRideTouchHandler = item => {
    navigation.navigate(routes.RIDE_DETAILS, {
      transaction: item,
    });
  };

  const renderItem = ({item, index}) => {
    return (
      <RideOverview ride={item} onPress={() => onRideTouchHandler(item)} />
    );
  };

  return (
    <SafeAreaView style={styles.screen}>
      {completedTransactions.length === 0 ? (
        <NoRide
          noRidesText={localize("no_completed_rides")}
          onGetStartedPress={getStartedButtonPressHandler}
        />
      ) : null}
      <FlatList
        data={completedTransactions}
        keyExtractor={(item, index) => `${item.bookingDetailId}`}
        renderItem={renderItem}
      />
      <Modal
        style={styles.kycVerifyContainer}
        backdropOpacity={0.5}
        isVisible={showKYCView}
        swipeDirection="down"
        onSwipeComplete={cancelVerifyKYCHandler}
        onBackdropPress={cancelVerifyKYCHandler}>
        <VerifyKYC
          profile={profile}
          onVerifyButtonPress={verifyKYCHandler}
          onCancelButtonPress={cancelVerifyKYCHandler}
        />
      </Modal>
      <Loader show={showLoader} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  kycVerifyContainer: {
    margin: 0,
  },
});

export default CompletedRidesScreen;
