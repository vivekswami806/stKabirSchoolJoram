import React, { JSX } from "react";
import { FlatList, Text, View } from "react-native";

/* ================= TYPES ================= */

interface Person {
  id: string;
  name: string;
  avatar?: string;          // fallback initials
  image?: string | null;    // base64 image
  isPresent: "A" | "P";
  synced?: boolean;
}


interface StudentListProps {
  students: Person[];
  styles: any;
  renderAttendanceRow: (item: Person) => JSX.Element;
}

/* ================= COMPONENT ================= */

export default function StudentList({
  students,
  styles,
  renderAttendanceRow,
}: StudentListProps) {
  return (
    <View style={styles.listContainer}>
      <View style={styles.columnHeaders}>
        <Text style={styles.columnHeaderText}>Name</Text>
        <View style={styles.attendanceHeaders}>
          <Text style={styles.attendanceHeaderText}>Present</Text>
          <Text style={styles.attendanceHeaderText}>Absent</Text>
        </View>
      </View>

      <FlatList
        data={students}
        keyExtractor={(item) => `student-${item.id}`}
        renderItem={({ item }) => renderAttendanceRow(item)}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
