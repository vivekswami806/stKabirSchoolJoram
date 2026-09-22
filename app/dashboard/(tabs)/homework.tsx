import { RootState } from "@/action/store";
import { ThemeContext } from "@/action/theme/ThemeContext";
import { Theme } from "@/action/theme/themeReducer";
import ErrorRetry from "@/app/adminDashboard/(tabs)/components/ErrorRetry";
import Skeleton from "@/components/Skeleton";
import { API_BASE_URL } from "@/config";
import { getDeviceId } from "@/helper/getDeviceId";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Buffer } from "buffer";
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from "expo-file-system";
import { useRouter } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
import {
  FlatList, Linking, Modal, Platform, SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { ToastService } from "react-native-toastier";
import { useSelector } from "react-redux";
import { downloadAttachmentForHomework } from "../../../components/downloadnotice";

interface HomeworkItem {
  id: string;
  title: string;
  description: string;
  subject: string;
  className: string;
  section: string;
  homeworkDate: string;
  dueDate: string;
  expired: boolean;
  submissionCount: number;
  attachments: any[];
  status: "Pending" | "Marked" | "Not Submitted";
}

export default function HomeWorkScreen() {
  const router = useRouter();
  const themeState = useContext(ThemeContext);
  const { userDetail } = useSelector((state: RootState) => state.user);
  if (!themeState) return null;

  const { theme } = themeState;
  const styles = getStyles(theme);

  const [homeworkData, setHomeworkData] = useState<HomeworkItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [page, setPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  const [modalVisible, setModalVisible] = useState(false);
  const [currentHomeworkId, setCurrentHomeworkId] = useState<string | null>(null);
  const [remarks, setRemarks] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const ALLOWED_TYPES = [
    "application/pdf", // PDF
    "image/jpeg",      // JPG
    "image/png",       // PNG
    "application/msword", // DOC
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // DOCX
  ];

  /* ===========================
       FETCH HOMEWORK
  ============================ */
  const fetchHomework = async (pageNumber: number = 0) => {
    if (loading || pageNumber >= totalPages) return;
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("auth_token");
      const encodedTenant = await AsyncStorage.getItem("auth_tenant");
      const deviceId = await getDeviceId();
      if (!token || !encodedTenant) throw new Error("Auth missing");

      const tenantId = Buffer.from(encodedTenant, "base64").toString("utf-8");

      const response = await axios.get(`${API_BASE_URL}homework/getHomeWorkForParents`, {
        params: { studentId: userDetail.id, page: pageNumber, size: 10 },
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Tenant-ID": tenantId,
          'X-Device-ID': deviceId
        },
      });
    //  console.log("---response Homework|", response.data);
      const { content, totalPages: tp } = response.data;

      const mappedHomework = content.map((hw: any) => ({
        id: hw.id,
        title: hw.title,
        description: hw.description,
        subject: hw.subject,
        className: hw.className,
        section: hw.section,
        homeworkDate: hw.homeworkDate,
        dueDate: hw.dueDate,
        expired: hw.expired,
        submissionCount: hw.submissionCount,
        attachments: hw.attachments,
        status:
          hw.expired
            ? "Not Submitted"
            : hw.submissionCount > 0
              ? "Marked"
              : "Pending",
      }));

      setHomeworkData((prev) => [...prev, ...mappedHomework]);
      setTotalPages(tp);
      setPage(pageNumber + 1);
    } catch (error) {
      console.error("Homework API error:", error);
      setError("ERROR")
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHomework(); }, []);

  /* ===========================
       STATUS STYLES
  ============================ */
  const getStatusStyle = (status: HomeworkItem["status"]) => {
    switch (status) {
      case "Pending": return { badge: styles.pendingBadge, text: styles.pendingText };
      case "Marked": return { badge: styles.markedBadge, text: styles.markedText };
      case "Not Submitted": return { badge: styles.notSubmittedBadge, text: styles.notSubmittedText };
    }
  };

  /* ===========================
       FILE PICKER
  ============================ */
  const pickFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        multiple: true,
      });
  
      if (result.canceled) return;
  
      const validFiles = result.assets.filter(
        (file) => ALLOWED_TYPES.includes(file.mimeType ?? "")
      );
  
      if (validFiles.length === 0) {
        alert("Invalid file type. Allowed: PDF, JPG, PNG, DOC, DOCX");
        return;
      }
  
      setSelectedFiles(validFiles);
    } catch (error) {
      console.error("File picker error:", error);
    }
  };
  

  /* ===========================
       SUBMIT HOMEWORK
  ============================ */
  const handleSubmit = async () => {
    if (!currentHomeworkId) return;

    try {
      const formData = new FormData();

      for (const attachment of selectedFiles) {
        if (Platform.OS === "web") {
          const response = await fetch(attachment.uri);
          const blob = await response.blob();
          const file = new File([blob], attachment.name, { type: attachment.mimeType || "application/octet-stream" });
          formData.append("files", file);
        } else {
          formData.append("files", {
            uri: attachment.uri,
            name: attachment.name,
            type: attachment.mimeType || "application/octet-stream",
          } as any);
        }
      }

      formData.append("remarks", remarks);
      formData.append("studentId", userDetail.id);

      const token = await AsyncStorage.getItem("auth_token");
      const encodedTenant = await AsyncStorage.getItem("auth_tenant");
      const tenantId = Buffer.from(encodedTenant!, "base64").toString("utf-8");
      const deviceId = await getDeviceId();
      console.log(tenantId);
      
      await axios.post(`${API_BASE_URL}homework/submitHomeWork/${currentHomeworkId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
          "X-Tenant-ID": tenantId,
          'X-Device-ID': deviceId
        },
      });

      ToastService.show({
        type: "success",
        message: "Homework submitted successfully!",
        duration: 2000,
        contentContainerStyle: { flex: 1 },
      });
      setModalVisible(false);
      setRemarks("");
      setSelectedFiles([]);
      setHomeworkData([]);
      setPage(0);
      fetchHomework();
    } catch (error) {
      // console.error("Submit Homework Error:", error);
      ToastService.show({
        type: "danger",
        message: "Failed to submit homework.",
        duration: 2000,
        contentContainerStyle: { flex: 1 },
      });
    }
  };

  const openAttachment = async (file: any) => {
    try {
      const token = await AsyncStorage.getItem("auth_token");
      const encodedTenant = await AsyncStorage.getItem("auth_tenant");
      const deviceId = await getDeviceId();
      if (!token || !encodedTenant) throw new Error("Auth missing");
  
      const tenantId = Buffer.from(encodedTenant, "base64").toString("utf-8");
      const url = `${API_BASE_URL}file/${file.id}`;
  
      // Download file to local cache
      const fileUri = FileSystem.File + file.fileName;
  
      const downloadResumable = FileSystem.createDownloadResumable(
        url,
        fileUri,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Tenant-ID": tenantId,
            'X-Device-ID': deviceId
          },
        }
      );
  
      const { uri } = await downloadResumable.downloadAsync();
  
      // Open file with OS handler
      await Linking.openURL(uri);
    } catch (error) {
      console.error("Failed to open attachment", error);
    }
  };

  /* ===========================
       RENDER ITEM
  ============================ */
  const renderHomeworkItem = ({ item }: { item: HomeworkItem }) => {
    const status = getStatusStyle(item.status);
    return (
      <TouchableOpacity style={styles.homeworkCard} activeOpacity={0.7}>
        <View style={styles.cardHeader}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <MaterialIcons name="book" size={16} color={styles.muted.color} />
              <Text style={styles.infoText}>
                {item.subject} - Class {item.className}{item.section}
              </Text>
            </View>

            <View style={styles.infoItem}>
              <MaterialIcons name="calendar-today" size={16} color={styles.muted.color} />
              <Text style={styles.infoText}>{item.homeworkDate}</Text>
            </View>
          </View>

          <View style={[styles.statusBadge, status.badge]}>
            <Text style={[styles.statusText, status.text]}>{item.status}</Text>
          </View>
        </View>

        <Text style={styles.homeworkTitle}>{item.title}</Text>
        <Text style={[styles.infoText, { marginTop: 4 }]} numberOfLines={2}>{item.description}</Text>
        {item.attachments.length > 0 && (
          <View style={{ marginTop: 8 }}>
            <Text style={{ fontSize: 13, fontWeight: "600", marginBottom: 4 ,  color: theme.mode === "dark" ? "#F1F5F9" : "#111827"}}>
              Attachments
            </Text>

            {renderAttachments(item.attachments)}
          </View>
        )}

        {item.status === "Pending" && (
          <TouchableOpacity
            style={{
              marginTop: 8,
              paddingVertical: 6,
              paddingHorizontal: 12,
              backgroundColor: "#4CAF50",
              borderRadius: 8,
              alignSelf: "flex-start",
            }}
            onPress={() => {
              setCurrentHomeworkId(item.id);
              setModalVisible(true);
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>Submit</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const renderAttachments = (attachments: any[]) => {
    return attachments.map((file) => {
      const isImage = file.fileType.startsWith("image");

      return (
        <TouchableOpacity
          key={file.id}
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginTop: 6,
            padding: 6,
            borderRadius: 6,
            backgroundColor: "#F3F4F6",
          }}
          onPress={() => downloadAttachmentForHomework(file.id, file.fileName, "open")}
        >
          <MaterialIcons
            name={isImage ? "image" : "attach-file"}
            size={20}
            color="#374151"
          />

          <View style={{ marginLeft: 8, flex: 1 }}>
            <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: "500" }}>
              {file.fileName}
            </Text>
            <Text style={{ fontSize: 11, color: "#6B7280" }}>
              {file.fileSizeFormatted}
            </Text>
          </View>
        </TouchableOpacity>
      );
    });
  };


  /* ===========================
       RETURN JSX
  ============================ */
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle={theme.mode === "dark" ? "light-content" : "dark-content"}
        backgroundColor={styles.statusBar.backgroundColor}
      />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.push("/(tabs)/home")}>
          <MaterialIcons name="arrow-back" size={24} color={styles.icon.color} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Home Work</Text>
        <View style={styles.placeholder} />
      </View>

      {/* LIST */}
      {!loading && error ? (
        <ErrorRetry
          message={error}
          isDark={false}
          loading={loading}
          onRetry={() => fetchHomework(page + 1)}
        />
      ) : homeworkData.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="document-text-outline"
            size={80}
            color={"#6B7280"}
            style={styles.emptyIcon}
          />
          <Text style={styles.emptyTitle}>No Homework</Text>
          <Text style={styles.emptySubtitle}>There are no Homework to show.</Text>
        </View>
      ) : 
      <FlatList
        data={homeworkData}
        renderItem={renderHomeworkItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onEndReached={() => fetchHomework(page)}
        onEndReachedThreshold={0.5}
        ListFooterComponent={loading ? <Skeleton isDark={false}/> : null}
      />
    }

      {/* ===========================
           SUBMIT MODAL
      ============================ */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" }}>
          <View style={{ width: "90%", backgroundColor: theme.mode === "dark" ? "#111827" : "#fff", padding: 20, borderRadius: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 12 }}>Submit Homework</Text>

            <TextInput
              style={{
                borderWidth: 1,
                borderColor: "#ccc",
                borderRadius: 8,
                padding: 10,
                height: 80,
                marginBottom: 12,
                color: theme.mode === "dark" ? "#fff" : "#000",
              }}
              placeholder="Write remarks..."
              placeholderTextColor={theme.mode === "dark" ? "#999" : "#999"}
              multiline
              value={remarks}
              onChangeText={setRemarks}
            />

            <TouchableOpacity
              style={{ padding: 10, backgroundColor: "#E5E7EB", borderRadius: 8, marginBottom: 12 }}
              onPress={pickFiles}
            >
              <Text>Select Files ({selectedFiles.length} selected)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ backgroundColor: "#4CAF50", padding: 12, borderRadius: 8, alignItems: "center" }}
              onPress={handleSubmit}
            >
              <Text style={{ color: "#fff", fontWeight: "600" }}>Submit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ marginTop: 10, alignItems: "center" }}
              onPress={() => setModalVisible(false)}
            >
              <Text style={{ color: "#F44336", fontWeight: "600" }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* ===========================
       THEME STYLES
=========================== */
function getStyles(theme: Theme) {
  const isDark = theme.mode === "dark";

  const colors = {
    background: isDark ? "#0F172A" : "#F9FAFB",
    card: isDark ? "#1E293B" : "#FFFFFF",
    border: isDark ? "#334155" : "#E5E7EB",
    primary: "#6366F1",
    success: "#22C55E",
    warning: "#F59E0B",
    danger: "#EF4444",
    textPrimary: isDark ? "#F1F5F9" : "#111827",
    textSecondary: isDark ? "#94A3B8" : "#6B7280",
  };

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      paddingTop: 30,
    },

    statusBar: {
      backgroundColor: isDark ? "#0B1220" : "#FFFFFF",
    },

    icon: {
      color: isDark ? "#E5E7EB" : "#000",
    },

    muted: {
      color: isDark ? "#9CA3AF" : "#999",
    },

    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 16,
      backgroundColor: theme.background,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? "#1F2937" : "#F0F0F0",
    },

    backButton: {
      borderRadius: 12,
    },

    headerTitle: {
      fontSize: 22,
      fontWeight: "700",
      letterSpacing: 0.5,
      color: colors.textPrimary,
    },

    placeholder: {
      width: 40,
    },

    listContent: {
      padding: 16,
      paddingTop: 8,
    },
    homeworkCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 18,
      marginBottom: 18,
      borderWidth: 1,
      borderColor: colors.border,
    
      // Light mode shadow
      shadowColor: "#000",
      shadowOpacity: isDark ? 0 : 0.08,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
    
      // Android elevation
      elevation: isDark ? 0 : 3,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 12,
    },

    infoRow: {
      flex: 1,
      gap: 8,
    },

    infoItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },

    infoText: {
      fontSize: 13,
      color: isDark ? "#9CA3AF" : "#999",
    },

    statusBadge: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
      marginLeft: 8,
    },

    pendingBadge: {
      backgroundColor: isDark ? "#3F2E05" : "#FEF3C7",
      borderColor: "#FFA726",
    },

    markedBadge: {
      backgroundColor: isDark ? "#052E16" : "#DCFCE7",
      borderColor: "#4CAF50",
    },

    notSubmittedBadge: {
      backgroundColor: isDark ? "#3B0A0A" : "#FEE2E2",
      borderColor: "#F44336",
    },

    statusText: {
      fontSize: 12,
      fontWeight: "600",
    },

    pendingText: {
      color: "#F57C00",
    },

    markedText: {
      color: "#4CAF50",
    },

    notSubmittedText: {
      color: "#F44336",
    },

    homeworkTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: isDark ? "#E5E7EB" : "#000",
      lineHeight: 22,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 32,
    },
    emptyIcon: {
      marginBottom: 20,
    },
    emptyTitle: {
      fontSize: 22,
      fontWeight: "700",
      color: isDark ? "#F3F4F6" : "#111827",
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: 14,
      color: isDark ? "#A1A1AA" : "#6B7280",
      textAlign: "center",
    },
  });
}
