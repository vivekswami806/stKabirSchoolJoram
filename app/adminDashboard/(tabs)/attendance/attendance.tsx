import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { Buffer } from "buffer";
import { router } from "expo-router";
import React, { useCallback, useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

import { ThemeContext } from "@/action/theme/ThemeContext";
import AttendanceRow from "../components/AttendanceRow";
import StudentList from "../components/StudentList";

import { RootState } from "@/action/store";
import { Theme } from "@/action/theme/themeReducer";
import { API_BASE_URL, classes, sections } from "@/config";
import { getDeviceId } from "@/helper/getDeviceId";
import { RoleMode } from "@/types/leave";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { ToastService } from "react-native-toastier";
import { useSelector } from "react-redux";
import ErrorRetry from "../components/ErrorRetry";
import StudentFilters from "../components/StudentFilters";
import LeaveSkeleton from "../leave/LeaveSkeleton";

interface Person {
  id: string;
  name: string;
  avatar?: string;
  image?: string | null;
  isPresent: "A" | "P";
  synced?: boolean;
  attendanceMarked?: boolean;

  // optional student-only fields
  studentClass?: string;
  section?: string;
  admissionNumber?: string;
}



// Local date helper
const formatDateLocal = (date: Date) => {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60000);
  return localDate.toISOString().split("T")[0];
};

export default function AttendanceScreen() {
  const [activeTab, setActiveTab] = useState<"students" | "teacher">("students");
  const [roleMode, setRoleMode] = useState<RoleMode>("PARENT");
  const { userDetail } = useSelector((state: RootState) => state.user);
  const [dateObj, setDateObj] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState(formatDateLocal(new Date()));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string>("nur");
  const [selectedSection, setSelectedSection] = useState<string>("A");
  const [students, setStudents] = useState<Person[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [classModalVisible, setClassModalVisible] = useState(false);
  const [sectionModalVisible, setSectionModalVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // console.log("---userDe|", userDetail.id);

  // Store pending attendance locally
  const [pendingChanges, setPendingChanges] = useState<
    Map<
      string,
      {
        studentId: string;
        ownerId: string;
        date: string;
        status: "A" | "P";
        markedBy: string; // add this
        attendanceMarked:Boolean
      }
    >
  >(new Map());

  const themeState = useContext(ThemeContext);
  if (!themeState) return null;
  const { theme } = themeState;

  
  const styles = getStyles(theme);

  // Load students when class or date changes
  useEffect(() => {
    loadStudentsData();
  }, [selectedClass, selectedSection, roleMode]);

  const loadStudentsData = async () => {
    try {
      setIsLoading(true);

      const encodedTenant = await AsyncStorage.getItem("auth_tenant");
      const token = await AsyncStorage.getItem("auth_token");
      const deviceId = await getDeviceId();
      if (!encodedTenant || !token) return;

      const tenantId = Buffer.from(encodedTenant, "base64").toString("utf-8");
      const url = roleMode ==="PARENT" ? `${API_BASE_URL}attendance/admin/students-for-attendance?date=${selectedDateStr}&studentClass=${selectedClass}&section=${selectedSection}`
                                      : `${API_BASE_URL}v2/attendance/staff-for-attendance`;
      const response = await axios.get(url,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Tenant-ID": tenantId,
            'X-Device-ID': deviceId
          },
        }
      );
        //  console.log("---res Attandnnce  |", response.data[5])
         const newPendingChanges = new Map();
       const studentsData: Person[] = response.data.map((s: any) => {
        const status: "A" | "P" = s.marked ? (s.status as "A" | "P") : "A";
        const isMarked = s.marked;
        if (roleMode === "PARENT") {
          if (!isMarked) {
          const key = `${s.studentId}_${selectedDateStr}`;
          newPendingChanges.set(key, {
            studentId: s.studentId,
            // ownerId: id,
            date: selectedDateStr,
            status: "A", // Defaulting to Absent
            markedBy: userDetail.id,
            attendanceMarked: true
          });
        }
          return {
            id: s.studentId,
            name: s.studentName,
            avatar: s.studentName?.charAt(0) ?? "",
            image: s.studentImage
              ? `data:image/png;base64,${s.studentImage}`
              : null,
            // isPresent: s.status as "A" | "P",
            isPresent: status,
            synced: true,
            attendanceMarked: s.attendanceMarked,
          };
        } else {
          if (!isMarked) {
          const key = `${s.staffId}_${selectedDateStr}`;
          newPendingChanges.set(key, {
            studentId: s.staffId,
            // ownerId: id,
            date: selectedDateStr,
            status: "A", // Defaulting to Absent
            markedBy: userDetail.id,
            attendanceMarked: true
          });
        }
          return {
            id: s.staffId,
            name: s.staffName,
            avatar: s.staffName?.charAt(0) ?? "",
            image: s.staffImage
              ? `data:image/png;base64,${s.staffImage}`
              : null,
            // isPresent: s.status as "A" | "P",
            isPresent:   status, //s.status === "P" ? "P" : "A",
            synced: true,
            attendanceMarked: s.attendanceMarked,
          };
        }
      });
            
      setStudents(studentsData);
      setPendingChanges(newPendingChanges);
      setPendingCount(newPendingChanges.size);
    } catch (error: any) {
      setError("Failed to load leave requests");
      ToastService.show({
        type: "danger",
        message: error,
        duration: 3000,
        contentContainerStyle: { flex: 1 },
      });
      if (error.response) {
        // console.log("STATUS:", error.response.status);
        // console.log("DATA:", error.response.data);
        // console.log("HEADERS:", error.response.headers);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAttendance = useCallback(
    (id: string, status: "A" | "P") => {
      setStudents((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, isPresent: status, synced: false } : s
        )
      );

      const key = `${id}_${selectedDateStr}`;
      setPendingChanges((prev) => {
        const map = new Map(prev);
        map.set(key, {
          studentId: id,
          ownerId:id,
          date: selectedDateStr, // don't forget date
          status,
          markedBy: userDetail.id,
          attendanceMarked: true
        });
        setPendingCount(map.size);
        return map;
      });

    },
    [selectedDateStr]
  );

  const markAllPresent = () => {
    // 1️⃣ Update all students in the UI
    const updated: Person[] = students.map((s) => ({
      ...s,
      isPresent: "P",          // Mark as Present
      synced: false,           // Will need sync
    }));

    setStudents(updated);

    // 2️⃣ Prepare pendingChanges map
    const map = new Map(pendingChanges);
    
    updated.forEach((s) => {
      const key = `${s.id}_${selectedDateStr}`; 
      map.set(key, {
        
        ownerId: s.id,
        studentId: s.id,
        date: selectedDateStr,
        status: "P",            // Present
        markedBy: userDetail.id,
        attendanceMarked: true
      });
    });

    setPendingChanges(map);
    setPendingCount(map.size);
  };



  const handleManualSync = async () => {
    try {
      setIsSyncing(true);

      const encodedTenant = await AsyncStorage.getItem("auth_tenant");
      const token = await AsyncStorage.getItem("auth_token");
      const deviceId = await getDeviceId();
      if (!encodedTenant || !token) return;

      const tenantId = Buffer.from(encodedTenant, "base64").toString("utf-8");

      // FIX: Instead of checking pendingChanges, map the current 'students' state.
      // This ensures that even if you didn't click anything (leaving them as 'A'), 
      // the current UI state is what gets sent to the server.
      const attendanceArray = students.map((s) => ({
        ownerId: s.id,
        studentId: s.id,
        date: selectedDateStr,
        status: s.isPresent, // Uses the current UI state ("A" or "P")
        markedBy: userDetail.id,
        attendanceMarked: true
      }));

      let url = roleMode === "PARENT" 
        ? `${API_BASE_URL}attendance/markBulkAttendance`
        : `${API_BASE_URL}v2/attendance/markBulkAttendanceByOwnerType`;
  
      await axios.post(
        url,
        attendanceArray,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Tenant-ID": tenantId,
            'X-Device-ID': deviceId
          },
        }
      );

      ToastService.show({
        type: "success",
        message: "Attendance marked successfully",
        duration: 3000,
        contentContainerStyle: { flex: 1 },
      });

      // Refresh data and clear pending indicators
      await loadStudentsData();
      setPendingChanges(new Map());
      setPendingCount(0);

    } catch (e: any) {
      console.log("Sync error:", e);
      ToastService.show({
        type: "danger",
        message: "Failed to sync attendance",
        duration: 3000,
        contentContainerStyle: { flex: 1 },
      });
    } finally {
      setIsSyncing(false);
    }
  };


  const onDateChange = (_: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setDateObj(date);
      setSelectedDateStr(formatDateLocal(date));
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace("/(tabs)/home")} >
          <Ionicons name="arrow-back" size={26} style={styles.backButton}/>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Attendance</Text>
        <View style={styles.toggleContainer}>
          <TouchableOpacity onPress={() => setRoleMode("PARENT")}>
            <Ionicons
              name="people"
              size={24}
              color={roleMode === "PARENT" ? "#3B82F6" : "#9CA3AF"}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setRoleMode("STAFF")}>
            <Ionicons
              name="school"
              size={24}
              color={roleMode === "STAFF" ? "#3B82F6" : "#9CA3AF"}
            />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          onPress={handleManualSync}
          disabled={isSyncing}
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: theme.primary,
            paddingVertical: 6,
            paddingHorizontal: 12,
            borderRadius: 20,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
          }}
        >
          {isSyncing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
              <Text
                style={{
                  color: theme.buttonText,
                  fontWeight: "600",
                  marginLeft: 6,
                }}
              >
                Mark
              </Text>

              {pendingCount > 0 && (
                <View
                  style={{
                    borderRadius: 10,
                    marginLeft: 6,
                    minWidth: 20,
                    paddingHorizontal: 6,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: theme.buttonText, fontSize: 12, fontWeight: "bold" }}>
                    {pendingCount}
                  </Text>
                </View>
              )}
            </>
          )}
        </TouchableOpacity>

      </View>
      {roleMode === "PARENT" ?
        <StudentFilters
          styles={styles}
          selectedDateStr={selectedDateStr}

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
          onDatePress={() => setShowDatePicker(true)}
        /> : null}


      <View style={styles.quickActionBar}>
        <Text style={styles.totalText}>Total: {students.length}</Text>
        <TouchableOpacity onPress={markAllPresent}>
          <Text style={{ color: theme.primary }}>Mark All Present</Text>
        </TouchableOpacity>
      </View>


      {isLoading ? (
        <LeaveSkeleton isDark={theme.mode == "dark" ? true : false} />
      ) : error ? (
        <ErrorRetry
          message={error}
          isDark={false}
          onRetry={() => loadStudentsData()}
        />
      ) : students.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="document-text-outline"
            size={80}
            color={"#6B7280"}
            style={styles.emptyIcon}
          />
          <Text style={styles.emptyTitle}>No Student</Text>
          <Text style={styles.emptySubtitle}>There are no leave requests to show.</Text>
        </View>
      ) : (
        <StudentList
          students={students}
          styles={styles}
          renderAttendanceRow={(item) => (
            <AttendanceRow
              key={item.id}
              item={item}
              listType="students"
              styles={styles}
              toggleAttendance={toggleAttendance}
            />
          )}
        />
      )}

      {showDatePicker && (
        <DateTimePicker
          value={dateObj}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={onDateChange}
          maximumDate={new Date()}
        />
      )}
    </View>
  );
}

function getStyles(theme: Theme) {
  let isDark = theme.mode === "dark";

  const colors = {
    bg: isDark ? "#020617" : "#EBF4F3",
    surface: isDark ? "#020617" : "#FFFFFF",
    text: isDark ? "#E5E7EB" : "#111827",
    textMuted: isDark ? "#9CA3AF" : "#6B7280",
    border: isDark ? "#1F2937" : "#E5E7EB",
    icon: isDark ? "#E5E7EB" : "#111827",
    chip: isDark ? "#1F2937" : "#F8F9FA",
    danger: "#FF6B6B",
    warningBg: isDark ? "#3F2F1B" : "#FFF3CD",
    warningText: isDark ? "#FCD34D" : "#856404",
  };
  const styles = StyleSheet.create({
    offlineBanner: {
      backgroundColor: '#FF6B6B',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
      gap: 6,
    },
    offlineText: {
      color: '#fff',
      fontSize: 13,
      fontWeight: '500',
    },
    backButton:{
      color: isDark ? "#E5E7EB" : "#111827",
    },
    pendingBanner: {
      backgroundColor: '#FFF3CD',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
      gap: 6,
    },
    pendingText: {
      color: '#856404',
      fontSize: 13,
      fontWeight: '500',
    },
    container: {
      flex: 1,
      backgroundColor: theme.background,
      paddingTop: Platform.OS === 'ios' ? 40 : 35,
    },
    quickActionBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 10,
      backgroundColor: theme.background,
      borderBottomWidth: 1,
      borderColor: isDark ? "#E5E7EB" : "#111827"
    },
    totalText: {
      color: !isDark ? '#1a1a1a' : '#f8f9fa',
    },
    headerIcon: {
      color: !isDark
        ? '#000104'
        : '#E9EFFC',
    },

    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingTop: 8,
      paddingBottom: 16,
      paddingHorizontal: 20,
      backgroundColor: theme.background,
      justifyContent: "space-between",
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: !isDark
        ? '#000104'
        : '#E9EFFC',
    },

    // Tabs
    topTabs: {
      flexDirection: "row",
      backgroundColor: isDark
        ? '#000104'
        : '#E9EFFC',
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 12,
      justifyContent: "flex-start",
      gap: 20,
    },
    topTab: {
      paddingBottom: 8,
      marginRight: 20,
    },
    topTabActive: {
      borderBottomWidth: 3,
      borderColor: "#6366f1",
    },
    topTabText: {
      fontSize: 16,
      color: !isDark
        ? '#000104'
        : '#E9EFFC',
      fontWeight: "400",
    },
    topTabTextActive: {
      color: "#6366f1",
      fontWeight: "600",
    },

    // Filters
    filterContainer: {
      flexDirection: "row",
      padding: 16,
      gap: 12,
      backgroundColor: theme.background,
      alignItems: "center",
    },
    classDropdown: {
      flex: 1,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 14,
      backgroundColor: "white",
      borderRadius: 10,
      borderWidth: 1,
      borderColor: !isDark
        ? '#000104'
        : '#E9EFFC',
    },
    dropdownText: {
      fontSize: 15,
      color: "#495057",
    },
    dropdownIcon: {
      fontSize: 14,
      color: "#6c757d",
    },
    dateText: {
      fontSize: 15,
      color: "#495057",
    },
    calendarIcon: {
      fontSize: 16,
    },

    // Content container
    contentContainer: {
      flex: 1,
    },

    // Student list
    listContainer: {
      backgroundColor: theme.background,
      paddingBottom: 20,
      flex: 1,
    },
    columnHeaders: {
      flexDirection: "row",
      paddingHorizontal: 20,
      paddingVertical: 12,
      backgroundColor: theme.background,
      alignItems: "center",
    },
    columnHeaderText: {
      flex: 1,
      fontSize: 14,
      fontWeight: "600",
      color: !isDark
        ? '#000104'
        : '#E9EFFC',
    },
    attendanceHeaders: {
      flexDirection: "row",
      gap: 40,
    },
    attendanceHeaderText: {
      fontSize: 14,
      fontWeight: "600",
      color: !isDark
        ? '#000104'
        : '#E9EFFC',
      width: 60,
      textAlign: "center",
    },

    studentRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: !isDark
        ? '#000104'
        : '#E9EFFC',
    },
    studentInfo: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
    },
    avatar: {
      width: 45,
      height: 45,
      borderRadius: 22.5,
      backgroundColor: "#e9ecef",
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    avatarText: {
      fontSize: 22,
    },
    studentName: {
      fontSize: 15,
      color: !isDark
        ? '#000104'
        : '#E9EFFC',
      fontWeight: "500",
    },

    attendanceButtons: {
      flexDirection: "row",
      gap: 40,
    },
    buttonContainer: {
      width: 60,
      alignItems: "center",
    },
    checkButton: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: "#dee2e6",
      backgroundColor: "white",
      justifyContent: "center",
      alignItems: "center",
    },
    checkButtonActive: {
      borderColor: "#6366f1",
      backgroundColor: "#6366f1",
    },
    checkMark: {
      color: "white",
      fontSize: 14,
      fontWeight: "bold",
    },

    // Teacher calendar styles
    teacherMonthHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 8,
      alignItems: "center",
    },
    teacherMonthText: {
      fontSize: 18,
      fontWeight: "600",
      color: !isDark
        ? "#777"
        : '#E9EFFC',
    },
    teacherDaysRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 6,
      color: !isDark
        ? "#777"
        : '#E9EFFC',
    },
    teacherDayName: {
      width: "14%",
      textAlign: "center",
      fontWeight: "500",
      color: !isDark
        ? "#777"
        : '#E9EFFC',
    },
    calendarMonthChanger: {
      color: !isDark
        ? "#777000"
        : '#E9EFFC',
    },
    teacherDateGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
    },
    teacherDateCircle: {
      width: "14%",
      height: 36,
      borderRadius: 18,
      justifyContent: "center",
      alignItems: "center",
      marginVertical: 6,
      backgroundColor: "#fff",
    },
    teacherDateCircleActive: {
      backgroundColor: "#8A7DFF",
    },
    teacherDateText: {
      color: "#000",
    },
    teacherDateTextActive: {
      color: "#fff",
      fontWeight: "600",
    },
    teacherCardRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 18,
    },
    teacherCard: {
      width: "32%",
      paddingVertical: 18,
      borderRadius: 12,
      alignItems: "center",
    },
    teacherCardLabel: {
      fontSize: 14,
      marginTop: 8,
      color: "#444",
    },
    teacherCardValue: {
      marginTop: 6,
      fontSize: 18,
      fontWeight: "700",
    },
    dropdownMenu: {
      backgroundColor: "#fff",
      borderWidth: 1,
      borderColor: "#ddd",
      borderRadius: 10,
      marginTop: 5,
      paddingVertical: 8,
    },

    dropdownItem: {
      paddingVertical: 10,
      paddingHorizontal: 14,
    },

    dropdownItemText: {
      fontSize: 15,
      color: "#333",
    },

    classDropdownWrapper: {
      width: '30%',
      height: 35,
      borderWidth: 1,
      borderColor: '#ccc',
      borderRadius: 8,
      justifyContent: 'center',
      paddingHorizontal: 10,
      backgroundColor: '#fff',
    },

    selectedText: {
      fontSize: 16,
      color: '#333',
    },

    /* Date picker container */
    datePickerContainer: {
      width: '35%',
      height: 35,
      borderWidth: 1,
      borderColor: '#ccc',
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 10,
      backgroundColor: '#fff',
    },

    /* ---------- MODAL STYLES ---------- */

    modalContainer: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.3)',
      justifyContent: 'center',
      paddingHorizontal: 20,
    },

    modalBox: {
      backgroundColor: '#fff',
      borderRadius: 10,
      paddingVertical: 10,
    },

    modalItem: {
      paddingVertical: 14,
      paddingHorizontal: 15,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
    },

    modalItemText: {
      fontSize: 16,
      color: '#333',
    },


    //-----------------------------------------------------------

    monthNavigation: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
      paddingHorizontal: 10,
    },
    navButton: {
      padding: 8,
    },
    monthLabel: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#333',
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 20,
      gap: 8,
    },
    statCard: {
      flex: 1,
      padding: 12,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    statNumber: {
      fontSize: 22,
      fontWeight: 'bold',
      color: '#333',
      marginTop: 4,
    },
    statLabel: {
      fontSize: 11,
      color: '#666',
      marginTop: 2,
    },
    weekDaysHeader: {
      flexDirection: 'row',
      marginBottom: 8,
    },
    weekDayCell: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 8,
    },
    weekDayText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#666',
    },
    calendarGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: 20,
    },
    calendarDay: {
      width: '14.28%', // 100% / 7 days
      aspectRatio: 1,
      padding: 2,
    },
    dayContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 8,
      borderWidth: 2,
      backgroundColor: '#fff',
      position: 'relative',
    },
    emptyDay: {
      flex: 1,
    },
    dayNumber: {
      fontSize: 14,
      fontWeight: '500',
      color: '#333',
    },
    statusDot: {
      position: 'absolute',
      bottom: 4,
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    legendContainer: {
      backgroundColor: '#F9F9F9',
      padding: 16,
      borderRadius: 12,
      marginBottom: 16,
    },
    legendTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: 12,
    },
    legendRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    legendDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: 8,
    },
    legendText: {
      fontSize: 13,
      color: '#666',
    },
    percentageCard: {
      backgroundColor: '#E3F2FD',
      padding: 20,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: 20,
    },
    percentageTitle: {
      fontSize: 14,
      color: '#666',
      marginBottom: 8,
    },
    percentageValue: {
      fontSize: 42,
      fontWeight: 'bold',
      color: '#1976D2',
    },
    percentageSubtext: {
      fontSize: 12,
      color: '#666',
      marginTop: 4,
    }, emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 32,
    },
    emptyIcon: {
      marginBottom: 20,
    },
    emptyTitle: {
      fontSize: 22,
      fontWeight: "700",
      color: isDark ? "#F3F4F6" : "#111827",
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: 14,
      color: isDark ? "#A1A1AA" : "#6B7280",
      textAlign: "center",
    },
    toggleContainer: {
      flexDirection: "row",
      gap: 16,  // space between icons
      justifyContent: "flex-end",
      width: 70, // or enough to fit both icons comfortably
    },

  });
  return styles;
}
