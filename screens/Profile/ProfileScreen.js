import React, {useState, useCallback, useRef} from "react";
import {
  View,
  Text,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Alert,
  Dimensions,
  PermissionsAndroid,
} from "react-native";
import {useSelector, useDispatch} from "react-redux";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import moment from "moment";
import * as ImagePicker from "react-native-image-picker";
import Feather from "react-native-vector-icons/Feather";
import Ionicons from "react-native-vector-icons/Ionicons";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import {useActionSheet} from "@expo/react-native-action-sheet";
import {request, PERMISSIONS, RESULTS} from "react-native-permissions";

import colors from "../../constants/colors";
import fonts from "../../constants/fonts";
import fontSizes from "../../constants/font-sizes";
import * as constants from "../../constants/general";
import {localize} from "../../translations/localized";
import useProfileUpdate from "../../api/profile/update-profile";
import useProfilePicUpdate from "../../api/profile/upload-profile-picture";
import * as profileActions from "../../redux/actions/profile";
import * as routes from "../../navigation/routes/app-routes";

import InputField from "../../components/UI/Inputs/InputField";
import RoundButton from "../../components/UI/Buttons/RoundButton";
import ErrorText from "../../components/UI/Texts/ErrorText";
import Loader from "../../components/UI/Loading/Loader";
import CloseButton from "../../components/UI/HeaderButtons/CloseButton";
import AvatarView from "../../components/SideMenu/AvatarView";

import Profile from "../../models/profile";
import RadioButton from "../../components/UI/Buttons/RadioButton";
import TouchableView from "../../components/UI/Buttons/TouchableView";
import PopupAlert from "../../components/UI/Alert/PopupAlert";
import {showMediaOptionsOpenAlert} from "../../services/open-settings";

const SignupScreen = ({navigation}) => {
  const dispatch = useDispatch();
  const scrollView = useRef();
  const {showActionSheetWithOptions} = useActionSheet();

  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [gender, setGender] = useState(0);
  const [dob, setDOB] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showLoader, setShowLoader] = useState(false);
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [profilePicture, setProfilePicture] = useState({
    id: 0,
    image: null,
    imageUrl: null,
  });
  const [selectedImagePath, setSelectedImagePath] = useState(null);
  const [showUpdateProfileAlert, setShowUpdateProfileAlert] = useState(false);
  const [updateProfileMessage, setUpdateProfileMessage] = useState("");
  const [
    showUpdateProfileImageAlert,
    setShowUpdateProfileImageAlert,
  ] = useState(false);
  const [updateProfileImageMessage, setUpdateProfileImageMessage] = useState(
    "",
  );

  const [
    onProfileUpdate,
    profileUpdateResponse,
    profileUpdateResponseError,
  ] = useProfileUpdate();
  const [
    onUploadProfilePicture,
    profilePictureResponse,
    profilePictureResponseError,
  ] = useProfilePicUpdate();

  const FIRST_NAME = localize("first_name");
  const MIDDLE_NAME = localize("middle_name");
  const LAST_NAME = localize("last_name");
  const EMAIL = localize("email");
  const DATE_OF_BIRTH = localize("date_of_birth");
  const PHONE_NUMBER = localize("phone_number");

  const profile = Profile.class(useSelector(state => state.getProfile.profile));

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: "",
      headerLeft: () => (
        <CloseButton
          onPress={() => {
            navigation.pop();
          }}
        />
      ),
    });
  }, [navigation]);

  React.useEffect(() => {
    setFirstName(profile.firstName ?? "");
    setMiddleName(profile.middleName ?? "");
    setLastName(profile.lastName ?? "");
    setEmail(profile.email);
    setPhoneNumber("******" + profile.mobile.substr(6, 10));
    if (profile.dateOfBirth?.length > 0 && profile.dateOfBirth !== "NU") {
      setDOB(
        moment(moment(profile.dateOfBirth).startOf("day").format("LL"))
          .startOf("day")
          .format("MM-DD-YYYY"),
      );
    }
    switch (profile.gender) {
      case "M":
        setGender(1);
        break;
      case "F":
        setGender(2);
        break;
      case "T":
        setGender(3);
        break;
    }
  }, [
    profile.email,
    profile.mobile,
    profile.dateOfBirth,
    profile.gender,
    profile.middleName,
    profile.lastName,
    profile.firstName,
  ]);

  const fieldChangeHandler = (newValue, field) => {
    setErrorMessage("");
    switch (field) {
      case FIRST_NAME:
        if (firstName?.length > 0 || newValue.trim() !== "") {
          let value = newValue.replace(/[^A-Za-z _'-]/gi, "");
          setFirstName(value);
        }
        break;
      case MIDDLE_NAME:
        if (middleName?.length > 0 || newValue.trim() !== "") {
          let value = newValue.replace(/[^A-Za-z _'-]/gi, "");
          setMiddleName(value);
        }
        break;
      case LAST_NAME:
        if (lastName?.length > 0 || newValue.trim() !== "") {
          let value = newValue.replace(/[^A-Za-z _'-]/gi, "");
          setLastName(value);
        }
        break;
      case EMAIL:
        if (email.length > 0 || newValue.trim() !== "") {
          setEmail(newValue);
        }
        break;
    }
  };

  const fieldEndEditingHandler = () => {
    setFirstName(firstName.trim());
    setMiddleName(middleName.trim());
    setLastName(lastName.trim());
    setEmail(email.trim());
    setDOB(dob.trim());
  };

  const validateFields = () => {
    const nameRegex = /^[A-Za-z ]{2,30}$/;
    const middleNameRegex = /^[A-Za-z ]{2,30}$/;
    const lastNameRegex = /^[A-Za-z]{2,30}$/;
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!nameRegex.test(firstName)) {
      setErrorMessage(localize("first_name_error"));
      return false;
    } else if (middleName?.length > 0 && !middleNameRegex.test(middleName)) {
      setErrorMessage(localize("middle_name_error"));
      return false;
    } else if (!lastNameRegex.test(lastName)) {
      setErrorMessage(localize("last_name_error"));
      return false;
    } else if (!emailRegex.test(email)) {
      setErrorMessage(localize("email_error"));
      return false;
    } else if (!emailRegex.test(email)) {
      setErrorMessage(localize("email_error"));
      return false;
    } else if (dob.length === 0) {
      setErrorMessage(localize("date_of_birth_error"));
      return false;
    } else if (gender === 0) {
      setErrorMessage(localize("gender_error"));
      return false;
    }
    setErrorMessage("");
    setFirstName(firstName);
    setMiddleName(middleName);
    setLastName(lastName);
    setEmail(email);
    setPhoneNumber(phoneNumber);
    setDOB(dob);
    return true;
  };

  const profilePressHandler = () => {
    setErrorMessage("");
    const options = [
      localize("take_photo"),
      localize("choose_from_gallery"),
      localize("cancel"),
    ];
    const cancelButtonIndex = 2;
    // const title = localize("");
    // const message = localize("");

    const imagePickerOptions = {
      maxWidth: Dimensions.get("window").width * 0.75,
      maxHeight: Dimensions.get("window").width * 0.5,
      // cropping: true,
      mediaType: "photo",
      includeBase64: true,
      title: localize("edit_profile_picture"),
      quality: 0.4,
    };
    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
        // title,
        // message,
      },
      index => {
        if (index === 0) {
          const cameraPermission =
            Platform.OS === "android"
              ? PERMISSIONS.ANDROID.CAMERA
              : PERMISSIONS.IOS.CAMERA;
          request(cameraPermission).then(
            requestStatus => {
              switch (requestStatus) {
                case RESULTS.GRANTED:
                  ImagePicker.launchCamera(imagePickerOptions).then(
                    imagePickerResponse => {
                      handleImagePickerResponse(imagePickerResponse, "camera");
                    },
                  );
                  break;
                case RESULTS.DENIED:
                case RESULTS.BLOCKED:
                  showMediaOptionsOpenAlert(
                    "permission",
                    localize("camera_permission_error"),
                  );
                  break;
                default:
                  break;
              }
            },
            rejectedReason => {
              console.log("Camera request permission is rejected!!");
            },
          );
        } else if (index === 1) {
          ImagePicker.launchImageLibrary(imagePickerOptions).then(
            imagePickerResponse => {
              handleImagePickerResponse(imagePickerResponse, "photos");
            },
          );
        }
      },
    );
  };

  const handleImagePickerResponse = (imagePickerResponse, type) => {
    const assets = imagePickerResponse.assets;
    const pickerErrorMessage = imagePickerResponse.errorMessage ?? "";
    const errorCode = imagePickerResponse.errorCode;
    console.log(imagePickerResponse);
    if (assets?.length > 0) {
      const image = assets[0];
      setProfilePicture({id: 1, image: image, imageUrl: null});
      setTimeout(() => {
        uploadProfilePicture(image);
      }, 500);
    } else if (errorCode?.length > 0) {
      console.log("ImagePicker error message: ", pickerErrorMessage);
      if (errorCode === "camera_unavailable") {
      } else if (errorCode === "permission") {
        showMediaOptionsOpenAlert(
          "permission",
          type === "camera"
            ? localize("camera_permission_error")
            : localize("photos_permission_error"),
        );
      }
    }
  };

  const dobPressHandler = () => {
    setErrorMessage("");
    setDatePickerVisible(true);
  };

  const confirmDatePickerHandler = date => {
    const dateString = moment(date).format("MM-DD-YYYY");
    setDOB(dateString);
    setDatePickerVisible(false);
  };

  const cancelDatePickerHandler = () => {
    setDatePickerVisible(false);
  };

  const updateButtonPressHandler = async () => {
    const isValid = validateFields();
    if (isValid) {
      updateProfile();
    } else {
      setTimeout(() => {
        scrollView.current.scrollToEnd({animated: true});
      }, 200);
    }
  };

  const updateProfile = useCallback(async () => {
    let genderType;
    switch (gender) {
      case 1:
        genderType = "M";
        break;
      case 2:
        genderType = "F";
        break;
      case 3:
        genderType = "T";
        break;
      default:
        break;
    }
    const formattedDOB = moment(dob, "MM-DD-YYYY").format("YYYY-MM-DD");
    setShowLoader(true);
    await onProfileUpdate(
      firstName,
      middleName,
      lastName,
      email,
      genderType,
      formattedDOB,
    );
    setShowLoader(false);
  }, [dob, email, firstName, gender, lastName, middleName, onProfileUpdate]);

  React.useEffect(() => {
    if (profileUpdateResponse && profileUpdateResponse.status === "success") {
      console.log(profileUpdateResponse);
      dispatch(profileActions.updateProfileName(firstName));
      setTimeout(() => {
        setShowUpdateProfileAlert(true);
        setUpdateProfileMessage(profileUpdateResponse?.data?.msg ?? "");
      }, 500);
    } else if (profileUpdateResponseError) {
      console.log(profileUpdateResponseError);
      setErrorMessage(profileUpdateResponseError);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, profileUpdateResponse, profileUpdateResponseError]);

  const uploadProfilePicture = async image => {
    const data = new FormData();
    data.append("file", {
      type: "image/jpeg", // image.type,
      uri: image.uri,
      name: image.uri.split("/").pop(),
    });
    // setShowLoader(true);
    await onUploadProfilePicture(data);
    // setShowLoader(false);
  };

  React.useEffect(() => {
    if (profilePictureResponse && profilePictureResponse.status === "success") {
      console.log(profilePictureResponse);
      setTimeout(() => {
        setSelectedImagePath(profilePicture?.image?.uri);
        setShowUpdateProfileImageAlert(true);
        setUpdateProfileImageMessage(profilePictureResponse?.data?.msg ?? "");
      }, 500);
    } else if (profilePictureResponseError) {
      console.log(profilePictureResponseError);
      setErrorMessage(profilePictureResponseError);
      setTimeout(() => {
        scrollView.current.scrollToEnd({animated: true});
      }, 200);
    }
  }, [
    profilePicture?.image?.uri,
    profilePictureResponse,
    profilePictureResponseError,
    updateProfileImageMessage,
  ]);

  const checkDocumentsPressHandler = () => {
    navigation.navigate(routes.DOCUMENTS_VERIFICATION, {
      customerType: profile.type,
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.screen}>
      <SafeAreaView style={styles.container}>
        <ScrollView ref={scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.nameContainer}>
            <Text style={styles.name}>
              {localize("hello")} {profile.firstName}!
            </Text>
            <AvatarView
              avatarSize={50}
              profile={profile}
              showShadow={true}
              onPressProfile={profilePressHandler}
              imagePath={selectedImagePath}
            />
          </View>
          <View>
            <InputField
              style={styles.field}
              autoCapitalize="sentences"
              placeholder={FIRST_NAME}
              text={firstName}
              onTextChange={newValue => {
                fieldChangeHandler(newValue, FIRST_NAME);
              }}
              onTextSubmit={() => fieldChangeHandler(firstName, FIRST_NAME)}
              maxLength={30}
              keyboardType="default"
              onEndEditing={fieldEndEditingHandler}
            />
            <InputField
              style={styles.field}
              autoCapitalize="sentences"
              placeholder={MIDDLE_NAME}
              text={middleName}
              onTextChange={newValue => {
                fieldChangeHandler(newValue, MIDDLE_NAME);
              }}
              onTextSubmit={() => fieldChangeHandler(middleName, MIDDLE_NAME)}
              maxLength={30}
              keyboardType="default"
              onEndEditing={fieldEndEditingHandler}
            />
            <InputField
              style={styles.field}
              autoCapitalize="sentences"
              placeholder={LAST_NAME}
              text={lastName}
              onTextChange={newValue => {
                fieldChangeHandler(newValue, LAST_NAME);
              }}
              onTextSubmit={() => fieldChangeHandler(lastName, LAST_NAME)}
              maxLength={30}
              keyboardType="default"
              onEndEditing={fieldEndEditingHandler}
            />
            <InputField
              style={styles.field}
              placeholder={EMAIL}
              text={email}
              onTextChange={newValue => {
                fieldChangeHandler(newValue, EMAIL);
              }}
              onTextSubmit={() => fieldChangeHandler(email, EMAIL)}
              maxLength={50}
              keyboardType="email-address"
              onEndEditing={fieldEndEditingHandler}
            />
            <TouchableWithoutFeedback onPress={dobPressHandler}>
              <View>
                <View pointerEvents="none">
                  <InputField
                    style={styles.field}
                    placeholder={DATE_OF_BIRTH}
                    text={dob}
                    onTextChange={newValue => {
                      fieldChangeHandler(newValue, DATE_OF_BIRTH);
                    }}
                    onTextSubmit={() => fieldChangeHandler(dob, DATE_OF_BIRTH)}
                    maxLength={50}
                    keyboardType="default"
                    onEndEditing={fieldEndEditingHandler}
                  />
                </View>
              </View>
            </TouchableWithoutFeedback>
            <View pointerEvents="none">
              <InputField
                style={{...styles.field, ...styles.phone}}
                placeholder={PHONE_NUMBER}
                text={phoneNumber}
                onTextChange={newValue => {
                  fieldChangeHandler(newValue, PHONE_NUMBER);
                }}
                onTextSubmit={() =>
                  fieldChangeHandler(phoneNumber, PHONE_NUMBER)
                }
                maxLength={10}
                keyboardType="phone-pad"
                onEndEditing={fieldEndEditingHandler}
                prefix="+1"
              />
            </View>
            <Text style={styles.label}>{localize("gender").toUpperCase()}</Text>
            <View style={styles.horizontalContainer}>
              <RadioButton
                title={localize("male")}
                isOn={gender === 1}
                onPress={() => setGender(1)}
              />
              <RadioButton
                title={localize("female")}
                isOn={gender === 2}
                onPress={() => setGender(2)}
              />
              <RadioButton
                title={localize("other")}
                isOn={gender === 3}
                onPress={() => setGender(3)}
              />
            </View>
            {/* <View>
              <TouchableView
                style={styles.touchContainer}
                onPress={checkDocumentsPressHandler}>
                <View style={styles.checkDocumentsView}>
                  <View style={styles.rowContainer}>
                    {profile.documentVerified === "AC" ? (
                      <Ionicons
                        style={styles.left_5}
                        name={
                          Platform.OS === "android"
                            ? "md-checkmark-circle"
                            : "ios-checkmark-circle"
                        }
                        color={colors.success}
                        size={20}
                      />
                    ) : profile.documentVerified === "NU" ? (
                      <MaterialIcons
                        style={styles.left_5}
                        name="error"
                        color={colors.error}
                        size={20}
                      />
                    ) : (
                      <FontAwesome
                        style={styles.left_5}
                        name="question-circle"
                        color={colors.yellow}
                        size={20}
                      />
                    )}
                    <Text style={styles.checkDocumentsText}>
                      {localize("kyc_documents")}
                    </Text>
                  </View>
                  <Feather
                    name="chevron-right"
                    color={colors.textPrimary}
                    size={20}
                  />
                </View>
              </TouchableView>
            </View> */}
            {errorMessage ? (
              <View style={styles.elementsContainer}>
                <ErrorText error={errorMessage} />
              </View>
            ) : null}
          </View>
        </ScrollView>
        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          onConfirm={confirmDatePickerHandler}
          onCancel={cancelDatePickerHandler}
          date={
            dob.length > 0
              ? moment(dob, "MM-DD-YYYY").toDate()
              : moment(new Date())
                  .add(constants.MAX_DATE_OF_BIRTH, "years")
                  .toDate()
          }
          headerTextIOS={DATE_OF_BIRTH}
          minimumDate={moment(new Date())
            .add(constants.MIN_DATE_OF_BIRTH, "years")
            .toDate()}
          maximumDate={moment(new Date())
            .add(constants.MAX_DATE_OF_BIRTH, "years")
            .toDate()}
        />
        <View style={styles.buttonContainer}>
          <RoundButton
            style={styles.button}
            title={localize("update").toUpperCase()}
            onPress={updateButtonPressHandler}
          />
        </View>
        <Loader show={showLoader} />
        <PopupAlert
          show={showUpdateProfileAlert}
          title={localize("success")}
          message={updateProfileMessage}
          showOk
          onOkButtonPress={() => {
            setShowUpdateProfileAlert(false);
            navigation.navigate(routes.TRANSACTIONS);
          }}
        />
        <PopupAlert
          show={showUpdateProfileImageAlert}
          title={localize("success")}
          message={updateProfileImageMessage}
          showOk
          onOkButtonPress={() => {
            setShowUpdateProfileImageAlert(false);
          }}
        />
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "white",
  },
  container: {
    flex: 1,
    marginHorizontal: 16,
    justifyContent: "space-between",
    height: "100%",
  },
  field: {
    marginTop: 16,
  },
  elementsContainer: {
    marginTop: 16,
  },
  nameContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.largeHeaderTitle,
    color: colors.textPrimary,
  },
  label: {
    marginTop: 16,
    fontSize: fontSizes.body_tiny,
    fontFamily: fonts.bold,
    color: colors.field,
  },
  horizontalContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  buttonContainer: {
    marginVertical: 16,
    height: 50,
  },
  button: {
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  nonEditableField: {
    backgroundColor: colors.fade,
  },
  touchContainer: {
    marginTop: 8,
    height: 45,
  },
  checkDocumentsView: {
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  checkDocumentsText: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: fontSizes.header,
  },
  rowContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  left_5: {
    marginRight: 5,
    marginTop: 1,
  },
});

export default SignupScreen;
