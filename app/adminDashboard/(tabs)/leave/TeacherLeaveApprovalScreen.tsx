import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Buffer } from "buffer";
import { useRouter } from "expo-router";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Platform,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ToastService } from "react-native-toastier";

import { ThemeContext } from "@/action/theme/ThemeContext";
import { Theme } from "@/action/theme/themeReducer";
import { API_BASE_URL, classes, sections } from "@/config";
import { getDeviceId } from "@/helper/getDeviceId";

import { LeaveRequest, LeaveStatus, ParentLeaveApi, RoleMode, StaffLeaveApi } from "@/types/leave";

import ErrorRetry from "../components/ErrorRetry";
import StudentFilters from "../components/StudentFilters";
import LeaveActionModal from "./LeaveActionModal";
import LeaveCard from "./LeaveCard";
import LeaveSkeleton from "./LeaveSkeleton";

/* ================= HELPERS ================= */

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
interface LeaveSection {
  title: string;
  data: LeaveRequest[];
}
/* ================= SCREEN ================= */

export default function TeacherLeaveApprovalScreen() {
  const router = useRouter();
  const themeCtx = useContext(ThemeContext);
  if (!themeCtx) return null;

  const { theme } = themeCtx;
  const isDark = theme.mode === "dark";
  const styles = getStyles(theme);

  /* ---------- STATE ---------- */
  const [leaveMode, setLeaveMode] = useState<RoleMode>("PARENT");
  const [leaveData, setLeaveData] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedItem, setSelectedItem] = useState<LeaveRequest | null>(null);
  const [selectedStatus, setSelectedStatus] =
    useState<LeaveStatus>("Waiting");
  const [modalVisible, setModalVisible] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [selectedClass, setSelectedClass] = useState("1");
  const [selectedSection, setSelectedSection] = useState("A");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [classModalVisible, setClassModalVisible] = useState(false);
  const [sectionModalVisible, setSectionModalVisible] = useState(false);
  const selectedDateStr = selectedDate

  /* ---------- FETCH ---------- */
  const fetchLeaves = useCallback(
    async (isRefresh = false) => {
      try {
        setError(null);
        isRefresh ? setRefreshing(true) : setLoading(true);

        const token = await AsyncStorage.getItem("auth_token");
        const encodedTenant = await AsyncStorage.getItem("auth_tenant");
        if (!token || !encodedTenant) throw new Error("Auth missing");

        const tenantId = Buffer.from(encodedTenant, "base64").toString("utf-8");
        const deviceId = await getDeviceId();

        const url =
          leaveMode === "PARENT"
            ? `${API_BASE_URL}leaves/getClassWiseLeaves?className=${selectedClass}&sectionName=${selectedSection}`
            : `${API_BASE_URL}leaves/getAllStaffLeave`;

        const res = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Tenant-ID": tenantId,
            "X-Device-ID": deviceId,
          },
        });
        
        const raw: (ParentLeaveApi | StaffLeaveApi)[] =
          leaveMode === "PARENT" ? res.data : res.data.data;
    
        
        const normalized: LeaveRequest[] = raw.map((item: any) => ({
          id: item.leaveId,
          date: `${item.fromDate} → ${item.toDate}`,
          month: new Date(item.fromDate).toLocaleString("en-US", {
            month: "long",
            year: "numeric",
          }),
          type: item.leaveType,
          duration: `${item.totalDays} Days`,
          status: mapStatus(item.status),
          personName:
            leaveMode === "PARENT" ? item.studentName : item.staffName,
          rollNumber:
            leaveMode === "PARENT"
              ? item.studentUsername
              : item.staffCode,
          remarks: item.remarks ?? "",
          personCode: item.staffCode,
          reason: item.reason
        }));

        normalized.sort(
          (a, b) =>
            new Date(b.date.split(" → ")[0]).getTime() -
            new Date(a.date.split(" → ")[0]).getTime()
        );
        console.log("--- setLeaveData|",normalized );
        setLeaveData(normalized);
      } catch {
        setError("Failed to load leave requests");
        ToastService.show({
          type: "danger",
          message: "Failed to load leave requests",
          duration: 3000,
          contentContainerStyle: { flex: 1 },
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [leaveMode, selectedClass, selectedSection]
  );

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  /* ---------- SECTION LIST ---------- */
  const sectionsData = useMemo<LeaveSection[]>(() => {
    const grouped = leaveData.reduce<Record<string, LeaveSection>>(
      (acc, item) => {
        if (!acc[item.month]) {
          acc[item.month] = {
            title: item.month,
            data: [],
          };
        }

        acc[item.month].data.push(item);
        return acc;
      },
      {}
    );

    return Object.values(grouped);
  }, [leaveData]);

  /* ---------- ACTIONS ---------- */
  const openActionModal = (item: LeaveRequest, status: LeaveStatus) => {
    setSelectedItem(item);
    setSelectedStatus(status);
    setModalVisible(true);
  };

  const updateStatus = async () => {
    if (!selectedItem) return;

    try {
      setUpdatingId(selectedItem.id);
      setModalVisible(false);

      const token = await AsyncStorage.getItem("auth_token");
      const encodedTenant = await AsyncStorage.getItem("auth_tenant");
      if (!token || !encodedTenant) throw new Error();

      const tenantId = Buffer.from(encodedTenant, "base64").toString("utf-8");
      const deviceId = await getDeviceId();

      await axios.post(
        `${API_BASE_URL}leaves/${selectedItem.id}/updateStatusLeave`,
        {},
        {
          params: {
            status: mapUIStatusToBackend(selectedStatus),
            remarks: selectedItem.remarks,
          },
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Tenant-ID": tenantId,
            "X-Device-ID": deviceId,
          },
        }
      );

      setLeaveData((prev) =>
        prev.map((i) =>
          i.id === selectedItem.id ? { ...i, status: selectedStatus } : i
        )
      );

      ToastService.show({
        type: "success",
        message: "Leave updated successfully",
        duration: 3000,
        contentContainerStyle: { flex: 1 },
      });
    } catch {
      ToastService.show({
        type: "danger",
        message: "Failed to update leave",
        duration: 3000,
        contentContainerStyle: { flex: 1 },
      });
    } finally {
      setUpdatingId(null);
    }
  };

  /* ---------- RENDER ---------- */
  return (
    <SafeAreaView style={styles.safeContainer}>
      {/* HEADER */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => router.replace("/(tabs)/home")} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} style={styles.backButton} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Leave Requests</Text>

        <View style={styles.toggleContainer}>
          <TouchableOpacity onPress={() => setLeaveMode("PARENT")}>
            <Ionicons
              name="people"
              size={24}
              color={leaveMode === "PARENT" ? "#3B82F6" : "#fff"}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setLeaveMode("STAFF")}>
            <Ionicons
              name="school"
              size={24}
              color={leaveMode === "STAFF" ? "#3B82F6" : "#fff"}
            />
          </TouchableOpacity>
        </View>
      </View>

      {leaveMode === "PARENT" ? <StudentFilters
        styles={styles}
        selectedDateStr={selectedDateStr}

        classModalVisible={classModalVisible}
        setClassModalVisible={setClassModalVisible}

        sectionModalVisible={sectionModalVisible}
        setSectionModalVisible={setSectionModalVisible}

        classOptions={classes}
        sectionOptions={sections}

        selectedClass={selectedClass}
        setSelectedClass={setSelectedClass}
        role="ADMIN"
        selectedSection={selectedSection}
        setSelectedSection={setSelectedSection}

        onDatePress={() => setShowDatePicker(true)}
      /> : null}

      {loading ? (
        <LeaveSkeleton isDark={theme.mode == "dark" ? true : false} />
      ) : error ? (
        <ErrorRetry
          message={error}
          isDark={isDark}
          onRetry={() => fetchLeaves(true)}
        />
      ) : sectionsData.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="document-text-outline"
            size={80}
            color={isDark ? "#6B7280" : "#D1D5DB"}
            style={styles.emptyIcon}
          />
          <Text style={styles.emptyTitle}>No Leave Requests</Text>
          <Text style={styles.emptySubtitle}>There are no leave requests to show.</Text>
        </View>
      ) : (
        <SectionList
          sections={sectionsData}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <LeaveCard
              item={item}
              theme={theme}
              disabled={updatingId === item.id}
              onAction={openActionModal}
              RoleMode={leaveMode}
            />
          )}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionHeader}>{section.title}</Text>
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchLeaves(true)}
            />
          }
          removeClippedSubviews
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={7}
        />
      )}


      <LeaveActionModal
        visible={modalVisible}
        item={selectedItem}
        selectedStatus={selectedStatus}
        onClose={() => setModalVisible(false)}
        onConfirm={updateStatus}
        onRemarksChange={(t) =>
          setSelectedItem((p) => (p ? { ...p, remarks: t } : p))
        }
        theme={theme}
        RoleMode={leaveMode}
      />
    </SafeAreaView>
  );
}

function getStyles(theme: Theme) {
  const isDark = theme.mode === "dark";

  return StyleSheet.create({
    safeContainer: {
      flex: 1,
      backgroundColor: isDark ? "#0F1115" : "#F5F7FA",
    },
    container: {
      flex: 1,
      backgroundColor: isDark ? "#0F1115" : "#F5F7FA",
    },
    backButton:{
      color: !isDark ? "#0F1115" : "#F5F7FA",
    },

    /* ================= HEADER ================= */
    headerContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginBottom: 8,
      // backgroundColor: isDark ? "#1C28" : "#FFFFFF",
      borderBottomWidth: 1,
      borderBottomColor: isDark ? "#2A2E3B" : "#E0E4EA",
    },
    headerBtn: {
      padding: 8,
      justifyContent: "center",
      alignItems: "center",
    },
    headerTitle: {
      flex: 1,
      textAlign: "center",
      fontSize: 20,
      fontWeight: "700",
      color: isDark ? "#F0F0F5" : "#111827",
      letterSpacing: -0.3,
    },
    headerIcon: {
      color: isDark ? "#fff" : "#4B5563",
    },
    toggleContainer: {
      flexDirection: "row",
      gap: 16,  // space between icons
      justifyContent: "flex-end",
      width: 70, // or enough to fit both icons comfortably
    },

    /* ================= FILTERS ================= */
    filterContainer: {
      flexDirection: "row",
      padding: 16,
      gap: 12,
      backgroundColor: isDark ? "#15171F" : "#E9F0FF",
      alignItems: "center",
      borderRadius: 12,
      marginHorizontal: 16,
      marginBottom: 8,
    },
    classDropdown: {
      flex: 1,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 14,
      backgroundColor: isDark ? "#1F2230" : "#FFFFFF",
      borderRadius: 10,
      borderWidth: 1,
      borderColor: isDark ? "#2C2F3C" : "#CBD5E1",
    },
    dropdownText: {
      fontSize: 15,
      color: isDark ? "#E5E5EA" : "#1F2937",
    },
    dropdownIcon: {
      fontSize: 14,
      color: isDark ? "#9CA3AF" : "#6B7280",
    },

    /* ================= LIST ================= */
    sectionHeader: {
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginTop: 8,
      marginBottom: 4,
      backgroundColor: isDark ? "#1F2230" : "#E3F2FD",
      color: !isDark ? "#1F2230" : "#E3F2FD",
      borderRadius: 12,
    },
    monthLabel: {
      fontSize: 18,
      fontWeight: "700",
      color: isDark ? "#F0F0F5" : "#1E293B",
    },
    monthCount: {
      fontSize: 12,
      fontWeight: "600",
      color: isDark ? "#60E0FA" : "#3B82F6",
      backgroundColor: isDark ? "rgba(96,224,250,0.2)" : "rgba(59,130,246,0.15)",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },

    /* ================= CARD ================= */
    card: {
      backgroundColor: isDark ? "#1C1F28" : "#FFFFFF",
      borderRadius: 16,
      marginHorizontal: 8,
      marginBottom: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.25 : 0.05,
      shadowRadius: 6,
      borderLeftWidth: 4,
      borderLeftColor: "#3B82F6",
    },
    dateIcon: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: isDark ? "rgba(96,224,250,0.15)" : "rgba(59,130,246,0.15)",
      justifyContent: "center",
      alignItems: "center",
    },
    dateText: {
      fontSize: 14,
      fontWeight: "700",
      color: isDark ? "#E5E5EA" : "#111827",
    },
    statusPill: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      alignSelf: "flex-start",
      backgroundColor: isDark ? "#292C3A" : "#F0F9FF",
    },

    /* ================= ACTIONS ================= */
    approveBtnStyle: {
      backgroundColor: isDark ? "rgba(56,233,168,0.2)" : "#DCFCE7",
    },
    rejectBtnStyle: {
      backgroundColor: isDark ? "rgba(255,106,106,0.2)" : "#FEE2E2",
    },
    actionText: {
      fontSize: 13,
      fontWeight: "600",
      color: isDark ? "#E5E5EA" : "#111827",
    },

    /* ================= MODAL ================= */
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.4)",
      justifyContent: "flex-end",
    },
    modalContainer: {
      backgroundColor: isDark ? "#1C1F28" : "#FFFFFF",
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
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
    },    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 22,
      fontWeight: "700",
      color: isDark ? "#F0F0F5" : "#111827",
    },
    modalConfirm: {
      flex: 1,
      flexDirection: "row",
      gap: 6,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#3B82F6",
    },
    modalConfirmText: {
      fontSize: 14,
      fontWeight: "700",
      color: "#FFFFFF",
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
    }, modalActions: {
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
    cardDivider: {
      height: 1,
      backgroundColor: isDark ? "#374151" : "#E5E7EB",
      marginVertical: 12,
    },
    actionsRow: {
      flexDirection: "row",
      gap: 10,
    },
    // modalTitle: {
    //   fontSize: 22,
    //   fontWeight: "700",
    //   color: isDark ? "#F3F4F6" : "#111827",
    // },
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
    }, detailDivider: {
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

  });
}