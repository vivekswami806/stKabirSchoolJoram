import { ThemeContext } from "@/action/theme/ThemeContext";
import { Theme } from "@/action/theme/themeReducer";
import { API_BASE_URL } from "@/config";
import { getDeviceId } from "@/helper/getDeviceId";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Buffer } from "buffer";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import LeaveSkeleton from "../leave/LeaveSkeleton";

interface teacher {
  staffClass: string;
  id: string;
  name: string;
  status: boolean;
}

interface Props {
  onSelectStudent: (teacher: teacher) => void;
}

export default function TeacherInfo({ onSelectStudent }: Props) {
  const router = useRouter();
  const themeState = useContext(ThemeContext);
  if (!themeState) return null;
  const { theme } = themeState;

  const isDark = theme.mode === "dark";
  const styles = getStyles(theme, isDark);

  const [students, setStudents] = useState<teacher[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTeachersDetails();
  }, []);

  const fetchTeachersDetails = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("auth_token");
      const encodedTenant = await AsyncStorage.getItem("auth_tenant");
      const deviceId = await getDeviceId();
      if (!token || !encodedTenant) throw new Error("Auth missing");

      const tenantId = Buffer.from(
        encodedTenant,
        "base64"
      ).toString("utf-8");

      const response = await axios.get(
        `${API_BASE_URL}staff/getAllStaff`,
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
      Alert.alert("Error", err.message || "Failed to load staff");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getInitials = (name: string) => {
    const names = name.split(" ");
    return names.length > 1
      ? names[0][0] + names[1][0]
      : names[0][0];
  };

  return (
    <LinearGradient
      colors={[theme.background, theme.background]}
      style={{ flex: 1 }}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={() => router.push("/(tabs)/home")}>
            <Ionicons
              name="arrow-back"
              size={26}
              color={theme.background}
            />
          </TouchableOpacity>
          <Text style={styles.headerText}>Staff Details</Text>
        </View>

        {loading ? (
          <LeaveSkeleton isDark={isDark} />
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
                  fetchTeachersDetails();
                }}
                tintColor={theme.primary}
              />
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.card}
                onPress={() => onSelectStudent(item)}
              >
                {/* Accent */}
                <View
                  style={[
                    styles.accentBar,
                    {
                      backgroundColor: item.status
                        ? "#22c55e"
                        : "#ef4444",
                    },
                  ]}
                />

                <View style={styles.cardContent}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {getInitials(item.name)}
                    </Text>
                  </View>

                  <View>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.roll}>
                      Class Teacher: {item.staffClass}
                    </Text>
                  </View>
                </View>

                <Ionicons
                  name={
                    item.status
                      ? "checkmark-circle"
                      : "close-circle"
                  }
                  size={22}
                  color={
                    item.status ? "#22c55e" : "#ef4444"
                  }
                />
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </LinearGradient>
  );
}

function getStyles(theme: Theme, isDark: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: Platform.OS === "ios" ? 60 : 50,
    },
    headerContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginHorizontal: 20,
      marginBottom: 25,
    },
    headerText: {
      fontSize: 22,
      fontWeight: "700",
      marginLeft: 15,
      color: isDark ? "#fff" : "#111",
    },
    card: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDark
        ? "rgba(255,255,255,0.06)"
        : "#ffffff",
      marginHorizontal: 20,
      marginBottom: 16,
      padding: 18,
      borderRadius: 20,
      borderWidth: isDark ? 1 : 0,
      borderColor: "rgba(255,255,255,0.06)",
      elevation: 5,
    },
    accentBar: {
      width: 5,
      height: "100%",
      borderRadius: 10,
      marginRight: 14,
    },
    cardContent: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
    },
    avatar: {
      width: 45,
      height: 45,
      borderRadius: 25,
      backgroundColor: "#4C8EF7",
      justifyContent: "center",
      alignItems: "center",
      marginRight: 14,
    },
    avatarText: {
      color: "#fff",
      fontWeight: "700",
      fontSize: 16,
    },
    name: {
      fontSize: 16,
      fontWeight: "700",
      color: isDark ? "#fff" : "#111",
    },
    roll: {
      color: isDark ? "#aaa" : "#555",
      marginTop: 4,
      fontSize: 13,
    },
  });
}