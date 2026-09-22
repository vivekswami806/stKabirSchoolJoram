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
  Image,
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
  staffSection: string
  staffImage: string
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
      // console.log(response.data?.data );
      
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

  const getStatusColor = (status: boolean) => {
    return status ? "#10B981" : "#EF4444";
  };

  const getClassDisplay = (staffClass: string, staffSection: string) => {
    if (!staffClass || staffClass.trim() === "") {
      return "N/A";
    }
    return staffSection ? `${staffClass} - ${staffSection}` : staffClass;
  };

  return (
    <LinearGradient
      colors={[theme.background, theme.background]}
      style={{ flex: 1 }}
    >
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
          <Text style={styles.headerText}>Staff Directory</Text>
          <View style={styles.headerSpacer} />
        </View>

        {loading ? (
          <LeaveSkeleton isDark={isDark} />
        ) : students.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="people-outline"
              size={60}
              color={isDark ? "#6B7280" : "#D1D5DB"}
            />
            <Text style={styles.emptyText}>No staff members found</Text>
          </View>
        ) : (
          <FlatList
            data={students}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
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
                activeOpacity={0.7}
              >
                {/* Status Accent Bar */}
                <View
                  style={[
                    styles.accentBar,
                    {
                      backgroundColor: getStatusColor(item.status),
                    },
                  ]}
                />

                <View style={styles.cardContent}>
                  {/* Avatar */}
                  <View
                    style={[
                      styles.avatar,
                      {
                        backgroundColor: isDark ? "#5B7FFF" : "#4C8EF7",
                        borderWidth: 2,
                        borderColor: getStatusColor(item.status),
                      },
                    ]}
                  >
                    {item.staffImage ? (
                      <Image
                        source={{ uri: item.staffImage }}
                        style={styles.avatarImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <Text style={styles.avatarText}>
                        {getInitials(item.name)}
                      </Text>
                    )}
                  </View>

                  {/* Info Section */}
                  <View style={styles.infoSection}>
                    <Text style={styles.name} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <View style={styles.classContainer}>
                      <Ionicons
                        name="school-outline"
                        size={13}
                        color={isDark ? "#9CA3AF" : "#6B7280"}
                        style={{ marginRight: 4 }}
                      />
                      <Text style={styles.classText}>
                        Class Teacher: {getClassDisplay(item.staffClass, item.staffSection)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Status Badge */}
                <View style={styles.statusBadge}>
                  <Ionicons
                    name={
                      item.status
                        ? "checkmark-circle"
                        : "close-circle"
                    }
                    size={24}
                    color={getStatusColor(item.status)}
                  />
                </View>
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
      justifyContent: "space-between",
      marginHorizontal: 16,
      marginBottom: 24,
    },
    backButton: {
      padding: 8,
      borderRadius: 10,
      backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
    },
    headerText: {
      fontSize: 24,
      fontWeight: "800",
      color: theme.text,
      flex: 1,
      textAlign: "center",
    },
    headerSpacer: {
      width: 32,
    },
    listContent: {
      paddingHorizontal: 12,
      paddingBottom: 40,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    emptyText: {
      marginTop: 16,
      fontSize: 16,
      color: isDark ? "#9CA3AF" : "#6B7280",
      fontWeight: "600",
    },
    card: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDark
        ? "rgba(255,255,255,0.08)"
        : "#FFFFFF",
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
    avatarText: {
      color: "#fff",
      fontWeight: "800",
      fontSize: 18,
    },
    avatarImage: {
      width: "100%",
      height: "100%",
      borderRadius: 10, // slightly smaller than avatar's radius
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
    classContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    classText: {
      color: isDark ? "#9CA3AF" : "#6B7280",
      fontSize: 12,
      fontWeight: "500",
      flex: 1,
    },
    statusBadge: {
      padding: 8,
      justifyContent: "center",
      alignItems: "center",
    },
  });
}