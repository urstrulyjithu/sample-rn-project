import React from "react";
import {StyleSheet} from "react-native";
import {
  View,
  Text,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
} from "react-native";
import SyncStorage from "sync-storage";
import storageKeys from "../../cache/storage-keys";
import * as routes from "../../navigation/routes/app-routes";
import fontSizes from "../../constants/font-sizes";
import fonts from "../../constants/fonts";

const SettingsScreen = ({navigation}) => {
  const listData = ["Dev", "Staging", "Production"];

  const onPressListItem = item => {
    SyncStorage.set(storageKeys.environment, item);
    navigation.navigate(routes.SPLASH);
  };

  const renderListItem = ({item, index}) => {
    return (
      <View>
        <TouchableOpacity onPress={() => onPressListItem(item)}>
          <Text style={styles.text}>{item}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView>
      <Text style={styles.header}>Please select one of the environment</Text>
      <FlatList
        keyExtractor={(item, index) => item}
        data={listData}
        renderItem={renderListItem}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.body,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  text: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.body_medium,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
});
export default SettingsScreen;
