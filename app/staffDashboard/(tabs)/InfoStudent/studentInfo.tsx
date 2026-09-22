import { RootState } from "@/action/store";
import { ThemeContext } from "@/action/theme/ThemeContext";
import { Theme } from "@/action/theme/themeReducer";
import LeaveSkeleton from "@/app/adminDashboard/(tabs)/leave/LeaveSkeleton";
import { API_BASE_URL } from "@/config";
import { getDeviceId } from "@/helper/getDeviceId";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Buffer } from "buffer";
import { useRouter } from "expo-router";
import { useContext, useEffect, useState } from "react";
import {
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { useSelector } from "react-redux";

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

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("auth_token");
      const encodedTenant = await AsyncStorage.getItem("auth_tenant");
      const deviceId = await getDeviceId();
      if (!token || !encodedTenant) throw new Error("Auth missing");
      const tenantId = Buffer.from(encodedTenant, "base64").toString("utf-8");
      
      const response = await axios.get(
        `${API_BASE_URL}student/giveAllActiveStudentByClassAndSection?studentClass=${userDetail.staffClass}&section=${userDetail.staffSection}`,
        // `${API_BASE_URL}student/giveAllActiveStudentByClass?studentClass=${userDetail.staffClass}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Tenant-ID": tenantId,
            'X-Device-ID': deviceId
          },
        }
      );
      //  console.log("---giveAllActiveStudentByClass|", response.data?.data[0]);
      
      setStudents(response.data?.data || []);
    } catch (err: any) {
      console.log(err);
      
      // Alert.alert("Error", err.message || "Failed to load students");
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
          <Ionicons
            name="arrow-back"
            size={26}
            color={theme.mode === "dark" ? "#E9EFFC" : "#000"}
          />
        </TouchableOpacity>
        <Text style={styles.headerText}>Class: {userDetail?.staffClass}-{userDetail?.staffSection}</Text>
      </View>

      {/* Student List */}
      {loading ? (  <LeaveSkeleton isDark={false}/>) : (
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
            <TouchableOpacity
              style={styles.card}
              onPress={() => onSelectStudent(item)}
            >
              <View>
                <Text style={styles.name}>{item.studentName}</Text>
                <Text style={styles.roll}>
                  Roll No: {item.studentAdmissionNumber}
                </Text>
              </View>

              <View
                style={[
                  styles.statusBadge,
                  item.studentStatus === true
                    ? styles.present
                    : styles.absent,
                ]}
              >
                <Ionicons
                  name={
                    item.studentStatus === true
                      ? "checkmark-circle"
                      : "close-circle"
                  }
                  size={16}
                  color="#fff"
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.statusText}>{item.studentStatus}</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons
                name="people-outline"
                size={60}
                color="#aaa"
                style={{ marginBottom: 10 }}
              />
              <Text style={styles.emptyText}>No students found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

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
      backgroundColor: isDark ? "#1E1E1E" : "#F7F9FC",
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
      elevation: 3, // android shadow
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
  });
}
