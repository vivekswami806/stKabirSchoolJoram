import { ThemeContext } from "@/action/theme/ThemeContext";
import { Theme } from "@/action/theme/themeReducer";
import { Ionicons } from "@expo/vector-icons";
import React, { useContext } from "react";
import {
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface Option {
  label: string;
  value: string;
}

interface StudentFiltersProps {
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

  role: string;
  onDatePress: () => void;
  styles?: any;
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
  role,
}: StudentFiltersProps) {
  const themeState = useContext(ThemeContext);
  if (!themeState) return null;

  const { theme } = themeState;
  const isDark = theme.mode === "dark";

  const styles = getFilterStyles(isDark, theme);

  const canChangeClassOrSection =
    role === "ADMIN" || role === "STAFF_CHAT";

  return (
    <View style={styles.filterContainer}>
      {/* Class */}
      <TouchableOpacity
        style={[
          styles.classDropdownWrapper,
          !canChangeClassOrSection && { opacity: 0.6 },
        ]}
        disabled={!canChangeClassOrSection}
        onPress={() =>
          canChangeClassOrSection && setClassModalVisible(true)
        }
      >
        <Text style={styles.selectedText}>
          {classOptions.find((c) => c.value === selectedClass)?.label ??
            "Select Class"}
        </Text>
      </TouchableOpacity>

      {/* Section */}
      <TouchableOpacity
        style={[
          styles.classDropdownWrapper,
          !canChangeClassOrSection && { opacity: 0.6 },
        ]}
        disabled={!canChangeClassOrSection}
        onPress={() =>
          canChangeClassOrSection && setSectionModalVisible(true)
        }
      >
        <Text style={styles.selectedText}>
          {sectionOptions.find((s) => s.value === selectedSection)?.label ??
            "Select Section"}
        </Text>
      </TouchableOpacity>

      {/* Date */}
      <TouchableOpacity
        style={styles.datePickerContainer}
        onPress={onDatePress}
      >
        <Text style={styles.dateText}>
          {selectedDateStr || "Select Date"}
        </Text>

        <Ionicons
          name="calendar-outline"
          size={18}
          color={isDark ? "#E5E7EB" : "#666"}
        />
      </TouchableOpacity>

      {/* CLASS MODAL */}
      {canChangeClassOrSection && (
       <Modal
       transparent
       visible={classModalVisible}
       animationType="fade"
     >
       <View style={styles.modalContainer}>
         <View style={styles.modalBox}>
           <Text style={styles.modalTitle}>Select Class</Text>
     
           <FlatList
             data={classOptions}
             keyExtractor={(item) => item.value}
             keyboardShouldPersistTaps="handled"
             showsVerticalScrollIndicator={false}
             renderItem={({ item }) => (
               <TouchableOpacity
                 style={styles.modalItem}
                 onPress={() => {
                   setSelectedClass(item.value);
                   setClassModalVisible(false);
                 }}
               >
                 <Text style={styles.modalItemText}>{item.label}</Text>
               </TouchableOpacity>
             )}
           />
     
           <TouchableOpacity
             style={styles.closeBtn}
             onPress={() => setClassModalVisible(false)}
           >
             <Text style={{ color: "#2563EB", fontWeight: "600" }}>
               Close
             </Text>
           </TouchableOpacity>
         </View>
       </View>
     </Modal>
      )}

      {/* SECTION MODAL */}
      {canChangeClassOrSection && (
        <Modal transparent visible={sectionModalVisible} animationType="fade">
          <TouchableOpacity
            style={styles.modalContainer}
            activeOpacity={1}
            onPress={() => setSectionModalVisible(false)}
          >
            <TouchableOpacity
              activeOpacity={1}
              style={styles.modalBox}
            >
              <Text style={styles.modalTitle}>Select Section</Text>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 8 }}
              >
                {sectionOptions.map((item) => (
                  <TouchableOpacity
                    key={item.value}
                    style={[
                      styles.modalItem,
                      selectedSection === item.value &&
                        styles.selectedItem,
                    ]}
                    onPress={() => {
                      setSelectedSection(item.value);
                      setSectionModalVisible(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.modalItemText,
                        selectedSection === item.value &&
                          styles.selectedItemText,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
}

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
      borderColor: isDark ? "#334155" : "#D1D5DB",
      backgroundColor: isDark ? "#020617" : "#F9FAFB",
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

    modalTitle: {
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 12,
      color: isDark ? "#F8FAFC" : "#111827",
    },


    selectedItem: {
      backgroundColor: isDark ? "#1E293B" : "#E0F2FE",
    },

    modalItemText: {
      fontSize: 15,
      color: isDark ? "#E5E7EB" : "#1F2937",
    },

    selectedItemText: {
      fontWeight: "700",
      color: "#2563EB",
    },
    modalContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0,0,0,0.5)",
    },
    
    modalBox: {
      width: "90%",
      maxHeight: "75%",
      backgroundColor: theme.background,
      borderRadius: 16,
      padding: 16,
    },
    
    modalItem: {
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark ? "#334155" : "#E5E7EB",
    },
    
    closeBtn: {
      marginTop: 12,
      alignItems: "center",
    },
  });