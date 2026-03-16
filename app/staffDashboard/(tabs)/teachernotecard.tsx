import { TeacherNote } from "@/helper/teacherNotesDb";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface Props {
  note: TeacherNote;
  onStatusChange: (status: "completed" | "failed") => void;
}

export const NoteCard: React.FC<Props> = ({ note, onStatusChange }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{note.title}</Text>
      <Text style={styles.desc}>{note.description}</Text>

      <Text style={styles.meta}>
        {note.dayType.toUpperCase()} • {note.status}
      </Text>

      {note.status === "pending" && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.btn, styles.success]}
            onPress={() => onStatusChange("completed")}
          >
            <Text style={styles.btnText}>Success</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.fail]}
            onPress={() => onStatusChange("failed")}
          >
            <Text style={styles.btnText}>Failed</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#F7F7F7",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12
  },
  title: {
    fontSize: 16,
    fontWeight: "600"
  },
  desc: {
    marginTop: 6,
    color: "#555"
  },
  meta: {
    marginTop: 8,
    fontSize: 12,
    color: "#777"
  },
  actions: {
    flexDirection: "row",
    marginTop: 10
  },
  btn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginRight: 10
  },
  success: {
    backgroundColor: "#4CAF50"
  },
  fail: {
    backgroundColor: "#F44336"
  },
  btnText: {
    color: "#fff",
    fontWeight: "600"
  }
});
