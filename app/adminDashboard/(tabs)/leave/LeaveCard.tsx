import { Theme } from "@/action/theme/themeReducer";
import { LeaveRequest, LeaveStatus, RoleMode } from "@/types/leave";
import { getPersonCodeLabel, getPersonLabel, getStatusColor } from "@/utils/leaveUtils";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import LeavePersonInfo from "./LeavePersonInfo";

type Props = {
  item: LeaveRequest;
  disabled: boolean;
  onAction: (item: LeaveRequest, status: LeaveStatus) => void;
  theme: Theme;
  RoleMode: RoleMode;
};

export default function LeaveCard({ item, disabled, onAction, theme, RoleMode }: Props) {
  const isDark = theme.mode === "dark";
  const statusColor = getStatusColor(item.status, isDark);
  const styles = getStyles(isDark);
  return (
    <View style={[styles.card, disabled && styles.cardDisabled]}>
      {/* HEADER */}
      <View style={styles.cardHeader}>
        <Text style={styles.dateText}>{item.date}</Text>
          <Text style={{ color: statusColor.text, fontWeight: "600" }}>{item.duration}</Text>
        <View style={[styles.statusPill, { backgroundColor: statusColor.bg }]}>
          <Text style={{ color: statusColor.text, fontWeight: "600" }}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.cardDivider} />

      <LeavePersonInfo
        name={item.personName}
        code={item.personCode}
        rollNumber={item.rollNumber}
        type={item.type}
        reason={item.reason}
        label={getPersonLabel(RoleMode)}
        codeLabel={getPersonCodeLabel(RoleMode)}
        theme={theme}
      />

      {item.status === "Waiting" && (
        <>
          <View style={styles.cardDivider} />
          <View style={styles.actionsRow}>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: "#059669" }]} onPress={() => onAction(item, "Approved")}>
              <Text style={styles.actionText}>Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: "#DC2626" }]} onPress={() => onAction(item, "Cancelled")}>
              <Text style={styles.actionText}>Reject</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    card: {
      backgroundColor: isDark ? "#1C1F28" : "#FFFFFF",
      borderRadius: 12,
      padding: 16,
      marginVertical: 8,
      marginHorizontal: 16,
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      elevation: 3, // Android shadow
    },
    cardDisabled: {
      opacity: 0.5,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    dateText: {
      fontSize: 14,
      color: isDark ? "#9CA3AF" : "#6B7280",
      fontWeight: "600",
    },
    statusPill: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 20,
    },
    cardDivider: {
      height: 1,
      backgroundColor: isDark ? "#374151" : "#E5E7EB",
      marginVertical: 12,
    },
    actionsRow: {
      flexDirection: "row",
      justifyContent: "space-around",
      gap: 12,
    },
    actionButton: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 8,
      alignItems: "center",
    },
    actionText: {
      color: "#FFFFFF",
      fontWeight: "600",
      fontSize: 14,
    },
  });
