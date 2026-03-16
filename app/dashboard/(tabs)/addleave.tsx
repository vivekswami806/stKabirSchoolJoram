import { RootState } from "@/action/store";
import { ThemeContext } from "@/action/theme/ThemeContext";
import { Theme } from "@/action/theme/themeReducer";
import { API_BASE_URL } from "@/config";
import { getDeviceId } from "@/helper/getDeviceId";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Buffer } from "buffer";
import { useRouter } from "expo-router";
import React, { useContext, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { ToastService } from "react-native-toastier";
import { useSelector } from "react-redux";

/* ================= TYPES ================= */
type LeaveType = "SICK" | "CASUAL" | "";
type DayType = "HALF_DAY" | "FULL_DAY" | "";

const LEAVE_TYPES: LeaveType[] = ["SICK", "CASUAL"];

/* ================= COMPONENT ================= */
export default function ApplyLeave() {
  const router = useRouter();
  const themeState = useContext(ThemeContext);
  const { userDetail } = useSelector((state: RootState) => state.user);

  if (!themeState) return null;
  const { theme } = themeState;
  const styles = getStyles(theme);

  const [leaveType, setLeaveType] = useState<LeaveType>("");
  const [dayType, setDayType] = useState<DayType>("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [pickerType, setPickerType] = useState<"start" | "end">("start");
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  /* ================= HELPERS ================= */
  const showInfo = (message: string) =>
    ToastService.show({
      type: "info",
      message,
      duration: 2500,
      contentContainerStyle: { flex: 1 },
    });

  const openDatePicker = (type: "start" | "end") => {
    setPickerType(type);
    setDatePickerVisible(true);
  };

  const handleDateConfirm = (date: Date) => {
    const formatted = date.toISOString().split("T")[0];

    if (pickerType === "end" && startDate && formatted < startDate) {
      showInfo("End date cannot be before start date");
      return setDatePickerVisible(false);
    }

    pickerType === "start" ? setStartDate(formatted) : setEndDate(formatted);
    setDatePickerVisible(false);
  };

  const handleSubmit = async () => {
    if (!leaveType) return showInfo("Please select a leave type");
    if (!startDate || !endDate)
      return showInfo("Please select start and end dates");
    if (!dayType) return showInfo("Please select Half Day or Full Day");
    if (dayType === "HALF_DAY" && startDate !== endDate)
      return showInfo("Half Day leave must be for a single date");
    if (!reason.trim()) return showInfo("Please provide a reason");

    setLoading(true);
    try {
      const params = {
        studentId: userDetail.id,
        leaveType,
        fromDate: startDate,
        toDate: endDate,
        dayType,
        reason,
      };

      const [token, encodedTenant, deviceId] = await Promise.all([
        AsyncStorage.getItem("auth_token"),
        AsyncStorage.getItem("auth_tenant"),
        getDeviceId(),
      ]);

      if (!token || !encodedTenant) throw new Error("Auth missing");

      const tenantId = Buffer.from(encodedTenant, "base64").toString("utf-8");

      const { data } = await axios.post(
        `${API_BASE_URL}leaves/applyLeave`,
        params,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Tenant-ID": tenantId,
            "X-Device-ID": deviceId,
          },
        }
      );

      ToastService.show({
        type: "success",
        message: data?.message || "Leave applied successfully",
        duration: 3000,
        contentContainerStyle: { flex: 1 },
      });

      router.replace("/dashboard/(tabs)/leave");
    } catch (error: any) {
      ToastService.show({
        type: "danger",
        message:
          error?.response?.data?.message || "Failed to apply leave",
        duration: 3000,
        contentContainerStyle: { flex: 1 },
      });
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */
  return (
    <KeyboardAvoidingView
      style={styles.wrapper}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1 }}>
          {/* HEADER */}
          <Text style={styles.headerTitle}>
            <TouchableOpacity
              onPress={() => router.push("/dashboard/(tabs)/leave")}
            >
              <Ionicons name="arrow-back" size={26} color={styles.icon.color} />
            </TouchableOpacity>{" "}
            Apply for Leave
          </Text>

          <KeyboardAwareScrollView
        enableOnAndroid
        enableAutomaticScroll
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={Platform.OS === 'ios' ? 20 : 60}
        extraHeight={Platform.OS === 'android' ? 120 : 0}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardOpeningTime={0}
      >
            <View style={styles.card}>
              {/* LEAVE TYPE */}
              <Text style={styles.label}>Leave Type</Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setDropdownVisible(true)}
              >
                <Text style={styles.dropdownText}>
                  {leaveType || "Select Leave Type"}
                </Text>
              </TouchableOpacity>

              {/* DATE */}
              <Text style={styles.label}>Duration</Text>
              {["start", "end"].map(type => (
                <TouchableOpacity
                  key={type}
                  style={styles.inputWithIcon}
                  onPress={() => openDatePicker(type as any)}
                >
                  <Text style={styles.inputText}>
                    {type === "start"
                      ? startDate || "Start Date"
                      : endDate || "End Date"}
                  </Text>
                </TouchableOpacity>
              ))}

              {/* DAY TYPE */}
              <View style={styles.toggleRow}>
                {[
                  { label: "Half Day", value: "HALF_DAY" },
                  { label: "Full Day", value: "FULL_DAY" },
                ].map(item => (
                  <TouchableOpacity
                    key={item.value}
                    style={[
                      styles.toggleButton,
                      dayType === item.value && styles.toggleButtonActive,
                    ]}
                    onPress={() => setDayType(item.value as DayType)}
                  >
                    <Text
                      style={[
                        styles.toggleText,
                        dayType === item.value && styles.toggleTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* REASON */}
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

            {/* SUBMIT */}
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={loading}
            >
              <View style={styles.submitGradient}>
                <Text style={styles.submitButtonText}>
                  {loading ? "Submitting..." : "Submit Application"}
                </Text>
                <MaterialIcons name="arrow-forward" size={20} color="#fff" />
              </View>
            </TouchableOpacity>
            </KeyboardAwareScrollView>
        </View>
      </TouchableWithoutFeedback>

      {/* DATE PICKER */}
      <DateTimePickerModal
        isVisible={datePickerVisible}
        mode="date"
        onConfirm={handleDateConfirm}
        onCancel={() => setDatePickerVisible(false)}
        minimumDate={
          pickerType === "end" && startDate
            ? new Date(startDate)
            : undefined
        }
      />

      {/* LEAVE TYPE MODAL */}
      <Modal transparent visible={dropdownVisible} animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setDropdownVisible(false)}
        >
          <View style={styles.modalBox}>
            {LEAVE_TYPES.map(item => (
              <TouchableOpacity
                key={item}
                style={styles.modalItem}
                onPress={() => {
                  setLeaveType(item);
                  setDropdownVisible(false);
                }}
              >
                <Text style={styles.modalItemText}>{item}</Text>
                {leaveType === item && (
                  <MaterialIcons name="check" size={22} color="#667eea" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

/* ================= STYLES ================= */
function getStyles(theme: Theme) {
  const isDark = theme.mode === "dark";

  return StyleSheet.create({
    wrapper: {
      flex: 1,
      backgroundColor: isDark ? "#0B1220" : "#F5F7FA",
      paddingTop: Platform.OS === "ios" ? 50 : 40,
    },
    icon: { color: isDark ? "#E9EFFC" : "#111827" },
    muted: { color: isDark ? "#9CA3AF" : "#999" },
    headerTitle: {
      fontSize: 28,
      fontWeight: "800",
      color: isDark ? "#E9EFFC" : "#111827",
      paddingLeft: 15,
    },
    scrollContent: { padding: 20, paddingBottom: 40 },
    card: {
      backgroundColor: isDark ? "#111827" : "#FFFFFF",
      borderRadius: 20,
      padding: 20,
    },
    label: {
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 12,
      color: isDark ? "#E5E7EB" : "#2D3748",
    },
    dropdown: {
      borderWidth: 1.5,
      borderColor: "#667eea",
      padding: 16,
      borderRadius: 12,
      marginBottom: 20,
    },
    dropdownText: { color: isDark ? "#E9EFFC" : "#2D3748" },
    inputWithIcon: {
      borderWidth: 1.5,
      borderColor: "#E2E8F0",
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
    },
    inputText: { color: isDark ? "#E9EFFC" : "#2D3748" },
    toggleRow: { flexDirection: "row", gap: 12, marginVertical: 16 },
    toggleButton: {
      flex: 1,
      borderWidth: 1.5,
      borderColor: "#667eea",
      borderRadius: 12,
      padding: 14,
      alignItems: "center",
    },
    toggleButtonActive: { backgroundColor: "#667eea" },
    toggleText: { color: "#667eea", fontWeight: "600" },
    toggleTextActive: { color: "#fff" },
    textArea: {
      height: 120,
      borderWidth: 1.5,
      borderColor: "#E2E8F0",
      borderRadius: 12,
      padding: 16,
      color: isDark ? "#E9EFFC" : "#2D3748",
    },
    submitButton: { marginTop: 20, borderRadius: 16 },
    submitGradient: {
      paddingVertical: 18,
      flexDirection: "row",
      justifyContent: "center",
      gap: 8,
      backgroundColor: "#638FFF",
    },
    submitButtonText: { color: "#fff", fontSize: 17, fontWeight: "700" },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "center",
    },
    modalBox: {
      backgroundColor: isDark ? "#111827" : "#fff",
      marginHorizontal: 20,
      borderRadius: 20,
      padding: 10,
    },
    modalItem: {
      padding: 16,
      flexDirection: "row",
      justifyContent: "space-between",
    },
    modalItemText: {
      fontSize: 16,
      color: isDark ? "#E9EFFC" : "#2D3748",
    },
  });
}
