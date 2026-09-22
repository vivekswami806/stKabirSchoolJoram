import { API_BASE_URL } from "@/config";
import { getDeviceId } from "@/helper/getDeviceId";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Buffer } from "buffer";
import * as FileSystem from "expo-file-system/legacy";
import * as IntentLauncher from "expo-intent-launcher";
import * as Sharing from "expo-sharing";
import { Alert, Platform } from "react-native";

export const downloadAttachment = async (
  attachmentId: string,
  fileName: string
): Promise<void> => {
  try {
    const token = await AsyncStorage.getItem("auth_token");
    const encodedTenant = await AsyncStorage.getItem("auth_tenant");
    const deviceId = await getDeviceId();
    if (!token || !encodedTenant) {
      Alert.alert("Error", "Authentication missing");
      return;
    }

    const tenantId = Buffer.from(encodedTenant, "base64").toString("utf-8");

    const downloadUrl =
      `${API_BASE_URL}notice/attachment/downloadNotice/${attachmentId}`;

    const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const fileUri = `${FileSystem.documentDirectory}${safeFileName}`;

    // Remove old file if exists
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(fileUri, { idempotent: true });
    }

    // ⬇ DOWNLOAD
    const { uri } = await FileSystem.downloadAsync(downloadUrl, fileUri, {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Tenant-ID": tenantId,
        'X-Device-ID': deviceId
      },
    });
    // console.log("---uri notice| for all user", uri);
    
    // ⬇ AFTER DOWNLOAD
    Alert.alert(
      "File downloaded",
      "What would you like to do?",
      [
        {
          text: "Open",
          onPress: async () => {
            try {
              if (Platform.OS === "android") {
                // ✅ CONVERT file:// → content://
                const contentUri =
                  await FileSystem.getContentUriAsync(uri);

                await IntentLauncher.startActivityAsync(
                  "android.intent.action.VIEW",
                  {
                    data: contentUri,
                    type: "image/*",
                    flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
                  }
                );
              } else {
                // iOS fallback
                if (await Sharing.isAvailableAsync()) {
                  await Sharing.shareAsync(uri);
                }
              }
            } catch (err) {
              console.error("Open file error:", err);
              Alert.alert("Error", "No app found to open this file");
            }
          },
        },
        {
          text: "Share",
          onPress: async () => {
            if (await Sharing.isAvailableAsync()) {
              await Sharing.shareAsync(uri);
            }
          },
        },
        { text: "Cancel", style: "cancel" },
      ],
      { cancelable: true }
    );
  } catch (error) {
    console.error("Download error:", error);
    Alert.alert("Download failed", "Unable to download attachment");
  }
};
// import { API_BASE_URL } from "@/config";
// import { getDeviceId } from "@/helper/getDeviceId";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { Buffer } from "buffer";
// import * as FileSystem from "expo-file-system/legacy";
// import * as IntentLauncher from "expo-intent-launcher";
// import * as Sharing from "expo-sharing";
// import { Platform } from "react-native";
import { ToastService } from "react-native-toastier";

export const downloadAttachmentForHomework = async (
  fileId: string,
  fileName: string,
  action: "open" | "share"
) => {
  try {
    const token = await AsyncStorage.getItem("auth_token");
    const encodedTenant = await AsyncStorage.getItem("auth_tenant");

    if (!token || !encodedTenant) {
      ToastService.show({
        type: "info",
        message: "Authentication missing",
        duration: 2500, contentContainerStyle: {flex: 1,}
      });
      return;
    }

    const tenantId = Buffer.from(encodedTenant, "base64").toString("utf-8");
    const deviceId = await getDeviceId();
    const downloadUrl = `${API_BASE_URL}homework/download-homework/${fileId}`;

    // console.log("📥 Download URL:", downloadUrl);
    // console.log("🔑 Token:", token.substring(0, 20) + "...");
    // console.log("🏢 Tenant:", tenantId);
    // console.log("📱 Device ID:", deviceId);

    // ============================================
    // METHOD 1: Using fetch for debugging
    // ============================================
    // console.log("⏳ Fetching file...");
    
    const response = await fetch(downloadUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Tenant-ID": tenantId,
        "X-Device-ID": deviceId,
      },
    });

    // console.log("📊 Response Status:", response.status);
    // console.log("📊 Response OK:", response.ok);
    // console.log("📊 Content-Type:", response.headers.get("content-type"));
    // console.log("📊 Content-Length:", response.headers.get("content-length"));
    // console.log("📊 Content-Disposition:", response.headers.get("content-disposition"));

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Error response:", errorText);
      throw new Error(`Server returned ${response.status}: ${errorText}`);
    }

    // Get the blob
    const blob = await response.blob();
    // console.log("💾 Blob size:", blob.size);
    // console.log("💾 Blob type:", blob.type);

    // Check if blob is valid
    if (blob.size === 0) {
      throw new Error("Downloaded file is empty");
    }

    // ============================================
    // METHOD 2: Convert blob to base64 and save
    // ============================================
    const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const fileUri = `${FileSystem.documentDirectory}${safeFileName}`;

    // console.log("💾 Saving to:", fileUri);

    // Remove existing file if it exists
    try {
      const info = await FileSystem.getInfoAsync(fileUri);
      if (info.exists) {
        await FileSystem.deleteAsync(fileUri, { idempotent: true });
        // console.log("🗑️ Deleted existing file");
      }
    } catch (e) {
      console.log("No existing file to delete");
    }

    // Convert blob to base64
    const reader = new FileReader();
    const base64Data = await new Promise<string>((resolve, reject) => {
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    // console.log("📝 Base64 length:", base64Data.length);

    // Write file
    await FileSystem.writeAsStringAsync(fileUri, base64Data, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // console.log("✅ File saved successfully");

    // Verify the file
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    console.log("📄 File info:", fileInfo);

    if (!fileInfo.exists) {
      throw new Error("File was not saved successfully");
    }

    // console.log(`✅ File verified: ${fileInfo.size} bytes`);

    // ============================================
    // Handle the file based on action
    // ============================================
    if (action === "share") {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
        // console.log("📤 File shared");
      } else {
        ToastService.show({
          type: "danger",
          message: "Sharing not available on this device",
          duration: 2500, contentContainerStyle: {flex: 1,}
        });
      }
      return;
    }

    // Open file
    if (Platform.OS === "android") {
      try {
        const contentUri = await FileSystem.getContentUriAsync(fileUri);
        const mimeType = blob.type || getMimeType(fileName);

        await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
          data: contentUri,
          type: mimeType,
          flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
        });

        // console.log("✅ File opened on Android");
      } catch (intentError: any) {
        console.error("❌ Intent error:", intentError);
        console.error("Intent error details:", intentError.message);
        
        // Fallback to sharing if opening fails
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri);
        } else {
          throw new Error("Cannot open or share file");
        }
      }
    } else {
      // iOS
      const mimeType = blob.type || getMimeType(fileName);
      await Sharing.shareAsync(fileUri, {
        mimeType,
        UTI: getUTI(fileName),
      });
      // console.log("🍎 File opened on iOS");
    }

    ToastService.show({
      type: "success",
      message: "File downloaded",
      duration: 2500, contentContainerStyle: {flex: 1,}
    });

  } catch (err: any) {
    console.error("❌ File download error:", err);
    console.error("Error message:", err?.message);
    console.error("Error stack:", err?.stack);
    ToastService.show({
      type: "danger",
      message: "Download Failed",
      duration: 2500, contentContainerStyle: {flex: 1,}
    });
  }
};

// Helper: Get MIME type from filename
function getMimeType(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase();

  const mimeTypes: Record<string, string> = {
    // Images
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    bmp: "image/bmp",

    // Documents
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",

    // Text
    txt: "text/plain",
    csv: "text/csv",
    html: "text/html",

    // Other
    zip: "application/zip",
    rar: "application/x-rar-compressed",
    mp4: "video/mp4",
    mp3: "audio/mpeg",
  };

  return mimeTypes[ext || ""] || "application/octet-stream";
}

// Helper: Get UTI for iOS
function getUTI(fileName: string): string | undefined {
  const ext = fileName.split(".").pop()?.toLowerCase();

  const utiMap: Record<string, string> = {
    pdf: "com.adobe.pdf",
    jpg: "public.jpeg",
    jpeg: "public.jpeg",
    png: "public.png",
    doc: "com.microsoft.word.doc",
    docx: "org.openxmlformats.wordprocessingml.document",
    xls: "com.microsoft.excel.xls",
    xlsx: "org.openxmlformats.spreadsheetml.sheet",
  };

  return utiMap[ext || ""];
}