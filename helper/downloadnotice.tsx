import { API_BASE_URL } from "@/config";
import { getDeviceId } from "@/helper/getDeviceId";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Buffer } from "buffer";
import * as FileSystem from "expo-file-system/legacy";
import * as IntentLauncher from "expo-intent-launcher";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

export interface FilePreviewData {
  uri: string;
  fileName: string;
  fileType: string;
  isImage: boolean;
  isPdf: boolean;
  isDocument: boolean;
}

const isImageFile = (fileName: string): boolean => {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  const ext = fileName.split('.').pop()?.toLowerCase();
  return imageExtensions.includes(ext || '');
};

const isPdfFile = (fileName: string): boolean => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  return ext === 'pdf';
};

const isDocumentFile = (fileName: string): boolean => {
  const docExtensions = ['doc', 'docx'];
  const ext = fileName.split('.').pop()?.toLowerCase();
  return docExtensions.includes(ext || '');
};

const getFileType = (fileName: string): string => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf':
      return 'PDF';
    case 'doc':
    case 'docx':
      return 'Document';
    case 'jpg':
    case 'jpeg':
    case 'png':
      return 'Image';
    default:
      return 'File';
  }
};

/**
 * Download and preview attachment in-app
 * User can then choose to share or download from preview
 */
export const downloadAttachment = async (
  attachmentId: string,
  fileName: string,
  onPreviewReady: (data: FilePreviewData) => void,
  onError?: (error: string) => void
): Promise<void> => {
  try {
    const token = await AsyncStorage.getItem("auth_token");
    const encodedTenant = await AsyncStorage.getItem("auth_tenant");
    const deviceId = await getDeviceId();

    if (!token || !encodedTenant) {
      const msg = "Authentication missing";
      onError?.(msg);
      ToastService.show({
        type: "danger",
        message: msg,
        duration: 2000,
        contentContainerStyle: { flex: 1 },
      });
      return;
    }

    const tenantId = Buffer.from(encodedTenant, "base64").toString("utf-8");
    const downloadUrl = `${API_BASE_URL}notice/attachment/downloadNotice/${attachmentId}`;

    // Sanitize filename
    const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const fileUri = `${FileSystem.documentDirectory}${safeFileName}`;

    // Remove old file if exists
    try {
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(fileUri, { idempotent: true });
      }
    } catch (err) {
      console.log("File cleanup skipped");
    }

    // Show loading toast
    ToastService.show({
      type: "info",
      message: "Opening file...",
      duration: 1000,
      contentContainerStyle: { flex: 1 },
    });

    // Download the file
    const { uri } = await FileSystem.downloadAsync(downloadUrl, fileUri, {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Tenant-ID": tenantId,
        'X-Device-ID': deviceId
      },
    });

    // Prepare preview data
    const previewData: FilePreviewData = {
      uri,
      fileName,
      fileType: getFileType(fileName),
      isImage: isImageFile(fileName),
      isPdf: isPdfFile(fileName),
      isDocument: isDocumentFile(fileName),
    };

    // Call callback to show in-app preview
    onPreviewReady(previewData);
  } catch (error) {
    console.error("Download error:", error);
    const msg = "Failed to open file";
    onError?.(msg);
    ToastService.show({
      type: "danger",
      message: msg,
      duration: 2000,
      contentContainerStyle: { flex: 1 },
    });
  }
};

/**
 * Share file from preview
 */
export const shareFile = async (fileUri: string, fileName: string): Promise<void> => {
  try {
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri);
      ToastService.show({
        type: "success",
        message: "Shared successfully",
        duration: 1500,
        contentContainerStyle: { flex: 1 },
      });
    }
  } catch (error) {
    console.error("Share error:", error);
    ToastService.show({
      type: "danger",
      message: "Failed to share file",
      duration: 2000,
      contentContainerStyle: { flex: 1 },
    });
  }
};

/**
 * Download file to device storage
 */
export const downloadFileToStorage = async (
  fileUri: string,
  fileName: string
): Promise<void> => {
  try {
    if (Platform.OS === "android") {
      const downloadDir = `${FileSystem.documentDirectory}downloads/`;
      
      // Create downloads directory if it doesn't exist
      const dirInfo = await FileSystem.getInfoAsync(downloadDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(downloadDir, { intermediates: true });
      }

      const downloadPath = `${downloadDir}${fileName}`;
      
      // Copy file to downloads
      await FileSystem.copyAsync({
        from: fileUri,
        to: downloadPath,
      });

      ToastService.show({
        type: "success",
        message: `Downloaded to Downloads folder`,
        duration: 2000,
        contentContainerStyle: { flex: 1 },
      });
    } else {
      // iOS - Use sharing to save to files
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      }
    }
  } catch (error) {
    console.error("Download to storage error:", error);
    ToastService.show({
      type: "danger",
      message: "Failed to download file",
      duration: 2000,
      contentContainerStyle: { flex: 1 },
    });
  }
};

/**
 * Open file in external app
 */
export const openFileExternally = async (
  fileUri: string,
  fileName: string
): Promise<void> => {
  try {
    if (Platform.OS === "android") {
      const contentUri = await FileSystem.getContentUriAsync(fileUri);
      const mimeType = isImageFile(fileName)
        ? "image/*"
        : isPdfFile(fileName)
          ? "application/pdf"
          : "application/*";

      await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
        data: contentUri,
        type: mimeType,
        flags: 1,
      });
    } else {
      // iOS - Use sharing
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      }
    }

    ToastService.show({
      type: "success",
      message: "Opening in external app...",
      duration: 1500,
      contentContainerStyle: { flex: 1 },
    });
  } catch (error) {
    console.error("Open externally error:", error);
    ToastService.show({
      type: "danger",
      message: "No app found to open this file",
      duration: 2000,
      contentContainerStyle: { flex: 1 },
    });
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