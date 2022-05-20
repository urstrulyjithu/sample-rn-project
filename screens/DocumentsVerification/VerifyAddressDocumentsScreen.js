import React, {useState, useRef} from "react";
import {
  View,
  FlatList,
  SafeAreaView,
  Dimensions,
  StyleSheet,
  Alert,
  Text,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import * as ImagePicker from "react-native-image-picker";
import DropDownPicker from "react-native-dropdown-picker";
import {useSelector} from "react-redux";
import {useActionSheet} from "@expo/react-native-action-sheet";
import {request, PERMISSIONS, RESULTS} from "react-native-permissions";

import {localize} from "../../translations/localized";
import colors from "../../constants/colors";
import * as constants from "../../constants/general";
import LeftArrow from "../../components/UI/HeaderButtons/LeftArrow";
import DocumentCard from "../../components/DocumentsVerification/DocumentCard";
import RoundButton from "../../components/UI/Buttons/RoundButton";
import Loader from "../../components/UI/Loading/Loader";
import useUploadAddressProofDocuments from "../../api/documentsVerification/uploadAddressDocuments";
import fonts from "../../constants/fonts";
import fontSizes from "../../constants/font-sizes";
import InputField from "../../components/UI/Inputs/InputField";
import ErrorText from "../../components/UI/Texts/ErrorText";
import Profile from "../../models/profile";
import PopupAlert from "../../components/UI/Alert/PopupAlert";
import {showMediaOptionsOpenAlert} from "../../services/open-settings";

const width = Dimensions.get("window").width;

const VerifyAddressDocumentsScreen = ({route, navigation}) => {
  const scrollView = useRef();
  const {document} = route.params;
  const addressProof = document.id === constants.ADDRESS_PROOF_ID;
  const identityProof = document.id === constants.IDENTITY_PROOF_ID;
  const [images, setImages] = useState([{id: 0, imageUrl: null, image: null}]);
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [showLoader, setShowLoader] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [
    onUploadAddressProofDocuments,
    response,
    responseError,
  ] = useUploadAddressProofDocuments();
  const [showUploadDocumentsAlert, setShowUploadDocumentsAlert] = useState(
    false,
  );
  const [uploadDocumentsMessage, setUploadDocumentsMessage] = useState("");
  const [
    showUploadDocumentsErrorAlert,
    setShowUploadDocumentsErrorAlert,
  ] = useState(false);
  const [
    uploadDocumentsErrorMessage,
    setUploadDocumentsErrorMessage,
  ] = useState("");
  const {showActionSheetWithOptions} = useActionSheet();

  const ADDRESS_LINE_1 = localize("address_line_1");
  const ADDRESS_LINE_2 = localize("address_line_2");
  const CITY = localize("city");
  const POSTAL_CODE = localize("postal_code");

  const MIN_CITY_LENGTH = 3;
  const MAX_CITY_LENGTH = 42;
  const MAX_POSTAL_CODE_LENGTH = 6;

  let provinces = {};
  if (constants.PROVINCES.length > 0) {
    provinces = constants.PROVINCES.map(type => {
      return {label: type, value: type};
    });
  }

  let pickerController;

  const profile = Profile.class(useSelector(state => state.getProfile.profile));
  const documentDetails = profile?.documents?.find(
    doc => doc.id === constants.ADDRESS_PROOF_ID,
  );

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: document.name,
      headerLeft: () => (
        <LeftArrow
          onPress={() => {
            navigation.pop();
          }}
        />
      ),
    });
  }, [navigation, document]);

  React.useEffect(() => {
    if (
      (documentDetails?.documentPath?.img1 ?? "") !== "" &&
      (documentDetails?.documentPath?.img2 ?? "") !== ""
    ) {
      setImages([
        {
          id: 1,
          image: null,
          imageUrl: documentDetails?.documentPath?.img1,
        },
        {
          id: 2,
          image: null,
          imageUrl: documentDetails?.documentPath?.img2,
        },
      ]);
    } else if ((documentDetails?.documentPath?.img1 ?? "") !== "") {
      setImages([
        {
          id: 1,
          image: null,
          imageUrl: documentDetails?.documentPath?.img1,
        },
      ]);
    } else if ((documentDetails?.documentPath?.img2 ?? "") !== "") {
      setImages([
        {
          id: 1,
          image: null,
          imageUrl: documentDetails?.documentPath?.img2,
        },
      ]);
    }
    setAddressLine1(documentDetails?.details?.addressLine1 ?? "");
    setAddressLine2(documentDetails?.details?.addressLine2 ?? "");
    setCity(documentDetails?.details?.city ?? "");
    pickerController.selectItem(documentDetails?.details?.province ?? "");
    setPostalCode(documentDetails?.details?.postalCode ?? "");
  }, [
    documentDetails?.details?.addressLine1,
    documentDetails?.details?.addressLine2,
    documentDetails?.details?.city,
    documentDetails?.details?.postalCode,
    documentDetails?.details?.province,
    documentDetails?.documentPath?.img1,
    documentDetails?.documentPath?.img2,
    pickerController,
  ]);

  React.useEffect(() => {
    if (response && response.status === "success") {
      console.log(response);
      setShowLoader(false);
      setTimeout(() => {
        setShowUploadDocumentsAlert(true);
        setUploadDocumentsMessage(response.data?.msg ?? "");
      }, 500);
    } else if (responseError) {
      console.log(responseError);
      setShowLoader(false);
      setErrorMessage(responseError);
      setTimeout(() => {
        setShowUploadDocumentsErrorAlert(true);
        setUploadDocumentsErrorMessage(responseError);
      }, 500);
    }
  }, [navigation, response, responseError]);

  const fieldChangeHandler = (newValue, field) => {
    setErrorMessage("");
    switch (field) {
      case ADDRESS_LINE_1:
        if (addressLine1.length > 0 || newValue.trim() !== "") {
          setAddressLine1(newValue);
        }
        break;
      case ADDRESS_LINE_2:
        if (addressLine2.length > 0 || newValue.trim() !== "") {
          setAddressLine2(newValue);
        }
        break;
      case CITY:
        if (city.length > 0 || newValue.trim() !== "") {
          let value = newValue.replace(/[^A-Za-z _'-]/gi, "");
          setCity(value);
        }
        break;
      case POSTAL_CODE:
        if (postalCode.length > 0 || newValue.trim() !== "") {
          let value = newValue.replace(/[^A-Za-z0-9]/gi, "");
          setPostalCode(value);
        }
        break;
    }
  };

  const fieldEndEditingHandler = () => {
    setAddressLine1(addressLine1.trim());
    setAddressLine2(addressLine2.trim());
    setCity(city.trim());
    setPostalCode(postalCode.trim());
  };

  const validateFields = () => {
    const cityRegex = /^[A-Za-z ]{5,42}$/;
    const postalCodeRegex = /^[A-Z0-9]{5,6}$/;
    if (
      addressLine1.length < MIN_CITY_LENGTH ||
      addressLine1.length > MAX_CITY_LENGTH
    ) {
      setErrorMessage(localize("address_line_1_error"));
      return false;
    } else if (
      addressLine2.length < MIN_CITY_LENGTH ||
      addressLine2.length > MAX_CITY_LENGTH
    ) {
      setErrorMessage(localize("address_line_2_error"));
      return false;
    } else if (!cityRegex.test(city)) {
      setErrorMessage(localize("city_error"));
      return false;
    } else if (!cityRegex.test(province)) {
      setErrorMessage(localize("province_error"));
      return false;
    } else if (!postalCodeRegex.test(postalCode)) {
      setErrorMessage(localize("postal_code_error"));
      return false;
    }
    setErrorMessage("");
    setAddressLine1(addressLine1);
    setAddressLine2(addressLine2);
    setCity(city);
    setProvince(province);
    setPostalCode(postalCode);
    return true;
  };

  const openImagePicker = item => {
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
      title: localize("edit_document"),
      quality: 0.4,
      cameraType: "back",
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
    if (assets.length > 0) {
      const image = assets[0];
      const id = images[0].id;
      if (images.length < constants.MAX_DOCUMENTS) {
        setImages([{id: id + 1, image: image}, ...images]);
      } else if (images.length === constants.MAX_DOCUMENTS) {
        const newImages = images.filter(newImage => newImage.id !== 0);
        setImages([{id: id + 1, image: image}, ...newImages]);
      }
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

  const documentClickHandler = item => {
    if (item.id === 0) {
      setErrorMessage("");
      openImagePicker(item);
    } else {
      const addUpload = images.some(image => image.id === 0);
      if (!addUpload) {
        const newImages = images.filter(image => image.id !== item.id);
        setImages([...newImages, {id: 0, image: null, imageUrl: null}]);
      } else {
        const newImages = images.filter(image => image.id !== item.id);
        setImages(newImages);
      }
    }
  };

  const uploadDocuments = async () => {
    const data = new FormData();
    for (const key in images) {
      const image = images[key].image;
      if (image !== null) {
        const newFile = {
          type: "image/jpeg", // image.type,
          uri: image.path,
          name: image.path.split("/").pop(),
        };
        data.append("file[]", newFile);
      }
    }
    data.append("documentCategoryId", document.id);
    data.append("addressLine1", addressLine1);
    data.append("addressLine2", addressLine2);
    data.append("city", city);
    data.append("province", province);
    data.append("postalCode", postalCode);
    setShowLoader(true);
    await onUploadAddressProofDocuments(data);
  };

  const submitButtonPressHandler = () => {
    if (images.length === 1 && images[0].id === 0) {
      setErrorMessage(localize("no_proof_documents_message"));
    } else {
      const isValid = validateFields();
      if (isValid) {
        uploadDocuments();
      } else {
        setTimeout(() => {
          scrollView.current.scrollToEnd({animated: true});
        }, 200);
      }
    }
  };

  const renderItem = item => {
    return (
      <DocumentCard
        item={item}
        onDocumentClick={() => documentClickHandler(item)}
        disabled={item.imageUrl?.length > 0 ?? false}
      />
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.screen}>
      <SafeAreaView style={styles.container}>
        <ScrollView ref={scrollView} showsVerticalScrollIndicator={false}>
          <View
            style={styles.fieldsContent}
            pointerEvents={
              (documentDetails?.documentStatus ?? "") === "NU" ? "auto" : "none"
            }>
            {addressProof ? (
              <Text style={styles.message}>
                {localize("address_proof_message")}
              </Text>
            ) : null}
            {identityProof ? (
              <Text style={styles.message}>
                {localize("identity_proof_message")}
              </Text>
            ) : null}
            {documentDetails?.documentStatus === "U" ? (
              <Text style={{...styles.message, ...styles.yellowText}}>
                {localize("verification_pending")}
              </Text>
            ) : documentDetails?.documentStatus === "A" ? (
              <Text style={{...styles.message, ...styles.greenText}}>
                {localize("verified")}
              </Text>
            ) : null}
            <FlatList
              scrollEnabled={false}
              style={styles.list}
              numColumns={2}
              data={images}
              keyExtractor={(item, index) => item.id}
              renderItem={({item, index}) => renderItem(item)}
            />
            <InputField
              style={styles.field}
              autoCapitalize="sentences"
              placeholder={ADDRESS_LINE_1}
              text={addressLine1}
              onTextChange={newValue => {
                fieldChangeHandler(newValue, ADDRESS_LINE_1);
              }}
              onTextSubmit={() =>
                fieldChangeHandler(addressLine1, ADDRESS_LINE_1)
              }
              maxLength={MAX_CITY_LENGTH}
              keyboardType="default"
              onEndEditing={fieldEndEditingHandler}
            />
            <InputField
              style={styles.field}
              autoCapitalize="sentences"
              placeholder={ADDRESS_LINE_2}
              text={addressLine2}
              onTextChange={newValue => {
                fieldChangeHandler(newValue, ADDRESS_LINE_2);
              }}
              onTextSubmit={() =>
                fieldChangeHandler(addressLine2, ADDRESS_LINE_2)
              }
              maxLength={MAX_CITY_LENGTH}
              keyboardType="default"
              onEndEditing={fieldEndEditingHandler}
            />
            <InputField
              style={styles.field}
              autoCapitalize="sentences"
              placeholder={CITY}
              text={city}
              onTextChange={newValue => {
                fieldChangeHandler(newValue, CITY);
              }}
              onTextSubmit={() => fieldChangeHandler(city, CITY)}
              maxLength={MAX_CITY_LENGTH}
              keyboardType="default"
              onEndEditing={fieldEndEditingHandler}
            />
            <View style={styles.provinceContainer}>
              {province.length > 0 ? (
                <Text style={styles.label}>
                  {localize("province").toUpperCase()}
                </Text>
              ) : null}
            </View>
            <View style={Platform.OS === "ios" ? styles.pickerContainer : null}>
              <DropDownPicker
                controller={instance => (pickerController = instance)}
                items={provinces}
                style={styles.picker}
                containerStyle={Platform.OS === "ios" ? styles.picker : null}
                placeholder={localize("province")}
                placeholderStyle={{...styles.titleText, color: colors.fade}}
                arrowSize={25}
                arrowColor={colors.fade}
                labelStyle={{...styles.titleText, ...styles.dropDownText}}
                defaultValue={province}
                onChangeItem={item => {
                  setProvince(item.value);
                }}
                dropDownStyle={styles.dropDown}
              />
            </View>
            <InputField
              style={styles.field}
              placeholder={POSTAL_CODE}
              text={postalCode}
              onTextChange={newValue => {
                fieldChangeHandler(newValue, POSTAL_CODE);
              }}
              onTextSubmit={() => fieldChangeHandler(postalCode, POSTAL_CODE)}
              maxLength={MAX_POSTAL_CODE_LENGTH}
              keyboardType={
                Platform.OS === "ios" ? "default" : "visible-password"
              }
              onEndEditing={fieldEndEditingHandler}
              autoCapitalize="characters"
              autoCorrect={false}
            />
          </View>
          {errorMessage ? (
            <View style={styles.elementsContainer}>
              <ErrorText error={errorMessage} />
            </View>
          ) : null}
        </ScrollView>
        {(documentDetails?.documentStatus ?? "") === "NU" ? (
          <View style={styles.buttonContainer}>
            <RoundButton
              style={styles.button}
              title={localize("submit").toUpperCase()}
              onPress={submitButtonPressHandler}
            />
          </View>
        ) : null}
        <Loader show={showLoader} />
        <PopupAlert
          show={showUploadDocumentsAlert}
          title={localize("success")}
          message={uploadDocumentsMessage}
          showOk
          onOkButtonPress={() => {
            setShowUploadDocumentsAlert(false);
            navigation.pop();
          }}
        />
        <PopupAlert
          show={showUploadDocumentsErrorAlert}
          title={localize("error")}
          message={uploadDocumentsErrorMessage}
          showOk
          onOkButtonPress={() => {
            setShowUploadDocumentsErrorAlert(false);
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
    justifyContent: "space-between",
    height: "100%",
  },
  list: {
    marginTop: 8,
  },
  fieldsContent: {
    marginHorizontal: 16,
  },
  message: {
    marginTop: 12,
    marginBottom: 16,
    color: colors.textPrimary,
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.body_semi_medium,
  },
  field: {
    marginTop: 16,
  },
  pickerContainer: {
    zIndex: 1,
  },
  picker: {
    height: 50,
  },
  dropDown: {
    marginTop: 4,
  },
  dropDownText: {
    paddingVertical: 2,
  },
  titleText: {
    color: colors.textPrimary,
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.body_semi_medium,
  },
  provinceContainer: {
    marginTop: 16,
  },
  label: {
    fontSize: fontSizes.body_tiny,
    fontFamily: fonts.bold,
    color: colors.field,
    marginBottom: 7,
  },
  elementsContainer: {
    marginTop: 20,
  },
  buttonContainer: {
    margin: 16,
    height: 50,
  },
  button: {
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  yellowText: {
    color: colors.yellow,
    marginTop: 0,
    marginBottom: 0,
    textAlign: "right",
  },
  greenText: {
    color: colors.success,
    marginTop: 0,
    marginBottom: 0,
    textAlign: "right",
  },
});

export default VerifyAddressDocumentsScreen;
