import { ThemeContext } from "@/action/theme/ThemeContext";
import { Theme } from "@/action/theme/themeReducer";
import { API_BASE_URL } from "@/config";
import { getDeviceId } from "@/helper/getDeviceId";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Buffer } from "buffer";
import { router, useLocalSearchParams } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { downloadAndHandleFile } from "../../../../components/downloadfolder";

interface FileItem {
  id: string;
  fileName: string;
  fileSizeFormatted: string;
  expiryDate: string;
  expired: boolean;
  fileType: string;
  uploadedAt: string;
  downloadUrl?: string;
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

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: string }> = {
  SUBMITTED: { color: "#16A34A", bg: "#DCFCE7", icon: "checkmark-circle" },
  LATE:      { color: "#DC2626", bg: "#FEE2E2", icon: "time" },
  PENDING:   { color: "#D97706", bg: "#FEF3C7", icon: "ellipsis-horizontal-circle" },
};

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/jpg", "image/webp", "image/gif"];

const isImageType = (fileType: string) =>
  IMAGE_TYPES.some((t) => fileType?.toLowerCase().includes(t.split("/")[1]));

const getFileIcon = (fileType: string): any => {
  if (isImageType(fileType)) return "image-outline";
  if (fileType?.includes("pdf")) return "document-text-outline";
  if (fileType?.includes("word") || fileType?.includes("document")) return "document-outline";
  if (fileType?.includes("excel") || fileType?.includes("spreadsheet")) return "grid-outline";
  return "attach-outline";
};

const HomeworkSubmissions = () => {
  const { homeworkId, className, section, title } = useLocalSearchParams<{
    homeworkId: string;
    className: string;
    section: string;
    title: string;
  }>();

  const [list, setList] = useState<SubmissionItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const themeState = useContext(ThemeContext);
  if (!themeState) return null;
  const { theme } = themeState;
  const styles = getStyles(theme);
  const isDark = theme.mode === "dark";

  const getAuthHeaders = async () => {
    const token = await AsyncStorage.getItem("auth_token");
    const encodedTenant = await AsyncStorage.getItem("auth_tenant");
    const deviceId = await getDeviceId();
    if (!token || !encodedTenant) throw new Error("Auth missing");
    const tenantId = Buffer.from(encodedTenant, "base64").toString("utf-8");
    return {
      Authorization: `Bearer ${token}`,
      "X-Tenant-ID": tenantId,
      "X-Device-ID": deviceId,
    };
  };

  const fetchSubmissions = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await axios.get(
        `${API_BASE_URL}homework/staff/submissions/${homeworkId}`,
        {
          params: { className, section, page: 0, size: 50 },
          headers,
        }
      );
      setList(res.data.content);
      setTotal(res.data.totalElements);
    } catch (error) {
      console.error("Fetch submissions error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const submitted = list.filter((i) => i.status === "SUBMITTED").length;
  const late = list.filter((i) => i.status === "LATE").length;
  const pending = list.filter((i) => i.status === "PENDING").length;

  const renderFile = (file: FileItem, fileIdx: number) => {
    const isImg = isImageType(file.fileType);

    return (
      <View key={file.id ?? fileIdx} style={styles.fileCard}>
        {/* Image preview or icon */}
        {isImg && file.downloadUrl ? (
          <Image
            source={{ uri: file.downloadUrl }}
            style={styles.imagePreview}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.fileIconWrap, isImg && { backgroundColor: "#EFF6FF" }]}>
            <Ionicons
              name={getFileIcon(file.fileType)}
              size={28}
              color={isImg ? "#4C8EF7" : isDark ? "#94A3B8" : "#64748B"}
            />
          </View>
        )}

        {/* File info */}
        <View style={styles.fileInfo}>
          <Text style={styles.fileName} numberOfLines={1} ellipsizeMode="middle">
            {file.fileName ?? "Unknown file"}
          </Text>
          <Text style={styles.fileMeta}>{file.fileSizeFormatted ?? ""}</Text>
        </View>

        {/* Actions */}
        <View style={styles.fileActions}>
          <TouchableOpacity
            style={styles.fileActionBtn}
            onPress={() => downloadAndHandleFile(file.id, file.fileName, "open")}
          >
            <Ionicons name="eye-outline" size={15} color="#4C8EF7" />
            <Text style={styles.fileActionText}>View</Text>
          </TouchableOpacity>

          <View style={styles.fileActionDivider} />

          {/* <TouchableOpacity
            style={styles.fileActionBtn}
            onPress={() => downloadAndHandleFile(file.id, file.fileName, "open")}
          >
            <Ionicons name="download-outline" size={15} color="#4C8EF7" />
            <Text style={styles.fileActionText}>Download</Text>
          </TouchableOpacity> */}
        </View>

        {file.expired && (
          <View style={styles.expiredBadge}>
            <Text style={styles.expiredText}>Expired</Text>
          </View>
        )}
      </View>
    );
  };

  const renderItem = ({ item, index }: { item: SubmissionItem; index: number }) => {
    const statusCfg = STATUS_CONFIG[item.status] ?? { color: "#6B7280", bg: "#F3F4F6", icon: "help-circle-outline" };
    const isExpanded = expandedId === item.submissionId;

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.card}
        onPress={() => setExpandedId(isExpanded ? null : item.submissionId)}
      >
        {/* ── Card Header ── */}
        <View style={styles.cardHeader}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {(item.studentName ?? "?")[0].toUpperCase()}
            </Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.studentName}>{item.studentName ?? "Unknown"}</Text>
            <Text style={styles.admissionNo}>
              {"#"}
              {item.admissionNumber ?? "—"}
            </Text>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
            <Ionicons name={statusCfg.icon as any} size={12} color={statusCfg.color} />
            <Text style={[styles.statusText, { color: statusCfg.color }]}>{item.status}</Text>
          </View>
        </View>

        {/* ── Submitted at ── */}
        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={12} color="#9CA3AF" />
          <Text style={styles.metaText}>
            {item.submittedAt
              ? new Date(item.submittedAt).toLocaleString()
              : "Not submitted"}
          </Text>
          {(item.files ?? []).length > 0 && (
            <View style={styles.fileCountBadge}>
              <Ionicons name="attach-outline" size={11} color="#4C8EF7" />
              <Text style={styles.fileCountText}>{item.files.length}</Text>
            </View>
          )}
          <View style={{ flex: 1 }} />
          <Ionicons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={16}
            color="#9CA3AF"
          />
        </View>

        {/* ── Remarks ── */}
        {item.remarks ? (
          <View style={styles.remarksBox}>
            <Ionicons name="chatbubble-outline" size={12} color="#6B7280" />
            <Text style={styles.remarksText}>{item.remarks}</Text>
          </View>
        ) : null}

        {/* ── Files (expanded) ── */}
        {isExpanded && (item.files ?? []).length > 0 && (
          <View style={styles.filesSection}>
            <View style={styles.filesSectionHeader}>
              <Ionicons name="folder-open-outline" size={14} color="#4C8EF7" />
              <Text style={styles.filesSectionTitle}>Attachments</Text>
            </View>
            {item.files.map((file, fIdx) => renderFile(file, fIdx))}
          </View>
        )}

        {isExpanded && (item.files ?? []).length === 0 && (
          <View style={styles.noFilesBox}>
            <Ionicons name="document-outline" size={20} color="#9CA3AF" />
            <Text style={styles.noFilesText}>No attachments</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.replace("/staffDashboard/(tabs)/homework/homework")}
        >
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>{title}</Text>
          <Text style={styles.headerSub}>
            {"Class "}
            {className}
            {section ? ` \u2022 Section ${section}` : ""}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={() => fetchSubmissions(true)}
          disabled={refreshing}
        >
          {refreshing
            ? <ActivityIndicator size="small" color="#4C8EF7" />
            : <Ionicons name="refresh" size={20} color="#4C8EF7" />
          }
        </TouchableOpacity>
      </View>

      {/* ── Stats Row ── */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { borderColor: "#DCFCE7" }]}>
          <Text style={[styles.statNum, { color: "#16A34A" }]}>{submitted}</Text>
          <Text style={styles.statLabel}>Submitted</Text>
        </View>
        <View style={[styles.statCard, { borderColor: "#FEE2E2" }]}>
          <Text style={[styles.statNum, { color: "#DC2626" }]}>{late}</Text>
          <Text style={styles.statLabel}>Late</Text>
        </View>
        <View style={[styles.statCard, { borderColor: "#FEF3C7" }]}>
          <Text style={[styles.statNum, { color: "#D97706" }]}>{pending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={[styles.statCard, { borderColor: theme.border }]}>
          <Text style={[styles.statNum, { color: theme.text }]}>{total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
      </View>

      {/* ── List ── */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4C8EF7" />
          <Text style={[styles.emptyText, { marginTop: 12 }]}>Loading submissions...</Text>
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(item, idx) => item.submissionId ?? idx.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 12, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchSubmissions(true)}
              colors={["#4C8EF7"]}
              tintColor="#4C8EF7"
            />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="document-text-outline" size={52} color="#9CA3AF" />
              <Text style={styles.emptyText}>No submissions yet</Text>
              <Text style={styles.emptySubText}>Pull down to refresh</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

export default HomeworkSubmissions;

function getStyles(theme: Theme) {
  const isDark = theme.mode === "dark";

  return StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: 44,
    },

    /* Header */
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingBottom: 12,
    },
    backBtn: {
      width: 38,
      height: 38,
      // borderRadius: 19,
      alignItems: "center",
      justifyContent: "center",
      // borderWidth: 1,
      // borderColor: theme.border,
      marginRight: 10,
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: "700",
    },
    headerSub: {
      fontSize: 12,
      color: "#9CA3AF",
      marginTop: 2,
    },
    refreshBtn: {
      width: 38,
      height: 38,
      // borderRadius: 19,
      alignItems: "center",
      justifyContent: "center",
      // borderWidth: 1,
      // borderColor: "#BFDBFE",
      // backgroundColor: "#EFF6FF",
      marginLeft: 8,
    },

    /* Stats */
    statsRow: {
      flexDirection: "row",
      paddingHorizontal: 12,
      marginBottom: 8,
    },
    statCard: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1.5,
      marginHorizontal: 4,
      backgroundColor: theme.card,
    },
    statNum: {
      fontSize: 18,
      fontWeight: "800",
    },
    statLabel: {
      fontSize: 10,
      color: "#9CA3AF",
      fontWeight: "500",
      marginTop: 2,
    },

    /* Empty */
    center: {
      flex: 1,
      alignItems: "center",
      marginTop: 80,
    },
    emptyText: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.text,
      marginTop: 10,
    },
    emptySubText: {
      fontSize: 13,
      color: "#9CA3AF",
      marginTop: 4,
    },

    /* Card */
    card: {
      backgroundColor: theme.card,
      borderRadius: 14,
      marginVertical: 6,
      borderWidth: 1,
      borderColor: theme.border,
      overflow: "hidden",
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      padding: 14,
    },
    avatarCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "#4C8EF7",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 10,
    },
    avatarText: {
      color: "#fff",
      fontWeight: "700",
      fontSize: 16,
    },
    studentName: {
      fontSize: 15,
      fontWeight: "700",
      color: theme.text,
    },
    admissionNo: {
      fontSize: 12,
      color: "#9CA3AF",
      marginTop: 1,
    },
    statusBadge: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 20,
    },
    statusText: {
      fontSize: 11,
      fontWeight: "700",
      marginLeft: 4,
    },

    /* Meta row */
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingBottom: 12,
    },
    metaText: {
      fontSize: 11,
      color: "#9CA3AF",
      marginLeft: 4,
    },
    fileCountBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#EFF6FF",
      borderRadius: 10,
      paddingHorizontal: 6,
      paddingVertical: 2,
      marginLeft: 8,
    },
    fileCountText: {
      fontSize: 11,
      color: "#4C8EF7",
      fontWeight: "700",
      marginLeft: 2,
    },

    /* Remarks */
    remarksBox: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginHorizontal: 14,
      marginBottom: 10,
      backgroundColor: isDark ? "#1E293B" : "#F8FAFC",
      borderRadius: 8,
      padding: 10,
      borderLeftWidth: 3,
      borderLeftColor: "#4C8EF7",
    },
    remarksText: {
      fontSize: 12,
      color: theme.text,
      fontStyle: "italic",
      marginLeft: 6,
      flex: 1,
    },

    /* Files section */
    filesSection: {
      borderTopWidth: 1,
      borderTopColor: theme.border,
      paddingHorizontal: 14,
      paddingTop: 12,
      paddingBottom: 14,
    },
    filesSectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 10,
    },
    filesSectionTitle: {
      fontSize: 12,
      fontWeight: "700",
      color: "#4C8EF7",
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginLeft: 5,
    },

    /* File card */
    fileCard: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 10,
      marginBottom: 10,
      overflow: "hidden",
      backgroundColor: theme.background,
    },
    imagePreview: {
      width: "100%",
      height: 180,
      borderTopLeftRadius: 10,
      borderTopRightRadius: 10,
    },
    fileIconWrap: {
      height: 60,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDark ? "#1E293B" : "#F1F5F9",
    },
    fileInfo: {
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    fileName: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.text,
    },
    fileMeta: {
      fontSize: 11,
      color: "#9CA3AF",
      marginTop: 2,
    },
    fileActions: {
      flexDirection: "row",
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    fileActionBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 10,
    },
    fileActionDivider: {
      width: 1,
      backgroundColor: theme.border,
    },
    fileActionText: {
      fontSize: 12,
      color: "#4C8EF7",
      fontWeight: "600",
      marginLeft: 5,
    },
    expiredBadge: {
      position: "absolute",
      top: 8,
      right: 8,
      backgroundColor: "#EF4444",
      borderRadius: 6,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    expiredText: {
      color: "#fff",
      fontSize: 10,
      fontWeight: "700",
    },

    /* No files */
    noFilesBox: {
      borderTopWidth: 1,
      borderTopColor: theme.border,
      alignItems: "center",
      paddingVertical: 16,
    },
    noFilesText: {
      fontSize: 13,
      color: "#9CA3AF",
      marginTop: 4,
    },
  });
}