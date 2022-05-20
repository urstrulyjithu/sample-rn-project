import Profile from "../../models/profile";
import ProfileDocument from "../../models/profileDocument";

import apiClient from "../../api/apiClient";
import * as endPoints from "../../constants/end-points";

export const GET_PROFILE = "GET_PROFILE";
export const REMOVE_PROFILE = "REMOVE_PROFILE";
export const UPDATE_PROFILE_NAME = "UPDATE_PROFILE_NAME";

export const getProfile = () => {
  return async (dispatch) => {
    try {
      const response = await apiClient.post(endPoints.GET_PROFILE, {
        data: null,
      });
      if (response.data.status === "success") {
        const profileData = response.data.data;
        let documents = [];
        for (document of profileData.documents) {
          documents.push(
            new ProfileDocument(
              document.id,
              document.name,
              document.customerDocumentID,
              document.documentStatus,
              document.documentPath,
              document.details,
            ),
          );
        }
        const profile = new Profile(
          profileData.customerDetailId,
          profileData.customerMobileNumber,
          profileData.customerEmail,
          profileData.customerFirstName,
          profileData.customerLastName,
          profileData.customerMiddleName,
          profileData.customerType,
          profileData.gender,
          profileData.customerStatus,
          profileData.isVerified,
          profileData.countryCode,
          profileData.documentVerified,
          profileData.dateOfBirth,
          profileData.profileImagePath,
          profileData.documents,
          profileData.countryName,
          profileData.isdCode,
          profileData.currencyCode,
          profileData.currencyName,
          profileData.currencySymbol,
          profileData.successfulDeliveries,
          profileData.reducedCarbon,
        );
        dispatch({type: GET_PROFILE, payload: profile});
      }
    } catch (error) {
      const status = error?.response?.status ?? 0;
      switch (status) {
        case 400:
        case 401:
        case 408:
          let message =
            error.response.data?.trace?.msg ?? "Something went wrong";
          throw new Error(message);
        case 500:
          message = error.response.data?.trace?.error ?? "Something went wrong";
          throw new Error(message);
        default:
          throw new Error("Something went wrong");
      }
    }
  };
};

export const removeProfile = () => {
  return {
    type: REMOVE_PROFILE,
  };
};

export const updateProfileName = (name) => {
  return {
    type: UPDATE_PROFILE_NAME,
    payload: name,
  };
};
