import { ThemeContext } from "@/action/theme/ThemeContext";
import { Theme } from "@/action/theme/themeReducer";
import { router } from "expo-router";
import React, { useContext } from "react";
import {
  Animated,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

/* ================= TYPES ================= */

interface studentAddress {
  streetAddress?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface Student {
  id: string;
  studentName: string;
  studentClass: string;
  studentStatus: boolean;
  studentDateOfBirth: string;
  studentGender: string;
  studentAdmissionNumber: string;
  studentPhoneNumber: string;
  studentEmail: string;
  studentFatherName: string;
  studentMotherName: string;
  studentGuardianName: string;
  studentAddress: studentAddress[];
  studentImage?: string;
}

interface Props {
  visible: boolean;
  student: Student | null;
  onClose: () => void;
}

/* ================= COMPONENT ================= */

export default function StudentDetail({
  visible,
  student,
  onClose,
}: Props) {
  
  const themeState = useContext(ThemeContext);
  if (!themeState || !student) return null;

  const { theme } = themeState;
  const isDark = theme.mode === "dark";
  const styles = getStyles(theme);

  return (
    <Modal visible={visible} transparent animationType="none">
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Overlay */}
        <Pressable style={styles.overlay} onPress={onClose} />

        {/* Bottom Sheet */}
        <Animated.View style={styles.sheet}>
          {/* Handle */}
          <View style={styles.handle} />

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            contentContainerStyle={styles.scrollContent}
          >
            {/* ===== HEADER CARD ===== */}
            <View style={styles.headerCard}>
              <View style={styles.avatarWrapper}>
                {student.studentImage ? (
                  <Image
                    source={{
                      uri: `data:image/jpeg;base64,${student.studentImage}`,
                    }}
                    style={styles.avatar}
                  />
                ) : (
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {student.studentName?.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>

              <Text style={styles.name}>{student.studentName}</Text>
              <Text style={styles.class}>Class {student.studentClass}</Text>

              <View
                style={[
                  styles.statusPill,
                  student.studentStatus ? styles.activePill : styles.inactivePill,
                ]}
              >
                <Text style={styles.statusText}>
                  {student.studentStatus ? "Active" : "Inactive"}
                </Text>
              </View>
            </View>

            {/* ===== PERSONAL CARD ===== */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Personal Information</Text>
              <Info label="DOB" value={student.studentDateOfBirth} />
              <Info label="Gender" value={student.studentGender} />
              <Info label="Admission No" value={student.studentAdmissionNumber} />
              <Info label="Phone" value={student.studentPhoneNumber} />
              <Info label="Email" value={student.studentEmail} />
            </View>

            {/* ===== PARENTS/GUARDIAN CARD ===== */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Parents / Guardian</Text>
              <Info label="Father" value={student.studentFatherName} />
              <Info label="Mother" value={student.studentMotherName} />
              <Info label="Guardian" value={student.studentGuardianName} />
            </View>

            {/* ===== ADDRESS CARD ===== */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Address</Text>
              {student.studentAddress && student.studentAddress.length > 0 ? (
                student.studentAddress.map((addr, idx) => (
                  <View key={idx} style={styles.addressCard}>
                    <Text style={styles.addressText}>{addr.streetAddress}</Text>
                    <Text style={styles.addressText}>
                      {addr.city}, {addr.state} - {addr.postalCode}
                    </Text>
                    <Text style={styles.addressText}>{addr.country}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.addressText}>No address available</Text>
              )}
            </View>

            {/* ===== BUTTONS ===== */}
            <TouchableOpacity
              onPress={() => {
                onClose();
                router.push({
                  pathname: "/staffDashboard/(tabs)/InfoStudent/studentAttendance",
                  params: { details: JSON.stringify(student) },
                });
              }}
              style={styles.primaryBtn}
            >
              <Text style={styles.primaryText}>View Attendance</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onClose} style={styles.secondaryBtn}>
              <Text style={styles.secondaryText}>Close</Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/* ================= SMALL COMPONENTS ================= */

function Info({ label, value }: { label: string; value: string }) {
  const { theme } = useContext(ThemeContext)!;
  return (
    <Text
      style={{
        fontSize: 14,
        marginVertical: 0,
        color: theme.text,
      }}
    >
      <Text style={{ fontWeight: "600" }}>{label}: </Text>
      {value}
    </Text>
  );
}

/* ================= STYLES ================= */

function getStyles(theme: Theme) {
  const isDark = theme.mode === "dark";

  return StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "flex-end",
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.45)",
    },
    sheet: {
      backgroundColor: isDark ? "#3c3c3c" : "#E5E7EB",
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: "85%",
      paddingHorizontal: 16,
      paddingBottom: 0,
    },
    handle: {
      width: 40,
      height: 4,
      backgroundColor: isDark ? "#E5E7EB" : "#111827",
      borderRadius: 20,
      alignSelf: "center",
      marginVertical: 10,
    },
    scrollContent: {
      // paddingBottom: 10,
    },

    /* HEADER CARD */
    headerCard: {
      alignItems: "center",
      paddingVertical: 20,
    },
    avatarWrapper: {
      marginBottom: 0,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: "#4C8EF7",
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 3,
      borderColor: "#fff",
      overflow: "hidden",
    },
    avatarText: {
      fontSize: 30,
      fontWeight: "800",
      color: "#fff",
    },
    name: {
      fontSize: 22,
      fontWeight: "800",
      color: theme.text,
    },
    class: {
      fontSize: 14,
      color: isDark ? "#9CA3AF" : "#6B7280",
      marginTop: 4,
    },
    statusPill: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 20,
      alignSelf: "flex-start",
      marginTop: 12,
    },
    activePill: {
      backgroundColor: isDark ? "#064E3B" : "#D1FAE5",
    },
    inactivePill: {
      backgroundColor: isDark ? "#7F1D1D" : "#FEE2E2",
    },
    statusText: {
      fontSize: 12,
      fontWeight: "700",
      color: isDark ? "#E5E7EB" : "#111827",
    },

    /* SECTION CARDS */
    sectionCard: {
      backgroundColor: isDark ? "#2a2a2a" : "#fff",
      padding: 14,
      borderRadius: 14,
      marginTop: 5,
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    sectionTitle: {
      fontWeight: "700",
      marginBottom: 2,
      color: theme.text,
      fontSize: 16,
    },

    /* ADDRESS */
    addressCard: {
      backgroundColor: isDark ? "#2a2a2a" : "#fff",
      padding: 10,
      borderRadius: 8,
      marginVertical: 4,
    },
    addressText: {
      color: isDark ? "#E5E7EB" : "#111827",
      fontSize: 14,
      marginVertical: 2,
    },

    /* BUTTONS */
    primaryBtn: {
      marginTop: 12,
      backgroundColor: "#4C8EF7",
      padding: 14,
      borderRadius: 12,
      alignItems: "center",
    },
    primaryText: {
      color: "#fff",
      fontWeight: "700",
      fontSize: 16,
    },
    secondaryBtn: {
      marginTop: 12,
      backgroundColor: isDark ? "#444" : "#e5e7eb",
      padding: 12,
      borderRadius: 12,
      alignItems: "center",
    },
    secondaryText: {
      color: theme.text,
      fontWeight: "600",
      fontSize: 16,
    },
  });
}