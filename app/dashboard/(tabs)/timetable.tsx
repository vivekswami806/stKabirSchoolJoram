import { RootState } from "@/action/store";
import { ThemeContext } from "@/action/theme/ThemeContext";
import { Theme } from "@/action/theme/themeReducer";
import { API_BASE_URL } from "@/config";
import { getDeviceId } from "@/helper/getDeviceId";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Buffer } from "buffer";
import { useRouter } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { ToastService } from "react-native-toastier";
import { useSelector } from "react-redux";

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
  const { userDetail } = useSelector((state: RootState) => state.user);
  
  if (!themeState) return null;
  const { theme } = themeState;
  const styles = getStyles(theme);

  const [data, setData] = useState<TimeTableItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTimeTable();
  }, []);

  const fetchTimeTable = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("auth_token");
      const encodedTenant = await AsyncStorage.getItem("auth_tenant");
      const deviceId = await getDeviceId();
      if (!token || !encodedTenant) throw new Error("Auth missing");
      let tenantId = Buffer.from(encodedTenant, "base64").toString("utf-8")

      if (!token || !tenantId) {
        throw new Error("Authentication missing");
      }

      const response = await axios.get(
        // `${API_BASE_URL}v2/timetable/entries/by-class-section`,
        `${API_BASE_URL}v2/timetable/entries/by-class-section?className=${userDetail.studentClass}&section=${userDetail.classSection}`,
        {
            headers: {
              Authorization: `Bearer ${token}`,
              "X-Tenant-ID": tenantId,
              "X-Device-ID": deviceId,
            },
          }
      );
      // console.log("rrrr|", response);
      setData(response.data?.data || []);
 
    } catch (err: any) {
      console.log("err|", err);
      
      ToastService.show({
        type: "danger",
        message: "Network Error ",
        duration: 2500, contentContainerStyle: {flex: 1,}
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
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

      {/* Date Row */}
      <View style={styles.dateRow}>
        <Ionicons
          name="calendar-outline"
          size={20}
          color={theme.mode === "dark" ? "#E9EFFC" : "#111827"}
        />
        <Text style={styles.dateText}>
          {new Date().toDateString()}
        </Text>
        <Text style={styles.todayText}>Today</Text>
      </View>

      {/* Table Header */}
      <View style={styles.tableHeader}>
        <Text style={styles.tableHeaderText}>Time</Text>
        <Text style={styles.tableHeaderText}>Class</Text>
      </View>

      {/* Loader */}
      {loading && (
        <ActivityIndicator
          size="large"
          color="#7A75F0"
          style={{ marginTop: 20 }}
        />
      )}

      {/* Time Table */}
      {!loading && (
        <FlatList
          data={data}
          keyExtractor={(item, index) => `${item.time}-${index}`}
          renderItem={({ item, index }) => (
            <View style={styles.rowContainer}>
              {/* Left Side */}
              <View style={styles.leftColumn}>
                <Text style={styles.timeText}>{item.time}</Text>

                {index !== data.length - 1 && (
                  <View style={styles.verticalLine} />
                )}

                <View style={styles.dot} />
              </View>

              {/* Right Side */}
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
  });
}
