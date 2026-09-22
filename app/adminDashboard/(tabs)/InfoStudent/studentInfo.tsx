import { ThemeContext } from "@/action/theme/ThemeContext";
import { Theme } from "@/action/theme/themeReducer";
import { API_BASE_URL, classes, sections } from "@/config";
import { getDeviceId } from "@/helper/getDeviceId";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Buffer } from "buffer";
import { useRouter } from "expo-router";
import { useCallback, useContext, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import StudentFilters from "../components/StudentFilters";
import LeaveSkeleton from "../leave/LeaveSkeleton";

// ============= TYPES =============
interface Student {
  studentName: string;
  id: string;
  name: string;
  studentAdmissionNumber: string;
  todayAttendanceStatus: string;
  studentImage?: string;
}

interface Props {
  className: string;
  onSelectStudent: (student: Student) => void;
}

interface AuthCredentials {
  token: string;
  tenantId: string;
  deviceId: string;
}

// ============= CONSTANTS =============
const ERROR_MESSAGES = {
  AUTH_MISSING: "Authentication failed. Please log in again.",
  LOAD_STUDENTS: "Unable to load students. Please try again.",
  LOAD_HOSTELERS: "Unable to load hostelers. Please try again.",
  NETWORK_ERROR: "Network error. Check your connection and try again.",
} as const;

// ============= MAIN COMPONENT =============
export default function StudentInfo({ className, onSelectStudent }: Props) {
  const router = useRouter();
  const themeState = useContext(ThemeContext);
  // const { userDetail } = useSelector((state: RootState) => state.user);

  if (!themeState) return null;
  const { theme } = themeState;
  const isDark = theme.mode === "dark";
  const styles = getStyles(theme, isDark);

  // State Management
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedClass, setSelectedClass] = useState("nur");
  const [selectedSection, setSelectedSection] = useState("A");
  const [classModalVisible, setClassModalVisible] = useState(false);
  const [sectionModalVisible, setSectionModalVisible] = useState(false);
  const [filterMode, setFilterMode] = useState<"students">("students");

  // ============= UTILITY FUNCTIONS =============
  /**
   * Retrieves authentication credentials from AsyncStorage
   */
  const getAuthCredentials = useCallback(async (): Promise<AuthCredentials | null> => {
    try {
      const token = await AsyncStorage.getItem("auth_token");
      const encodedTenant = await AsyncStorage.getItem("auth_tenant");
      const deviceId = await getDeviceId();

      if (!token || !encodedTenant) {
        return null;
      }

      const tenantId = Buffer.from(encodedTenant, "base64").toString("utf-8");
      return { token, tenantId, deviceId };
    } catch {
      return null;
    }
  }, []);

  /**
   * Shows error alert with appropriate message
   */
  const handleError = useCallback((error: any, defaultMessage: string) => {
    let message = defaultMessage;

    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        message = ERROR_MESSAGES.AUTH_MISSING;
      } else if (!error.response) {
        message = ERROR_MESSAGES.NETWORK_ERROR;
      }
    }

    Alert.alert("Error", message, [{ text: "OK" }]);
  }, []);

  const isValidBase64Image = (str: string) => {
    if (!str) return false;
    return str.startsWith("data:image");
  };

  const getInitials = (name: string) => {
    const names = name.split(" ");
    return names.length > 1
      ? names[0][0] + names[1][0]
      : names[0][0];
  };

  // ============= API CALLS =============
  /**
   * Fetches students by class and section
   */
  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const credentials = await getAuthCredentials();

      if (!credentials) {
        handleError(null, ERROR_MESSAGES.AUTH_MISSING);
        return;
      }

      const response = await axios.get(
        `${API_BASE_URL}student/giveAllActiveStudentByClass`,
        {
          params: {
            studentClass: selectedClass,
            section: selectedSection,
          },
          headers: {
            Authorization: `Bearer ${credentials.token}`,
            "X-Tenant-ID": credentials.tenantId,
            "X-Device-ID": credentials.deviceId,
          },
        }
      );
      // console.log("---response.data?.data|", response.data?.data);
      
      setStudents(response.data?.data || []);
    } catch (err) {
      handleError(err, ERROR_MESSAGES.LOAD_STUDENTS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedClass, selectedSection, getAuthCredentials, handleError]);

  /**
   * Fetches hostelers by class and section
   */
  const fetchHostelers = useCallback(async () => {
    try {
      setLoading(true);
      const credentials = await getAuthCredentials();

      if (!credentials) {
        handleError(null, ERROR_MESSAGES.AUTH_MISSING);
        return;
      }

      const response = await axios.get(
        `${API_BASE_URL}student/getHostelersByClassAndSection`,
        {
          params: {
            studentClass: selectedClass,
            classSection: selectedSection,
            page: 0,
            size: 100,
          },
          headers: {
            Authorization: `Bearer ${credentials.token}`,
            "X-Tenant-ID": credentials.tenantId,
            "X-Device-ID": credentials.deviceId,
          },
        }
      );

      setStudents(response.data?.content || []);
    } catch (err) {
      handleError(err, ERROR_MESSAGES.LOAD_HOSTELERS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedClass, selectedSection, getAuthCredentials, handleError]);

  const getImageUri = (image?: string) => {
    if (!image) return undefined;
    const trimmed = image.trim();
    if (trimmed.startsWith("data:image")) {
      return trimmed;
    }
    return `data:image/jpeg;base64,${trimmed}`;
  };

  // ============= EFFECTS =============
  useEffect(() => {
    if (filterMode === "students") {
      fetchStudents();
    } else {
      fetchHostelers();
    }
  }, [selectedClass, selectedSection, filterMode, fetchStudents, fetchHostelers]);

  // ============= EVENT HANDLERS =============
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    if (filterMode === "students") {
      fetchStudents();
    } else {
      fetchHostelers();
    }
  }, [filterMode, fetchStudents, fetchHostelers]);

  const handleStudentSelect = useCallback(
    (student: Student) => {
      onSelectStudent(student);
    },
    [onSelectStudent]
  );

  // ============= RENDER METHODS =============
  const renderStudentCard = ({ item }: { item: Student }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleStudentSelect(item)}
      activeOpacity={0.7}
    >
      {/* Status Accent Bar */}
      <View
        style={[
          styles.accentBar,
          {
            backgroundColor: item.todayAttendanceStatus !== "A" ? "#10B981" : "#EF4444",
          },
        ]}
      />

      <View style={styles.cardContent}>
        {/* Avatar or Image */}
        <View
          style={[
            styles.avatar,
            {
              backgroundColor: isDark ? "#5B7FFF" : "#4C8EF7",
              borderWidth: 2,
              borderColor: item.todayAttendanceStatus !== "A" ? "#10B981" : "#EF4444",
              overflow: "hidden",
            }
          ]}
        >

          {item.studentImage ? (
            <Image
              source={{ uri: getImageUri(item.studentImage) }}
              style={styles.avatarImage}
              resizeMode="cover"
            />
          ) : (
            <Text style={styles.avatarText}>
              {getInitials(item.studentName)}
            </Text>
          )}
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.name} numberOfLines={1}>
            {item.studentName}
          </Text>
          <View style={styles.rollContainer}>
            <Ionicons
              name="id-card-outline"
              size={13}
              color={isDark ? "#9CA3AF" : "#6B7280"}
              style={{ marginRight: 4 }}
            />
            <Text style={styles.roll}>
              Roll #{item.studentAdmissionNumber}
            </Text>
          </View>
        </View>
      </View>

      {/* Status Badge */}
      <View style={styles.statusBadge}>
        {/* <Ionicons
          name={item.todayAttendanceStatus ? "checkmark-circle" : "close-circle"}
          size={24}
          color={item.todayAttendanceStatus ? "#10B981" : "#EF4444"}
        /> */}
        <Text
          style={{
            color: item.todayAttendanceStatus !== "A"  ? "#10B981" : "#EF4444",
          }}
        >
          {item.todayAttendanceStatus !== "A" ? "P" : "A"}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="people-outline"
        size={60}
        color={isDark ? "#6B7280" : "#D1D5DB"}
      />
      <Text style={styles.emptyText}>No students found</Text>
      <Text style={styles.emptySubtext}>
        Try selecting a different class or section
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/home")}
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back"
            size={26}
            color={theme.text}
          />
        </TouchableOpacity>
        <Text style={styles.headerText}>
          Class {selectedClass.charAt(0).toUpperCase() + selectedClass.slice(1)} - Section {selectedSection}
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/adminDashboard/(tabs)/InfoStudent/birthday")}
          style={styles.backButton}
        >
     <Text>Birthday</Text>
        </TouchableOpacity>
        {/* <View style={styles.headerSpacer} /> */}
      </View>

      {/* Filters */}
      <StudentFilters
        styles={styles}
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
        onDatePress={() => { }}
      />

      {/* View Toggle Buttons */}
      {/* <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            filterMode === "students" && styles.toggleButtonActive,
          ]}
          onPress={() => setFilterMode("students")}
        >
          <Ionicons
            name="people"
            size={18}
            color={filterMode === "students" ? "#fff" : isDark ? "#9CA3AF" : "#6B7280"}
          />
          <Text
            style={[
              styles.toggleButtonText,
              filterMode === "students" && styles.toggleButtonTextActive,
            ]}
          >
            All Students
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.toggleButton,
            filterMode === "hostelers" && styles.toggleButtonActive,
          ]}
          onPress={() => setFilterMode("hostelers")}
        >
          <Ionicons
            name="home"
            size={18}
            color={filterMode === "hostelers" ? "#fff" : isDark ? "#9CA3AF" : "#6B7280"}
          />
          <Text
            style={[
              styles.toggleButtonText,
              filterMode === "hostelers" && styles.toggleButtonTextActive,
            ]}
          >
            Hostelers
          </Text>
        </TouchableOpacity>
      </View> */}

      {/* Student Count Badge */}
      {!loading && students.length > 0 && (
        <View style={styles.countBadge}>
          <Ionicons
            name="people"
            size={14}
            color={theme.primary}
            style={{ marginRight: 6 }}
          />
          <Text style={styles.countText}>
            {students.length} {students.length === 1 ? "student" : "students"}
          </Text>
        </View>
      )}

      {/* Student List */}
      {loading ? (
        <LeaveSkeleton isDark={isDark} />
      ) : (
        <FlatList
          data={students}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.primary}
            />
          }
          renderItem={renderStudentCard}
          ListEmptyComponent={renderEmptyState}
          scrollEnabled={students.length > 0}
        />
      )}
    </View>
  );
}

// ============= STYLES =============
function getStyles(theme: Theme, isDark: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      paddingTop: Platform.OS === "ios" ? 40 : 30,
    },
    headerContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginHorizontal: 16,
      marginBottom: 20,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB",
    },
    backButton: {
      padding: 8,
      borderRadius: 10,
      backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
    },
    headerText: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.text,
      flex: 1,
      textAlign: "center",
    },
    headerSpacer: {
      width: 32,
    },
    toggleContainer: {
      flexDirection: "row",
      paddingHorizontal: 16,
      paddingBottom: 14,
      gap: 10,
    },
    toggleButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 11,
      paddingHorizontal: 14,
      borderRadius: 12,
      backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "#F3F4F6",
      borderWidth: 1,
      borderColor: isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB",
    },
    toggleButtonActive: {
      backgroundColor: theme.primary || "#4C8EF7",
      borderColor: theme.primary || "#4C8EF7",
    },
    toggleButtonText: {
      fontSize: 13,
      fontWeight: "600",
      color: isDark ? "#9CA3AF" : "#6B7280",
    },
    toggleButtonTextActive: {
      color: "#fff",
    },
    countBadge: {
      marginHorizontal: 16,
      marginBottom: 12,
      paddingVertical: 7,
      paddingHorizontal: 14,
      backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "#F3F4F6",
      borderRadius: 20,
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB",
    },
    countText: {
      fontSize: 12,
      fontWeight: "600",
      color: isDark ? "#9CA3AF" : "#6B7280",
    },
    listContent: {
      paddingHorizontal: 12,
      paddingBottom: 40,
    },
    card: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "#FFFFFF",
      marginHorizontal: 8,
      marginBottom: 12,
      padding: 16,
      borderRadius: 16,
      borderWidth: isDark ? 1 : 0,
      borderColor: "rgba(255,255,255,0.1)",
      elevation: 4,
      shadowColor: isDark ? "#000000" : "#4C8EF7",
      shadowOpacity: isDark ? 0.3 : 0.12,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
    },
    accentBar: {
      width: 4,
      height: "100%",
      borderRadius: 8,
      marginRight: 12,
    },
    cardContent: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
    },
    avatar: {
      width: 50,
      height: 50,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
      flexShrink: 0,
    },
    avatarImage: {
      width: "100%",
      height: "100%",
      borderRadius: 12,
    },
    avatarText: {
      color: "#fff",
      fontWeight: "800",
      fontSize: 18,
    },
    infoSection: {
      flex: 1,
      justifyContent: "center",
    },
    name: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.text,
      marginBottom: 6,
    },
    rollContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    roll: {
      fontSize: 12,
      fontWeight: "500",
      color: isDark ? "#9CA3AF" : "#6B7280",
    },
    statusBadge: {
      padding: 8,
      justifyContent: "center",
      alignItems: "center",
    },
    emptyContainer: {
      marginTop: 80,
      alignItems: "center",
      paddingHorizontal: 40,
    },
    emptyText: {
      marginTop: 16,
      fontSize: 18,
      fontWeight: "600",
      color: isDark ? "#9CA3AF" : "#6B7280",
      marginBottom: 8,
    },
    emptySubtext: {
      fontSize: 14,
      color: isDark ? "#9CA3AF" : "#6B7280",
      textAlign: "center",
      lineHeight: 20,
    },
  });
}