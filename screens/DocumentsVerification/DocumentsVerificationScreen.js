import React, {useState, useCallback} from "react";
import {
  View,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Alert,
  BackHandler,
} from "react-native";
import {useSelector, useDispatch} from "react-redux";

import {localize} from "../../translations/localized";
import LeftArrow from "../../components/UI/HeaderButtons/LeftArrow";
import * as routes from "../../navigation/routes/app-routes";
import * as constants from "../../constants/general";
import DocumentTypeCard from "../../components/DocumentsVerification/DocumentTypeCard";
import useDocuments from "../../api/documentsVerification/documents";
import Loader from "../../components/UI/Loading/Loader";
import * as profileActions from "../../redux/actions/profile";
import Profile from "../../models/profile";
import PopupAlert from "../../components/UI/Alert/PopupAlert";

const DocumentsVerificationScreen = ({route, navigation}) => {
  const {customerType} = route.params;
  const [showLoader, setShowLoader] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [documentTypes, setDocumentTypes] = useState([]);
  const [onGetDocuments, response, responseError] = useDocuments();
  const profile = Profile.class(useSelector(state => state.getProfile.profile));
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: localize("kyc_documents"),
      headerLeft: () => (
        <LeftArrow
          onPress={() => {
            navigation.popToTop();
          }}
        />
      ),
    });
    getDocuments();
  }, [navigation, getDocuments]);

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

  const getDocuments = useCallback(async () => {
    setShowLoader(true);
    await onGetDocuments(customerType);
  }, [onGetDocuments, customerType]);

  const dispatch = useDispatch();

  React.useEffect(() => {
    const focusSubscription = navigation.addListener("focus", getData);
    return focusSubscription;
  }, [navigation, getData]);

  const getData = useCallback(async () => {
    setErrorMessage(null);
    setShowLoader(true);
    try {
      await dispatch(profileActions.getProfile());
      setShowLoader(false);
    } catch (error) {
      setErrorMessage(error.message);
      setShowLoader(false);
    }
  }, [dispatch, setShowLoader, setErrorMessage]);

  React.useEffect(() => {
    if (response && response.status === "success") {
      setDocumentTypes(response?.data?.documentCategory ?? []);
      console.log(response);
      setTimeout(() => {
        setShowLoader(false);
      }, 500);
    } else if (responseError) {
      console.log(responseError);
      setErrorMessage(responseError);
      setTimeout(() => {
        setShowLoader(false);
        setShowAlert(true);
        setAlertMessage(responseError);
      }, 500);
    }
  }, [response, responseError]);

  const documentClickHandler = document => {
    if (document.id === constants.ADDRESS_PROOF_ID) {
      navigation.navigate(routes.VERIFY_ADDRESS_DOCUMENTS, {
        document: document,
      });
    } else if (document.id === constants.IDENTITY_PROOF_ID) {
      navigation.navigate(routes.ADD_DOCUMENTS, {document: document});
    }
  };

  const getDocumentStatus = index => {
    const documentDetails = profile?.documents?.find(
      doc => doc.id === index + 1,
    );
    return documentDetails?.documentStatus ?? "";
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.mainContainer}>
        <FlatList
          data={documentTypes}
          keyExtractor={(item, index) => `${item.id}`}
          renderItem={({item, index}) => {
            return (
              <DocumentTypeCard
                status={getDocumentStatus(index)}
                item={item}
                index={index}
                onDocumentClick={() => documentClickHandler(item)}
              />
            );
          }}
        />
        <Loader show={showLoader} />
        <PopupAlert
          show={showAlert}
          title={localize("error")}
          message={alertMessage}
          showOk
          onOkButtonPress={() => {
            setShowAlert(false);
          }}
        />
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  mainContainer: {
    flex: 2,
    backgroundColor: "white",
  },
});

export default DocumentsVerificationScreen;
