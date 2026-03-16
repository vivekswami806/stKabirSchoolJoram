import { ThemeContext } from "@/action/theme/ThemeContext";
import { Theme } from "@/action/theme/themeReducer";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import axios from "axios";
import { Buffer } from "buffer";
import { useRouter } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

import { classes, sections } from "@/config";
import { ToastService } from "react-native-toastier";
import ErrorRetry from "./components/ErrorRetry";
import StudentFilters from "./components/StudentFilters";
import LeaveSkeleton from "./leave/LeaveSkeleton";

/* ================= TYPES ================= */

interface TimeTableItem {
  time: string;
  subject: string;
  className: string;
}

/* ================= SCREEN ================= */

export default function TimeTableScreen() {
  const router = useRouter();
  const themeState = useContext(ThemeContext);
  if (!themeState) return null;

  const { theme } = themeState;
  const styles = getStyles(theme);

  /* ================= FILTER STATE ================= */

  // ✅ initial date = today
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // ✅ initial class & section
  const [selectedClass, setSelectedClass] = useState<string>("1");
  const [selectedSection, setSelectedSection] = useState<string>("A");

  const [classModalVisible, setClassModalVisible] = useState(false);
  const [sectionModalVisible, setSectionModalVisible] = useState(false);

  const selectedDateStr = selectedDate.toISOString().split("T")[0];
  const [error, setError] = useState<string | null>(null);
  /* ================= DATA ================= */

  const [data, setData] = useState<TimeTableItem[]>([]);
  const [loading, setLoading] = useState(false);

  /* ================= FETCH ================= */

  useEffect(() => {
    fetchTimeTable();
  }, [selectedDate, selectedClass, selectedSection]);

  const fetchTimeTable = async () => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("auth_token");
      const encodedTenant = await AsyncStorage.getItem("auth_tenant");
      if (!token || !encodedTenant) throw new Error("Auth missing");

      const tenantId = Buffer.from(encodedTenant, "base64").toString("utf-8");

      const response = await axios.get(
        "https://your-api-url.com/api/teacher/timetable",
        {
          params: {
            date: selectedDateStr,
            className: selectedClass,
            section: selectedSection,
          },
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Tenant-ID": tenantId,
          },
        }
      );

      setData(response.data?.data || []);
      ToastService.show({
        type: "success",
        message: "timetable",
        duration: 3000,
        contentContainerStyle: { flex: 1 },
      });
    } catch (err: any) {
      setError("Failed to load Time Table ");
      ToastService.show({
        type: "info",
        message: "Failed to load timetable",
        duration: 3000,
        contentContainerStyle: { flex: 1 },
      });
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.push("/(tabs)/home")}>
          <Ionicons
            name="arrow-back"
            size={26}
            color={theme.mode === "dark" ? "#E9EFFC" : "#111827"}
          />
        </TouchableOpacity>

        <Text style={styles.headerText}>Time Table</Text>
        <View style={{ width: 26 }} />
      </View>

      {/* FILTERS */}
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
        onDatePress={() => setShowDatePicker(true)}
        role="ADMIN"
      />

      {/* DATE PICKER */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(_, date) => {
            setShowDatePicker(false);
            if (date) setSelectedDate(date);
          }}
        />
      )}

      {/* TABLE HEADER */}
      <View style={styles.tableHeader}>
        <Text style={styles.tableHeaderText}>Time</Text>
        <Text style={styles.tableHeaderText}>Class</Text>
      </View>

      {/* LOADER */}
      {loading && (<LeaveSkeleton isDark= {false}/>)}

      {/* LIST */}
      {!loading && error ? (
        <ErrorRetry
          message={error}
          isDark={false}
          onRetry={() => fetchTimeTable()}
        />
      ) : data.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="document-text-outline"
            size={80}
            color={"#6B7280"}
            style={styles.emptyIcon}
          />
          <Text style={styles.emptyTitle}>No Time table</Text>
          <Text style={styles.emptySubtitle}>There are no Time table to show.</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item, index) => `${item.time}-${index}`}
          contentContainerStyle={{ paddingBottom: 30 }}
          renderItem={({ item, index }) => (
            <View style={styles.rowContainer}>
              {/* LEFT */}
              <View style={styles.leftColumn}>
                <Text style={styles.timeText}>{item.time}</Text>

                {index !== data.length - 1 && (
                  <View style={styles.verticalLine} />
                )}

                <View style={styles.dot} />
              </View>

              {/* RIGHT */}
              <View style={styles.classCard}>
                <Text style={styles.subjectText}>{item.subject}</Text>
                <Text style={styles.classText}>
                  ({item.className})
                </Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <Text style={{ textAlign: "center", marginTop: 40 }}>
              No timetable available
            </Text>
          }
        />
      )}
    </View>
  );
}

/* ================= STYLES ================= */

function getStyles(theme: Theme) {
  const isDark = theme.mode === "dark";

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      paddingTop: Platform.OS === "ios" ? 40 : 30,
    },

    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      alignItems: "center",
    },

    headerText: {
      fontSize: 22,
      fontWeight: "700",
      color: isDark ? "#E9EFFC" : "#000",
    },

    tableHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginTop: 20,
      backgroundColor: isDark ? "#111318" : "#F5F5F5",
    },

    tableHeaderText: {
      fontSize: 14,
      fontWeight: "600",
      color: isDark ? "#D4D4D8" : "#444",
    },

    rowContainer: {
      flexDirection: "row",
      paddingHorizontal: 16,
      marginTop: 20,
    },

    leftColumn: {
      width: 60,
      alignItems: "center",
    },

    timeText: {
      fontSize: 15,
      fontWeight: "600",
      marginBottom: 6,
      color: isDark ? "#F4F4F5" : "#000",
    },

    verticalLine: {
      width: 2,
      backgroundColor: "#7A75F0",
      height: 40,
      marginTop: -4,
    },

    dot: {
      width: 10,
      height: 10,
      backgroundColor: "#7A75F0",
      borderRadius: 5,
      position: "absolute",
      top: 28,
    },

    classCard: {
      flex: 1,
      backgroundColor: isDark ? "#111318" : "#FAFAFA",
      borderRadius: 10,
      padding: 12,
      borderWidth: 1,
      borderColor: isDark ? "#1F2937" : "#EEE",
    },

    subjectText: {
      fontSize: 15,
      fontWeight: "700",
      color: isDark ? "#F4F4F5" : "#000",
    },

    classText: {
      fontSize: 13,
      marginTop: 2,
      color: isDark ? "#A1A1AA" : "#777",
    },


    //------------------------------------filterData-----



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
    pendingText: {
      color: '#856404',
      fontSize: 13,
      fontWeight: '500',
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
    emptyContainer: {
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
}
