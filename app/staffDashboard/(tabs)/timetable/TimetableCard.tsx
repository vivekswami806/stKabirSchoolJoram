import { ThemeContext } from "@/action/theme/ThemeContext";
import { Theme } from "@/action/theme/themeReducer";
import { TimetableItem } from "@/types/timetabletype";
import { isCurrentPeriod } from "@/utils/timetable_time";
import { Ionicons } from "@expo/vector-icons";
import React, { useContext } from "react";
import { StyleSheet, Text, View } from "react-native";

export default function TimetableCard({ item }: { item: TimetableItem }) {
  const isCurrent = isCurrentPeriod(
    item.rawStartTime,
    item.rawEndTime,
    item.effectiveDate
  );
  const themeState = useContext(ThemeContext);
  if (!themeState) return null;
  const { theme } = themeState;
  const styles = getStyles(theme);
  return (
    <View style={styles.container}>
      {/* ===== LEFT TIME BAR (ALWAYS) ===== */}
      <View style={styles.timeColumn}>
        <Text style={styles.timeText}>{item.startTime}</Text>

        <View
          style={[
            styles.verticalLine,
            isCurrent && styles.activeLine,
          ]}
        />

        <View
          style={[
            styles.dot,
            item.isBreak && styles.breakDot,
            isCurrent && styles.activeDot,
          ]}
        />

        <Text style={styles.timeText}>{item.endTime}</Text>
      </View>

      {/* ===== RIGHT CONTENT ===== */}
      {item.isBreak ? (
        <View style={styles.breakCard}>
          <Text style={styles.breakText}>Break</Text>
          <Text style={styles.breakTime}>{item.timeRange}</Text>
        </View>
      ) : (
        <View style={[styles.card, isCurrent && styles.currentCard]}>
           {isCurrent && <View style={styles.currentAccent} />}

          <View style={styles.header}>
            <Text style={styles.subject}>{item.subject}</Text>
            <Text style={styles.code}>{item.subjectCode}</Text>
          </View>

          <Text style={styles.classText}>
            Class: {item.className}
          </Text>

          <View style={styles.row}>
            <Text>
              <Ionicons name="location" size={12} color="#7A75F0" />
            </Text>
            <Text style={styles.detail}>{item.room}</Text>
          </View>

          <View style={styles.row}>
            <Text>
              <Ionicons name="person" size={12} color="#7A75F0" />
            </Text>
            <Text style={styles.detail}>{item.teacher}</Text>
          </View>

          {item.notes && (
            <Text style={styles.notes}>
              Note: {item.notes}
            </Text>
          )}

          <Text style={styles.timeRange}>{item.timeRange}</Text>
        </View>
      )}
    </View>
  );
}

function getStyles(theme: Theme) {
  const isDark = theme.mode === "dark";

  return StyleSheet.create({
    /* ================= LAYOUT ================= */
    container: {
      flexDirection: "row",
      marginBottom: 20,
    },

    /* ================= TIME COLUMN ================= */
    timeColumn: {
      width: 70,
      alignItems: "center",
    },

    timeText: {
      fontSize: 12,
      fontWeight: "600",
      color: isDark ? "#E5E7EB" : "#374151",
    },

    verticalLine: {
      width: 2,
      height: 110,
      backgroundColor: !isDark ? "#334155" : "#E5E7EB",
      marginVertical: 6,
    },
    
    dot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: !isDark ? "#334155" : "#CBD5E1",
      position: "absolute",
      top: 36,
    },

    activeLine: {
      backgroundColor: "#7A75F0",
    },

    activeDot: {
      backgroundColor: "#7A75F0",
      shadowColor: "#7A75F0",
      shadowOpacity: 0.9,
      shadowRadius: 6,
      elevation: 6,
    },

    /* ================= CARD ================= */
    card: {
      flex: 1,
      backgroundColor: isDark ? "#020617" : "#FFFFFF",
      padding: 14,
      borderRadius: 14,
    
      borderWidth: 1,
      borderColor: isDark ? "#1E293B" : "#E5E7EB",
    
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.4 : 0.1,
      shadowRadius: 8,
      elevation: 6,
    },

    currentCard: {
      borderColor: "#7A75F0",
      borderWidth: 2,
      backgroundColor: isDark ? "#0F172A" : "#F4F3FF",
    },

    header: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    subject: {
      fontSize: 16,
      fontWeight: "800",
      color: theme.text,
      letterSpacing: 0.2,
    },

    code: {
      fontSize: 12,
      color: "#7A75F0",
      fontWeight: "600",
    },

    classText: {
      fontSize: 13,
      marginVertical: 6,
      color: isDark ? "#9CA3AF" : "#6B7280",
    },

    row: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 4,
    },

    detail: {
      fontSize: 12,
      color: isDark ? "#9CA3AF" : "#6B7280",
      marginLeft: 6,
    },

    notes: {
      fontSize: 11,
      marginTop: 6,
      color: isDark ? "#D1D5DB" : "#4B5563",
    },

    timeRange: {
      fontSize: 11,
      marginTop: 6,
      color: isDark ? "#9CA3AF" : "#9CA3AF",
      fontStyle: "italic",
    },

    liveBadge: {
      alignSelf: "flex-start",
      fontSize: 10,
      fontWeight: "800",
      color: "#000",
      backgroundColor: "#7A75F0",
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 999,
      marginBottom: 6,
      letterSpacing: 0.5,
    },

    /* ================= BREAK ================= */
    breakDot: {
      backgroundColor: isDark ? "#4F46E5" : "#C7C5F9",
    },

    breakCard: {
      flex: 1,
      backgroundColor: isDark ? "#0B1220" : "#F5F7FF",
      padding: 14,
      borderRadius: 14,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      borderStyle: "dashed",
      borderColor: isDark ? "#334155" : "#C7C5F9",
    },
    breakText: {
      fontSize: 15,
      fontWeight: "800",
      color: "#7A75F0",
      letterSpacing: 0.5,
    },

    breakTime: {
      fontSize: 11,
      marginTop: 4,
      color: isDark ? "#9CA3AF" : "#6B7280",
    },
    currentAccent: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: 4,
      backgroundColor: "#7A75F0",
      borderTopLeftRadius: 14,
      borderBottomLeftRadius: 14,
    },
    
  });
}
