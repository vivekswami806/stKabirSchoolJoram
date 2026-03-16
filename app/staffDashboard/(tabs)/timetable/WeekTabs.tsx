import { WeekDay } from "@/types/timetabletype";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";


const DAYS: { label: string; value: WeekDay }[] = [
  { label: "Mon", value: "MONDAY" },
  { label: "Tue", value: "TUESDAY" },
  { label: "Wed", value: "WEDNESDAY" },
  { label: "Thu", value: "THURSDAY" },
  { label: "Fri", value: "FRIDAY" },
  { label: "Sat", value: "SATURDAY" },
];

export default function WeekTabs({
  selected,
  onChange,
}: {
  selected: WeekDay;
  onChange: (day: WeekDay) => void;
}) {
  return (
    <View style={styles.container}>
      {DAYS.map((day) => (
        <TouchableOpacity
          key={day.value}
          style={[
            styles.tab,
            selected === day.value && styles.activeTab,
          ]}
          onPress={() => onChange(day.value)}
        >
          <Text
            style={[
              styles.text,
              selected === day.value && styles.activeText,
            ]}
          >
            {day.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginTop: 16,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: "#EEE",
  },
  activeTab: {
    backgroundColor: "#7A75F0",
  },
  text: {
    fontSize: 13,
    fontWeight: "600",
    color: "#444",
  },
  activeText: {
    color: "#FFF",
  },
});
