import React, {useState, useRef, useCallback} from "react";
import {
  View,
  FlatList,
  SafeAreaView,
  Dimensions,
  StyleSheet,
  Text,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import * as ImagePicker from "react-native-image-picker";
import {useDispatch, useSelector} from "react-redux";
import {useActionSheet} from "@expo/react-native-action-sheet";
import {request, PERMISSIONS, RESULTS} from "react-native-permissions";

import {localize} from "../../translations/localized";
import colors from "../../constants/colors";
import * as constants from "../../constants/general";
import LeftArrow from "../../components/UI/HeaderButtons/LeftArrow";
import DocumentCard from "../../components/DocumentsVerification/DocumentCard";
import RoundButton from "../../components/UI/Buttons/RoundButton";
import Loader from "../../components/UI/Loading/Loader";
import useUploadIdentityDocuments from "../../api/documentsVerification/uploadIdentityDocuments";
import fonts from "../../constants/fonts";
import fontSizes from "../../constants/font-sizes";
import InputField from "../../components/UI/Inputs/InputField";
import ErrorText from "../../components/UI/Texts/ErrorText";
import Profile from "../../models/profile";
import PopupAlert from "../../components/UI/Alert/PopupAlert";
import * as routes from "../../navigation/routes/app-routes";
import * as creditCardActions from "../../redux/actions/credit-cards";
import {showMediaOptionsOpenAlert} from "../../services/open-settings";

const AddDocumentsScreen = ({route, navigation}) => {
  const scrollView = useRef();
  const {document} = route.params;
  const addressProof = document.id === constants.ADDRESS_PROOF_ID;
  const identityProof = document.id === constants.IDENTITY_PROOF_ID;
  const [images, setImages] = useState([{id: 0, image: null, imageUrl: null}]);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [showLoader, setShowLoader] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [
    onUploadIdentityDocuments,
    response,
    responseError,
  ] = useUploadIdentityDocuments();

  const REFERENCE_NUMBER = localize("reference_number");
  const MAX_REFERENCE_NUMBER_LENGTH = 42;

  const profile = Profile.class(useSelector(state => state.getProfile.profile));
  const documentDetails = profile?.documents?.find(
    doc => doc.id === constants.IDENTITY_PROOF_ID,
  );
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
  const dispatch = useDispatch();
  const cards = useSelector(state => state.cards.cards);
  const {showActionSheetWithOptions} = useActionSheet();

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
    console.log("documentDetails", documentDetails);
    if (
      (documentDetails?.documentPath?.img1 ?? "") !== "" &&
      (documentDetails?.documentPath?.img2 ?? "") !== ""
    ) {
      setImages([
        {id: 1, image: null, imageUrl: documentDetails?.documentPath?.img1},
        {id: 2, image: null, imageUrl: documentDetails?.documentPath?.img2},
      ]);
    } else if ((documentDetails?.documentPath?.img1 ?? "") !== "") {
      setImages([
        {id: 1, image: null, imageUrl: documentDetails?.documentPath?.img1},
      ]);
    } else if ((documentDetails?.documentPath?.img2 ?? "") !== "") {
      setImages([
        {id: 1, image: null, imageUrl: documentDetails?.documentPath?.img2},
      ]);
    }
    setReferenceNumber(documentDetails?.details?.referenceNumber ?? "");
  }, [
    documentDetails,
    documentDetails?.details?.referenceNumber,
    documentDetails?.documentPath?.img1,
    documentDetails?.documentPath?.img2,
    profile.documents,
  ]);

  React.useEffect(() => {
    getData();
  }, [getData]);

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
    if (response && response.status === "success") {
      console.log(response);
      setShowLoader(false);
      setTimeout(() => {
        setImages([{id: 0, image: null, imageUrl: null}]);
        setShowUploadDocumentsAlert(true);
        setUploadDocumentsMessage(response.data?.msg ?? "");
      }, 500);
    } else if (responseError) {
      console.log(responseError);
      setErrorMessage(responseError);
      setShowLoader(false);
      setTimeout(() => {
        setShowUploadDocumentsErrorAlert(true);
        setUploadDocumentsErrorMessage(responseError);
      }, 500);
    }
  }, [navigation, response, responseError]);

  const fieldChangeHandler = (newValue, field) => {
    setErrorMessage("");
    switch (field) {
      case REFERENCE_NUMBER:
        if (referenceNumber.length > 0 || newValue.trim() !== "") {
          let value = newValue.replace(/[^A-Za-z0-9- ]/gi, "");
          setReferenceNumber(value);
        }
        break;
    }
  };

  const fieldEndEditingHandler = () => {
    setReferenceNumber(referenceNumber.trim());
  };

  const validateFields = () => {
    if (
      referenceNumber.length <= 3 ||
      referenceNumber.length > MAX_REFERENCE_NUMBER_LENGTH
    ) {
      setErrorMessage(localize("reference_number_error"));
      return false;
    }
    setErrorMessage("");
    setReferenceNumber(referenceNumber);
    return true;
  };

  const openImagePicker = async item => {
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
      openImagePicker(item);
    } else {
      const addUpload = images.some(image => image.id === 0);
      if (!addUpload) {
        const newImages = images.filter(image => image.id !== item.id);
        setImages([...newImages, {id: 0, imageUrl: null, image: null}]);
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
          uri: image.uri,
          name: image.uri.split("/").pop(),
        };
        data.append("file[]", newFile);
      }
    }
    data.append("documentCategoryId", document.id);
    data.append("referenceNumber", referenceNumber);
    setShowLoader(true);
    await onUploadIdentityDocuments(data);
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
        disabled={item.uri?.length > 0 ?? false}
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
              placeholder={REFERENCE_NUMBER}
              text={referenceNumber}
              onTextChange={newValue => {
                fieldChangeHandler(newValue, REFERENCE_NUMBER);
              }}
              onTextSubmit={() =>
                fieldChangeHandler(referenceNumber, REFERENCE_NUMBER)
              }
              maxLength={MAX_REFERENCE_NUMBER_LENGTH}
              keyboardType={
                Platform.OS === "ios" ? "default" : "visible-password"
              }
              onEndEditing={fieldEndEditingHandler}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            {errorMessage ? (
              <View style={styles.elementsContainer}>
                <ErrorText error={errorMessage} />
              </View>
            ) : null}
          </View>
        </ScrollView>
        {(documentDetails?.documentStatus ?? "") === "NU" ? (
          <View style={styles.buttonContainer}>
            <RoundButton
              style={styles.button}
              title={localize("submit").toUpperCase()}
              onPress={submitButtonPressHandler}
            />
          </View>
        ) : (documentDetails?.documentStatus ?? "") === "U" ? (
          <View style={styles.buttonContainer}>
            <Text style={{...styles.message, ...styles.centerText}}>
              {localize("kyc_delay_message")}
            </Text>
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
            if (cards?.length > 0) {
              navigation.pop();
            } else {
              navigation.navigate(routes.ADD_NEW_CARD, {
                fromRoute: routes.ADD_DOCUMENTS,
                bookingId: null,
              });
            }
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
    marginBottom: 20,
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
  centerText: {
    textAlign: "center",
  },
});

export default AddDocumentsScreen;
