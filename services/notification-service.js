import PushNotification from "react-native-push-notification";
import NotificationHandler from "./notification-handler";

export default class NotificationService {
  constructor(onRegister, onNotification) {
    NotificationHandler.attachRegister(onRegister);
    NotificationHandler.attachNotification(onNotification);
  }

  checkPermission(cbk) {
    return PushNotification.checkPermissions(cbk);
  }

  requestPermissions() {
    return PushNotification.requestPermissions();
  }

  abandonPermissions() {
    PushNotification.abandonPermissions();
  }
}
