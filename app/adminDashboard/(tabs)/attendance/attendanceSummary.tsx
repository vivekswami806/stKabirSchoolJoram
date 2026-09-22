import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface Props {
  visible: boolean;
  loading: boolean;
  data: any[];
  roleMode: string;
  onClose: () => void;
}

export default function AttendanceSummaryModal({
  visible,
  loading,
  data,
  roleMode,
  onClose,
}: Props) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Attendance Summary</Text>

            <TouchableOpacity onPress={onClose}>
              <Text style={styles.close}>✕</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" />
          ) : (
            <FlatList
              data={data}
              keyExtractor={(_, index) => index.toString()}
              renderItem={({ item }) => (
                <View style={styles.card}>
                  <Text style={styles.classText}>
                    Class {item.studentClass} - {item.section}
                  </Text>

                  <Text>
                    Teacher: {item.classTeacherName || "Not Assigned"}
                  </Text>

                  <Text>Total Students : {item.totalStudents}</Text>

                  <Text style={{ color: "green" }}>
                    Marked : {item.markedCount}
                  </Text>

                  <Text style={{ color: "red" }}>
                    Unmarked : {item.unmarkedCount}
                  </Text>

                  <Text>Status : {item.status}</Text>

                  {/* <Text>Date : {item.date}</Text> */}
                </View>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 20,
  },
  container: {
    backgroundColor: "#fff",
    borderRadius: 15,
    maxHeight: "80%",
    padding: 15,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  close: {
    fontSize: 22,
    fontWeight: "bold",
  },
  card: {
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  classText: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 5,
  },
});