import { API_BASE_URL } from "@/config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Buffer } from "buffer";
import * as FileSystem from "expo-file-system/legacy";
import * as IntentLauncher from "expo-intent-launcher";
import * as Sharing from "expo-sharing";
import { Alert, Platform } from "react-native";
import { getDeviceId } from "./getDeviceId";

type DownloadAction = "view" | "download" | "share";

const getMimeType = (fileName: string): string => {
  const ext = fileName.split(".").pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    txt: "text/plain",
  };
  return mimeTypes[ext ?? ""] ?? "application/octet-stream";
};

export const downloadDocument = async (
  ownerType: string,
  ownerId: string,
  documentType: string,
  fileName: string,
  action: DownloadAction
) => {
  try {
    const token = await AsyncStorage.getItem("auth_token");
    const encodedTenant = await AsyncStorage.getItem("auth_tenant");

    if (!token || !encodedTenant) {
      Alert.alert("Error", "Authentication missing");
      return;
    }

    // BUG FIX 3: Only decode if actually base64-encoded; adjust to match
    // how auth_tenant was stored. If stored as plain string, use directly.
    const tenantId = Buffer.from(encodedTenant, "base64").toString("utf-8");

    const deviceId = await getDeviceId();

    const downloadUrl = `${API_BASE_URL}documents/download?ownerType=${ownerType}&ownerId=${ownerId}&documentType=${documentType}`;

    const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const fileUri = `${FileSystem.documentDirectory}${safeFileName}`;

    // Delete old file if exists
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(fileUri, { idempotent: true });
    }

    // Download to app-private directory first
    const { uri } = await FileSystem.downloadAsync(downloadUrl, fileUri, {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Tenant-ID": tenantId,
        "X-Device-ID": deviceId,
      },
    });

    // SHARE
    if (action === "share") {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      }
      return;
    }

    // DOWNLOAD — BUG FIX 1 & 2: SAF block moved here, after uri is defined,
    // and only runs for the "download" action on Android.
    if (action === "download") {
      if (Platform.OS === "android") {
        const permissions =
          await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

        if (!permissions.granted) {
          return;
        }

        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const downloadUri =
          await FileSystem.StorageAccessFramework.createFileAsync(
            permissions.directoryUri,
            fileName,
            getMimeType(fileName) // BUG FIX 4: use real MIME type
          );

        await FileSystem.writeAsStringAsync(downloadUri, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
      }

      Alert.alert("Download Complete", `${fileName} downloaded successfully`);
      return;
    }

    // VIEW
    if (action === "view") {
      if (Platform.OS === "android") {
        const contentUri = await FileSystem.getContentUriAsync(uri);

        await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
          data: contentUri,
          flags: 1,
          type: getMimeType(fileName), // BUG FIX 4: use real MIME type
        });
      } else {
        await Sharing.shareAsync(uri);
      }
    }
  } catch (error: any) {
    console.log("Download error:", error);
    Alert.alert(
      "Download Failed",
      error?.message || "Unable to download document"
    );
  }
};