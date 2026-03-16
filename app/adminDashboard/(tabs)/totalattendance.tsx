import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function TeacherScreen() {
  return (
    <ScrollView style={styles.container}>
      {/* Top Month Row */}
      <View style={styles.monthHeader}>
        <Text style={styles.monthText}>December 2025</Text>

        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Ionicons name="chevron-back" size={22} style={{ marginRight: 4 }} />
          <Ionicons name="chevron-forward" size={22} />
        </View>
      </View>

      {/* Week Days */}
      <View style={styles.daysRow}>
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <Text key={d} style={styles.dayName}>{d}</Text>
        ))}
      </View>

      {/* Calendar Dates */}
      <View style={styles.dateGrid}>
        {[...Array(31)].map((_, index) => {
          const day = index + 1;
          return (
            <TouchableOpacity key={day} style={styles.dateCircle}>
              <Text style={styles.dateText}>{day}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Summary Cards */}
      <View style={styles.cardRow}>
        <View style={[styles.card, { backgroundColor: "#E6F2FF" }]}>
          <Ionicons name="checkmark-circle-outline" size={28} color="#4C8EF7" />
          <Text style={styles.cardLabel}>Present</Text>
          <Text style={styles.cardValue}>22</Text>
        </View>

        <View style={[styles.card, { backgroundColor: "#FFE8E8" }]}>
          <Ionicons name="close-circle-outline" size={28} color="#FF6B6B" />
          <Text style={styles.cardLabel}>Absent</Text>
          <Text style={styles.cardValue}>03</Text>
        </View>

        <View style={[styles.card, { backgroundColor: "#EEE2FF" }]}>
          <Ionicons name="time-outline" size={28} color="#A46BFF" />
          <Text style={styles.cardLabel}>Events</Text>
          <Text style={styles.cardValue}>05</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
  monthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  monthText: { fontSize: 20, fontWeight: "bold" },
  daysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  dayName: { width: "14%", textAlign: "center", color: "#777" },
  dateGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  dateCircle: {
    width: "14%",
    height: 36,
    borderRadius: 20,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 4,
    elevation: 1,
  },
  dateText: { fontSize: 14 },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  card: {
    width: "32%",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  cardLabel: { marginTop: 6, color: "#444" },
  cardValue: { marginTop: 4, fontSize: 18, fontWeight: "bold" },
});
