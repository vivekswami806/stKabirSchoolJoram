import * as Application from "expo-application";
import { Platform } from "react-native";
export const getDeviceId = async () => {
    if (Platform.OS === "android") {
      return "Android_" + Application.getAndroidId(); // unique per device
    }

    if (Platform.OS === "ios") {
      return await "ios_" + Application.getIosIdForVendorAsync();
    }

    return "ANDROID-09";
  };