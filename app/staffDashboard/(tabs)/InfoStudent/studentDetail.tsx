import { ThemeContext } from "@/action/theme/ThemeContext";
import { Theme } from "@/action/theme/themeReducer";
import { router } from "expo-router";
import React, { useContext } from "react";
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface Props {
  visible: boolean;
  student: any;
  onClose: () => void;
}

export default function StudentDetail({ visible, student, onClose }: Props) {
  if (!student) return null;
  const themeState = useContext(ThemeContext);
  if (!themeState) return null;
  const { theme } = themeState;
  const styles = getStyles(theme);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={styles.box} activeOpacity={1}>
          <ScrollView>
            {/* Header */}
            <View style={styles.headerCard}>
              <View style={styles.headerLeft}>
                <Text style={styles.name}>{student.studentName}</Text>
                <Text style={styles.class}>Class {student.studentClass}</Text>

                <View
                  style={[
                    styles.statusPill,
                    student.studentStatus ? styles.activePill : styles.inactivePill,
                  ]}
                >
                  <Text style={styles.statusPillText}>
                    {student.studentStatus ? "Active" : "Inactive"}
                  </Text>
                </View>
              </View>

              <View style={styles.avatarWrapper}>
                <Image
                  source={{
                    uri: student.studentImage
                      ? `data:image/jpeg;base64,${student.studentImage}`
                      : undefined,
                  }}
                  style={styles.avatar}
                />
                <View
                  style={[
                    styles.statusDot,
                    student.studentStatus ? styles.dotActive : styles.dotInactive,
                  ]}
                />
              </View>
            </View>


            {/* Status */}
            {/* <View
              style={[
                styles.statusBadge,
                student.studentStatus ? styles.present : styles.absent,
              ]}
            >
              <Text style={styles.statusText}>
                {student.studentStatus ? "Active" : "Inactive"}
              </Text>
            </View> */}

            {/* Personal Info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Personal Info</Text>
              <Text style={styles.infoText}>
                <Text style={styles.label}>DOB: </Text>
                {student.studentDateOfBirth}
              </Text>
              <Text style={styles.infoText}>
                <Text style={styles.label}>Gender: </Text>
                {student.studentGender}
              </Text>
              <Text style={styles.infoText}>
                <Text style={styles.label}>Admission No: </Text>
                {student.studentAdmissionNumber}
              </Text>
              {/* <Text style={styles.infoText}>
                <Text style={styles.label}>Phone: </Text>
                {student.studentPhoneNumber}
              </Text>
              <Text style={styles.infoText}>
                <Text style={styles.label}>Email: </Text>
                {student.studentEmail}
              </Text> */}
            </View>

            {/* Parents Info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Parents / Guardian</Text>
              <Text style={styles.infoText}>
                <Text style={styles.label}>Father: </Text>
                {student.studentFatherName}
              </Text>
              <Text style={styles.infoText}>
                <Text style={styles.label}>Mother: </Text>
                {student.studentMotherName}
              </Text>
              <Text style={styles.infoText}>
                <Text style={styles.label}>Guardian: </Text>
                {student.studentGuardianName}
              </Text>
            </View>

            {/* Address */}
            {/* <View style={styles.section}>
              <Text style={styles.sectionTitle}>Address</Text>
              {student.studentAddress?.map((addr: any, idx: number) => (
                <View key={idx} style={styles.addressCard}>
                  <Text style={styles.infoText}>
                    <Text style={styles.label}>Type: </Text>
                    {addr.addressType}
                  </Text>
                  <Text style={styles.infoText}>
                    <Text style={styles.label}>Street: </Text>
                    {addr.streetAddress}
                  </Text>
                  <Text style={styles.infoText}>
                    <Text style={styles.label}>City: </Text>
                    {addr.city}
                  </Text>
                  <Text style={styles.infoText}>
                    <Text style={styles.label}>State: </Text>
                    {addr.state}
                  </Text>
                  <Text style={styles.infoText}>
                    <Text style={styles.label}>Postal Code: </Text>
                    {addr.postalCode}
                  </Text>
                  <Text style={styles.infoText}>
                    <Text style={styles.label}>Country: </Text>
                    {addr.country}
                  </Text>
                </View>
              ))}
            </View> */}

            {/* Close Button */}
            <TouchableOpacity onPress={() => {
              onClose(),
              router.push({ 
                pathname: "/staffDashboard/(tabs)/InfoStudent/studentAttendance",
                params: { details: JSON.stringify(student) },
              });
            }} style={styles.closeBtn}>
              <Text style={styles.closeText}>View Attendance</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

function getStyles(theme: Theme) {
  const isDark = theme.mode === "dark";
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      paddingHorizontal: 20,
    },
    box: {
      backgroundColor: theme.background,
      padding: 20,
      borderRadius: 15,
      maxHeight: "90%",
    },
    headerCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: (isDark ? "#1F1F1F" : "#F8FAFF"),
      padding: 15,
      borderRadius: 16,
      marginBottom: 12,
      elevation: 5,
      shadowColor: "#000",
      shadowOpacity: 0.15,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
    },

    headerLeft: {
      flex: 1,
      paddingRight: 12,
    },

    name: {
      fontSize: 22,
      fontWeight: "800",
      color: isDark ? "#EAF0FF" : "#0B1220",
    },

    class: {
      fontSize: 15,
      color: isDark ? "#AEB4C2" : "#4B5563",
      marginTop: 2,
    },

    statusPill: {
      marginTop: 8,
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: 20,
      alignSelf: "flex-start",
    },

    activePill: { backgroundColor: "#D1FAE5" },
    inactivePill: { backgroundColor: "#FEE2E2" },

    statusPillText: {
      fontSize: 12,
      fontWeight: "700",
      color: "#111",
    },

    avatarWrapper: {
      position: "relative",
    },

    avatar: {
      width: 86,
      height: 86,
      borderRadius: 43,
      borderWidth: 3,
      borderColor: "#4C8EF7",
      backgroundColor: "#E5E7EB",
    },

    statusDot: {
      position: "absolute",
      bottom: 4,
      right: 4,
      width: 16,
      height: 16,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: "#fff",
    },

    dotActive: { backgroundColor: "#22C55E" },
    dotInactive: { backgroundColor: "#EF4444" },


    statusBadge: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 8,
      marginTop: 10,
      alignSelf: "flex-start",
    },
    present: { backgroundColor: "#7FFB8D" },
    absent: { backgroundColor: "#FA5A5A" },
    statusText: { fontWeight: "700", textTransform: "capitalize" },
    section: {
      marginTop: 15,
      borderTopWidth: 1,
      borderTopColor: isDark ? "#555" : "#EEE",
      paddingTop: 10,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "700",
      marginBottom: 5,
      color: isDark ? "#E9EFFC" : "#000104",
    },
    infoText: {
      fontSize: 14,
      marginVertical: 1,
      color: isDark ? "#C5C7D0" : "#333",
    },
    label: { fontWeight: "600" },
    addressCard: {
      backgroundColor: isDark ? "#2C2C2C" : "#F4F4F4",
      borderRadius: 8,
      padding: 10,
      marginVertical: 5,
    },
    closeBtn: {
      marginTop: 20,
      backgroundColor: "#4C8EF7",
      padding: 12,
      borderRadius: 8,
      alignItems: "center",
      marginBottom: 10,
    },
    closeText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  });
}
