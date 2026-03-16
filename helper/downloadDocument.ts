import { API_BASE_URL } from "@/config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Buffer } from "buffer";
import * as FileSystem from "expo-file-system/legacy";
import * as IntentLauncher from "expo-intent-launcher";
import * as Sharing from "expo-sharing";
import { Alert, Platform } from "react-native";
import { getDeviceId } from "./getDeviceId";

export const downloadDocument = async (
  ownerType: string,
  ownerId: string,
  documentType: string,
  fileName: string,
  action: "open" | "share"
) => {
    // console.log("---ownerType|", ownerType, ownerId,documentType,fileName, action);
    
  try {
    const token = await AsyncStorage.getItem("auth_token");
    const encodedTenant = await AsyncStorage.getItem("auth_tenant");

    if (!token || !encodedTenant) {
      Alert.alert("Error", "Authentication missing");
      return;
    }

    const tenantId = Buffer.from(encodedTenant, "base64").toString("utf-8");
    const deviceId = await getDeviceId();
    const downloadUrl = `${API_BASE_URL}documents/download?ownerType=${ownerType}&ownerId=${ownerId}&documentType=${documentType}`;

    const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const fileUri = `${FileSystem.documentDirectory}${safeFileName}`;
    console.log("---file/submission|",fileUri );
    
    // Remove existing file
    const info = await FileSystem.getInfoAsync(fileUri);
    if (info.exists) {
      await FileSystem.deleteAsync(fileUri, { idempotent: true });
    }

    // ⬇ Download
    const { uri } = await FileSystem.downloadAsync(downloadUrl, fileUri, {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Tenant-ID": tenantId,
        'X-Device-ID': deviceId
      },
    });

    // ▶ After download
    if (action === "share") {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      }
      return;
    }

    // ▶ Open
    if (Platform.OS === "android") {
      const contentUri = await FileSystem.getContentUriAsync(uri);

      await IntentLauncher.startActivityAsync(
        "android.intent.action.VIEW",
        {
          data: contentUri,
          type: "*/*",
          flags: 1,
        }
      );
    } else {
      await Sharing.shareAsync(uri);
    }
  } catch (error: any) {
    console.log("Download error:", error);
    Alert.alert("Download Failed", error.message || "Unable to download document");
  }
};
