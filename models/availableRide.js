class AvailableRide {
  constructor(
    currencyCode = "",
    currencySymbol = "",
    distance = 0,
    duration = 0,
    estimate = "",
    highEstimate = 0,
    lowEstimate = 0,
    priceId = "",
    vehicleDisplayName = "",
    serviceTypeId = 0,
    serviceTypeName = "",
  ) {
    this.currencyCode = currencyCode;
    this.currencySymbol = currencySymbol;
    this.distance = distance;
    this.duration = duration;
    this.estimate = estimate;
    this.highEstimate = highEstimate;
    this.lowEstimate = lowEstimate;
    this.priceId = priceId;
    this.vehicleDisplayName = vehicleDisplayName;
    this.serviceTypeId = serviceTypeId;
    this.serviceTypeName = serviceTypeName;
  }
  static class(object) {
    return new AvailableRide(
      object.currencyCode,
      object.currencySymbol,
      object.distance,
      object.duration,
      object.estimate,
      object.highEstimate,
      object.lowEstimate,
      object.priceId,
      object.vehicleDisplayName,
      object.serviceTypeId,
      object.serviceTypeName,
    );
  }
}

export default AvailableRide;
