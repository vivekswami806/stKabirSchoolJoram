import { FilePreviewData } from "@/helper/downloadnotice";
import { MaterialIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface FilePreviewModalProps {
  visible: boolean;
  fileData: FilePreviewData | null;
  isDark: boolean;
  onShare: () => void;
  onDownload: () => void;
  onOpenExternal: () => void;
  onClose: () => void;
  loading?: boolean;
}

const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  visible,
  fileData,
  isDark,
  onShare,
  onDownload,
  onOpenExternal,
  onClose,
  loading = false,
}) => {
  const [imageLoading, setImageLoading] = useState(true);
  const styles = getStyles(isDark);

  if (!fileData) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <MaterialIcons
              name="close"
              size={24}
              color={isDark ? "#E5E7EB" : "#000"}
            />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={2}>
            {fileData.fileName}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Preview Content */}
        <ScrollView
          style={styles.previewContainer}
          contentContainerStyle={styles.previewContent}
        >
          {fileData.isImage ? (
            <View style={styles.imageWrapper}>
              {imageLoading && (
                <ActivityIndicator
                  size="large"
                  color={isDark ? "#3B82F6" : "#3B82F6"}
                  style={styles.loader}
                />
              )}
              <Image
                source={{ uri: fileData.uri }}
                style={styles.previewImage}
                onLoadEnd={() => setImageLoading(false)}
              />
            </View>
          ) : (
            <View style={styles.fileInfoContainer}>
              <View style={styles.fileIconContainer}>
                <Text style={styles.fileIconText}>
                  {fileData.isPdf ? "📕" : "📄"}
                </Text>
              </View>
              <Text style={styles.fileTypeName}>{fileData.fileType}</Text>
              <Text style={styles.fileName} numberOfLines={3}>
                {fileData.fileName}
              </Text>
              <View style={styles.fileInfoBox}>
                <Text style={styles.fileInfoText}>
                  Preview not available for this file type
                </Text>
                <Text style={styles.fileInfoSubText}>
                  Use "Open" to view in external app
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          {/* Open Externally */}
          <TouchableOpacity
            style={[styles.actionBtn, styles.openBtn]}
            onPress={onOpenExternal}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <MaterialIcons name="open-in-new" size={20} color="#fff" />
                <Text style={styles.actionBtnText}>Open</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Share */}
          <TouchableOpacity
            style={[styles.actionBtn, styles.shareBtn]}
            onPress={onShare}
            disabled={loading}
          >
            <MaterialIcons name="share" size={20} color="#fff" />
            <Text style={styles.actionBtnText}>Share</Text>
          </TouchableOpacity>

          {/* Download */}
          <TouchableOpacity
            style={[styles.actionBtn, styles.downloadBtn]}
            onPress={onDownload}
            disabled={loading}
          >
            <MaterialIcons name="download" size={20} color="#fff" />
            <Text style={styles.actionBtnText}>Download</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

function getStyles(isDark: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? "#0F172A" : "#FFFFFF",
    },

    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? "#334155" : "#E5E7EB",
    },

    closeButton: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },

    headerTitle: {
      flex: 1,
      fontSize: 16,
      fontWeight: "600",
      color: isDark ? "#E5E7EB" : "#000",
      marginHorizontal: 12,
      textAlign: "center",
    },

    previewContainer: {
      flex: 1,
    },

    previewContent: {
      flexGrow: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 20,
      paddingHorizontal: 16,
    },

    imageWrapper: {
      width: "100%",
      alignItems: "center",
      justifyContent: "center",
    },

    loader: {
      position: "absolute",
      zIndex: 1,
    },

    previewImage: {
      width: "100%",
      height: 400,
      borderRadius: 12,
      resizeMode: "contain",
    },

    fileInfoContainer: {
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 20,
    },

    fileIconContainer: {
      width: 80,
      height: 80,
      borderRadius: 16,
      backgroundColor: isDark ? "#1E293B" : "#F3F4F6",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
    },

    fileIconText: {
      fontSize: 48,
    },

    fileTypeName: {
      fontSize: 14,
      fontWeight: "600",
      color: "#3B82F6",
      marginBottom: 8,
    },

    fileName: {
      fontSize: 18,
      fontWeight: "700",
      color: isDark ? "#E5E7EB" : "#000",
      textAlign: "center",
      marginBottom: 20,
    },

    fileInfoBox: {
      backgroundColor: isDark ? "#1E293B" : "#F3F4F6",
      paddingVertical: 16,
      paddingHorizontal: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? "#334155" : "#E5E7EB",
    },

    fileInfoText: {
      fontSize: 14,
      fontWeight: "600",
      color: isDark ? "#E5E7EB" : "#000",
      textAlign: "center",
      marginBottom: 4,
    },

    fileInfoSubText: {
      fontSize: 12,
      color: isDark ? "#94A3B8" : "#6B7280",
      textAlign: "center",
    },

    actionsContainer: {
      flexDirection: "row",
      gap: 10,
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderTopWidth: 1,
      borderTopColor: isDark ? "#334155" : "#E5E7EB",
    },

    actionBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 12,
      borderRadius: 8,
      gap: 6,
    },

    openBtn: {
      backgroundColor: "#3B82F6",
    },

    shareBtn: {
      backgroundColor: "#8B5CF6",
    },

    downloadBtn: {
      backgroundColor: "#22C55E",
    },

    actionBtnText: {
      color: "#fff",
      fontWeight: "600",
      fontSize: 13,
    },
  });
}

export default FilePreviewModal;