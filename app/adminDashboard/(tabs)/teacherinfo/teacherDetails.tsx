import { ThemeContext } from "@/action/theme/ThemeContext";
import { Theme } from "@/action/theme/themeReducer";
import { router } from "expo-router";
import React, { useContext } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

/* ================= TYPES ================= */

interface StaffAddress {
  streetAddress?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  status: boolean;
  gender: string;
  dateOfBirth: string;
  phoneNumber: string;
  email: string;
  adharNumber: number;
  staffBloodGroup: string;
  staffEmergencyContact: number;
  staffJoiningDate: string;
  staffPreviousSchoolName: string;
  staffClass: string;
  staffSection: string;
  teachingSubjects: string;
  educationalQualifications: string;
  certifications: string;
  languagesSpoken: string;
  specializations: string;
  workExperience: string;
  staffAddressDetails: StaffAddress[];
}

interface Props {
  visible: boolean;
  teacher: Staff | null;
  onClose: () => void;
}

/* ================= COMPONENT ================= */

export default function TeacherDetailBottomSheet({
  visible,
  teacher,
  onClose,
}: Props) {
  const themeState = useContext(ThemeContext);
  if (!themeState || !teacher) return null;

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
        <Animated.View
          style={styles.sheet}>
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
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {teacher.name?.charAt(0).toUpperCase()}
                </Text>
              </View>

              <Text style={styles.name}>{teacher.name}</Text>
              <Text style={styles.role}>{teacher.role}</Text>

              <View
                style={[
                  styles.statusPill,
                  teacher.status ? styles.activePill : styles.inactivePill,
                ]}
              >
                <Text style={styles.statusText}>
                  {teacher.status ? "Active" : "Inactive"}
                </Text>
              </View>
            </View>

            {/* ===== PERSONAL CARD ===== */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Personal Information</Text>
              <Info label="DOB" value={teacher.dateOfBirth} />
              <Info label="Gender" value={teacher.gender} />
              <Info label="Blood Group" value={teacher.staffBloodGroup} />
              <Info label="Aadhar" value={String(teacher.adharNumber)} />
            </View>

            {/* ===== CONTACT CARD ===== */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Contact Information</Text>
              <Info label="Phone" value={teacher.phoneNumber} />
              <Info label="Email" value={teacher.email} />
              <Info
                label="Emergency"
                value={String(teacher.staffEmergencyContact)}
              />
            </View>

            {/* ===== ADDRESS CARD ===== */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Address</Text>
              {teacher.staffAddressDetails?.map((addr, idx) => (
                <View key={idx} style={styles.addressCard}>
                  <Text style={styles.addressText}>{addr.streetAddress}</Text>
                  <Text style={styles.addressText}>
                    {addr.city}, {addr.state} - {addr.postalCode}
                  </Text>
                  <Text style={styles.addressText}>{addr.country}</Text>
                </View>
              ))}
            </View>

            {/* ===== BUTTONS ===== */}
            <TouchableOpacity
              onPress={() => {
                onClose();
                router.push({
                  pathname: "/staffDashboard/(tabs)/totalattendance",
                  params: { details: JSON.stringify(teacher) },
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
      paddingBottom: 16,
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
      paddingBottom: 10,
    },

    /* HEADER CARD */
    headerCard: {
      alignItems: "center",
      paddingVertical: 20,
    },
    avatar: {
      width: 60,
      height: 60,
      borderRadius: 40,
      backgroundColor: "#4C8EF7",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 10,
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
    role: {
      fontSize: 14,
      color: isDark ? "#9CA3AF" : "#6B7280",
      // marginBottom: 10,
    },
    statusPill: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 20,
      alignSelf: "flex-start",
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
      padding: 0,
      borderRadius: 8,
      marginVertical: 4,
    },
    addressText: {
      color: isDark ? "#E5E7EB" : "#111827",
      fontSize: 14,
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

// import { ThemeContext } from "@/action/theme/ThemeContext";
// import { Theme } from "@/action/theme/themeReducer";
// import React, { useContext, useEffect, useRef } from "react";
// import {
//   Animated,
//   KeyboardAvoidingView,
//   Modal,
//   Platform,
//   Pressable,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from "react-native";

// interface StaffAddress {
//   streetAddress?: string;
//   city?: string;
//   state?: string;
//   postalCode?: string;
//   country?: string;
// }

// export interface Staff {
//   id: string;
//   name: string;
//   role: string;
//   status: boolean;
//   gender: string;
//   dateOfBirth: string;
//   phoneNumber: string;
//   email: string;
//   adharNumber: number;
//   staffBloodGroup: string;
//   staffFatherName: string;
//   staffMotherName: string;
//   staffEmergencyContact: number;
//   staffJoiningDate: string;
//   staffPreviousSchoolName: string;
//   staffClass: string;
//   staffSection: string;
//   teachingSubjects: string;
//   educationalQualifications: string;
//   certifications: string;
//   languagesSpoken: string;
//   specializations: string;
//   workExperience: string;
//   staffAddressDetails: StaffAddress[];
// }

// interface Props {
//   visible: boolean;
//   teacher: Staff | null;
//   onClose: () => void;
// }

// export default function TeacherDetailBottomSheet({
//   visible,
//   teacher,
//   onClose,
// }: Props) {
//   const themeState = useContext(ThemeContext);
//   if (!themeState || !teacher) return null;

//   const { theme } = themeState;
//   const styles = getStyles(theme);

//   /** Bottom sheet animation */
//   const slideAnim = useRef(new Animated.Value(0)).current;

//   useEffect(() => {
//     if (visible) {
//       Animated.timing(slideAnim, {
//         toValue: 1,
//         duration: 280,
//         useNativeDriver: true,
//       }).start();
//     } else {
//       Animated.timing(slideAnim, {
//         toValue: 0,
//         duration: 200,
//         useNativeDriver: true,
//       }).start();
//     }
//   }, [visible]);

//   const translateY = slideAnim.interpolate({
//     inputRange: [0, 1],
//     outputRange: [700, 0],
//   });

//   return (
//     <Modal visible={visible} transparent animationType="none">
//       <KeyboardAvoidingView
//         behavior={Platform.OS === "ios" ? "padding" : "height"}
//         style={styles.container}
//       >
//         {/* Overlay */}
//         <Pressable style={styles.overlay} onPress={onClose} />

//         {/* Bottom Sheet */}
//         <Animated.View
//           style={[
//             styles.sheet,
//             {
//               transform: [{ translateY }],
//             },
//           ]}
//         >
//           {/* Handle */}
//           <View style={styles.handle} />

//           <ScrollView
//             showsVerticalScrollIndicator={false}
//             keyboardDismissMode="on-drag"
//             keyboardShouldPersistTaps="handled"
//             nestedScrollEnabled
//             contentContainerStyle={styles.scrollContent}
//           >
//             {/* ================= HEADER ================= */}
//             <View style={styles.header}>
//               <Text style={styles.name}>{teacher.name}</Text>
//               <Text style={styles.role}>{teacher.role}</Text>

//               <View
//                 style={[
//                   styles.statusPill,
//                   teacher.status
//                     ? styles.activePill
//                     : styles.inactivePill,
//                 ]}
//               >
//                 <Text style={styles.statusText}>
//                   {teacher.status ? "Active" : "Inactive"}
//                 </Text>
//               </View>
//             </View>

//             {/* ================= PERSONAL ================= */}
//             <Section title="Personal Information">
//               <Info label="DOB" value={teacher.dateOfBirth} />
//               <Info label="Gender" value={teacher.gender} />
//               <Info label="Blood Group" value={teacher.staffBloodGroup} />
//               <Info label="Aadhar" value={String(teacher.adharNumber)} />
//             </Section>

//             {/* ================= CONTACT ================= */}
//             <Section title="Contact Information">
//               <Info label="Phone" value={teacher.phoneNumber} />
//               <Info label="Email" value={teacher.email} />
//               <Info
//                 label="Emergency"
//                 value={String(teacher.staffEmergencyContact)}
//               />
//             </Section>

//             {/* ================= PROFESSIONAL ================= */}
//             <Section title="Professional Details">
//               <Info label="Joining Date" value={teacher.staffJoiningDate} />
//               <Info
//                 label="Class & Section"
//                 value={`${teacher.staffClass} - ${teacher.staffSection}`}
//               />
//               <Info label="Subjects" value={teacher.teachingSubjects} />
//               <Info label="Experience" value={teacher.workExperience} />
//               <Info
//                 label="Previous School"
//                 value={teacher.staffPreviousSchoolName}
//               />
//             </Section>

//             {/* ================= QUALIFICATIONS ================= */}
//             <Section title="Qualifications">
//               <Info
//                 label="Education"
//                 value={teacher.educationalQualifications}
//               />
//               <Info label="Certifications" value={teacher.certifications} />
//               <Info label="Specializations" value={teacher.specializations} />
//               <Info label="Languages" value={teacher.languagesSpoken} />
//             </Section>

//             {/* ================= ADDRESS ================= */}
//             <Section title="Address">
//               {teacher.staffAddressDetails?.map((addr, idx) => (
//                 <View key={idx} style={styles.addressCard}>
//                   <Text style={styles.infoText}>{addr.streetAddress}</Text>
//                   <Text style={styles.infoText}>
//                     {addr.city}, {addr.state} - {addr.postalCode}
//                   </Text>
//                   <Text style={styles.infoText}>{addr.country}</Text>
//                 </View>
//               ))}
//             </Section>

//             <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
//               <Text style={styles.closeText}>Close</Text>
//             </TouchableOpacity>
//           </ScrollView>
//         </Animated.View>
//       </KeyboardAvoidingView>
//     </Modal>
//   );
// }

// /* ================= REUSABLE UI ================= */

// function Section({
//   title,
//   children,
// }: {
//   title: string;
//   children: React.ReactNode;
// }) {
//   return (
//     <View style={{ marginTop: 16 }}>
//       <Text style={{ fontWeight: "700", marginBottom: 6 }}>{title}</Text>
//       {children}
//     </View>
//   );
// }

// function Info({ label, value }: { label: string; value: string }) {
//   return (
//     <Text style={{ fontSize: 14, marginVertical: 1 }}>
//       <Text style={{ fontWeight: "600" }}>{label}: </Text>
//       {value}
//     </Text>
//   );
// }

// /* ================= STYLES ================= */

// function getStyles(theme: Theme) {
//   const isDark = theme.mode === "dark";

//   return StyleSheet.create({
//     container: {
//       flex: 1,
//       justifyContent: "flex-end",
//     },
//     overlay: {
//       ...StyleSheet.absoluteFillObject,
//       backgroundColor: "rgba(0,0,0,0.45)",
//     },
//     sheet: {
//       backgroundColor: theme.background,
//       borderTopLeftRadius: 20,
//       borderTopRightRadius: 20,
//       maxHeight: "90%",
//       paddingHorizontal: 16,
//       paddingBottom: 20,
//     },
//     handle: {
//       width: 40,
//       height: 4,
//       backgroundColor: "#999",
//       borderRadius: 20,
//       alignSelf: "center",
//       marginVertical: 10,
//     },
//     scrollContent: {
//       paddingBottom: 30,
//     },

//     header: {
//       marginBottom: 12,
//     },
//     name: {
//       fontSize: 22,
//       fontWeight: "800",
//       color: isDark ? "#EAF0FF" : "#0B1220",
//     },
//     role: {
//       fontSize: 14,
//       color: "#6B7280",
//       marginTop: 2,
//     },

//     statusPill: {
//       marginTop: 6,
//       paddingHorizontal: 10,
//       paddingVertical: 4,
//       borderRadius: 20,
//       alignSelf: "flex-start",
//     },
//     activePill: { backgroundColor: "#D1FAE5" },
//     inactivePill: { backgroundColor: "#FEE2E2" },
//     statusText: {
//       fontSize: 12,
//       fontWeight: "700",
//     },

//     infoText: {
//       fontSize: 14,
//       color: isDark ? "#C5C7D0" : "#333",
//     },

//     addressCard: {
//       backgroundColor: isDark ? "#2C2C2C" : "#F4F4F4",
//       padding: 10,
//       borderRadius: 8,
//       marginVertical: 4,
//     },

//     closeBtn: {
//       marginTop: 20,
//       backgroundColor: "#4C8EF7",
//       padding: 12,
//       borderRadius: 8,
//       alignItems: "center",
//     },
//     closeText: {
//       color: "#fff",
//       fontWeight: "600",
//       fontSize: 16,
//     },
//   });
// }


