import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { Buffer } from "buffer";
import { router } from "expo-router";
import moment from 'moment';
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
import AttendanceRow from "./components/AttendanceRow";
import StudentList from "./components/StudentList";

import { RootState } from "@/action/store";
import { Theme } from "@/action/theme/themeReducer";
import ErrorRetry from "@/app/adminDashboard/(tabs)/components/ErrorRetry";
import StudentFilters from "@/app/adminDashboard/(tabs)/components/StudentFilters";
import LeaveSkeleton from "@/app/adminDashboard/(tabs)/leave/LeaveSkeleton";
import { API_BASE_URL, classes, sections } from "@/config";
import { getDeviceId } from "@/helper/getDeviceId";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { ToastService } from "react-native-toastier";
import { useSelector } from "react-redux";

interface Person {
  id: string;
  name: string;
  avatar?: string;          // fallback initials
  image?: string | null;    // base64 image
  isPresent: "A" | "P";
  synced?: boolean;
}


// Local date helper
const formatDateLocal = (date: Date) => {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60000);
  return localDate.toISOString().split("T")[0];
};

export default function AttendanceScreen() {
  const [activeTab, setActiveTab] = useState<"students" | "teacher">("students");
  const { userDetail } = useSelector((state: RootState) => state.user);
  const [dateObj, setDateObj] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState(formatDateLocal(new Date()));
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [students, setStudents] = useState<Person[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [classModalVisible, setClassModalVisible] = useState(false);
  const [sectionModalVisible, setSectionModalVisible] = useState(false);
  const [selectedClass, setSelectedClass] = useState(userDetail?.staffClass || "");
  const [selectedSection, setSelectedSection] = useState(userDetail?.staffSection || "");
  const [error, setError] = useState<string | null>(null);


  // Store pending attendance locally
  const [pendingChanges, setPendingChanges] = useState<
    Map<
      string,
      {
        studentId: string;
        date: string;
        status: "A" | "P";
        markedby: string; // add this
      }
    >
  >(new Map());

  const [userData, setUserData] = useState({
    staffClass: userDetail?.staffClass || "nur",
    name: userDetail?.name || "Teacher",
    status: true,
  });

  const themeState = useContext(ThemeContext);
  if (!themeState) return null;
  const { theme } = themeState;
  const styles = getStyles(theme);

  const classOptions = userDetail?.className || [];

  // Load students when class or date changes
  useEffect(() => {
    loadStudentsData();
  }, [userData.staffClass, selectedDateStr]);

  const loadStudentsData = async () => {
    try {
      setIsLoading(true);

      const encodedTenant = await AsyncStorage.getItem("auth_tenant");
      const token = await AsyncStorage.getItem("auth_token");
      const deviceId = await getDeviceId();
      if (!encodedTenant || !token) return;

      const tenantId = Buffer.from(encodedTenant, "base64").toString("utf-8");
      // console.log("----Attendance |", token, tenantId);
      let date = moment(new Date()).format("YYYY-MM-DD");
      const response = await axios.get(
        `${API_BASE_URL}attendance/students-for-attendance?date=${date}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Tenant-ID": tenantId,
            'X-Device-ID': deviceId
          },
        }
      );
      //  console.log("---res Attandnnce STAFF|", response.data)

      const studentsData: Person[] = response.data.map((s: any) => ({
        id: s.studentId || s.id || s._id,
        name: s.studentName,
        avatar: s.studentName?.charAt(0) ?? "",
        image: s.studentImage
          ? `data:image/png;base64,${s.studentImage}`
          : null,
        isPresent: s.status,
        synced: true,
      }));

      setStudents(studentsData);
      setPendingChanges(new Map());
      setPendingCount(0);
    } catch (error: any) {
      setError("Failed to load Attendance requests");
      ToastService.show({
        type: "danger",
        message: "Failed to load Attendance requests",
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
          date: selectedDateStr, // don't forget date
          status,
          markedby: userDetail.id,
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
        studentId: s.id,
        date: selectedDateStr,
        status: "P",            // Present
        markedby: userDetail.id,
      });
    });

    setPendingChanges(map);
    setPendingCount(map.size);
  };



  // 🔥 ONLY SYNC WHEN USER CLICKS
  const handleManualSync = async () => {
    if (pendingChanges.size === 0) {
      ToastService.show({
        type: "info",
        message: "All Synced",
        duration: 3000,
        contentContainerStyle: { flex: 1 },
      });
      return;
    }

    try {
      setIsSyncing(true);

      const encodedTenant = await AsyncStorage.getItem("auth_tenant");
      const token = await AsyncStorage.getItem("auth_token");
      const deviceId = await getDeviceId();
      if (!encodedTenant || !token) return;

      const tenantId = Buffer.from(encodedTenant, "base64").toString("utf-8");
      const attendanceArray = Array.from(pendingChanges.values());
      // console.log("---attendanceArraymarkBulkAttendance param|", attendanceArray);
      let response = await axios.post(
        `${API_BASE_URL}attendance/markBulkAttendance`,
        attendanceArray, // ⚡ wrap in object if API expects "attendance" key
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Tenant-ID": tenantId,
            'X-Device-ID': deviceId
          },
        }
      );
      //  console.log("---response,", response.data);
      ToastService.show({
        type: "success",
        message: "Attendance synced successfully",
        duration: 3000,
        contentContainerStyle: { flex: 1 },
      });
      await loadStudentsData();
    } catch (e) {
      // console.log("Sync error:", e);
      ToastService.show({
        type: "danger",
        message: "Sync error",
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
        <TouchableOpacity onPress={() => router.replace("/(tabs)/home")}>
          <Ionicons name="arrow-back" size={26} style={styles.backButtonColor} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Attendance</Text>
        <TouchableOpacity
              onPress={() => router.push("/staffDashboard/(tabs)/staffsummary")}
              // style={"styles.headerBtn"}
            >
              <Text style={{ fontSize: 22 }}>🗓️</Text>
            </TouchableOpacity>
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
                  color: "#000",
                  fontWeight: "600",
                  marginLeft: 6,
                }}
              >
                Mark
              </Text>

              {pendingCount > 0 && (
                <View
                  style={{
                    backgroundColor: "#000",
                    borderRadius: 10,
                    marginLeft: 6,
                    minWidth: 20,
                    paddingHorizontal: 6,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "#fff", fontSize: 12, fontWeight: "bold" }}>
                    {pendingCount}
                  </Text>
                </View>
              )}
            </>
          )}
        </TouchableOpacity>

      </View> 
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
        setSelectedSection={setSelectedClass}
        role ="STAFF"
        onDatePress={() => setShowDatePicker(true)}
      />

      <View style={styles.quickActionBar}>
        <Text>Total: {students.length}</Text>
        <TouchableOpacity onPress={markAllPresent}>
          <Text style={{ color: theme.primary }}>Mark All Present</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <LeaveSkeleton isDark={false} />
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
            color={theme.mode === "dark" ? "#A1A1AA" : "#6B7280"}
            style={styles.emptyIcon}
          />
          <Text style={styles.emptyTitle}>No Students</Text>
          <Text style={styles.emptySubtitle}>There are no students to display for this date.</Text>
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
          minimumDate={new Date()}
        />
      )}
    </View>
  );
}

function getStyles(theme: Theme) {
  let isDark = theme.mode === "dark";
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
    pendingBanner: {
      backgroundColor: '#FFF3CD',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
      gap: 6,
    },
    backButtonColor:{
      color: !isDark ? '#1a1a1a' : '#f8f9fa',
    },
    pendingText: {
      color: '#856404',
      fontSize: 13,
      fontWeight: '500',
    },
    container: {
      flex: 1,
      backgroundColor: theme.background,
      paddingTop: Platform.OS === 'ios' ? 60 : 50,
    },
    quickActionBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 10,
      backgroundColor: isDark ? '#1a1a1a' : '#f8f9fa',
      borderBottomWidth: 1,
      borderColor: '#eee'
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
      borderBottomColor: isDark
        ? '#000104'
        : '#E9EFFC',
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
      backgroundColor: isDark
        ? '#000104'
        : '#E9EFFC',
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
      backgroundColor: isDark
        ? '#000104'
        : '#E9EFFC',
      paddingBottom: 20,
      flex: 1,
    },
    columnHeaders: {
      flexDirection: "row",
      paddingHorizontal: 20,
      paddingVertical: 12,
      backgroundColor: isDark
        ? '#000104'
        : '#E9EFFC',
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

  });
  return styles;
}
