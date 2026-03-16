import { ThemeContext } from "@/action/theme/ThemeContext";
import { Theme } from "@/action/theme/themeReducer";
import { API_BASE_URL } from "@/config";
import { getDeviceId } from "@/helper/getDeviceId";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Buffer } from "buffer";
import { router, useLocalSearchParams } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { downloadAndHandleFile } from "../../downloadfolder";

interface FileItem {
  id: string;
  fileName: string;
  fileSizeFormatted: string;
  expiryDate: string;
  expired: boolean;
  fileType: string;
  uploadedAt: string;
}

interface SubmissionItem {
  submissionId: string;
  studentName: string;
  admissionNumber: string;
  status: string;
  submittedAt: string;
  remarks?: string;
  files: FileItem[];
}

const HomeworkSubmissions = () => {
  const { homeworkId, className, section, title } = useLocalSearchParams<{
    homeworkId: string;
    className: string;
    section: string;
    title: string;
  }>();

  const [list, setList] = useState<SubmissionItem[]>([]);
  const [total, setTotal] = useState(0);
  const themeState = useContext(ThemeContext);
  if (!themeState) return null;

  const { theme } = themeState;
  const styles = getStyles(theme);
  const isDark = theme.mode === "dark";


  const fetchSubmissions = async () => {
    try {
      const token = await AsyncStorage.getItem("auth_token");
      const encodedTenant = await AsyncStorage.getItem("auth_tenant");
      const deviceId = await getDeviceId();
      if (!token || !encodedTenant) throw new Error("Auth missing");

      const tenantId = Buffer.from(encodedTenant, "base64").toString("utf-8");

      const res = await axios.get(
        `${API_BASE_URL}homework/staff/submissions/${homeworkId}`,
        {
          params: { className, section, page: 0, size: 20 },
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Tenant-ID": tenantId,
            'X-Device-ID': deviceId
          },
        }
      );
      // console.log("---submitHomework,", res.data.content[0]?.files);

      setList(res.data.content);
      setTotal(res.data.totalElements);
    } catch (error) {
      console.error("Fetch submissions error:", error);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const statusColors: Record<string, string> = {
    SUBMITTED: "#22c55e", // green
    LATE: "#ef4444", // red
    PENDING: "#f59e0b", // amber
  };

  // Helper to get file icon based on type
  const getFileIcon = (fileType: string) => {
    if (fileType.includes('image')) return 'image';
    if (fileType.includes('pdf')) return 'picture-as-pdf';
    if (fileType.includes('word') || fileType.includes('document')) return 'description';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return 'table-chart';
    return 'insert-drive-file';
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() =>
          router.replace("/staffDashboard/(tabs)/homework/homework")
        }
      >
        <MaterialIcons name="arrow-back" size={28} color={isDark ? "#f1f5f9" : "#1e293b"} />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <Text style={styles.header}>{title}</Text>
      <Text style={styles.count}>{total} student(s) submitted</Text>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      >
        {list.length === 0 && (
          <Text style={styles.emptyText}>No submissions found.</Text>
        )}

        {list.map((item, idx) => (
          <View key={item.submissionId ?? idx} style={styles.card}>
            <Text style={styles.name}>{item.studentName ?? "Unknown Student"}</Text>
            <Text style={styles.admissionNumber}>
              Admission #: {item.admissionNumber ?? "-"}
            </Text>

            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: statusColors[item.status] || "#6b7280" },
                ]}
              >
                <Text style={styles.statusText}>{item.status ?? "N/A"}</Text>
              </View>
              <Text style={styles.date}>
                Submitted: {item.submittedAt
                  ? new Date(item.submittedAt).toLocaleString()
                  : "-"}
              </Text>
            </View>

            {item.remarks ? (
              <Text style={styles.remarks}>Remarks: {item.remarks}</Text>
            ) : null}

            {(item.files ?? []).length > 0 && (
              <>
                <Text style={styles.attachmentsHeader}>Attachments:</Text>
                <FlatList
                  data={item.files ?? []}
                  horizontal
                  keyExtractor={(file, fIdx) => file.id ?? fIdx.toString()}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingVertical: 8 }}
                  renderItem={({ item: file }) => (
                    <View style={styles.fileCard}>
                      {/* File Icon */}
                      <View style={styles.fileIconContainer}>
                        <MaterialIcons
                          name={getFileIcon(file.fileType)}
                          size={48}
                          color={isDark ? "#cbd5e1" : "#64748b"}
                        />
                      </View>

                      {/* File Name */}
                      <Text style={styles.fileName} numberOfLines={2}>
                        {file.fileName ?? "Unknown"}
                      </Text>

                      {/* File Size */}
                      <Text style={styles.fileMeta}>
                        Size: {file.fileSizeFormatted ?? "-"}
                      </Text>

                      {/* Expiry Date */}
                      <Text
                        style={[
                          styles.fileMeta,
                          file.expired && { color: "#ef4444", fontWeight: "600" },
                        ]}
                      >
                        Expires: {file.expiryDate
                          ? new Date(file.expiryDate).toLocaleDateString()
                          : "-"}
                      </Text>

                      {/* Action Buttons */}
                      <View style={styles.fileActions}>
                        <TouchableOpacity
                          style={styles.actionBtn}
                          onPress={() =>
                            downloadAndHandleFile(file.id, file.fileName, "open")
                          }
                        >
                          <MaterialIcons name="download" size={18} color={isDark ? "#60a5fa" : "#2563eb"} />
                          <Text style={styles.actionText}>Download</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.actionBtn}
                          onPress={() =>
                            downloadAndHandleFile(file.id, file.fileName, "share")
                          }
                        >
                          <MaterialIcons name="share" size={18} color={isDark ? "#60a5fa" : "#2563eb"} />
                          <Text style={styles.actionText}>Share</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                />
              </>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default HomeworkSubmissions;

function getStyles(theme: Theme) {
  const isDark = theme.mode === "dark";

  const colors = {
    light: {
      background: "#f1f5f9",
      card: "#ffffff",
      textPrimary: "#0f172a",
      textSecondary: "#475569",
      textMuted: "#64748b",
      border: "#e2e8f0",
      fileCard: "#e2e8f0",
      fileIconBg: "#cbd5e1",
    },
    dark: {
      background: "#0f172a",
      card: "#1e293b",
      textPrimary: "#f1f5f9",
      textSecondary: "#cbd5e1",
      textMuted: "#94a3b8",
      border: "#334155",
      fileCard: "#1e293b",
      fileIconBg: "#334155",
    },
  };

  const palette = isDark ? colors.dark : colors.light;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: palette.background,
      paddingTop: 32,
    },

    backButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 6,
      marginBottom: 8,
    },

    backText: {
      fontSize: 16,
      color: palette.textPrimary,
      marginLeft: 4,
      fontWeight: "600",
    },

    header: {
      fontSize: 22,
      fontWeight: "700",
      color: palette.textPrimary,
      paddingHorizontal: 16,
      marginBottom: 4,
    },

    count: {
      paddingHorizontal: 16,
      fontSize: 14,
      color: palette.textSecondary,
      marginBottom: 12,
    },

    card: {
      backgroundColor: palette.card,
      borderRadius: 12,
      padding: 18,
      marginHorizontal: 16,
      marginVertical: 8,
      borderWidth: isDark ? 1 : 0,
      borderColor: palette.border,
      elevation: isDark ? 0 : 3,
    },

    name: {
      fontWeight: "700",
      fontSize: 18,
      color: palette.textPrimary,
    },

    admissionNumber: {
      fontSize: 13,
      color: palette.textMuted,
      marginBottom: 8,
      fontStyle: "italic",
    },

    statusRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },

    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 20,
    },

    statusText: {
      color: "#fff",
      fontWeight: "700",
      fontSize: 13,
    },

    date: {
      fontSize: 12,
      color: palette.textMuted,
    },

    remarks: {
      marginTop: 6,
      fontStyle: "italic",
      color: palette.textSecondary,
      fontSize: 13,
    },

    attachmentsHeader: {
      marginTop: 10,
      fontWeight: "700",
      color: palette.textPrimary,
      marginBottom: 4,
    },

    fileCard: {
      width: 140,
      backgroundColor: palette.fileCard,
      borderRadius: 10,
      padding: 12,
      marginRight: 10,
      alignItems: "center",
      borderWidth: isDark ? 1 : 0,
      borderColor: palette.border,
    },

    fileIconContainer: {
      width: 80,
      height: 80,
      borderRadius: 6,
      marginBottom: 8,
      backgroundColor: palette.fileIconBg,
      justifyContent: "center",
      alignItems: "center",
    },

    fileName: {
      fontSize: 12,
      fontWeight: "600",
      color: palette.textPrimary,
      textAlign: "center",
      marginBottom: 4,
    },

    fileMeta: {
      fontSize: 10,
      color: palette.textSecondary,
      marginBottom: 2,
    },

    emptyText: {
      textAlign: "center",
      marginTop: 40,
      color: palette.textMuted,
      fontSize: 16,
    },

    fileActions: {
      flexDirection: "row",
      justifyContent: "space-around",
      marginTop: 8,
      width: "100%",
    },

    actionBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },

    actionText: {
      fontSize: 11,
      color: palette.textPrimary,
      fontWeight: "600",
    },
  });
}
