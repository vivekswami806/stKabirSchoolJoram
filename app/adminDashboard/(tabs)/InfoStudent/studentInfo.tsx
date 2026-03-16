import { RootState } from "@/action/store";
import { ThemeContext } from "@/action/theme/ThemeContext";
import { Theme } from "@/action/theme/themeReducer";
import { API_BASE_URL, classes, sections } from "@/config";
import { getDeviceId } from "@/helper/getDeviceId";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Buffer } from "buffer";
import { useRouter } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSelector } from "react-redux";
import StudentFilters from "../components/StudentFilters";
import LeaveSkeleton from "../leave/LeaveSkeleton";

interface Student {
  studentName: string;
  id: string;
  name: string;
  studentAdmissionNumber: string;
  studentStatus: boolean;
}

interface Props {
  className: string;
  onSelectStudent: (student: Student) => void;
}

export default function StudentInfo({ className, onSelectStudent }: Props) {
  const router = useRouter();
  const themeState = useContext(ThemeContext);
  const { userDetail } = useSelector((state: RootState) => state.user);

  if (!themeState) return null;
  const { theme } = themeState;
  const styles = getStyles(theme);

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedClass, setSelectedClass] = useState("nur");
  const [selectedSection, setSelectedSection] = useState("A");

  const [classModalVisible, setClassModalVisible] = useState(false);
  const [sectionModalVisible, setSectionModalVisible] = useState(false);

  /* ===================== EFFECT ===================== */
  useEffect(() => {
    fetchStudents();
  }, [selectedClass, selectedSection]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("auth_token");
      const encodedTenant = await AsyncStorage.getItem("auth_tenant");
      const deviceId = await getDeviceId();
      if (!token || !encodedTenant) throw new Error("Auth missing");

      const tenantId = Buffer.from(encodedTenant, "base64").toString("utf-8");

      const response = await axios.get(
        `${API_BASE_URL}student/giveAllActiveStudentByClass?studentClass=${selectedClass}&section=${selectedSection}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Tenant-ID": tenantId,
            "X-Device-ID": deviceId,
          },
        }
      );

      setStudents(response.data?.data || []);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to load students");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => router.push("/(tabs)/home")}>
          <Ionicons name="arrow-back" size={26} color={theme.mode === "dark" ? "#E9EFFC" : "#000"} />
        </TouchableOpacity>
        <Text style={styles.headerText}>
          Class {selectedClass} - Section {selectedSection}
        </Text>
      </View>

      {/* Filters */}
      <StudentFilters
        styles={"styles"}
        selectedDateStr={new Date().toISOString().split("T")[0]}
        classModalVisible={classModalVisible}
        setClassModalVisible={setClassModalVisible}
        sectionModalVisible={sectionModalVisible}
        setSectionModalVisible={setSectionModalVisible}
        classOptions={classes}
        sectionOptions={sections}
        selectedClass={selectedClass}
        setSelectedClass={setSelectedClass}
        selectedSection={selectedSection}
        setSelectedSection={setSelectedSection}
        role="ADMIN"
        onDatePress={() => {}}
      />

      {/* Student List */}
      {loading ? (
        <LeaveSkeleton isDark={theme.mode === "dark"} />
      ) : (
        <FlatList
          data={students}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchStudents();
              }}
              tintColor="#4C8EF7"
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => onSelectStudent(item)}>
              <View>
                <Text style={styles.name}>{item.studentName}</Text>
                <Text style={styles.roll}>Roll No: {item.studentAdmissionNumber}</Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  item.studentStatus ? styles.present : styles.absent,
                ]}
              >
                <Text style={styles.statusText}>
                  {item.studentStatus ? "Active" : "Inactive"}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No students found</Text>
            </View>
          }
        />
      )}

      {/* Class Modal */}
      <Modal transparent visible={classModalVisible} animationType="fade">
        <TouchableOpacity style={styles.modalContainer} activeOpacity={1} onPress={() => setClassModalVisible(false)}>
          <View style={styles.modalBox}>
            {classes.map((item) => (
              <TouchableOpacity
                key={item.value}
                style={styles.modalItem}
                onPress={() => {
                  setSelectedClass(item.value);
                  setClassModalVisible(false);
                }}
              >
                <Text>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Section Modal */}
      <Modal transparent visible={sectionModalVisible} animationType="fade">
        <TouchableOpacity style={styles.modalContainer} activeOpacity={1} onPress={() => setSectionModalVisible(false)}>
          <View style={styles.modalBox}>
            {sections.map((item) => (
              <TouchableOpacity
                key={item.value}
                style={styles.modalItem}
                onPress={() => {
                  setSelectedSection(item.value);
                  setSectionModalVisible(false);
                }}
              >
                <Text>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

/* ================= STYLES SAME AS TeacherInfo ================= */

function getStyles(theme: Theme) {
  const isDark = theme.mode === "dark";

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      paddingTop: Platform.OS === "ios" ? 60 : 50,
    },
    headerContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginHorizontal: 20,
      marginBottom: 16,
    },
    headerText: {
      fontSize: 20,
      fontWeight: "700",
      marginLeft: 12,
      color: isDark ? "#E9EFFC" : "#000104",
    },
    card: {
      backgroundColor: isDark ? "#444444" : "#F7F9FC",
      padding: 16,
      borderRadius: 12,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
      marginHorizontal: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    name: { fontSize: 16, fontWeight: "600", color: isDark ? "#E9EFFC" : "#000" },
    roll: { color: isDark ? "#aaa" : "#777", marginTop: 4 },
    statusBadge: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 20,
    },
    present: { backgroundColor: "#7FFB8D" },
    absent: { backgroundColor: "#FA5A5A" },
    statusText: { fontSize: 13, fontWeight: "600", color: "#fff", textTransform: "capitalize" },
    emptyContainer: { marginTop: 60, alignItems: "center" },
    emptyText: { fontSize: 16, color: "#aaa" },
    modalContainer: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.45)",
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 20,
    },
    modalBox: {
      width: "100%",
      backgroundColor: isDark ? "#444444" : "#F7F9FC",
      borderRadius: 12,
      paddingVertical: 10,
      overflow: "hidden",
    },
    modalItem: {
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderBottomWidth: 0.5,
      borderColor: isDark ? "#555" : "#ccc",
    },
  });
}