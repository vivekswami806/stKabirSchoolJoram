import { RootState } from "@/action/store";
import { ThemeContext } from "@/action/theme/ThemeContext";
import { Theme } from "@/action/theme/themeReducer";
import Skeleton from "@/components/Skeleton";
import { API_BASE_URL } from "@/config";
import { getDeviceId } from "@/helper/getDeviceId";
import { TimetableItem, WeekDay } from "@/types/timetabletype";
import { getTodayWeekDay } from "@/utils/date";
import { mapTimetableItem } from "@/utils/timetable.mapper";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Buffer } from "buffer";
import { router } from "expo-router";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSelector } from "react-redux";
import TimetableCard from "./TimetableCard";
import WeekTabs from "./WeekTabs";
import WeeklyGrid from "./WeeklyGrid";

export default function TimeTableScreen() {
  const [rawData, setRawData] = useState<TimetableItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [day, setDay] = useState<WeekDay>(getTodayWeekDay());
  const [view, setView] = useState<"LIST" | "GRID">("LIST"); // future use
  const { userDetail } = useSelector((state: RootState) => state.user);
  const themeState = useContext(ThemeContext);
  if (!themeState) return null;
  const { theme } = themeState;
  const styles = getStyles(theme);
  /* ================= FILTERED DATA ================= */
  const filteredData = useMemo(() => {
    return rawData.filter((item) => item.dayOfWeek === day);
  }, [rawData, day]);

  /* ================= API CALL ================= */
  const fetchTimeTable = useCallback(async () => {
    setLoading(true);

    try {
      const token = await AsyncStorage.getItem("auth_token");
      const encodedTenant = await AsyncStorage.getItem("auth_tenant");
      const userId = await AsyncStorage.getItem("auth_login_id");
      const role = await AsyncStorage.getItem("auth_role");

      if (!token || !encodedTenant || !userId) {
        throw new Error("Authentication missing");
      }

      const tenantId = Buffer.from(encodedTenant, "base64").toString("utf-8");
      let url = role == "PARENT" ? `${API_BASE_URL}v2/timetable/entries/by-class-section?className=${userDetail.studentClass}&section=${userDetail.classSection}`:
                                    `${API_BASE_URL}v2/timetable/entries/by-teacher/${userId}`
      const response = await axios.get(
       url,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Tenant-ID": tenantId,
            "X-Device-ID": await getDeviceId(),
          },
        }
      );
      
      const mappedData: TimetableItem[] = (response.data ?? [])
        .filter((item: any) => item.isActive)
        .sort(
          (a: any, b: any) =>
            a.period.displayOrder - b.period.displayOrder
        )
        .map(mapTimetableItem);

      setRawData(mappedData);
    } catch (error) {
      console.error("Failed to fetch timetable:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  /* ================= LIFECYCLE ================= */
  useEffect(() => {
    fetchTimeTable();
  }, [fetchTimeTable]);

  /* ================= RENDER ================= */
  return (
    <View style={styles.container}>
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
      <View style={{ flex: 1 }}>
        {/* Week Tabs */}
        <WeekTabs selected={day} onChange={setDay} />

        {/* View Toggle */}
        {/* <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            marginVertical: 12,
            gap: 12,
          }}
        > */}
          {/* <Button
            title="List"
            onPress={() => setView("LIST")}
            color={view === "LIST" ? "#7A75F0" : undefined}
          />
          <Button
            title="Grid"
            onPress={() => setView("GRID")}
            color={view === "GRID" ? "#7A75F0" : undefined}
          /> */}
        {/* </View> */}

        {/* Content */}
        {loading ? (
          <Skeleton isDark={theme.mode === "dark" ? true: false} />
        ) : view === "LIST" ? (
          <FlatList
            data={filteredData}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TimetableCard item={item} />
            )}
            contentContainerStyle={{ padding: 16 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Text
                style={{
                  textAlign: "center",
                  marginTop: 40,
                  color: "#999",
                }}
              >
                No classes
              </Text>
            }
          />
        ) : (
          <WeeklyGrid data={rawData} />
        )}
      </View>
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
      paddingTop: Platform.OS === "ios" ? 60 : 50,
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

    dateRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 20,
      paddingHorizontal: 16,
      gap: 10,
    },

    dateText: {
      fontSize: 16,
      fontWeight: "600",
      color: isDark ? "#F4F4F5" : "#000",
    },

    todayText: {
      marginLeft: "auto",
      fontSize: 14,
      color: isDark ? "#A1A1AA" : "#777",
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
      height: 80,
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
      marginBottom: 8,
    },

    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },

    subjectText: {
      fontSize: 15,
      fontWeight: "700",
      color: isDark ? "#F4F4F5" : "#000",
      flex: 1,
    },

    subjectCodeText: {
      fontSize: 12,
      fontWeight: "600",
      color: "#7A75F0",
      backgroundColor: isDark ? "#1F2937" : "#E8E8FF",
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
    },

    classText: {
      fontSize: 13,
      marginBottom: 6,
      color: isDark ? "#A1A1AA" : "#666",
      fontWeight: "500",
    },

    cardRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: 4,
    },

    detailText: {
      fontSize: 12,
      color: isDark ? "#A1A1AA" : "#666",
    },

    notesContainer: {
      flexDirection: "row",
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: isDark ? "#1F2937" : "#EEE",
    },

    notesLabel: {
      fontSize: 11,
      fontWeight: "600",
      color: "#7A75F0",
      marginRight: 4,
    },

    notesText: {
      fontSize: 11,
      color: isDark ? "#A1A1AA" : "#666",
      flex: 1,
    },

    timeRangeText: {
      fontSize: 11,
      color: isDark ? "#717171" : "#999",
      marginTop: 8,
      fontStyle: "italic",
    },

    emptyText: {
      textAlign: "center",
      marginTop: 40,
      fontSize: 16,
      color: isDark ? "#A1A1AA" : "#999",
    },
  });
}