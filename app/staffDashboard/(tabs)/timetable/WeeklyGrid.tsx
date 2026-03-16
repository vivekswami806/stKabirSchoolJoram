import { TimetableItem, WeekDay } from "@/types/timetabletype";
import { groupByDay } from "@/utils/timetable.grid";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";


const DAYS: WeekDay[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

export default function WeeklyGrid({
  data,
}: {
  data: TimetableItem[];
}) {
  const grouped = groupByDay(data);

  return (
    <ScrollView horizontal>
      <View>
        {/* Header */}
        <View style={styles.headerRow}>
          {DAYS.map((d) => (
            <Text key={d} style={styles.headerCell}>
              {d.slice(0, 3)}
            </Text>
          ))}
        </View>

        {/* Grid */}
        <ScrollView>
          <View style={styles.gridRow}>
            {DAYS.map((day) => (
              <View key={day} style={styles.column}>
                {(grouped[day] || []).map((item) => (
                  <View key={item.id} style={styles.cell}>
                    <Text style={styles.subject}>
                      {item.subjectCode}
                    </Text>
                    <Text style={styles.time}>
                      {item.startTime}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
    headerRow: {
      flexDirection: "row",
    },
    headerCell: {
      width: 100,
      textAlign: "center",
      padding: 8,
      fontWeight: "700",
      backgroundColor: "#F1F1F1",
    },
    gridRow: {
      flexDirection: "row",
    },
    column: {
      width: 100,
      padding: 4,
    },
    cell: {
      backgroundColor: "#EFEFFE",
      borderRadius: 6,
      padding: 6,
      marginBottom: 6,
    },
    subject: {
      fontSize: 12,
      fontWeight: "700",
    },
    time: {
      fontSize: 10,
      color: "#666",
    },
  });
  