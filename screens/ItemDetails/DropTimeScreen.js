import React, {useState, useCallback} from "react";
import {View, Text, Dimensions, StyleSheet, SafeAreaView} from "react-native";
import DatePicker from "react-native-date-picker";
import moment from "moment";

import fonts from "../../constants/fonts";
import colors from "../../constants/colors";
import fontSizes from "../../constants/font-sizes";
import {localize} from "../../translations/localized";
import * as constants from "../../constants/general";

import PopupView from "../../components/UI/Popup/PopupView";
import PickupTypeView from "../../components/ItemDetails/PickupTypeView";
import RoundButton from "../../components/UI/Buttons/RoundButton";

const width = Dimensions.get("window").width;

const DropTimeScreen = ({
  isImmediateDrop,
  dropDate,
  onDropTimeButtonPress,
  dropDelayTime = 0,
  pickupDate = new Date(),
}) => {
  const [immediateDrop, setImmediateDrop] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [driverArrivalTime, setDriverArrivalTime] = useState("");

  React.useEffect(() => {
    updateValues(isImmediateDrop);
    setImmediateDrop(isImmediateDrop);
  }, [isImmediateDrop, updateValues]);

  const updateValues = useCallback(
    isImmediate => {
      let scheduledDate;
      if (!dropDate) {
        scheduledDate = nearestFutureMinutes(
          constants.PICKUP_TIME_ROUND_INTERVAL,
          moment(pickupDate).add(dropDelayTime, "minutes"),
        ).toDate();
      } else {
        const difference = moment(dropDate).diff(moment(pickupDate), "minutes");
        if (difference >= constants.SCHEDULED_DROP_MIN_LIMIT) {
          scheduledDate = dropDate;
        } else {
          scheduledDate = nearestFutureMinutes(
            constants.PICKUP_TIME_ROUND_INTERVAL,
            moment(pickupDate).add(dropDelayTime, "minutes"),
          ).toDate();
        }
      }
      setSelectedDate(scheduledDate);
    },
    [dropDate, dropDelayTime, pickupDate],
  );

  const nearestFutureMinutes = (interval, someMoment) => {
    const roundedMinutes = Math.ceil(someMoment.minute() / interval) * interval;
    return someMoment.clone().minute(roundedMinutes).second(0);
  };

  const dropTimeButtonPressHandler = () => {
    onDropTimeButtonPress(immediateDrop, selectedDate);
  };

  React.useEffect(() => {
    const arrivalTime =
      localize("driver_deliver_time") +
      " " +
      moment(selectedDate).format("hh:mm A") +
      "- " +
      moment(selectedDate)
        .add(constants.SCHEDULED_PICK_UP_DRIVER_DELAY, "minutes")
        .format("hh:mm A");
    const timer = setTimeout(() => {
      setDriverArrivalTime(arrivalTime);
    }, 200);
    return () => {
      clearTimeout(timer);
    };
  }, [selectedDate]);

  return (
    <SafeAreaView style={styles.flex_1}>
      <View style={styles.flex_1}>
        <View style={styles.container}>
          <PopupView style={styles.bottomView} roundTop={true}>
            <Text style={styles.header}>{localize("drop_time")}</Text>
            <PickupTypeView
              enablePickup={immediateDrop}
              title={localize("immediate_drop")}
              details={localize("immediate_drop_ride_message")}
              onPress={() => setImmediateDrop(true)}
            />
            <PickupTypeView
              enablePickup={!immediateDrop}
              title={localize("schedule_ride")}
              details={localize("schedule_drop_message")}
              onPress={() => setImmediateDrop(false)}
            />
            {immediateDrop === false ? (
              <View style={styles.centerView}>
                <DatePicker
                  style={{width: width - 32}}
                  textColor={colors.textPrimary}
                  androidVariant="iosClone"
                  date={selectedDate}
                  maximumDate={nearestFutureMinutes(
                    constants.PICKUP_TIME_ROUND_INTERVAL,
                    moment(pickupDate)
                      .add(dropDelayTime, "minutes")
                      .add(constants.SCHEDULED_DROP_MAX_LIMIT, "hours"),
                  ).toDate()}
                  minimumDate={nearestFutureMinutes(
                    constants.PICKUP_TIME_ROUND_INTERVAL,
                    moment(pickupDate).add(dropDelayTime, "minutes"),
                  ).toDate()}
                  onDateChange={setSelectedDate}
                  minuteInterval={constants.PICKUP_TIME_ROUND_INTERVAL}
                />
                <Text style={styles.arrivalText}>{driverArrivalTime}</Text>
              </View>
            ) : null}

            <View style={styles.pickupButtonContainer}>
              <RoundButton
                style={styles.button}
                title={localize("set_drop_time").toUpperCase()}
                onPress={dropTimeButtonPressHandler}
              />
            </View>
          </PopupView>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex_1: {
    flex: 1,
  },
  container: {
    bottom: -34,
    position: "absolute",
    width: "100%",
  },
  bottomView: {
    paddingTop: 30,
    paddingHorizontal: 16,
    paddingBottom: 16 + 34,
  },
  header: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.bigTitle,
    color: colors.textPrimary,
    paddingBottom: 8,
  },
  arrivalText: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.body_semi_medium,
    color: colors.textPrimary,
    marginTop: 8,
  },
  centerView: {
    alignItems: "center",
  },
  pickupButtonContainer: {
    marginTop: 30,
    height: 50,
  },
  button: {
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
});

export default DropTimeScreen;
