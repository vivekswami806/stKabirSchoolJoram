import { RootState } from "@/action/store";
import { ThemeContext } from "@/action/theme/ThemeContext";
import { Theme } from "@/action/theme/themeReducer";
import LeaveSkeleton from "@/app/adminDashboard/(tabs)/leave/LeaveSkeleton";
import Spinner from "@/components/spinner";
import { API_BASE_URL } from "@/config";
import { getDeviceId } from "@/helper/getDeviceId";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Buffer } from "buffer";
import { useRouter } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  Modal,
  Platform,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";

const { width, height } = Dimensions.get("window");

type LeaveStatus = "Approved" | "Cancelled" | "Waiting";

interface LeaveRequest {
  id: string;
  date: string;
  month: string;
  type: string;
  duration: string;
  status: LeaveStatus;
  studentName: string;
  rollNumber: string;
  remarks: string
}

interface SectionData {
  title: string;
  data: LeaveRequest[];
}

const mapStatus = (status: string): LeaveStatus => {
  switch (status) {
    case "APPROVED":
      return "Approved";
    case "REJECTED":
      return "Cancelled";
    default:
      return "Waiting";
  }
};

const mapUIStatusToBackend = (status: LeaveStatus) => {
  switch (status) {
    case "Approved":
      return "APPROVED";
    case "Cancelled":
      return "REJECTED";
    default:
      return "PENDING";
  }
};

function getStatusColor(status: LeaveStatus, isDark: boolean) {
  switch (status) {
    case "Approved":
      return {
        bg: isDark ? "#064E3B" : "#D1FAE5",
        text: isDark ? "#6EE7B7" : "#065F46",
      };
    case "Cancelled":
      return {
        bg: isDark ? "#7F1D1D" : "#FEE2E2",
        text: isDark ? "#FCA5A5" : "#991B1B",
      };
    default: // Waiting
      return {
        bg: isDark ? "#1E3A8A" : "#DBEAFE",
        text: isDark ? "#93C5FD" : "#1D4ED8",
      };
  }
}


export default function TeacherLeaveApprovalScreen() {
  const router = useRouter();
  const themeState = useContext(ThemeContext);
  const { userDetail } = useSelector((state: RootState) => state.user);
  if (!themeState) return null;
  const { theme } = themeState;
  const styles = getStyles(theme);
  const isDark = theme.mode === "dark";

  const [leaveData, setLeaveData] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<LeaveRequest | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<LeaveStatus>("Waiting");
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchLeaves(1);
  }, []);

  const formatDateRange = (from: string, to: string) => `${from} → ${to}`;
  const getMonthLabel = (date: string) =>
    new Date(date).toLocaleString("en-US", { month: "long", year: "numeric" });

  const fetchLeaves = async (pageNumber = 1, isRefresh = false) => {
    if (!hasMore && !isRefresh) return;
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("auth_token");
      const encodedTenant = await AsyncStorage.getItem("auth_tenant");
      if (!token || !encodedTenant) throw new Error("Auth missing");
      const deviceId = await getDeviceId();
      let tenantId = Buffer.from(encodedTenant, "base64").toString("utf-8");

      const response = await axios.get(
        `${API_BASE_URL}leaves/getClassWiseLeaves?className=${userDetail.staffClass}&sectionName=A`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Tenant-ID": tenantId,
            "X-Device-ID": deviceId
          },
        }
      );
      const sortedLeaves = response.data.sort(
        (a: any, b: any) =>
          new Date(b.fromDate).getTime() - new Date(a.fromDate).getTime()
      );
      const newData: LeaveRequest[] = sortedLeaves.map((item: any) => ({
        id: item.leaveId,
        date: formatDateRange(item.fromDate, item.toDate),
        month: getMonthLabel(item.fromDate),
        type: item.leaveType,
        duration: `${item.totalDays} Days`,
        status: mapStatus(item.status),
        studentName: item.studentName,
        rollNumber: item.studentUsername,
      }));
      const more = response.data?.meta?.hasMore ?? false;

      setLeaveData((prev) => (isRefresh ? newData : [...prev, ...newData]));
      setHasMore(more);
      setPage(pageNumber);
    } catch (error) {
      Alert.alert("Error", "Failed to load leave requests");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadMoreLeaves = () => {
    if (!loading && hasMore) {
      fetchLeaves(page + 1);
    }
  };

  const refreshLeaves = () => {
    setRefreshing(true);
    setHasMore(true);
    fetchLeaves(1, true);
  };

  const sections: SectionData[] = Object.values(
    leaveData.reduce((acc: any, item) => {
      if (!acc[item.month]) acc[item.month] = { title: item.month, data: [] };
      acc[item.month].data.push(item);
      return acc;
    }, {})
  );

  const confirmStatusChange = (item: LeaveRequest, status: LeaveStatus) => {
    setSelectedItem(item);
    setSelectedStatus(status);
    setModalVisible(true);
  };
  const statusColor = getStatusColor(selectedStatus, theme.mode === "dark");
  const updateStatus = async () => {
    if (!selectedItem) return;

    try {
      setUpdatingId(selectedItem.id);
      setModalVisible(false);

      const token = await AsyncStorage.getItem("auth_token");
      const encodedTenant = await AsyncStorage.getItem("auth_tenant");
      const deviceId = await getDeviceId();
      if (!token || !encodedTenant) throw new Error("Auth missing");

      const tenantId = Buffer.from(encodedTenant, "base64").toString("utf-8");
      let status = mapUIStatusToBackend(selectedStatus);
      console.log("---selectedItem.id|", selectedItem.id, "|", status, "--- deviceId|", deviceId);

      let res = await axios.post(
        `${API_BASE_URL}leaves/${selectedItem.id}/updateStatusLeave?status=${status}&remarks=${selectedItem.remarks}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Tenant-ID": tenantId,
            "X-Device-ID": deviceId
          },
        }
      );

      setLeaveData((prev) =>
        prev.map((item) =>
          item.id === selectedItem.id
            ? { ...item, status: selectedStatus }
            : item
        )
      );
      console.log("---res|", res);

      Alert.alert(
        "Success",
        `Leave ${selectedStatus === "Approved" ? "Approved" : "Rejected"} successfully`
      );
    } catch (error) {
      Alert.alert("Error", "Failed to update leave status");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top']}>
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.headerContainer}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/home")}
              style={styles.headerBtn}
            >
              <Ionicons name="arrow-back" size={24} style={styles.headerIcon} />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Leave Requests</Text>
              <Text style={styles.headerSubtitle}>
                {leaveData.length} request{leaveData.length !== 1 ? 's' : ''}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push("/staffDashboard/(tabs)/teacherleave")}
              style={styles.headerBtn}
            >
              <Text style={{ fontSize: 22 }}>🗓️</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/staffDashboard/(tabs)/addleave")}
              style={styles.headerBtn}
            >
              <Ionicons name="add-circle" size={28} style={styles.headerIcon} />
            </TouchableOpacity>
          </View>
        </View>

        {/* CONTENT */}
        {loading && leaveData.length === 0 ? (
          // <View style={styles.loadingContainer}>
          <LeaveSkeleton isDark={isDark} />
          // </View>
        ) : leaveData.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="document-outline" size={60} style={styles.emptyIcon} />
            </View>
            <Text style={styles.emptyTitle}>No Leave Requests</Text>
            <Text style={styles.emptySubtitle}>
              All leave requests have been processed
            </Text>
          </View>
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            renderSectionHeader={({ section }) => (
              <View style={styles.sectionHeader}>
                <Text style={styles.monthLabel}>{section.title}</Text>
                <View style={styles.badgeContainer}>
                  <Text style={styles.monthCount}>{section.data.length}</Text>
                </View>
              </View>
            )}
            renderItem={({ item }) => (
              <LeaveCard
                item={item}
                disabled={updatingId === item.id}
                onAction={confirmStatusChange}
                theme={theme}
              />
            )}
            onEndReached={loadMoreLeaves}
            onEndReachedThreshold={0.4}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={refreshLeaves}
                tintColor={theme.mode === "dark" ? "#60A5FA" : "#3B82F6"}
              />
            }
            contentContainerStyle={styles.listContent}
            scrollEnabled={true}
            nestedScrollEnabled={true}
            ListFooterComponent={
              hasMore && !loading ? (
                <View style={styles.footerLoader}>
                  <Spinner />
                </View>
              ) : null
            }
          />
        )}

        {/* CONFIRM MODAL */}
        <Modal transparent visible={modalVisible} animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHandle} />

              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Confirm Action</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Ionicons name="close" size={24} style={styles.closeIcon} />
                  </TouchableOpacity>
                </View>

                {selectedItem && (
                  <>
                    <View style={styles.modalDetails}>
                      <View style={styles.detailRow}>
                        <View style={styles.detailIconContainer}>
                          <Ionicons name="person-circle" size={20} style={styles.detailIcon} />
                        </View>
                        <View style={styles.detailTextContainer}>
                          <Text style={styles.detailLabel}>Student</Text>
                          <Text style={styles.detailValue}>{selectedItem.studentName}</Text>
                        </View>
                      </View>

                      <View style={styles.detailDivider} />

                      <View style={styles.detailRow}>
                        <View style={styles.detailIconContainer}>
                          <Ionicons name="calendar" size={20} style={styles.detailIcon} />
                        </View>
                        <View style={styles.detailTextContainer}>
                          <Text style={styles.detailLabel}>Duration</Text>
                          <Text style={styles.detailValue}>{selectedItem.duration}</Text>
                        </View>
                      </View>

                      <View style={styles.detailDivider} />

                      <View style={styles.detailRow}>
                        <View style={styles.detailIconContainer}>
                          <Ionicons name="document-text" size={20} style={styles.detailIcon} />
                        </View>
                        <View style={styles.detailTextContainer}>
                          <Text style={styles.detailLabel}>Leave Type</Text>
                          <Text style={styles.detailValue}>{selectedItem.type}</Text>
                        </View>
                      </View>

                      <View style={styles.detailRow}>
                        <View style={styles.detailIconContainer}>
                          <Ionicons name="text" size={20} style={styles.detailIcon} />
                        </View>
                        <View style={styles.detailTextContainer}>
                          <Text style={styles.detailLabel}>Remarks</Text>
                          <TextInput
                            style={styles.detailValue}
                            value={selectedItem.remarks}
                            onChangeText={(text) =>
                              setSelectedItem({ ...selectedItem, remarks: text || "OK" })
                            }
                            placeholder="Enter leave type"
                          />
                        </View>
                      </View>

                    </View>

                    <View style={styles.statusContainer}>
                      <Text style={styles.statusLabel}>Mark as:</Text>

                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: statusColor.bg }, // ✅ FIX
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            { color: statusColor.text }, // ✅ FIX
                          ]}
                        >
                          {selectedStatus}
                        </Text>
                      </View>
                    </View>
                  </>
                )}

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalCancel}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.modalConfirm,
                      {
                        backgroundColor: selectedStatus === "Approved"
                          ? (isDark ? "#059669" : "#10B981")
                          : (isDark ? "#DC2626" : "#EF4444"),
                      }
                    ]}
                    onPress={updateStatus}
                  >
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={styles.modalConfirmText}>Confirm</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const LeaveCard = ({
  item,
  onAction,
  disabled,
  theme,
}: {
  item: LeaveRequest;
  disabled: boolean;
  onAction: (item: LeaveRequest, status: LeaveStatus) => void;
  theme: Theme;
}) => {
  const isDark = theme.mode === "dark";
  const styles = getStyles(theme);
  const statusColor = getStatusColor(item.status, isDark);

  return (
    <View style={[styles.card, disabled && styles.cardDisabled]}>
      <View style={styles.cardHeader}>
        <View style={styles.dateSection}>
          <View style={styles.dateIcon}>
            <Ionicons
              name="calendar-outline"
              size={18}
              color={isDark ? "#60A5FA" : "#3B82F6"}
            />
          </View>
          <View>
            <Text style={styles.dateLabel}>Leave Period</Text>
            <Text style={styles.dateText}>{item.date}</Text>
          </View>
        </View>
        <View
          style={[
            styles.statusPill,
            { backgroundColor: statusColor.bg },
          ]}
        >
          <Text style={[styles.statusLabel, { color: statusColor.text }]}>
            {item.status}
          </Text>
        </View>
      </View>

      <View style={styles.cardDivider} />

      <View style={styles.cardBody}>
        <View style={styles.studentSection}>
          <Ionicons
            name="person-outline"
            size={18}
            color={isDark ? "#60A5FA" : "#3B82F6"}
          />
          <View style={styles.studentInfo}>
            <Text style={styles.studentName}>{item.studentName}</Text>
            <Text style={styles.rollNumber}>Roll: {item.rollNumber}</Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons
              name="hourglass-outline"
              size={14}
              color={isDark ? "#A1A1AA" : "#6B7280"}
            />
            <Text style={styles.metaText}>{item.duration}</Text>
          </View>
          <View style={styles.metaSeparator} />
          <View style={styles.metaItem}>
            <Ionicons
              name="document-text-outline"
              size={14}
              color={isDark ? "#A1A1AA" : "#6B7280"}
            />
            <Text style={styles.metaText}>{item.type}</Text>
          </View>
        </View>
      </View>

      {item.status === "Waiting" && (
        <>
          <View style={styles.cardDivider} />
          <View style={styles.actionsRow}>
            <TouchableOpacity
              disabled={disabled}
              style={[
                styles.actionBtn,
                styles.approveBtnStyle,
                disabled && styles.actionBtnDisabled,
              ]}
              onPress={() => onAction(item, "Approved")}
            >
              <Ionicons
                name="checkmark-circle"
                size={18}
                color={isDark ? "#86EFAC" : "#059669"}
              />
              <Text style={[styles.actionText, { color: isDark ? "#86EFAC" : "#059669" }]}>
                Approve
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              disabled={disabled}
              style={[
                styles.actionBtn,
                styles.rejectBtnStyle,
                disabled && styles.actionBtnDisabled,
              ]}
              onPress={() => onAction(item, "Cancelled")}
            >
              <Ionicons
                name="close-circle"
                size={18}
                color={isDark ? "#FCA5A5" : "#DC2626"}
              />
              <Text style={[styles.actionText, { color: isDark ? "#FCA5A5" : "#DC2626" }]}>
                Reject
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

function getStyles(theme: Theme) {
  const isDark = theme.mode === "dark";

  return StyleSheet.create({
    safeContainer: {
      flex: 1,
      backgroundColor: isDark ? theme.background: theme.background,
    },
    container: {
      flex: 1,
      backgroundColor: theme.background  //isDark ? "#111827" : "#F9FAFB",
    },

    /* ================= HEADER ================= */
    headerContainer: {
      backgroundColor: theme.background, //isDark ? "#1F2937" : "#FFFFFF",
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginBottom: 0,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? "#374151" : "#E5E7EB",
    },
    headerTop: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      minHeight: 20,
    },
    headerBtn: {
      padding: 8,
      borderRadius: 10,
      width: 44,
      height: 44,
      justifyContent: "center",
      alignItems: "center",
    },
    headerIcon: {
      color: isDark ? "#F3F4F6" : "#000",
    },
    headerCenter: {
      flex: 1,
      marginHorizontal: 12,
      justifyContent: "center",
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: isDark ? "#F3F4F6" : "#000",
      letterSpacing: -0.3,
    },
    headerSubtitle: {
      fontSize: 13,
      color: isDark ? "#9CA3AF" : "#6B7280",
      marginTop: 4,
    },

    /* ================= LOADING & EMPTY ================= */
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 32,
    },
    loadingIcon: {
      color: isDark ? "#4B5563" : "#D1D5DB",
      marginBottom: 16,
    },
    loadingText: {
      fontSize: 16,
      color: isDark ? "#A1A1AA" : "#6B7280",
      fontWeight: "500",
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 32,
    },
    emptyIconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: isDark ? "rgba(96,165,250,0.1)" : "rgba(59,130,246,0.1)",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 20,
    },
    emptyIcon: {
      color: isDark ? "#60A5FA" : "#3B82F6",
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: isDark ? "#F3F4F6" : "#111827",
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: 14,
      color: isDark ? "#A1A1AA" : "#6B7280",
      textAlign: "center",
    },

    /* ================= LIST ================= */
    listContent: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      paddingBottom: 10,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 8,
      paddingVertical: 14,
      marginTop: 0,
      marginBottom: 0,
    },
    monthLabel: {
      fontSize: 18,
      fontWeight: "700",
      color: isDark ? "#E9EFFC" : "#111827",
    },
    badgeContainer: {
      flexDirection: "row",
    },
    monthCount: {
      fontSize: 12,
      fontWeight: "600",
      color: isDark ? "#60A5FA" : "#3B82F6",
      backgroundColor: isDark ? "rgba(96,165,250,0.2)" : "rgba(59,130,246,0.1)",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    footerLoader: {
      paddingVertical: 20,
      alignItems: "center",
    },
    footerText: {
      color: isDark ? "#A1A1AA" : "#6B7280",
      fontSize: 12,
      fontWeight: "500",
    },

    /* ================= CARD ================= */
    card: {
      backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
      borderRadius: 14,
      marginHorizontal: 4,
      marginBottom: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.2 : 0.05,
      shadowRadius: 6,
      borderLeftWidth: 4,
      borderLeftColor: "#3B82F6",
    },
    cardDisabled: {
      opacity: 0.6,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 12,
      gap: 8,
    },
    dateSection: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      flex: 1,
    },
    dateIcon: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: isDark ? "rgba(96,165,250,0.1)" : "rgba(59,130,246,0.1)",
      justifyContent: "center",
      alignItems: "center",
    },
    dateLabel: {
      fontSize: 11,
      color: isDark ? "#9CA3AF" : "#6B7280",
      fontWeight: "500",
      marginBottom: 2,
    },
    dateText: {
      fontSize: 14,
      fontWeight: "700",
      color: isDark ? "#F3F4F6" : "#111827",
    },
    statusPill: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      alignSelf: "flex-start",
    },
    // statusLabel: {
    //   fontSize: 12,
    //   fontWeight: "600",
    // },
    cardDivider: {
      height: 1,
      backgroundColor: isDark ? "#374151" : "#E5E7EB",
      marginVertical: 12,
    },
    cardBody: {
      gap: 12,
    },
    studentSection: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    studentInfo: {
      flex: 1,
    },
    studentName: {
      fontSize: 15,
      fontWeight: "600",
      color: isDark ? "#F3F4F6" : "#1F2937",
      marginBottom: 2,
    },
    rollNumber: {
      fontSize: 12,
      color: isDark ? "#9CA3AF" : "#6B7280",
      fontWeight: "500",
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    metaItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      flex: 1,
    },
    metaSeparator: {
      width: 1,
      height: 14,
      backgroundColor: isDark ? "#4B5563" : "#D1D5DB",
    },
    metaText: {
      fontSize: 12,
      color: isDark ? "#9CA3AF" : "#6B7280",
      fontWeight: "500",
    },

    /* ================= ACTIONS ================= */
    actionsRow: {
      flexDirection: "row",
      gap: 10,
    },
    actionBtn: {
      flex: 1,
      flexDirection: "row",
      paddingVertical: 11,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    },
    approveBtnStyle: {
      backgroundColor: isDark ? "rgba(134,239,172,0.15)" : "#ECFDF5",
    },
    rejectBtnStyle: {
      backgroundColor: isDark ? "rgba(252,165,165,0.15)" : "#FEF2F2",
    },
    actionBtnDisabled: {
      opacity: 0.5,
    },
    actionText: {
      fontSize: 13,
      fontWeight: "600",
    },

    /* ================= MODAL ================= */
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.4)",
      justifyContent: "flex-end",
    },
    modalContainer: {
      backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: height * 0.85,
      paddingBottom: Platform.OS === "ios" ? 20 : 0,
    },
    modalHandle: {
      width: 40,
      height: 4,
      backgroundColor: isDark ? "#4B5563" : "#D1D5DB",
      borderRadius: 2,
      alignSelf: "center",
      marginTop: 12,
      marginBottom: 8,
    },
    modalContent: {
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 22,
      fontWeight: "700",
      color: isDark ? "#F3F4F6" : "#111827",
    },
    closeIcon: {
      color: isDark ? "#9CA3AF" : "#6B7280",
    },
    modalDetails: {
      backgroundColor: isDark ? "rgba(96,165,250,0.05)" : "rgba(59,130,246,0.05)",
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
      borderLeftWidth: 4,
      borderLeftColor: isDark ? "#60A5FA" : "#3B82F6",
    },
    detailRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    detailIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: isDark ? "rgba(96,165,250,0.1)" : "rgba(59,130,246,0.1)",
      justifyContent: "center",
      alignItems: "center",
    },
    detailIcon: {
      color: isDark ? "#60A5FA" : "#3B82F6",
    },
    detailTextContainer: {
      flex: 1,
    },
    detailLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: isDark ? "#9CA3AF" : "#6B7280",
      marginBottom: 2,
    },
    detailValue: {
      fontSize: 14,
      fontWeight: "600",
      color: isDark ? "#F3F4F6" : "#111827",
    },
    detailDivider: {
      height: 1,
      backgroundColor: isDark ? "rgba(96,165,250,0.1)" : "rgba(59,130,246,0.1)",
      marginVertical: 12,
    },
    /* ================= STATUS (MODAL) ================= */
    statusContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 20,
    },
    statusLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: isDark ? "#D1D5DB" : "#374151",
    },
    statusBadge: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 20,
    },
    statusBadgeText: {
      fontSize: 13,
      fontWeight: "700",
      textTransform: "capitalize",
    },

    /* ================= MODAL ACTIONS ================= */
    modalActions: {
      flexDirection: "row",
      gap: 12,
      marginTop: 10,
    },
    modalCancel: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? "#4B5563" : "#D1D5DB",
      alignItems: "center",
      justifyContent: "center",
    },
    modalCancelText: {
      fontSize: 14,
      fontWeight: "600",
      color: isDark ? "#E5E7EB" : "#374151",
    },
    modalConfirm: {
      flex: 1,
      flexDirection: "row",
      gap: 6,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    modalConfirmText: {
      fontSize: 14,
      fontWeight: "700",
      color: "#FFFFFF",
    },

  });
}