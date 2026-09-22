import { RootState } from "@/action/store";
import { logout } from "@/action/student/userContext";
import { ThemeContext } from "@/action/theme/ThemeContext";
import { blue, green, red } from "@/action/theme/light";
import CollapsibleCard from "@/components/CollapsibleCard";
import { API_BASE_URL } from "@/config";
import { getDeviceId } from "@/helper/getDeviceId";
import {
  getPhoneSize,
  getResponsiveFontSize,
  getResponsivePadding,
  scaleH,
  scaleW
} from "@/utils/responsivedesignsystem";
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
  View,
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
        const url =
          storedRole == "PARENT"
            ? `${API_BASE_URL}attendance/todayStudentAttendance/${userID}`
            : `${API_BASE_URL}v2/attendance/todayStaffAttendance?ownerType=${storedRole}&ownerId=${userID}`;
        const { data } = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Tenant-ID": tenantId,
            "X-Device-ID": deviceId,
          },
        });

        if (storedRole !== "PARENT") {
          setIsPresentToday(data.status === "P");
        } else {
          setIsPresentToday(data === "P");
        }
      } catch (err) {
        setIsPresentToday(false);
        // console.log("--- err|", err);
      }
    };

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
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      <View style={styles.card}>
        <Text style={styles.header}>Profile</Text>

        <View style={styles.imageContainer}>
          <Image source={{ uri: profileImage }} style={styles.profileImage} />

          <View style={styles.statusIndicator}>
            <View
              style={
                isPresentToday
                  ? styles.statusDot
                  : styles.statusDotOffline
              }
            />
          </View>
        </View>

        <Text style={styles.name}>
          {isStaffLike ? userDetail.name : userDetail.studentName}
        </Text>
        <Text style={styles.subtitle}>{role}</Text>

        {/* ================= PERSONAL ================= */}
        <CollapsibleCard title="Personal Information">
          <InfoRow
            label="DOB"
            value={
              isStaffLike
                ? userDetail.dateOfBirth
                : userDetail.studentDateOfBirth
            }
          />
          <InfoRow
            label="Gender"
            value={
              isStaffLike ? userDetail.gender : userDetail.studentGender
            }
          />
          <InfoRow
            label="Father"
            value={
              isStaffLike
                ? userDetail.staffFatherName
                : userDetail.studentFatherName
            }
          />
          <InfoRow
            label="Mother"
            value={
              isStaffLike
                ? userDetail.staffMotherName
                : userDetail.studentMotherName
            }
          />
          <InfoRow
            label="Phone"
            value={
              isStaffLike
                ? userDetail.phoneNumber
                : String(userDetail.studentPhoneNumber)
            }
          />
          <InfoRow label="Email" value={userDetail.email} />
          <InfoRow label="Address" value={address} />
        </CollapsibleCard>

        {/* ================= STAFF / ADMIN ================= */}
        {isStaffLike && (
          <CollapsibleCard title="Professional Details">
            <InfoRow
              label="Joining Date"
              value={userDetail.staffJoiningDate}
            />
            <InfoRow
              label="Previous School"
              value={userDetail.staffPreviousSchoolName}
            />
            <InfoRow
              label="Subjects"
              value={userDetail.teachingSubjects}
            />
            <InfoRow
              label="Qualifications"
              value={userDetail.educationalQualifications}
            />
            <InfoRow
              label="Certifications"
              value={userDetail.certifications}
            />
            <InfoRow
              label="Specializations"
              value={userDetail.specializations}
            />
            <InfoRow
              label="Experience"
              value={userDetail.workExperience}
            />
            <InfoRow
              label="Languages"
              value={userDetail.languagesSpoken}
            />
            <InfoRow
              label="Blood Group"
              value={userDetail.staffBloodGroup}
            />
            <InfoRow
              label="Aadhar"
              value={String(userDetail.adharNumber)}
            />
          </CollapsibleCard>
        )}

        {/* ================= PARENT ================= */}
        {isParent && (
          <CollapsibleCard title="Student & Transport Details">
            <InfoRow label="Class" value={userDetail.studentClass} />
            <InfoRow label="Section" value={userDetail.classSection} />
            <InfoRow
              label="Admission No"
              value={userDetail.studentAdmissionNumber}
            />
            <InfoRow
              label="Joining Date"
              value={userDetail.studentJoiningDate}
            />
            <InfoRow label="Religion" value={userDetail.religion} />
            <InfoRow
              label="Caste Category"
              value={userDetail.casteCategory}
            />
            <InfoRow label="Bus Number" value={userDetail.busNumber} />
            <InfoRow label="Bus Route" value={userDetail.busRoute} />
            <InfoRow label="Driver Name" value={userDetail.driverName} />
            <InfoRow
              label="Driver Contact"
              value={String(userDetail.busDriverNumber)}
            />
          </CollapsibleCard>
        )}

        {isStaffLike && (
          <CollapsibleCard
            title="My Attendance Details"
            onPress={() =>
              router.push("/staffDashboard/(tabs)/totalattendance")
            }
          >
            <Text style={{ color: styles.link.color }}></Text>
          </CollapsibleCard>
        )}

        {/* ================= ACTIONS ================= */}

        {isParent  && (
          <TouchableOpacity
            style={styles.resetPassword}
            onPress={() =>
              router.replace("/(auth)/SelectChild")
            }
          >
            <Text style={styles.resetText}>Switch Children</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        {isStaffLike && (
          <TouchableOpacity
            style={styles.resetPassword}
            onPress={() =>
              router.replace("/staffDashboard/resetstaffpassword")
            }
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
    return (
      <View style={styles.infoRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value || "-"}</Text>
      </View>
    );
  }
);

/* ================= STYLES ================= */

const getStyles = (theme: any) => {
  const isDark = theme.mode === "dark";
  const padding = getResponsivePadding();
  const fonts = getResponsiveFontSize();
  const phoneSize = getPhoneSize();
  return StyleSheet.create({
    link: { color: blue[500] },

    container: {
      flex: 1,
      backgroundColor: theme.background,
      paddingTop: scaleH(20),
    },

    card: {
      backgroundColor: theme.background,
      margin: scaleW(6),
      borderRadius: scaleW(24),
      padding: padding.md,
    },

    header: {
      fontSize: fonts.h1,
      fontWeight: "700",
      textAlign: "center",
      color: theme.textPrimary,
      marginBottom: scaleH(6),
    },

    name: {
      fontSize: fonts.h2,
      fontWeight: "700",
      textAlign: "center",
      color: theme.textPrimary,
      marginTop: scaleH(6),
    },

    subtitle: {
      fontSize: fonts.body,
      color: theme.textSecondary,
      textAlign: "center",
      marginBottom: scaleH(10),
    },

    infoRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: scaleH(12),
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },

    label: {
      fontSize: fonts.small,
      color: theme.textSecondary,
      flex: 1,
    },

    value: {
      fontSize: fonts.small,
      fontWeight: "600",
      textAlign: "right",
      flex: 1.3,
      color: theme.textPrimary,
    },

    logoutButton: {
      backgroundColor: red[100],
      borderRadius: scaleW(14),
      paddingVertical: scaleH(14),
      marginTop: scaleH(10),
    },

    logoutText: {
      color: theme.text,
      fontSize: fonts.body,
      fontWeight: "700",
      textAlign: "center",
    },

    resetPassword: {
      backgroundColor: green[400],
      borderRadius: scaleW(14),
      
      paddingVertical: scaleH(14),
      marginTop: scaleH(10),
      marginBottom: scaleH(20),
    },

    resetText: {
      color: theme.buttonText,
      fontSize: fonts.body,
      fontWeight: "700",
      textAlign: "center",
    },

    imageContainer: {
      width: scaleW(phoneSize === "XS" ? 70 : 80),
      height: scaleW(phoneSize === "XS" ? 70 : 80),
      position: "relative",
      marginVertical: scaleH(16),
      alignSelf: "center",
      alignItems: "center",
      justifyContent: "center",
    },

    profileImage: {
      width: "100%",
      height: "100%",
      borderRadius: scaleW(40),
    },

    statusIndicator: {
      position: "absolute",
      bottom: 0,
      right: 0,
      width: scaleW(20),
      height: scaleW(20),
      alignItems: "center",
      justifyContent: "center",
    },

    statusDot: {
      width: scaleW(12),
      height: scaleW(12),
      borderRadius: scaleW(6),
      backgroundColor: theme.success,
      borderWidth: scaleW(2),
      borderColor:theme.primary,
    },

    statusDotOffline: {
      width: scaleW(12),
      height: scaleW(12),
      borderRadius: scaleW(6),
      backgroundColor: theme.errorColor,
      borderWidth: scaleW(1),
      borderColor: theme.primary,
    },
  });
};