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

const PickupTimeScreen = ({
  isImmediatePickup,
  pickupDate,
  onPickupTimeButtonPress,
}) => {
  const [immediatePickup, setImmediatePickup] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [driverArrivalTime, setDriverArrivalTime] = useState("");

  React.useEffect(() => {
    updateValues(isImmediatePickup);
    setImmediatePickup(isImmediatePickup);
  }, [isImmediatePickup, updateValues]);

  const updateValues = useCallback(
    isImmediate => {
      let scheduledDate;
      if (isImmediate) {
        scheduledDate = new Date();
        console.log("immediate");
      } else if (!pickupDate) {
        scheduledDate = nearestFutureMinutes(
          constants.PICKUP_TIME_ROUND_INTERVAL,
          moment(new Date()).add(
            constants.SCHEDULED_RIDE_TIME_IN_ADVANCE,
            "minutes",
          ),
        ).toDate();
        console.log("pickup date null", scheduledDate);
      } else {
        scheduledDate = pickupDate;
        const difference = moment(pickupDate).diff(
          moment(new Date()),
          "minutes",
        );
        if (difference >= constants.SCHEDULED_RIDE_TIME_IN_ADVANCE) {
          scheduledDate = pickupDate;
        } else {
          scheduledDate = nearestFutureMinutes(
            constants.PICKUP_TIME_ROUND_INTERVAL,
            moment(new Date()).add(
              constants.SCHEDULED_RIDE_TIME_IN_ADVANCE,
              "minutes",
            ),
          ).toDate();
        }
        console.log("pickup date not null", scheduledDate);
      }
      setSelectedDate(scheduledDate);
    },
    [pickupDate],
  );

  const nearestFutureMinutes = (interval, someMoment) => {
    const roundedMinutes = Math.ceil(someMoment.minute() / interval) * interval;
    return someMoment.clone().minute(roundedMinutes).second(0);
  };

  const setPickupTimeButtonPressHandler = () => {
    if (immediatePickup) {
      setSelectedDate(new Date());
      onPickupTimeButtonPress(immediatePickup, selectedDate);
      return;
    } else {
      onPickupTimeButtonPress(immediatePickup, selectedDate);
    }
  };

  React.useEffect(() => {
    const arrivalTime =
      localize("driver_arrive_time") +
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
            <Text style={styles.header}>{localize("pickup_time")}</Text>
            <PickupTypeView
              enablePickup={immediatePickup}
              title={localize("immediate_pickup")}
              details={localize("immediate_ride_message")}
              onPress={() => setImmediatePickup(true)}
            />
            <PickupTypeView
              enablePickup={!immediatePickup}
              title={localize("schedule_ride")}
              details={localize("schedule_ride_message")}
              onPress={() => {
                setImmediatePickup(false);
                setTimeout(() => {
                  updateValues(false);
                }, 500);
              }}
            />
            {immediatePickup === false ? (
              <View style={styles.centerView}>
                <DatePicker
                  style={{width: width - 32}}
                  textColor={colors.textPrimary}
                  androidVariant="iosClone"
                  date={selectedDate}
                  minimumDate={nearestFutureMinutes(
                    constants.PICKUP_TIME_ROUND_INTERVAL,
                    moment(new Date()).add(
                      constants.SCHEDULED_RIDE_TIME_IN_ADVANCE,
                      "minutes",
                    ),
                  ).toDate()}
                  maximumDate={nearestFutureMinutes(
                    constants.PICKUP_TIME_ROUND_INTERVAL,
                    moment(new Date()).add(
                      constants.SCHEDULED_PICK_UP_MAX_LIMIT,
                      "months",
                    ),
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
                title={localize("set_pickup_time").toUpperCase()}
                onPress={setPickupTimeButtonPressHandler}
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

export default PickupTimeScreen;
