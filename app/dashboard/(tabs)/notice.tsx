import { RootState } from "@/action/store";
import { ThemeContext } from "@/action/theme/ThemeContext";
import { Theme } from "@/action/theme/themeReducer";
import ErrorRetry from "@/app/adminDashboard/(tabs)/components/ErrorRetry";
import LeaveSkeleton from "@/app/adminDashboard/(tabs)/leave/LeaveSkeleton";
import { API_BASE_URL } from "@/config";
import { getDeviceId } from "@/helper/getDeviceId";
import ConfirmationModal from "@/utils/ConfirmationModal";
import FilePreviewModal from "@/utils/Filepreviewmodal";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Buffer } from 'buffer';
import { useRouter } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ListRenderItem,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { ToastService } from "react-native-toastier";
import { useSelector } from "react-redux";
import { FilePreviewData, downloadAttachment, downloadFileToStorage, openFileExternally, shareFile } from "../../../helper/downloadnotice";

type UserRole = "STAFF" | "PARENT" | "ADMIN" | "TEACHER";

enum TargetType {
  ALL = "ALL",
  STAFF = "STAFF",
  STUDENT = "STUDENT",
  ADMIN = "ADMIN",
  ALL_STUDENTS = "ALL_STUDENTS",
}

interface Attachment {
  id: string;
  fileName: string;
  downloadUrl: string;
  fileType: string;
  fileSize: number;
}

interface Notice {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  targetType: TargetType;
  attachments?: Attachment[];
  className?: string;
  section?: string;
}

const getTargetLabel = (notice: Notice) => {
  switch (notice.targetType) {
    case TargetType.ALL:
      return "All Users";

    case TargetType.STAFF:
      return "Staff Only";

    case TargetType.STUDENT: {
      const className = notice.className?.trim();
      const section = notice.section?.trim();

      if (className && section) {
        return `Class ${className} - Section ${section}`;
      }

      if (className) {
        return `Class ${className}`;
      }

      return "Selected Students";
    }

    case TargetType.ALL_STUDENTS:
      return "All Students";

    case TargetType.ADMIN:
      return "Admin";

    default:
      return "Unknown";
  }
};

const getTargetColor = (target: TargetType) => {
  switch (target) {
    case TargetType.ALL:
      return "#2563EB";
    case TargetType.STAFF:
      return "#7C3AED";
    case TargetType.STUDENT:
      return "#059669";
    case TargetType.ALL_STUDENTS:
      return "#D97706";
    default:
      return "#6B7280";
  }
};

const getFileIcon = (fileName: string): string => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf':
      return '📕';
    case 'doc':
    case 'docx':
      return '📄';
    case 'jpg':
    case 'jpeg':
    case 'png':
      return '';
    default:
      return '📎';
  }
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

const NoticeScreen: React.FC = () => {
  const router = useRouter();
  const themeState = useContext(ThemeContext);
  const data = useSelector((state: RootState) => state.user);

  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [selectedNoticeId, setSelectedNoticeId] = useState("");

  // File preview states
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [filePreviewData, setFilePreviewData] = useState<FilePreviewData | null>(null);
  const [loadingFileAction, setLoadingFileAction] = useState(false);

  useEffect(() => {
    fetchNotices();
    const loadRole = async () => {
      const storedRole = await AsyncStorage.getItem("auth_role");
      setRole(storedRole);
    };
    loadRole();
  }, []);

  if (!themeState) return null;

  const { theme } = themeState;
  const styles = getStyles(theme);
  const isDark = theme.mode === "dark";
  const isAdmin = role === "ADMIN";

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchNotices(page + 1);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchNotices(0);
    } finally {
      setRefreshing(false);
    }
  };

  const fetchNotices = async (pageNumber: number = 0): Promise<void> => {
    try {
      pageNumber === 0 ? setLoading(true) : setLoadingMore(true);

      const token = await AsyncStorage.getItem("auth_token");
      const encodedTenant = await AsyncStorage.getItem("auth_tenant");
      const deviceId = await getDeviceId();
      if (!token || !encodedTenant) return;

      const tenantId = Buffer.from(encodedTenant, "base64").toString("utf-8");

      const response = await axios.get<{
        content: Notice[];
        last: boolean;
      }>(`${API_BASE_URL}notice/getNoticeList`, {
        params: { page: pageNumber, size: 15 },
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Tenant-ID": tenantId,
          'X-Device-ID': deviceId
        },
      });

      const filtered = filterNoticesByRole(
        response.data.content,
        data?.role as UserRole,
        data?.userDetail?.studentClass,
        data?.userDetail?.classSection
      );
      setNotices((prev) =>
        pageNumber === 0 ? filtered : [...prev, ...filtered]
      );

      setHasMore(!response.data.last);
      setPage(pageNumber);
    } catch (e) {
      setError("Error");
      console.error("Notice API error", e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const filterNoticesByRole = (
    notices: Notice[],
    role?: UserRole,
    studentClassName?: string,
    studentSection?: string
  ): Notice[] => {
    if (!role) return notices;

    return notices.filter((notice) => {
      switch (role) {
        case "STAFF":
          return (
            notice.targetType === TargetType.ALL ||
            notice.targetType === TargetType.STAFF
          );

        case "ADMIN":
          return (
            notice.targetType === TargetType.ALL ||
            notice.targetType === TargetType.STUDENT ||
            notice.targetType === TargetType.ALL_STUDENTS ||
            notice.targetType === TargetType.STAFF
          );

        case "PARENT":
          if (notice.targetType === TargetType.ALL) return true;

          if (
            notice.targetType === TargetType.STUDENT ||
            notice.targetType === TargetType.ALL_STUDENTS
          ) {
            if (!notice.className) return true;

            const classMatches =
              notice.className?.toString().trim().toLowerCase() ===
              studentClassName?.toString().trim().toLowerCase();

            const sectionMatches = notice.section
              ? notice.section.toString().trim().toLowerCase() ===
              studentSection?.toString().trim().toLowerCase()
              : true;

            return classMatches && sectionMatches;
          }

          return false;

        default:
          return false;
      }
    });
  };

  const deleteNotice = async () => {
    if (!selectedNoticeId) return;

    try {
      setLoadingDelete(true);

      const token = await AsyncStorage.getItem("auth_token");
      const encodedTenant = await AsyncStorage.getItem("auth_tenant");
      const deviceId = await getDeviceId();

      if (!token || !encodedTenant) return;

      const tenantId = Buffer.from(encodedTenant, "base64").toString("utf-8");

      await axios.delete(
        `${API_BASE_URL}notice/deleteNotice/${selectedNoticeId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Tenant-ID": tenantId,
            "X-Device-ID": deviceId,
          },
        }
      );

      setNotices((prev) =>
        prev.filter((n) => n.id !== selectedNoticeId)
      );

      ToastService.show({
        type: "success",
        message: "Notice deleted successfully",
        duration: 2000,
        contentContainerStyle: { flex: 1 },
      });

      setShowDeleteModal(false);
      setSelectedNoticeId("");
    } catch (error) {
      console.error(error);

      ToastService.show({
        type: "danger",
        message: "Notice delete failed",
        duration: 2000,
        contentContainerStyle: { flex: 1 },
      });
    } finally {
      setLoadingDelete(false);
    }
  };

  const handleDownloadAttachment = (attachmentId: string, fileName: string) => {
    downloadAttachment(
      attachmentId,
      fileName,
      (previewData: any) => {
        setFilePreviewData(previewData);
        setShowPreviewModal(true);
      },
      (error: any) => {
        console.error("Download failed:", error);
      }
    );
  };

  const handleShare = async () => {
    if (!filePreviewData) return;
    try {
      setLoadingFileAction(true);
      await shareFile(filePreviewData.uri, filePreviewData.fileName);
    } finally {
      setLoadingFileAction(false);
    }
  };

  const handleDownload = async () => {
    if (!filePreviewData) return;
    try {
      setLoadingFileAction(true);
      await downloadFileToStorage(filePreviewData.uri, filePreviewData.fileName);
      setShowPreviewModal(false);
      setFilePreviewData(null);
    } finally {
      setLoadingFileAction(false);
    }
  };

  const handleOpenExternal = async () => {
    if (!filePreviewData) return;
    try {
      setLoadingFileAction(true);
      await openFileExternally(filePreviewData.uri, filePreviewData.fileName);
    } finally {
      setLoadingFileAction(false);
    }
  };

  const renderNoticeItem: ListRenderItem<Notice> = ({ item }) => (
    <View style={styles.noticeCard}>
      {/* Date */}
      <View style={styles.dateContainer}>
        <Text style={styles.calendarIcon}>
          <Ionicons name="calendar-outline" size={20} color={"#6B7280"} />
        </Text>
        <Text style={styles.dateText}>
          {new Date(item.createdAt).toDateString()}
        </Text>
      </View>

      {/* Title */}
      <Text style={styles.noticeTitle}>{item.title}</Text>

      {/* Description */}
      <Text style={styles.description}>{item.description}</Text>

      {/* Target Type Badge */}
      <View
        style={[
          styles.badge,
          {
            backgroundColor: isDark
              ? getTargetColor(item.targetType) + "33"
              : getTargetColor(item.targetType) + "15",
          },
        ]}
      >
        <Text
          style={[
            styles.badgeText,
            { color: getTargetColor(item.targetType) },
          ]}
        >
          {getTargetLabel(item)}
        </Text>
      </View>

      {/* Attachments */}
      {item.attachments && item.attachments.length > 0 && (
        <View style={styles.attachmentsContainer}>
          {item.attachments.map((file) => (
            <TouchableOpacity
              key={file.id}
              onPress={() => handleDownloadAttachment(file.id, file.fileName)}
              style={styles.attachmentBtn}
            >
              <Text style={styles.attachmentIcon}>
                {getFileIcon(file.fileName)}
              </Text>
              <View style={styles.attachmentInfo}>
                <Text style={styles.attachmentText} numberOfLines={1}>
                  {file.fileName}
                </Text>
                <Text style={styles.attachmentType}>
                  {getFileType(file.fileName)}
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#3B82F6" />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* ADMIN ACTIONS */}
      {isAdmin && (
        <View style={styles.adminActions}>
          <Pressable
            style={[styles.adminBtn, styles.updateBtn]}
            onPress={async () => {
              router.push({
                pathname: "/adminDashboard/(tabs)/updatenotice",
                params: {
                  notice: JSON.stringify(item),
                },
              });
            }}
          >
            <MaterialIcons name="edit" size={18} color="#fff" />
            <Text style={styles.adminBtnText}>Update</Text>
          </Pressable>

          <TouchableOpacity
            style={[styles.adminBtn, styles.deleteBtn]}
            onPress={() => {
              setSelectedNoticeId(item.id);
              setShowDeleteModal(true);
            }}
          >
            <MaterialIcons name="delete" size={18} color="#fff" />
            <Text style={styles.adminBtnText}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle={theme.mode === "dark" ? "light-content" : "dark-content"}
        backgroundColor={styles.statusBar.backgroundColor}
      />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push("/(tabs)/home")}
        >
          <MaterialIcons name="arrow-back" size={24} color={styles.icon.color} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Notice</Text>

        {isAdmin ? (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push("/adminDashboard/(tabs)/addnotice")}
          >
            <MaterialIcons name="add" size={24} color={styles.icon.color} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {/* LOADER */}
      {loading && (<LeaveSkeleton isDark={isDark} />)}

      {/* LIST */}
      {!loading && error ? (
        <ErrorRetry
          message={error}
          isDark={isDark}
          loading={loading}
          onRetry={() => fetchNotices(page + 1)}
        />
      ) : notices.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="document-text-outline"
            size={80}
            color={"#6B7280"}
            style={styles.emptyIcon}
          />
          <Text style={styles.emptyTitle}>No Notice</Text>
          <Text style={styles.emptySubtitle}>There are no Notice to show.</Text>
        </View>
      ) : (
        <FlatList
          data={notices}
          renderItem={renderNoticeItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          refreshing={refreshing}
          onRefresh={onRefresh}
          scrollEnabled={!showDeleteModal && !showPreviewModal}
          ListFooterComponent={
            loadingMore ? <ActivityIndicator style={{ marginVertical: 16 }} /> : null
          }
        />
      )}

      {/* DELETE NOTICE MODAL */}
      <ConfirmationModal
        visible={showDeleteModal}
        loading={loadingDelete}
        title="Delete Notice?"
        message="This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        icon="delete-outline"
        iconColor="#EF4444"
        iconBackgroundColor="#FEE2E2"
        confirmButtonColor="#EF4444"
        isDark={theme.mode === "dark"}
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={deleteNotice}
      />

      {/* FILE PREVIEW MODAL */}
      <FilePreviewModal
        visible={showPreviewModal}
        fileData={filePreviewData}
        isDark={isDark}
        loading={loadingFileAction}
        onShare={handleShare}
        onDownload={handleDownload}
        onOpenExternal={handleOpenExternal}
        onClose={() => {
          setShowPreviewModal(false);
          setFilePreviewData(null);
        }}
      />
    </SafeAreaView>
  );
};

export default NoticeScreen;

/* ===========================
   THEME STYLES
=========================== */
function getStyles(theme: Theme) {
  const isDark = theme.mode === "dark";

  const colors = {
    background: isDark ? "#0F172A" : "#F3F4F6",
    header: isDark ? "#111827" : "#FFFFFF",
    card: isDark ? "#1E293B" : "#FFFFFF",
    border: isDark ? "#334155" : "#E5E7EB",
    textPrimary: isDark ? "#F1F5F9" : "#111827",
    textSecondary: isDark ? "#94A3B8" : "#6B7280",
    blue: "#3B82F6",
    green: "#22C55E",
    purple: "#8B5CF6",
    orange: "#F59E0B",
    red: "#EF4444",
  };

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      paddingTop: 20,
    },

    statusBar: {
      backgroundColor: isDark ? "#0B1220" : "#FFFFFF",
    },

    icon: {
      color: isDark ? "#E5E7EB" : "#000",
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
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },

    headerTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: isDark ? "#E5E7EB" : "#000",
    },

    addButton: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },

    listContainer: {
      padding: 16,
    },

    noticeCard: {
      backgroundColor: colors.card,
      borderRadius: 18,
      padding: 18,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,

      shadowColor: "#000",
      shadowOpacity: isDark ? 0 : 0.06,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: isDark ? 0 : 3,
    },

    dateContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },

    calendarIcon: {
      fontSize: 14,
      marginRight: 6,
    },

    dateText: {
      fontSize: 13,
      color: colors.textSecondary,
    },

    noticeTitle: {
      fontSize: 16,
      fontWeight: "800",
      color: isDark ? "#E5E7EB" : "#000",
    },

    description: {
      marginTop: 4,
      fontSize: 14,
      color: "#9CA3AF",
    },

    badge: {
      alignSelf: "flex-start",
      marginTop: 12,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },

    badgeText: {
      fontSize: 12,
      fontWeight: "600",
    },

    attachmentsContainer: {
      marginTop: 12,
      gap: 8,
    },

    attachmentBtn: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 10,
      backgroundColor: isDark ? "#0F172A" : "#F9FAFB",
      borderWidth: 1,
      borderColor: colors.border,
      gap: 10,
    },

    attachmentIcon: {
      fontSize: 20,
    },

    attachmentInfo: {
      flex: 1,
    },

    attachmentText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.blue,
    },

    attachmentType: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },

    adminActions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      marginTop: 12,
      gap: 10,
    },

    adminBtn: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 6,
    },

    updateBtn: {
      backgroundColor: colors.blue,
    },

    deleteBtn: {
      backgroundColor: colors.red,
    },

    adminBtnText: {
      color: "#fff",
      fontWeight: "600",
      marginLeft: 6,
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


// import { RootState } from "@/action/store";
// import { ThemeContext } from "@/action/theme/ThemeContext";
// import { Theme } from "@/action/theme/themeReducer";
// import ErrorRetry from "@/app/adminDashboard/(tabs)/components/ErrorRetry";
// import LeaveSkeleton from "@/app/adminDashboard/(tabs)/leave/LeaveSkeleton";
// import { API_BASE_URL } from "@/config";
// import { getDeviceId } from "@/helper/getDeviceId";
// import ConfirmationModal from "@/utils/ConfirmationModal";
// import { Ionicons, MaterialIcons } from "@expo/vector-icons";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import axios from "axios";
// import { Buffer } from 'buffer';
// import { useRouter } from "expo-router";
// import React, { useContext, useEffect, useState } from "react";
// import {
//   ActivityIndicator,
//   FlatList,
//   ListRenderItem,
//   Pressable,
//   SafeAreaView,
//   StatusBar,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View
// } from "react-native";
// import { ToastService } from "react-native-toastier";
// import { useSelector } from "react-redux";
// import { downloadAttachment } from "./downloadnotice";

// type UserRole = "STAFF" | "PARENT" | "ADMIN" | "TEACHER";

// enum TargetType {
//   ALL = "ALL",
//   STAFF = "STAFF",
//   STUDENT = "STUDENT",
//   ADMIN = "ADMIN",
//   ALL_STUDENTS = "ALL_STUDENTS",
// }

// interface Attachment {
//   id: string;
//   fileName: string;
//   downloadUrl: string;
//   fileType: string;
//   fileSize: number;
// }

// interface Notice {
//   id: string;
//   title: string;
//   description: string;
//   createdAt: string;
//   targetType: TargetType;
//   attachments?: Attachment[];
//   className?: string;
//   section?: string;
// }

// const getTargetLabel = (notice: Notice) => {
//   switch (notice.targetType) {
//     case TargetType.ALL:
//       return "All Users";

//     case TargetType.STAFF:
//       return "Staff Only";

//     case TargetType.STUDENT: {
//       const className = notice.className?.trim();
//       const section = notice.section?.trim();

//       if (className && section) {
//         return `Class ${className} - Section ${section}`;
//       }

//       if (className) {
//         return `Class ${className}`;
//       }

//       return "Selected Students";
//     }

//     case TargetType.ALL_STUDENTS:
//       return "All Students";

//     case TargetType.ADMIN:
//       return "Admin";

//     default:
//       return "Unknown";
//   }
// };

// const getTargetColor = (target: TargetType) => {
//   switch (target) {
//     case TargetType.ALL:
//       return "#2563EB"; // blue
//     case TargetType.STAFF:
//       return "#7C3AED"; // purple
//     case TargetType.STUDENT:
//       return "#059669"; // green
//     case TargetType.ALL_STUDENTS:
//       return "#D97706"; // orange
//     default:
//       return "#6B7280"; // gray
//   }
// };

// const NoticeScreen: React.FC = () => {
//   const router = useRouter();
//   const themeState = useContext(ThemeContext);
//   const data = useSelector((state: RootState) => state.user);
//   // console.log("useSelector|",data);

//   const [notices, setNotices] = useState<Notice[]>([]);
//   const [loading, setLoading] = useState<boolean>(false);
//   const [page, setPage] = useState(0);
//   const [hasMore, setHasMore] = useState(true);
//   const [loadingMore, setLoadingMore] = useState(false);
//   const [role, setRole] = useState<string | null>(null);
//   const [error, setError] = useState<string | null>(null);
//   const [refreshing, setRefreshing] = useState(false);
//   const [showDeleteModal, setShowDeleteModal] = useState(false);
//   const [loadingDelete, setLoadingDelete] = useState(false);
//   const [selectedNoticeId, setSelectedNoticeId] = useState("");

//   useEffect(() => {
//     fetchNotices();
//     const loadRole = async () => {
//       const storedRole = await AsyncStorage.getItem("auth_role");
//       setRole(storedRole);
//     };
//     loadRole();
//   }, []);
//   if (!themeState) return null;

//   const { theme } = themeState;
//   const styles = getStyles(theme);
//   const isDark = theme.mode === "dark";
//   const isAdmin = role === "ADMIN";

//   const loadMore = () => {
//     if (!loadingMore && hasMore) {
//       fetchNotices(page + 1);
//     }
//   };

//   const onRefresh = async () => {
//     setRefreshing(true);

//     try {
//       await fetchNotices(0); // Reload the first page
//     } finally {
//       setRefreshing(false);
//     }
//   };
//   const fetchNotices = async (pageNumber: number = 0): Promise<void> => {
//     try {
//       pageNumber === 0 ? setLoading(true) : setLoadingMore(true);

//       const token = await AsyncStorage.getItem("auth_token");
//       const encodedTenant = await AsyncStorage.getItem("auth_tenant");
//       const deviceId = await getDeviceId();
//       if (!token || !encodedTenant) return;

//       const tenantId = Buffer.from(encodedTenant, "base64").toString("utf-8");

//       const response = await axios.get<{
//         content: Notice[];
//         last: boolean;
//       }>(`${API_BASE_URL}notice/getNoticeList`, {
//         params: { page: pageNumber, size: 15 },
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "X-Tenant-ID": tenantId,
//           'X-Device-ID': deviceId

//         },
//       });

//       const filtered = filterNoticesByRole(
//         response.data.content,
//         data?.role as UserRole,
//         data?.userDetail?.studentClass,
//         data?.userDetail?.classSection
//       );
//       setNotices((prev) =>
//         pageNumber === 0 ? filtered : [...prev, ...filtered]
//       );

//       setHasMore(!response.data.last);
//       setPage(pageNumber);
//     } catch (e) {
//       setError("Error")
//       console.error("Notice API error", e);
//     } finally {
//       setLoading(false);
//       setLoadingMore(false);
//     }
//   };

//   const filterNoticesByRole = (
//     notices: Notice[],
//     role?: UserRole,
//     studentClassName?: string,
//     studentSection?: string
//   ): Notice[] => {
//     if (!role) return notices;

//     return notices.filter((notice) => {
//       switch (role) {
//         case "STAFF":
//           return (
//             notice.targetType === TargetType.ALL ||
//             notice.targetType === TargetType.STAFF
//           );

//         case "ADMIN":
//           return (
//             notice.targetType === TargetType.ALL ||
//             notice.targetType === TargetType.STUDENT ||
//             notice.targetType === TargetType.ALL_STUDENTS ||
//             notice.targetType === TargetType.STAFF
//           );

//         case "PARENT":
//           if (notice.targetType === TargetType.ALL) return true;

//           if (
//             notice.targetType === TargetType.STUDENT ||
//             notice.targetType === TargetType.ALL_STUDENTS
//           ) {
//             // If notice has no class/section restriction, show to everyone
//             if (!notice.className) return true;

//             const classMatches =
//               notice.className?.toString().trim().toLowerCase() ===
//               studentClassName?.toString().trim().toLowerCase();

//             const sectionMatches = notice.section
//               ? notice.section.toString().trim().toLowerCase() ===
//               studentSection?.toString().trim().toLowerCase()
//               : true;

//             return classMatches && sectionMatches;
//           }

//           return false;

//         default:
//           return false;
//       }
//     });
//   };

//   const deleteNotice = async () => {
//     if (!selectedNoticeId) return;

//     try {
//       setLoadingDelete(true);

//       const token = await AsyncStorage.getItem("auth_token");
//       const encodedTenant = await AsyncStorage.getItem("auth_tenant");
//       const deviceId = await getDeviceId();

//       if (!token || !encodedTenant) return;

//       const tenantId = Buffer.from(encodedTenant, "base64").toString("utf-8");

//       await axios.delete(
//         `${API_BASE_URL}notice/deleteNotice/${selectedNoticeId}`,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "X-Tenant-ID": tenantId,
//             "X-Device-ID": deviceId,
//           },
//         }
//       );

//       setNotices((prev) =>
//         prev.filter((n) => n.id !== selectedNoticeId)
//       );

//       ToastService.show({
//         type: "success",
//         message: "Notice deleted successfully",
//         duration: 2000,
//         contentContainerStyle: { flex: 1 },
//       });

//       setShowDeleteModal(false);
//       setSelectedNoticeId("");
//     } catch (error) {
//       console.error(error);

//       ToastService.show({
//         type: "danger",
//         message: "Notice delete failed",
//         duration: 2000,
//         contentContainerStyle: { flex: 1 },
//       });
//     } finally {
//       setLoadingDelete(false);
//     }
//   };


//   const renderNoticeItem: ListRenderItem<Notice> = ({ item }) => (
//     <View style={styles.noticeCard}>
//       {/* Date */}
//       <View style={styles.dateContainer}>
//         <Text style={styles.calendarIcon}>
//           <Ionicons name="calendar-outline"
//             size={20}
//             color={"#6B7280"} />  </Text>
//         <Text style={styles.dateText}>
//           {new Date(item.createdAt).toDateString()}
//         </Text>
//       </View>

//       {/* Title */}
//       <Text style={styles.noticeTitle}>{item.title}</Text>

//       {/* Description */}
//       <Text style={styles.description}>{item.description}</Text>

//       {/* Target Type Badge */}
//       <View
//         style={[
//           styles.badge,
//           {
//             backgroundColor: isDark
//               ? getTargetColor(item.targetType) + "33"
//               : getTargetColor(item.targetType) + "15",
//           },
//         ]}
//       >
//         <Text
//           style={[
//             styles.badgeText,
//             { color: getTargetColor(item.targetType) },
//           ]}
//         >
//           {getTargetLabel(item)}
//         </Text>
//       </View>

//       {/* Attachments */}
//       {item.attachments && item.attachments.length > 0 && (
//         <View style={styles.attachmentsContainer}>
//           {item.attachments.map((file) => (
//             <TouchableOpacity
//               key={file.id}
//               onPress={() => downloadAttachment(file.id, file.fileName)}
//               style={styles.attachmentBtn}
//             >
//               <Text style={styles.attachmentText}>📎 {file.fileName}</Text>
//             </TouchableOpacity>
//           ))}
//         </View>
//       )}

//       {/* 🔐 ADMIN ACTIONS */}
//       {isAdmin && (
//         <View style={styles.adminActions}>
//           {/* UPDATE */}

//           <Pressable
//             style={[styles.adminBtn, styles.updateBtn]}
//             onPress={async () => {
//               router.push({
//                 pathname: "/adminDashboard/(tabs)/updatenotice",
//                 params: {
//                   notice: JSON.stringify(item),
//                 },
//               });
//             }} >
//             <MaterialIcons name="edit" size={18} color="#fff" />
//             <Text style={styles.adminBtnText}>Update</Text>
//           </Pressable>

//           {/* DELETE */}
//           <TouchableOpacity
//             style={[styles.adminBtn, styles.deleteBtn]}
//             onPress={() => {
//               setSelectedNoticeId(item.id);
//               setShowDeleteModal(true);
//             }}
//           >
//             <MaterialIcons name="delete" size={18} color="#fff" />
//             <Text style={styles.adminBtnText}>Delete</Text>
//           </TouchableOpacity>
//         </View>
//       )}
//     </View>
//   );


//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar
//         barStyle={theme.mode === "dark" ? "light-content" : "dark-content"}
//         backgroundColor={styles.statusBar.backgroundColor}
//       />

//       {/* HEADER */}
//       <View style={styles.header}>
//         <TouchableOpacity
//           style={styles.backButton}
//           onPress={() => router.push("/(tabs)/home")}
//         >
//           <MaterialIcons name="arrow-back" size={24} color={styles.icon.color} />
//         </TouchableOpacity>

//         <Text style={styles.headerTitle}>Notice</Text>

//         {isAdmin ? (
//           <TouchableOpacity
//             style={styles.addButton}
//             onPress={() => router.push("/adminDashboard/(tabs)/addnotice")}
//           >
//             <MaterialIcons name="add" size={24} color={styles.icon.color} />
//           </TouchableOpacity>
//         ) : (
//           <View style={{ width: 40 }} />
//         )}
//       </View>

//       {/* LOADER */}
//       {loading && (<LeaveSkeleton isDark={isDark} />)}

//       {/* LIST */}
//       {!loading && error ? (
//         <ErrorRetry
//           message={error}
//           isDark={isDark}
//           loading={loading}
//           onRetry={() => fetchNotices(page + 1)}
//         />
//       ) : notices.length === 0 ? (
//         <View style={styles.emptyContainer}>
//           <Ionicons
//             name="document-text-outline"
//             size={80}
//             color={"#6B7280"}
//             style={styles.emptyIcon}
//           />
//           <Text style={styles.emptyTitle}>No Notice</Text>
//           <Text style={styles.emptySubtitle}>There are no Notice  to show.</Text>
//         </View>
//       ) : (
//         <FlatList
//           data={notices}
//           renderItem={renderNoticeItem}
//           keyExtractor={(item) => item.id}
//           contentContainerStyle={styles.listContainer}
//           onEndReached={loadMore}
//           onEndReachedThreshold={0.5}
//           refreshing={refreshing}
//           onRefresh={onRefresh}
//           scrollEnabled={!showDeleteModal}
//           ListFooterComponent={
//             loadingMore ? <ActivityIndicator style={{ marginVertical: 16 }} /> : null
//           }
//         />
//       )}
//       <ConfirmationModal
//         visible={showDeleteModal}
//         loading={loadingDelete}
//         title="Delete Notice?"
//         message="This action cannot be undone."
//         confirmText="Delete"
//         cancelText="Cancel"
//         icon="delete-outline"
//         iconColor="#EF4444"
//         iconBackgroundColor="#FEE2E2"
//         confirmButtonColor="#EF4444"
//         isDark={theme.mode === "dark"}
//         onCancel={() => setShowDeleteModal(false)}
//         onConfirm={deleteNotice}
//       />
//     </SafeAreaView>
//   );
// };

// export default NoticeScreen;

// /* ===========================
//    THEME STYLES
// =========================== */
// function getStyles(theme: Theme) {
//   const isDark = theme.mode === "dark";

//   const colors = {
//     background: isDark ? "#0F172A" : "#F3F4F6",
//     header: isDark ? "#111827" : "#FFFFFF",
//     card: isDark ? "#1E293B" : "#FFFFFF",
//     border: isDark ? "#334155" : "#E5E7EB",
//     textPrimary: isDark ? "#F1F5F9" : "#111827",
//     textSecondary: isDark ? "#94A3B8" : "#6B7280",
//     blue: "#3B82F6",
//     green: "#22C55E",
//     purple: "#8B5CF6",
//     orange: "#F59E0B",
//     red: "#EF4444",
//   };

//   return StyleSheet.create({
//     container: {
//       flex: 1,
//       backgroundColor: theme.background,
//       paddingTop: 20,
//     },

//     statusBar: {
//       backgroundColor: isDark ? "#0B1220" : "#FFFFFF",
//     },

//     icon: {
//       color: isDark ? "#E5E7EB" : "#000",
//     },

//     header: {
//       flexDirection: "row",
//       alignItems: "center",
//       justifyContent: "space-between",
//       paddingHorizontal: 16,
//       paddingVertical: 16,
//       backgroundColor: theme.background,
//       borderBottomWidth: 1,
//       borderBottomColor: isDark ? "#1F2937" : "#F0F0F0",
//     },

//     backButton: {
//       width: 40,
//       height: 40,
//       alignItems: "center",
//       justifyContent: "center",
//     },

//     headerTitle: {
//       fontSize: 20,
//       fontWeight: "700",
//       color: isDark ? "#E5E7EB" : "#000",
//     },

//     addButton: {
//       width: 40,
//       height: 40,
//       alignItems: "center",
//       justifyContent: "center",
//     },

//     listContainer: {
//       padding: 16,
//     },

//     noticeCard: {
//       backgroundColor: colors.card,
//       borderRadius: 18,
//       padding: 18,
//       marginBottom: 10,
//       borderWidth: 1,
//       borderColor: colors.border,

//       shadowColor: "#000",
//       shadowOpacity: isDark ? 0 : 0.06,
//       shadowRadius: 12,
//       shadowOffset: { width: 0, height: 4 },
//       elevation: isDark ? 0 : 3,
//     },

//     dateContainer: {
//       flexDirection: "row",
//       alignItems: "center",
//       marginBottom: 8,
//     },

//     calendarIcon: {
//       fontSize: 14,
//       marginRight: 6,
//     },

//     dateText: {
//       fontSize: 13,
//       color: colors.textSecondary,
//     },

//     noticeTitle: {
//       fontSize: 16,
//       fontWeight: "800",
//       color: isDark ? "#E5E7EB" : "#000",
//     },

//     description: {
//       marginTop: 4,
//       fontSize: 14,
//       color: "#9CA3AF",
//     },

//     badge: {
//       alignSelf: "flex-start",
//       marginTop: 12,
//       paddingHorizontal: 12,
//       paddingVertical: 6,
//       borderRadius: 20,
//     },

//     badgeText: {
//       fontSize: 12,
//       fontWeight: "600",
//     },

//     attachmentsContainer: {
//       marginTop: 12,
//     },

//     attachmentBtn: {
//       flexDirection: "row",
//       alignItems: "center",
//       paddingVertical: 8,
//       paddingHorizontal: 12,
//       borderRadius: 10,
//       marginVertical: 4,
//       backgroundColor: isDark ? "#0F172A" : "#F9FAFB",
//       borderWidth: 1,
//       borderColor: colors.border,
//     },

//     attachmentText: {
//       fontSize: 14,
//       fontWeight: "600",
//       color: colors.blue,
//     },
//     adminActions: {
//       flexDirection: "row",
//       justifyContent: "flex-end",
//       marginTop: 12,
//       gap: 10,
//     },

//     adminBtn: {
//       flexDirection: "row",
//       alignItems: "center",
//       paddingVertical: 6,
//       paddingHorizontal: 12,
//       borderRadius: 6,
//     },

//     updateBtn: {
//       backgroundColor: colors.blue,
//     },

//     deleteBtn: {
//       backgroundColor: colors.red,
//     },

//     adminBtnText: {
//       color: "#fff",
//       fontWeight: "600",
//       marginLeft: 6,
//     },
//     emptyContainer: {
//       flex: 1,
//       justifyContent: "center",
//       alignItems: "center",
//       paddingHorizontal: 32,
//     },
//     emptyIcon: {
//       marginBottom: 20,
//     },
//     emptyTitle: {
//       fontSize: 22,
//       fontWeight: "700",
//       color: isDark ? "#F3F4F6" : "#111827",
//       marginBottom: 8,
//     },
//     emptySubtitle: {
//       fontSize: 14,
//       color: isDark ? "#A1A1AA" : "#6B7280",
//       textAlign: "center",
//     },

//   });
// }