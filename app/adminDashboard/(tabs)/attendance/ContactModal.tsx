import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    Image,
    Linking,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

import { Theme } from "@/action/theme/themeReducer";
import { ToastService } from "react-native-toastier";

interface Person {
  id: string;
  name: string;
  avatar?: string;
  image?: string | null;
  isPresent: "A" | "P";
  synced?: boolean;
  attendanceMarked?: boolean;
  studentClass?: string;
  section?: string;
  admissionNumber?: string;
  rollNumber?: string;
  number?: string; // phone number
}
interface ContactModalProps {
    visible: boolean;
    student: Person | null;
    onClose: () => void;
    theme: Theme;
  }
  
 export const ContactModal = ({ visible, student, onClose, theme }: ContactModalProps) => {
    const hasNumber = !!student?.number;
  
    const handleCall = () => {
      if (student?.number) {
        Linking.openURL(`tel:${student.number}`);
      }
    };
  
    const handleSMS = () => {
      if (student?.number) {
        Linking.openURL(`sms:${student.number}`);
      }
    };
  
    const handleWhatsApp = () => {
      if (student?.number) {
        const cleaned = String(student.number).replace(/[^0-9]/g, "");
        Linking.openURL(`https://wa.me/${cleaned}`).catch(() => {
          ToastService.show({
            type: "danger",
            message: "WhatsApp is not installed",
            duration: 2000,
            contentContainerStyle: { flex: 1 },
          });
        });
      }
    };
  
    return (
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
      >
        {/* Backdrop — tap to close */}
        <TouchableOpacity
          style={modalStyles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        >
          {/* Prevent tap-through on the sheet itself */}
          <TouchableOpacity activeOpacity={1} style={modalStyles.sheetWrapper}>
            <View style={[modalStyles.sheet, { backgroundColor: theme.background ?? "#fff" }]}>
  
              {/* Drag Handle */}
              <View style={modalStyles.handle} />
  
              {/* Student Info */}
              <View style={modalStyles.infoSection}>
                {student?.image ? (
                  <Image
                    source={{ uri: student.image }}
                    style={modalStyles.avatar}
                  />
                ) : (
                  <View style={[modalStyles.avatarPlaceholder, { backgroundColor: "#3B82F6" }]}>
                    <Text style={modalStyles.avatarText}>{student?.avatar}</Text>
                  </View>
                )}
  
                <Text style={[modalStyles.studentName, { color: theme.text ?? "#111827" }]}>
                  {student?.name}
                </Text>
  
                {student?.admissionNumber && (
                  <Text style={modalStyles.studentMeta}>
                    Adm No.: {student.admissionNumber}
                  </Text>
                )}
  
                {student?.rollNumber && (
                  <Text style={modalStyles.studentMeta}>
                    Roll No.: {student.rollNumber}
                  </Text>
                )}
  
                {hasNumber ? (
                  <View style={modalStyles.numberRow}>
                    <Ionicons name="call-outline" size={14} color="#6B7280" />
                    <Text style={modalStyles.numberText}>{student?.number}</Text>
                  </View>
                ) : (
                  <View style={[modalStyles.numberRow, { marginTop: 8 }]}>
                    <Ionicons name="alert-circle-outline" size={14} color="#EF4444" />
                    <Text style={[modalStyles.numberText, { color: "#EF4444" }]}>
                      No phone number on record
                    </Text>
                  </View>
                )}
              </View>
  
              {/* Divider */}
              <View style={modalStyles.divider} />
  
              {/* Action Buttons */}
              <View style={modalStyles.actionsRow}>
  
                {/* Call */}
                <TouchableOpacity
                  onPress={handleCall}
                  disabled={!hasNumber}
                  style={[
                    modalStyles.actionBtn,
                    { backgroundColor: hasNumber ? "#10B981" : "#E5E7EB" },
                  ]}
                >
                  <Ionicons
                    name="call-outline"
                    size={22}
                    color={hasNumber ? "#fff" : "#9CA3AF"}
                  />
                  <Text
                    style={[
                      modalStyles.actionLabel,
                      { color: hasNumber ? "#fff" : "#9CA3AF" },
                    ]}
                  >
                    Call
                  </Text>
                </TouchableOpacity>
  
                {/* SMS */}
                <TouchableOpacity
                  onPress={handleSMS}
                  disabled={!hasNumber}
                  style={[
                    modalStyles.actionBtn,
                    { backgroundColor: hasNumber ? "#3B82F6" : "#E5E7EB" },
                  ]}
                >
                  <Ionicons
                    name="chatbubble-outline"
                    size={22}
                    color={hasNumber ? "#fff" : "#9CA3AF"}
                  />
                  <Text
                    style={[
                      modalStyles.actionLabel,
                      { color: hasNumber ? "#fff" : "#9CA3AF" },
                    ]}
                  >
                    SMS
                  </Text>
                </TouchableOpacity>
  
                {/* WhatsApp */}
                <TouchableOpacity
                  onPress={handleWhatsApp}
                  disabled={!hasNumber}
                  style={[
                    modalStyles.actionBtn,
                    { backgroundColor: hasNumber ? "#25D366" : "#E5E7EB" },
                  ]}
                >
                  {/* WhatsApp icon via Ionicons logo */}
                  <Ionicons
                    name="logo-whatsapp"
                    size={22}
                    color={hasNumber ? "#fff" : "#9CA3AF"}
                  />
                  <Text
                    style={[
                      modalStyles.actionLabel,
                      { color: hasNumber ? "#fff" : "#9CA3AF" },
                    ]}
                  >
                    WhatsApp
                  </Text>
                </TouchableOpacity>
  
              </View>
  
              {/* Cancel */}
              <TouchableOpacity onPress={onClose} style={modalStyles.cancelBtn}>
                <Text style={modalStyles.cancelText}>Cancel</Text>
              </TouchableOpacity>
  
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    );
  };
  
  const modalStyles = StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "flex-end",
    },
    sheetWrapper: {
      width: "100%",
    },
    sheet: {
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: 12,
      paddingHorizontal: 20,
      paddingBottom: 20,
    },
    handle: {
      width: 40,
      height: 4,
      backgroundColor: "#D1D5DB",
      borderRadius: 2,
      alignSelf: "center",
      marginBottom: 20,
    },
    infoSection: {
      alignItems: "center",
      marginBottom: 20,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      marginBottom: 12,
    },
    avatarPlaceholder: {
      width: 80,
      height: 80,
      borderRadius: 40,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
    },
    avatarText: {
      color: "#fff",
      fontSize: 32,
      fontWeight: "600",
    },
    studentName: {
      fontSize: 20,
      fontWeight: "600",
      marginBottom: 4,
    },
    studentMeta: {
      fontSize: 13,
      color: "#6B7280",
      marginTop: 2,
    },
    numberRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginTop: 6,
    },
    numberText: {
      fontSize: 13,
      color: "#6B7280",
    },
    divider: {
      height: 0.5,
      backgroundColor: "#E5E7EB",
      marginBottom: 20,
    },
    actionsRow: {
      flexDirection: "row",
      gap: 10,
      marginBottom: 12,
    },
    actionBtn: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 14,
      borderRadius: 14,
      gap: 6,
    },
    actionLabel: {
      fontSize: 13,
      fontWeight: "600",
    },
    cancelBtn: {
      alignItems: "center",
      paddingVertical: 14,
    },
    cancelText: {
      fontSize: 15,
      color: "#6B7280",
    },
  });