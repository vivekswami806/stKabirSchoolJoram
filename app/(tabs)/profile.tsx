import { RootState } from "@/action/store";
import { logout } from "@/action/student/userContext";
import { ThemeContext } from "@/action/theme/ThemeContext";
import CollapsibleCard from "@/components/CollapsibleCard";
import { API_BASE_URL } from "@/config";
import { getDeviceId } from "@/helper/getDeviceId";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Buffer } from "buffer";
import { useRouter } from "expo-router";
import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { useDispatch, useSelector } from "react-redux";

export default function Profile() {
  const themeState = useContext(ThemeContext);
if (!themeState) return null;

const { theme } = themeState;
const styles = getStyles(theme);
const isDark = theme.mode === "dark";

  const dispatch = useDispatch();
  const router = useRouter();
  const { userDetail } = useSelector((state: RootState) => state.user);
  const [isPresentToday, setIsPresentToday] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  useEffect(() => {
    const init = async () => {
      const storedRole = await AsyncStorage.getItem("auth_role");
      if (!storedRole) return;

      setRole(storedRole);
    };

    init();

  }, []);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const token = await AsyncStorage.getItem("auth_token");
        const encodedTenant = await AsyncStorage.getItem("auth_tenant");
        const userID = await AsyncStorage.getItem("auth_login_id");
        const storedRole = await AsyncStorage.getItem("auth_role");
        const deviceId = await getDeviceId();

        if (!token || !encodedTenant) {
          throw new Error("Authentication missing");
        }


        const tenantId = Buffer.from(encodedTenant, "base64").toString("utf-8");
        const url = storedRole == "PARENT" ? `${API_BASE_URL}attendance/todayStudentAttendance/${userID}`
          : `${API_BASE_URL}v2/attendance/todayStaffAttendance?ownerType=${storedRole}&ownerId=${userID}`
        const { data } = await axios.get(
          url,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "X-Tenant-ID": tenantId,
              "X-Device-ID": deviceId,
            },
          }
        );
        console.log("---profile Data|", data);
        
        if (storedRole !== "PARENT") {
          setIsPresentToday(data.status === "P");
        } else {
          setIsPresentToday(data === "P");
        }
      } catch (err) {
        setIsPresentToday(false);
        console.log(err);
      }
    }

    if (role) fetchAttendance();
  }, [role]);

  const isStaffLike = role === "STAFF" || role === "ADMIN";
  const isParent = role === "PARENT";

  const profileImage = useMemo(() => {
    if (!userDetail) return undefined;
    if (isStaffLike && userDetail.staffImage)
      return `data:image/jpeg;base64,${userDetail.staffImage}`;
    if (isParent && userDetail.studentImage)
      return `data:image/jpeg;base64,${userDetail.studentImage}`;
    return "https://via.placeholder.com/120";
  }, [userDetail, isStaffLike, isParent]);

  const address = useMemo(() => {
    if (!userDetail) return "-";
    const addr = isStaffLike
      ? userDetail.staffAddressDetails?.[0]
      : userDetail.studentAddress?.[0];

    if (!addr) return "-";

    return [
      addr.buildingNumber,
      addr.streetAddress,
      addr.landmark,
      addr.city,
      addr.state,
      addr.postalCode,
      addr.country,
    ]
      .filter(Boolean)
      .join(", ");
  }, [userDetail, isStaffLike]);

  const handleLogout = async () => {
    await AsyncStorage.multiRemove([
      "auth_expires_at",
      "auth_login_id",
      "auth_role",
      "auth_tenant",
      "auth_token",
    ]);
    dispatch(logout());
    router.replace("/");
  };

  if (!userDetail || !role) return null;
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.card}>
        <Text style={styles.header}>Profile</Text>

        <View style={styles.imageContainer}>
          <Image source={{ uri: profileImage }} style={styles.profileImage} />

          <View style={styles.statusIndicator}>
            <View style={isPresentToday ? styles.statusDot : styles.statusDotOffline} />
          </View>

        </View>

        <Text style={styles.name}>
          {isStaffLike ? userDetail.name : userDetail.studentName}
        </Text>
        <Text style={styles.subtitle}>{role}</Text>

        {/* ================= PERSONAL ================= */}
        <CollapsibleCard title="Personal Information">
          <InfoRow label="DOB"    value={isStaffLike ? userDetail.dateOfBirth     : userDetail.studentDateOfBirth} />
          <InfoRow label="Gender" value={isStaffLike ? userDetail.gender          : userDetail.studentGender} />
          <InfoRow label="Father" value={isStaffLike ? userDetail.staffFatherName : userDetail.studentFatherName} />
          <InfoRow label="Mother" value={isStaffLike ? userDetail.staffMotherName : userDetail.studentMotherName} />
          <InfoRow label="Phone"  value={isStaffLike ? userDetail.phoneNumber     : String(userDetail.studentPhoneNumber)} />
          <InfoRow label="Email"  value={userDetail.email} />
          <InfoRow label="Address"value={address} />
        </CollapsibleCard>

        {/* ================= STAFF / ADMIN ================= */}
        {isStaffLike && (
          <CollapsibleCard title="Professional Details">
            <InfoRow label="Joining Date"    value={userDetail.staffJoiningDate} />
            <InfoRow label="Previous School" value={userDetail.staffPreviousSchoolName} />
            <InfoRow label="Subjects"        value={userDetail.teachingSubjects} />
            <InfoRow label="Qualifications"  value={userDetail.educationalQualifications} />
            <InfoRow label="Certifications"  value={userDetail.certifications} />
            <InfoRow label="Specializations" value={userDetail.specializations} />
            <InfoRow label="Experience"      value={userDetail.workExperience} />
            <InfoRow label="Languages"       value={userDetail.languagesSpoken} />
            <InfoRow label="Blood Group"     value={userDetail.staffBloodGroup} />
            <InfoRow label="Aadhar"          value={String(userDetail.adharNumber)} />
          </CollapsibleCard>
        )}

        {/* ================= PARENT ================= */}
        {isParent && (
          <CollapsibleCard title="Student & Transport Details">
            <InfoRow label="Class"         value={userDetail.studentClass} />
            <InfoRow label="Section"       value={userDetail.classSection} />
            <InfoRow label="Admission No"  value={userDetail.studentAdmissionNumber} />
            <InfoRow label="Joining Date"  value={userDetail.studentJoiningDate} />
            <InfoRow label="Religion"      value={userDetail.religion} />
            <InfoRow label="Caste Category"value={userDetail.casteCategory} />
            <InfoRow label="Bus Number"    value={userDetail.busNumber} />
            <InfoRow label="Bus Route"     value={userDetail.busRoute} />
            <InfoRow label="Driver Name"   value={userDetail.driverName} />
            <InfoRow label="Driver Contact"value={String(userDetail.busDriverNumber)} />
          </CollapsibleCard>
        )}
        {isStaffLike && (
          <CollapsibleCard title="My Attendance Details" onPress={() =>
            router.push("/staffDashboard/(tabs)/totalattendance")
          }>
            <Text style={{ color: styles.link.color }}></Text>

          </CollapsibleCard>
        )}

        {/* ================= ACTIONS ================= */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        {isStaffLike && (
          <TouchableOpacity
            style={styles.resetPassword}
            onPress={() => router.replace("/staffDashboard/resetstaffpassword")}
          >
            <Text style={styles.resetText}>Reset Password</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

/* ================= INFO ROW ================= */

const InfoRow = React.memo(
  ({ label, value }: { label: string; value?: string }) => {
    const themeState = useContext(ThemeContext);
    if (!themeState) return null;
    
    const { theme } = themeState;
    const styles = getStyles(theme);
    return(
      <View style={styles.infoRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value || "-"}</Text>
      </View>
    )
  }
);

/* ================= STYLES ================= */

const getStyles = (theme: any) => {
  const isDark = theme.mode === "dark";

  const colors = {
    background: isDark ? "#0f172a" : "#eef2f7",
    card: isDark ? "#1e293b" : "#ffffff",
    textPrimary: isDark ? "#f1f5f9" : "#111827",
    textSecondary: isDark ? "#94a3b8" : "#6b7280",
    border: isDark ? "#334155" : "#e5e7eb",
    avatarBorder: isDark ? "#818cf8" : "#4f46e5",
    online: "#22c55e",
    offline: "#ef4444",
    logoutBg: isDark ? "#3f1d1d" : "#fee2e2",
    logoutText: isDark ? "#f87171" : "#dc2626",
    resetBg: isDark ? "#123524" : "#e6ffee",
    resetText: isDark ? "#4ade80" : "#16a34a",
    link: isDark ? "#93c5fd" : "#007AFF",
    dotBorder: isDark ? "#1e293b" : "#ffffff",
  };

  return StyleSheet.create({
    link: { color: colors.link },

    container: {
      flex: 1,
      backgroundColor: theme.background,
      paddingTop: 30,
    },

    card: {
      backgroundColor: colors.card,
      margin: 16,
      borderRadius: 24,
      padding: 24,
    },

    header: {
      fontSize: 26,
      fontWeight: "700",
      textAlign: "center",
      color: colors.textPrimary,
    },

    name: {
      fontSize: 22,
      fontWeight: "700",
      textAlign: "center",
      color: colors.textPrimary,
    },

    subtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: "center",
      marginBottom: 20,
    },

    infoRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },

    label: {
      fontSize: 14,
      color: colors.textSecondary,
      flex: 1,
    },

    value: {
      fontSize: 14,
      fontWeight: "600",
      textAlign: "right",
      flex: 1.3,
      color: colors.textPrimary,
    },

    logoutButton: {
      backgroundColor: colors.logoutBg,
      borderRadius: 14,
      paddingVertical: 14,
      marginTop: 10,
    },

    logoutText: {
      color: colors.logoutText,
      fontSize: 16,
      fontWeight: "700",
      textAlign: "center",
    },

    resetPassword: {
      backgroundColor: colors.resetBg,
      borderRadius: 14,
      paddingVertical: 14,
      marginTop: 10,
    },

    resetText: {
      color: colors.resetText,
      fontSize: 16,
      fontWeight: "700",
      textAlign: "center",
    },

    imageContainer: {
      width: 80,
      height: 80,
      position: "relative",
      marginVertical: 16,
      alignSelf: "center",
      alignItems: "center",
      justifyContent: "center",
    },

    profileImage: {
      width: "100%",
      height: "100%",
      borderRadius: 40,
      borderWidth: 4,
      borderColor: colors.avatarBorder,
    },

    statusIndicator: {
      position: "absolute",
      bottom: 0,
      right: 0,
      width: 20,
      height: 20,
      alignItems: "center",
      justifyContent: "center",
    },

    statusDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: colors.online,
      borderWidth: 2,
      borderColor: colors.dotBorder,
    },

    statusDotOffline: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: colors.offline,
      borderWidth: 2,
      borderColor: colors.dotBorder,
    },
  });
};
