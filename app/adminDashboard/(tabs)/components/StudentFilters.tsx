import { ThemeContext } from "@/action/theme/ThemeContext";
import { Theme } from "@/action/theme/themeReducer";
import { Ionicons } from "@expo/vector-icons";
import React, { useContext } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface Option {
  label: string;
  value: string;
}

interface StudentFiltersProps {
  styles?: any;
  selectedDateStr: string;

  classModalVisible: boolean;
  setClassModalVisible: (v: boolean) => void;

  sectionModalVisible: boolean;
  setSectionModalVisible: (v: boolean) => void;

  classOptions: Option[];
  sectionOptions: Option[];

  selectedClass: string;
  setSelectedClass: (v: string) => void;

  selectedSection: string;
  setSelectedSection: (v: string) => void;

  role: string;  // role passed as string
  onDatePress: () => void;
}

export default function StudentFilters({
  selectedDateStr,
  classModalVisible,
  setClassModalVisible,
  sectionModalVisible,
  setSectionModalVisible,
  classOptions,
  sectionOptions,
  selectedClass,
  setSelectedClass,
  selectedSection,
  setSelectedSection,
  onDatePress,
  role,  // just destructure the role
}: StudentFiltersProps) {
  const themeState = useContext(ThemeContext);
  if (!themeState) return null;

  const { theme } = themeState;
  const isDark = theme.mode === "dark";

  const styles = getFilterStyles(isDark, theme);

  // Only admin can change class/section
  const canChangeClassOrSection = role === "ADMIN" || role === "STAFF_CHAT";

  return (
    <View style={styles.filterContainer}>
      {/* Class Selector */}
      <TouchableOpacity
        style={[styles.classDropdownWrapper, !canChangeClassOrSection && { opacity: 0.6 }]}
        disabled={!canChangeClassOrSection}
        onPress={() => canChangeClassOrSection && setClassModalVisible(true)}
      >
        <Text style={styles.selectedText}>
          {classOptions.find(c => c.value === selectedClass)?.label || "Select Class"}
        </Text>
      </TouchableOpacity>

      {/* Section Selector */}
      <TouchableOpacity
        style={[styles.classDropdownWrapper, !canChangeClassOrSection && { opacity: 0.6 }]}
        disabled={!canChangeClassOrSection}
        onPress={() => canChangeClassOrSection && setSectionModalVisible(true)}
      >
        <Text style={styles.selectedText}>
          {sectionOptions.find(s => s.value === selectedSection)?.label || "Select Section"}
        </Text>
      </TouchableOpacity>

      {/* Date Picker */}
      <TouchableOpacity style={styles.datePickerContainer} onPress={onDatePress}>
        <Text style={styles.dateText}>
          {selectedDateStr || "Select Date"}
        </Text>
        {selectedDateStr !== "" && (
          <Ionicons
            name="calendar-outline"
            size={18}
            color={isDark ? "#E5E7EB" : "#666"}
          />
        )}
      </TouchableOpacity>

      {/* Class Modal */}
      {canChangeClassOrSection && (
        <Modal transparent visible={classModalVisible} animationType="fade">
          <TouchableOpacity
            style={styles.modalContainer}
            activeOpacity={1}
            onPress={() => setClassModalVisible(false)}
          >
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Select Class</Text>
              {classOptions.map(item => (
                <TouchableOpacity
                  key={item.value}
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedClass(item.value);
                    setClassModalVisible(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* Section Modal */}
      {canChangeClassOrSection && (
        <Modal transparent visible={sectionModalVisible} animationType="fade">
          <TouchableOpacity
            style={styles.modalContainer}
            activeOpacity={1}
            onPress={() => setSectionModalVisible(false)}
          >
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Select Section</Text>
              {sectionOptions.map(item => (
                <TouchableOpacity
                  key={item.value}
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedSection(item.value);
                    setSectionModalVisible(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
}


/* ================= STYLES ================= */

const getFilterStyles = (isDark: boolean, theme: Theme) =>
  StyleSheet.create({
    filterContainer: {
      flexDirection: "row",
      gap: 10,
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.background,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? "#1E293B" : "#E5E7EB",
    },

    classDropdownWrapper: {
      flex: 1,
      height: 44,
      paddingHorizontal: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: isDark ? "#2d4044" : "#D1D5DB",
      backgroundColor: isDark ? "#02061" : "#F9FAFB",
      justifyContent: "center",
    },

    selectedText: {
      fontSize: 14,
      color: isDark ? "#E5E7EB" : "#111827",
      fontWeight: "500",
    },

    datePickerContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      height: 44,
      paddingHorizontal: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: isDark ? "#334155" : "#D1D5DB",
      backgroundColor: isDark ? "#020617" : "#F9FAFB",
    },

    dateText: {
      fontSize: 14,
      color: isDark ? "#E5E7EB" : "#111827",
      fontWeight: "500",
    },

    modalContainer: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.4)",
      justifyContent: "center",
      paddingHorizontal: 20,
    },

    modalBox: {
      backgroundColor: theme.background,
      borderRadius: 14,
      paddingVertical: 16,
      paddingHorizontal: 14,
      // maxHeight: ",
    },

    modalTitle: {
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 12,
      color: isDark ? "#F8FAFC" : "#111827",
    },

    modalItem: {
      paddingVertical: 12,
      paddingHorizontal: 10,
      borderRadius: 8,
    },

    modalItemText: {
      fontSize: 14,
      color: isDark ? "#E5E7EB" : "#1F2937",
    },
  });
