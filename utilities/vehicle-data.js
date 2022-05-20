import {localize} from "../translations/localized";

export const vehicleData = (vehicleTypes, vehicleTypeId) => {
  const vehicleType = vehicleTypes?.find(
    type => type.vehicleTypeId === vehicleTypeId,
  );

  let imagePath = null;
  let attributes = [];
  switch (vehicleTypeId) {
    case 1:
      imagePath = require("../assets/images/icon-bike.png");
      attributes = [
        localize("time_sensitive"),
        localize("mandatory_insurance"),
        localize("instant_pick_drop"),
      ];
      break;
    case 2:
      imagePath = require("../assets/images/icon-auto.png");
      attributes = [
        localize("large_item"),
        localize("transport_SUV"),
        localize("mandatory_insurance"),
        localize("doorstep_delivery"),
      ];
      break;
    case 3:
      imagePath = require("../assets/images/icon-car.png");
      attributes = [
        localize("require_attention"),
        localize("handle_care"),
        localize("mandatory_insurance"),
        localize("doorstep_delivery"),
      ];
      break;
    case 4:
      imagePath = require("../assets/images/icon-scooter.png");
      attributes = [
        localize("lower_price"),
        localize("approximate_time"),
        localize("optional_insurance"),
        localize("door_step_delivery"),
      ];
      break;
    case 5:
      attributes = [
        localize("lowest_fare"),
        localize("no_time_limits"),
        localize("optional_insurance"),
        localize("door_step_delivery"),
      ];
      imagePath = require("../assets/images/icon-mini-truck.png");
      break;
    case 6:
      imagePath = require("../assets/images/icon-luggage-auto.png");
      break;
    default:
      imagePath = require("../assets/images/icon-person.png");
      break;
  }
  return {
    wheelerType: vehicleType.wheelerType,
    imagePath: imagePath,
    attributes,
  };
};
