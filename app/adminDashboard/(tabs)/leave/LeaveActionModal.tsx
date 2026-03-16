import { Theme } from "@/action/theme/themeReducer";
import { LeaveRequest, LeaveStatus, RoleMode } from "@/types/leave";
import { getPersonLabel, getStatusColor } from "@/utils/leaveUtils";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function LeaveActionModal({
  visible,
  onClose,
  item,
  selectedStatus,
  onConfirm,
  onRemarksChange,
  theme,
  RoleMode,

}: {
  visible: boolean;
  onClose: () => void;
  item: LeaveRequest | null;
  selectedStatus: LeaveStatus;
  onConfirm: () => void;
  onRemarksChange: (t: string) => void;
  theme: Theme;
  RoleMode: RoleMode;

}) {
  if (!item) return null;

  const isDark = theme.mode === "dark";
  const statusColor = getStatusColor(selectedStatus, isDark);
  const styles = getStyles(isDark);

  return (
    <Modal transparent visible={visible} animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHandle} />

          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Confirm Action</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={isDark ? "#E5E7EB" : "#374151"} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalDetails}>
            <Text style={styles.detailLabel}>{getPersonLabel(RoleMode)}:</Text>
            <Text style={styles.detailValue}>{item.personName}</Text>

            <Text style={styles.detailLabel}>Duration:</Text>
            <Text style={styles.detailValue}>{item.duration}</Text>

            <Text style={styles.detailLabel}>Leave Type:</Text>
            <Text style={styles.detailValue}>{item.type}</Text>

            <TextInput
              value={item.remarks}
              onChangeText={onRemarksChange}
              placeholder="Remarks"
              placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
              style={[styles.detailValue, { marginTop: 12, borderWidth: 1, borderColor: isDark ? "#374151" : "#E5E7EB", borderRadius: 8, padding: 10 }]}
            />
          </View>

          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
              <Text style={{ color: statusColor.text, fontWeight: "700" }}>{selectedStatus}</Text>
            </View>
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalCancel} onPress={onClose}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalConfirm} onPress={onConfirm}>
              <Text style={styles.modalConfirmText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.4)",
      justifyContent: "flex-end",
    },
    modalContainer: {
      backgroundColor: isDark ? "#1C1F28" : "#FFFFFF",
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: Platform.OS === "ios" ? 20 : 16,
    },
    modalHandle: {
      width: 40,
      height: 4,
      backgroundColor: isDark ? "#4B5563" : "#D1D5DB",
      borderRadius: 2,
      alignSelf: "center",
      marginBottom: 12,
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: isDark ? "#F3F4F6" : "#111827",
    },
    modalDetails: {
      backgroundColor: isDark ? "rgba(96,165,250,0.05)" : "rgba(59,130,246,0.05)",
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
      borderLeftWidth: 4,
      borderLeftColor: isDark ? "#60A5FA" : "#3B82F6",
    },
    detailLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: isDark ? "#9CA3AF" : "#6B7280",
    },
    detailValue: {
      fontSize: 14,
      fontWeight: "600",
      color: isDark ? "#F3F4F6" : "#111827",
      marginBottom: 8,
    },
    statusContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 20,
    },
    statusBadge: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 20,
    },
    modalActions: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 10,
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
  });
