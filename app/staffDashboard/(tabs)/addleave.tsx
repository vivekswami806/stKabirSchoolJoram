import { RootState } from "@/action/store";
import { ThemeContext } from "@/action/theme/ThemeContext";
import { Theme } from "@/action/theme/themeReducer";
import { API_BASE_URL } from "@/config";
import { getDeviceId } from "@/helper/getDeviceId";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Buffer } from 'buffer';
import { useRouter } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { ToastService } from "react-native-toastier";
import { useSelector } from "react-redux";

type LeaveType = "SICK" | "CASUAL" | "";

export default function ApplyLeave() {
  const router = useRouter();
  const themeState = useContext(ThemeContext);
  const { userDetail } = useSelector((state: RootState) => state.user);
  if (!themeState) return null;
  const { theme } = themeState;
  const [loading, setLoading] = useState(false);

  const styles = getStyles(theme);
  const [role, setRole] = useState<string | null>(null);
  useEffect(() => {
    const loadRole = async () => {
      const storedRole = await AsyncStorage.getItem("auth_role");
      setRole(storedRole);
    };
    loadRole();
  }, []);

  const [leaveType, setLeaveType] = useState<LeaveType>("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  const [halfDay, setHalfDay] = useState(false);
  const [fullDay, setFullDay] = useState(false);

  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [pickerType, setPickerType] = useState<"start" | "end">("start");
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  const openDatePicker = (type: "start" | "end") => {
    setPickerType(type);
    setDatePickerVisible(true);
  };

  const handleDateConfirm = (date: Date) => {
    const formatted = date.toISOString().split("T")[0];

    if (pickerType === "end" && startDate && formatted < startDate) {
      ToastService.show({
        type: "info",
        message: "End date cannot be before start date",
        duration: 2500, contentContainerStyle: {flex: 1,}
      });
      setDatePickerVisible(false);
      return;
    }

    pickerType === "start" ? setStartDate(formatted) : setEndDate(formatted);
    setDatePickerVisible(false);
  };

  const handleSubmit = async () => {
    if (!leaveType) {
      ToastService.show({ type: "info", message: "Please select a leave type", duration: 2500,  contentContainerStyle: {flex: 1,} });
      return;
    }
    if (!startDate || !endDate) {
      ToastService.show({ type: "info", message: "Please select start and end dates", duration: 2500, contentContainerStyle: {flex: 1,} });
      return;
    }
    if (!reason.trim()) {
      ToastService.show({ type: "info", message: "Please provide a reason for leave", duration: 2500, contentContainerStyle: {flex: 1,} });
      return;
    }
    if (!halfDay && !fullDay) {
      ToastService.show({ type: "info", message: "Please select Half Day or Full Day", duration: 2500, contentContainerStyle: {flex: 1,} });
      return;
    }
    setLoading(true);
    try {
      const params: any = {
        staffId :userDetail.id,
        leaveType,
        "fromDate": startDate,
        "toDate": endDate,
        dayType: halfDay ? "HALF_DAY" : "FULL_DAY",
        reason,
      };

      const token = await AsyncStorage.getItem("auth_token");
      const encodedTenant = await AsyncStorage.getItem("auth_tenant");
      const deviceId = await getDeviceId();
      if (!token || !encodedTenant) throw new Error("Auth missing");

      const tenantId = Buffer.from(encodedTenant, "base64").toString("utf-8");

      const response = await axios.post(`${API_BASE_URL}leaves/applyLeave`, params, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Tenant-ID": tenantId,
          "X-Device-ID": deviceId,
        },
      });
      setLoading(false);
      ToastService.show({
        type: "success",
        message: response.data.message || "Leave applied successfully",
        duration: 3000,
        contentContainerStyle: {flex: 1,}
      });

      router.replace("/staffDashboard/(tabs)/TeacherLeaveApprovalScreen");
    } catch (error: any) {
      console.error("Apply leave error:", error);
      ToastService.show({
        type: "danger",
        message: error?.response?.data?.message || "Failed to apply leave",
        duration: 3000,
        contentContainerStyle: {flex: 1,}
      });
    }
  };

  return (
    <View style={styles.wrapper}>
      {/* HEADER */}
      <Text style={styles.headerTitle}>
        <TouchableOpacity onPress={() => router.push("/staffDashboard/(tabs)/TeacherLeaveApprovalScreen")}>
          <Ionicons name="arrow-back" size={26} color={styles.icon.color} />
        </TouchableOpacity>{" "}
        Apply for Leave
      </Text>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          {/* LEAVE TYPE */}
          <View style={styles.section}>
            <Text style={styles.label}>Leave Type</Text>
            <TouchableOpacity
              style={[styles.dropdown, leaveType && styles.dropdownFilled]}
              onPress={() => setDropdownVisible(true)}
            >
              <View style={styles.dropdownContent}>
                <MaterialIcons name="event-note" size={20} color={styles.primary.color} />
                <Text style={[styles.dropdownText, leaveType && styles.dropdownTextFilled]}>
                  {leaveType || "Select Leave Type"}
                </Text>
              </View>
              <MaterialIcons name="keyboard-arrow-down" size={24} color={styles.muted.color} />
            </TouchableOpacity>
          </View>

          {/* MODAL */}
          <Modal transparent visible={dropdownVisible} animationType="fade">
            <TouchableOpacity
              style={styles.modalOverlay}
              onPress={() => {
                if (!leaveType) {
                  ToastService.show({
                    type: "info",
                    message: "Please select a leave type",
                    duration: 2000,
                    contentContainerStyle: {flex: 1,}
                  });
                }
                setDropdownVisible(false);
              }}
            >
              <View style={styles.modalBox}>
                <Text style={styles.modalTitle}>Select Leave Type</Text>
                {["SICK", "CASUAL"].map(item => (
                  <TouchableOpacity
                    key={item}
                    style={styles.modalItem}
                    onPress={() => {
                      setLeaveType(item as LeaveType);
                      setDropdownVisible(false);
                    }}
                  >
                    <Text style={styles.modalItemText}>{item}</Text>
                    {leaveType === item && (
                      <MaterialIcons name="check" size={22} color={styles.primary.color} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableOpacity>
          </Modal>

          {/* DATE */}
          <View style={styles.section}>
            <Text style={styles.label}>Duration</Text>
            {["start", "end"].map(type => (
              <TouchableOpacity
                key={type}
                style={styles.inputWithIcon}
                onPress={() => openDatePicker(type as any)}
              >
                <Text style={styles.inputText}>
                  {type === "start" ? startDate || "Start Date" : endDate || "End Date"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <DateTimePickerModal
            isVisible={datePickerVisible}
            mode="date"
            onConfirm={handleDateConfirm}
            onCancel={() => setDatePickerVisible(false)}
          />

          {/* TOGGLE */}
          <View style={styles.toggleRow}>
            {["Half Day", "Full Day"].map(type => {
              const active = type === "Half Day" ? halfDay : fullDay;
              return (
                <TouchableOpacity
                  key={type}
                  style={[styles.toggleButton, active && styles.toggleButtonActive]}
                  onPress={() => {
                    setHalfDay(type === "Half Day");
                    setFullDay(type === "Full Day");
                  }}
                >
                  <Text style={[styles.toggleText, active && styles.toggleTextActive]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* REASON */}
          <View style={styles.section}>
            <Text style={styles.label}>Reason</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Describe the reason..."
              placeholderTextColor={styles.muted.color}
              multiline
              value={reason}
              onChangeText={setReason}
            />
          </View>
        </View>

        {/* SUBMIT */}
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        {loading ? <View style={styles.submitGradient}>
            <Text style={styles.submitButtonText}>Submitting Application</Text>
            <MaterialIcons name="arrow-forward" size={20} color="#fff" />
          </View> : (
          <View style={styles.submitGradient}>
            <Text style={styles.submitButtonText}>Submit Application</Text>
            <MaterialIcons name="arrow-forward" size={20} color="#fff" />
          </View>
           )}
        </TouchableOpacity>
      </ScrollView>

      {/* TOAST */}
      {/* <Toastier /> */}
    </View>
  );
}

function getStyles(theme: Theme) {
  const isDark = theme.mode === "dark";

  const colors = {
    background: isDark ? "#0B1220" : "#F5F7FA",
    card: isDark ? "#111827" : "#FFFFFF",
    inputBg: isDark ? "#0F172A" : "#F8FAFC",
    border: !isDark ? "#1F2937" : "#E2E8F0",
    textPrimary: isDark ? "#E9EFFC" : "#111827",
    textSecondary: isDark ? "#9CA3AF" : "#6B7280",
    accent: "#638FFF",
    accentSoft: isDark ? "#1E3A8A30" : "#EEF2FF",
    modalBg: isDark ? "#111827" : "#FFFFFF",
  };

  return StyleSheet.create({
    wrapper: {
      flex: 1,
      backgroundColor: theme.background,
      paddingTop: Platform.OS === "ios" ? 50 : 40,
    },

    icon: { color: colors.textPrimary },
    primary: { color: colors.accent },
    muted: { color: colors.textSecondary },

    headerTitle: {
      fontSize: 28,
      fontWeight: "800",
      color: colors.textPrimary,
      paddingLeft: 15,
    },

    container: { flex: 1 },
    scrollContent: { padding: 20, paddingBottom: 40 },

    card: {
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },

    section: { marginBottom: 24 },

    label: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.textPrimary,
      marginBottom: 12,
    },

    dropdown: {
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.inputBg,
      padding: 16,
      borderRadius: 12,
    },

    dropdownFilled: {
      borderColor: colors.accent,
    },

    dropdownContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },

    dropdownText: {
      color: colors.textSecondary,
    },

    dropdownTextFilled: {
      color: colors.textPrimary,
    },

    modalOverlay: {
      flex: 1,
      justifyContent: "center",
      backgroundColor: "rgba(0,0,0,0.6)",
    },

    modalBox: {
      backgroundColor: colors.modalBg,
      borderRadius: 20,
      padding: 10,
      paddingHorizontal: 20,
      marginHorizontal: 15,
    },

    modalTitle: {
      fontSize: 18,
      fontWeight: "700",
      padding: 16,
      color: colors.accent,
    },

    modalItem: {
      padding: 16,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },

    modalItemText: {
      fontSize: 16,
      color: colors.textPrimary,
    },

    inputWithIcon: {
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.inputBg,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
    },

    inputText: {
      color: colors.textPrimary,
    },

    textArea: {
      height: 120,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.inputBg,
      borderRadius: 12,
      padding: 16,
      color: colors.textPrimary,
    },

    toggleRow: {
      flexDirection: "row",
      gap: 12,
    },

    toggleButton: {
      flex: 1,
      borderWidth: 1.5,
      borderColor: colors.accent,
      borderRadius: 12,
      padding: 14,
      alignItems: "center",
      backgroundColor: "transparent",
    },

    toggleButtonActive: {
      backgroundColor: colors.accent,
    },

    toggleText: {
      color: colors.accent,
      fontWeight: "600",
    },

    toggleTextActive: {
      color: "#FFFFFF",
    },

    submitButton: {
      marginTop: 16,
      borderRadius: 16,
      overflow: "hidden",
    },

    submitGradient: {
      paddingVertical: 18,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 8,
      backgroundColor: colors.accent,
    },

    submitButtonText: {
      color: "#FFFFFF",
      fontSize: 17,
      fontWeight: "700",
    },
  });
}

