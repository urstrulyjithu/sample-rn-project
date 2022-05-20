import apiClient from "../../api/bookingsAPIClient";
import * as endPoints from "../../constants/end-points";

import Vehicle from "../../models/vehicle";
import FeedbackOption from "../../models/feedbackOption";
import TicketCategory from "../../models/ticketCategory";
import ServiceType from "../../models/serviceType";

export const GET_PRODUCT_TYPES = "GET_PRODUCT_TYPES";
export const GET_VEHICLE_TYPES = "GET_VEHICLE_TYPES";
export const GET_FEEDBACK_OPTIONS = "GET_FEEDBACK_OPTIONS";
export const GET_TICKET_CATEGORIES = "GET_TICKET_CATEGORIES";
export const GET_SERVICE_TYPES = "GET_SERVICE_TYPES";

export const getMasterData = () => {
  return async dispatch => {
    try {
      let requests = [];
      requests.push(
        apiClient.get(endPoints.GET_PRODUCT_TYPES, {
          data: null,
        }),
      );
      requests.push(
        apiClient.get(endPoints.GET_VEHICLE_TYPES, {
          data: null,
        }),
      );
      requests.push(
        apiClient.get(endPoints.GET_FEEDBACK_OPTIONS, {
          data: null,
        }),
      );
      requests.push(
        apiClient.get(endPoints.GET_TICKET_TYPES, {
          data: null,
        }),
      );
      requests.push(
        apiClient.get(endPoints.GET_SERVICE_TYPES, {
          data: null,
        }),
      );
      const responses = await Promise.all(requests);
      if (responses.length > 3) {
        const productTypesData = responses[0].data.data;
        const vehiclesData = responses[1].data.data;
        const feedbackOptionsData = responses[2].data.data;
        const ticketCategoriesData = responses[3].data.data;
        const serviceTypesData = responses[4].data.data;
        let productTypes = [];
        let vehicles = [];
        let feedbackOptions = [];
        let ticketCategories = [];
        let serviceTypes = [];
        for (const type in productTypesData) {
          productTypes.push(type);
        }
        for (const vehicleData of vehiclesData) {
          const vehicle = new Vehicle(
            vehicleData.vehicleTypeId,
            vehicleData.vehicleTypeName,
            vehicleData.wheelerType,
            vehicleData.isVehicleActive,
            vehicleData.maxWeight,
            vehicleData.vehicleDimensions,
          );
          vehicles.push(vehicle);
        }
        if (feedbackOptionsData.length > 0) {
          const staringData = feedbackOptionsData[0].staring;
          for (const feedbackOptionData of staringData) {
            const option = new FeedbackOption(
              feedbackOptionData.star,
              feedbackOptionData.title,
              feedbackOptionData.options,
            );
            feedbackOptions.push(option);
          }
        }
        for (const ticketData of ticketCategoriesData) {
          const ticketCategory = new TicketCategory(
            ticketData.id,
            ticketData.name,
            ticketData.color,
          );
          ticketCategories.push(ticketCategory);
        }
        for (const serviceTypeData of serviceTypesData) {
          const serviceType = new ServiceType(
            serviceTypeData.serviceTypeId,
            serviceTypeData.serviceTypeName,
            serviceTypeData.serviceTypeDescription,
            serviceTypeData.insuranceMandatory,
            serviceTypeData.isActive,
          );
          serviceTypes.push(serviceType);
        }

        console.log(
          productTypes,
          "\n\n",
          vehicles,
          "\n\n",
          feedbackOptions,
          "\n\n",
          ticketCategories,
          "\n\n",
          serviceTypes,
        );
        dispatch({type: GET_PRODUCT_TYPES, payload: productTypes});
        dispatch({type: GET_VEHICLE_TYPES, payload: vehicles});
        dispatch({type: GET_FEEDBACK_OPTIONS, payload: feedbackOptions});
        dispatch({type: GET_TICKET_CATEGORIES, payload: ticketCategories});
        dispatch({type: GET_SERVICE_TYPES, payload: serviceTypes});
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
