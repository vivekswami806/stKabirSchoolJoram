import { ThemeContext } from "@/action/theme/ThemeContext";
import { Theme } from "@/action/theme/themeReducer";
import { Ionicons } from "@expo/vector-icons";
import React, { memo, useContext } from "react";
import { StyleSheet, Text, View } from "react-native";

type LectureCardProps = {
  periodName: string;
  startTime: string;
  endTime: string;
  isBreak: boolean;
  sessionTypeDisplay?: string;
  isCurrent?: boolean;
  Name: string;
  subjectName: string;
  dayOfWeek: string;
};

const formatTime = (time: string) =>
  new Date(`1970-01-01T${time}`).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

function LectureCardComponent({
  periodName,
  startTime,
  endTime,
  isBreak,
  sessionTypeDisplay,
  isCurrent,
  Name,
  subjectName,
  dayOfWeek,
}: LectureCardProps) {
  const themeState = useContext(ThemeContext);
  if (!themeState) return null;
  const { theme } = themeState;
  const styles = getStyles(theme);

  return (
    <View
      style={[
        styles.card,
        isBreak && styles.breakCard,
        isCurrent && styles.currentCard,
      ]}
    >
      {/* Day + Session */}
      <Text style={styles.dayText}>
        {dayOfWeek} {sessionTypeDisplay ? `• ${sessionTypeDisplay}` : ""}
      </Text>

      {/* Period */}
      <Text style={[styles.title, isBreak && styles.breakTitle]}>
        {isBreak ? "Break Time" : `${periodName} Period`}
        {isCurrent && !isBreak ? " • Ongoing" : ""}
      </Text>

      {isBreak ? (
        <Text style={styles.breakText}>Take a rest ☕</Text>
      ) : (
        <>
          {/* subjectName */}
          <Text style={styles.subjectText}>{subjectName}</Text>

          {/* Teacher */}
          <Text style={styles.staffText}>👨‍🏫 {Name}</Text>

          {/* Time */}
          <View style={styles.timePill}>
            <Ionicons name="time-outline" size={18} color="#000" />
            <Text style={styles.timeText}>
              {formatTime(startTime)} - {formatTime(endTime)}
            </Text>
          </View>
        </>
      )}
    </View>
  );

}

export default memo(LectureCardComponent);

function getStyles(theme: Theme) {
  const isDark = theme.mode === "dark";

  return StyleSheet.create({
    card: {
      flex: 1,
      backgroundColor: isDark ? "#020617" : "#FFFFFF",
      padding: 14,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: isDark ? "#1E293B" : "#E5E7EB",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.4 : 0.1,
      shadowRadius: 8,
      elevation: 16,
    },

    breakCard: {
      backgroundColor: isDark ? "#1F2937" : "#FFF7ED",
    },

    currentCard: {
      backgroundColor: isDark ? "#064E3B" : "#D6F0D4",
    },

    title: {
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 8,
      color: theme.text,
    },

    breakTitle: {
      color: isDark ? "#FDBA74" : "#EA580C",
    },

    breakText: {
      fontSize: 14,
      color: isDark ? "#FDBA74" : "#9A3412",
    },

    footer: {
      marginTop: 10,
    },

    timePill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },

    timeText: {
      fontSize: 13,
      color: theme.text,
    },

    dayText: {
      fontSize: 12,
      color: isDark ? "#9CA3AF" : "#6B7280",
      marginBottom: 4,
    },

    subjectText: {
      fontSize: 15,
      fontWeight: "600",
      marginBottom: 2,
      color: theme.text,
    },

    staffText: {
      fontSize: 13,
      color: isDark ? "#D1D5DB" : "#374151",
      marginBottom: 6,
    },
  });
}

