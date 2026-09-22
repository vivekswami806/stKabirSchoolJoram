import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { Buffer } from "buffer";
import { router } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

import { ThemeContext } from "@/action/theme/ThemeContext";
import { Theme } from "@/action/theme/themeReducer";
import { API_BASE_URL } from "@/config";
import { getDeviceId } from "@/helper/getDeviceId";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ToastService } from "react-native-toastier";

const { width } = Dimensions.get("window");

interface StudentBirthday {
  id: string;
  studentName: string;
  studentClass: string;
  classSection: string;
  studentDateOfBirth: string;
}

interface StaffBirthday {
  id: string;
  name: string;
  role: string;
  dateOfBirth: string;
}

interface BirthdayData {
  students: StudentBirthday[];
  staff: StaffBirthday[];
}

const calculateAge = (dateOfBirth: string): number => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export default function BirthdayScreen() {
  const [studentBirthdays, setStudentBirthdays] = useState<StudentBirthday[]>([]);
  const [staffBirthdays, setStaffBirthdays] = useState<StaffBirthday[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"students" | "staff">("students");

  const themeState = useContext(ThemeContext);
  if (!themeState) return null;
  const { theme } = themeState;
  const styles = getStyles(theme);

  useEffect(() => {
    loadBirthdayData();
  }, []);

  const loadBirthdayData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const encodedTenant = await AsyncStorage.getItem("auth_tenant");
      const token = await AsyncStorage.getItem("auth_token");
      const deviceId = await getDeviceId();

      if (!encodedTenant || !token) {
        setError("Authentication failed");
        return;
      }

      const tenantId = Buffer.from(encodedTenant, "base64").toString("utf-8");

      const headers = {
        Authorization: `Bearer ${token}`,
        "X-Tenant-ID": tenantId,
        "X-Device-ID": deviceId,
      };

      // Fetch student birthdays
      const studentResponse = await axios.get(
        `${API_BASE_URL}student/birthdays/today`,
        { headers }
      );

      // Fetch staff birthdays
      const staffResponse = await axios.get(
        `${API_BASE_URL}staff/today-birthdays`,
        { headers }
      );

      setStudentBirthdays(studentResponse.data?.data || []);
      setStaffBirthdays(staffResponse.data?.data || []);

      if (
        (!studentResponse.data || studentResponse.data.length === 0) &&
        (!staffResponse.data?.data || staffResponse.data.data.length === 0)
      ) {
        setError("No birthdays today");
      }
    } catch (err: any) {
      console.log(err);
      setError("Failed to load birthday data");
      ToastService.show({
        type: "danger",
        message: err?.message ?? "Something went wrong",
        duration: 2000,
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    loadBirthdayData();
  };

  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Student Birthday Card
  const StudentBirthdayCard = ({ item }: { item: StudentBirthday }) => {
    const age = calculateAge(item.studentDateOfBirth);

    return (
      <View style={styles.birthdayCard}>
        <View style={styles.cardGradient}>
          {/* Left Section - Avatar */}
          <View style={styles.cardLeftSection}>
            <View style={[styles.avatar, { backgroundColor: "#FFD700" }]}>
              <Text style={styles.avatarText}>
                {getInitials(item.studentName)}
              </Text>
            </View>
            <View style={styles.cakeIcon}>
              <Ionicons name="add-circle" size={20} color="#FF6B6B" />
            </View>
          </View>

          {/* Right Section - Info */}
          <View style={styles.cardRightSection}>
            <Text style={styles.studentName} numberOfLines={2}>
              {item.studentName}
            </Text>

            <View style={styles.classInfo}>
              <Text style={styles.classText}>
                Class {item.studentClass} - {item.classSection}
              </Text>
            </View>

            <View style={styles.ageContainer}>
              <Ionicons name="star" size={14} color="#FFD700" />
              <Text style={styles.ageText}>
                Turning <Text style={styles.ageBold}>{age + 1}</Text> today!
              </Text>
            </View>

            <Text style={styles.dateText}>
              {formatDate(item.studentDateOfBirth)}
            </Text>
          </View>

          {/* Celebration Icon */}
          <View style={styles.celebrationIcon}>
            <Text style={styles.celebrationEmoji}>🎉</Text>
          </View>
        </View>
      </View>
    );
  };

  // Staff Birthday Card
  const StaffBirthdayCard = ({ item }: { item: StaffBirthday }) => {
    const age = calculateAge(item.dateOfBirth);
    const getRoleColor = (role: string): string => {
      switch (role) {
        case "TEACHER":
          return "#4F46E5";
        case "STAFF":
          return "#10B981";
        default:
          return "#8B5CF6";
      }
    };

    return (
      <View style={styles.birthdayCard}>
        <View style={styles.cardGradient}>
          {/* Left Section - Avatar */}
          <View style={styles.cardLeftSection}>
            <View
              style={[styles.avatar, { backgroundColor: getRoleColor(item.role) }]}
            >
              <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
            </View>
            <View style={styles.cakeIcon}>
              <Ionicons name="chevron-collapse" size={20} color="#FF6B6B" />
            </View>
          </View>

          {/* Right Section - Info */}
          <View style={styles.cardRightSection}>
            <Text style={styles.studentName} numberOfLines={2}>
              {item.name}
            </Text>

            <View style={[styles.roleTag, { backgroundColor: getRoleColor(item.role) }]}>
              <Text style={styles.roleTagText}>{item.role}</Text>
            </View>

            <View style={styles.ageContainer}>
              <Ionicons name="star" size={14} color="#FFD700" />
              <Text style={styles.ageText}>
                Turning <Text style={styles.ageBold}>{age + 1}</Text> today!
              </Text>
            </View>

            <Text style={styles.dateText}>
              {formatDate(item.dateOfBirth)}
            </Text>
          </View>

          {/* Celebration Icon */}
          <View style={styles.celebrationIcon}>
            <Text style={styles.celebrationEmoji}>🎂</Text>
          </View>
        </View>
      </View>
    );
  };

  const emptyStateContent = (
    <View style={styles.emptyContainer}>
      <Ionicons name="calendar" size={80} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>No Birthdays Today</Text>
      <Text style={styles.emptySubtitle}>
        {activeTab === "students"
          ? "No student birthdays today"
          : "No staff birthdays today"}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} style={styles.backButton} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Ionicons name="bag-add-sharp" size={24} color={theme.primary} />
          <Text style={styles.headerTitle}>Today's Birthdays</Text>
        </View>

        <View style={{ width: 26 }} />
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "students" && styles.tabActive,
          ]}
          onPress={() => setActiveTab("students")}
        >
          <Ionicons
            name="school"
            size={18}
            color={
              activeTab === "students"
                ? theme.primary
                : theme.mode === "dark"
                ? "#6B7280"
                : "#9CA3AF"
            }
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "students" && styles.tabTextActive,
            ]}
          >
            Students
            {studentBirthdays.length > 0 && (
              <Text style={styles.tabBadge}> ({studentBirthdays.length})</Text>
            )}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "staff" && styles.tabActive,
          ]}
          onPress={() => setActiveTab("staff")}
        >
          <Ionicons
            name="person"
            size={18}
            color={
              activeTab === "staff"
                ? theme.primary
                : theme.mode === "dark"
                ? "#6B7280"
                : "#9CA3AF"
            }
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "staff" && styles.tabTextActive,
            ]}
          >
            Staff
            {staffBirthdays.length > 0 && (
              <Text style={styles.tabBadge}> ({staffBirthdays.length})</Text>
            )}
          </Text>
        </TouchableOpacity>
      </View>

     {/* Content */}
{isLoading ? (
  <View style={styles.centerContainer}>
    <ActivityIndicator size="large" color={theme.primary} />
    <Text style={styles.loadingText}>Loading birthdays...</Text>
  </View>
) : error && studentBirthdays.length === 0 && staffBirthdays.length === 0 ? (
  <FlatList
    data={[]}
    renderItem={() => null}
    keyExtractor={() => "empty"}
    ListEmptyComponent={emptyStateContent}
    refreshControl={
      <RefreshControl
        refreshing={isRefreshing}
        onRefresh={onRefresh}
        tintColor={theme.primary}
      />
    }
    contentContainerStyle={styles.emptyListContainer}
  />
) : (
  activeTab === "students" ? (
    <FlatList<StudentBirthday>
      data={studentBirthdays}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <StudentBirthdayCard item={item} />
      )}
      contentContainerStyle={styles.listContainer}
      ListEmptyComponent={emptyStateContent}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor={theme.primary}
        />
      }
      removeClippedSubviews
      initialNumToRender={8}
      maxToRenderPerBatch={8}
      windowSize={5}
    />
  ) : (
    <FlatList<StaffBirthday>
      data={staffBirthdays}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <StaffBirthdayCard item={item} />
      )}
      contentContainerStyle={styles.listContainer}
      ListEmptyComponent={emptyStateContent}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor={theme.primary}
        />
      }
      removeClippedSubviews
      initialNumToRender={8}
      maxToRenderPerBatch={8}
      windowSize={5}
    />
  )
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
      paddingTop: Platform.OS === "ios" ? 40 : 35,
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
      borderBottomColor: isDark ? "#1F2937" : "#E5E7EB",
    },
    backButton: {
      color: theme.text,
    },
    headerCenter: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      flex: 1,
      justifyContent: "center",
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: theme.text,
    },
    // Tab Navigation
    tabContainer: {
      flexDirection: "row",
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.background,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? "#1F2937" : "#E5E7EB",
      gap: 8,
    },
    tab: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 10,
      backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "#F3F4F6",
      gap: 6,
      borderBottomWidth: 2,
      borderBottomColor: "transparent",
    },
    tabActive: {
      backgroundColor: `${theme.primary || "#4C8EF7"}20`,
      borderBottomColor: theme.primary || "#4C8EF7",
    },
    tabText: {
      fontSize: 13,
      fontWeight: "600",
      color: isDark ? "#6B7280" : "#6B7280",
    },
    tabTextActive: {
      color: theme.primary || "#4C8EF7",
    },
    tabBadge: {
      fontSize: 12,
      fontWeight: "700",
    },
    // Content
    centerContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 32,
    },
    loadingText: {
      marginTop: 12,
      fontSize: 14,
      color: isDark ? "#A1A1AA" : "#6B7280",
      fontWeight: "500",
    },
    listContainer: {
      paddingHorizontal: 12,
      paddingVertical: 12,
      paddingBottom: 30,
    },
    emptyListContainer: {
      flex: 1,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 32,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.text,
      marginTop: 16,
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: 14,
      color: isDark ? "#A1A1AA" : "#6B7280",
      textAlign: "center",
    },
    // Birthday Card
    birthdayCard: {
      marginHorizontal: 4,
      marginVertical: 8,
      borderRadius: 16,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    cardGradient: {
      backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
      paddingVertical: 14,
      paddingHorizontal: 14,
      flexDirection: "row",
      alignItems: "center",
      borderLeftWidth: 4,
      borderLeftColor: theme.primary || "#4C8EF7",
    },
    cardLeftSection: {
      position: "relative",
      marginRight: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    avatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: "center",
      alignItems: "center",
    },
    avatarText: {
      fontSize: 18,
      fontWeight: "700",
      color: "#FFFFFF",
    },
    cakeIcon: {
      position: "absolute",
      bottom: -6,
      right: -6,
      backgroundColor: theme.background,
      borderRadius: 12,
      padding: 4,
      borderWidth: 1,
      borderColor: isDark ? "#374151" : "#E5E7EB",
    },
    cardRightSection: {
      flex: 1,
      marginRight: 10,
    },
    studentName: {
      fontSize: 15,
      fontWeight: "700",
      color: theme.text,
      marginBottom: 6,
      lineHeight: 20,
    },
    classInfo: {
      marginBottom: 6,
    },
    classText: {
      fontSize: 12,
      color: isDark ? "#A1A1AA" : "#6B7280",
      fontWeight: "500",
    },
    roleTag: {
      alignSelf: "flex-start",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      marginBottom: 6,
    },
    roleTagText: {
      fontSize: 11,
      fontWeight: "700",
      color: "#FFFFFF",
    },
    ageContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginBottom: 4,
    },
    ageText: {
      fontSize: 12,
      color: isDark ? "#A1A1AA" : "#6B7280",
      fontWeight: "500",
    },
    ageBold: {
      fontWeight: "700",
      color: theme.primary || "#4C8EF7",
    },
    dateText: {
      fontSize: 11,
      color: isDark ? "#9CA3AF" : "#9CA3AF",
      fontStyle: "italic",
    },
    // Celebration Icon
    celebrationIcon: {
      justifyContent: "center",
      alignItems: "center",
      paddingLeft: 8,
    },
    celebrationEmoji: {
      fontSize: 28,
    },
  });
}