import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";

interface StudentFiltersProps {
  styles: any;
  selectedDateStr: string;
  classModalVisible: boolean;
  setClassModalVisible: (v: boolean) => void;
  classOptions: { label: string; value: string }[];
  userData: any;
  setUserData: (v: any) => void;
  onDatePress: () => void; // Trigger Native Picker
}

export default function StudentFilters({
  styles,
  selectedDateStr,
  classModalVisible,
  setClassModalVisible,
  classOptions,
  userData,
  setUserData,
  onDatePress
}: StudentFiltersProps) {
  
  return (
    <View style={styles.filterContainer}>
      {/* Class Selector */}
      <TouchableOpacity
        style={styles.classDropdownWrapper}
        onPress={() => setClassModalVisible(true)}
      >
        <Text style={styles.selectedText}>
          {classOptions.find(c => c.value === userData.staffClass)?.label || userData.staffClass}
        </Text>
        <Ionicons name="caret-down" size={16} color="#666" />
      </TouchableOpacity>

      {/* Class Modal */}
      <Modal transparent visible={classModalVisible} animationType="fade">
        <TouchableOpacity 
          style={styles.modalContainer} 
          activeOpacity={1} 
          onPress={() => setClassModalVisible(false)}
        >
          <View style={styles.modalBox}>
            <Text style={{padding: 10, fontWeight: 'bold', color: '#999'}}>Select Class</Text>
            {classOptions.map((item) => (
              <TouchableOpacity
                key={item.value}
                style={styles.modalItem}
                onPress={() => {
                  setUserData({ ...userData, staffClass: item.value });
                  setClassModalVisible(false);
                }}
              >
                <Text style={styles.modalItemText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Date Trigger */}
      <TouchableOpacity style={styles.datePickerContainer} onPress={onDatePress}>
        <Text style={styles.dateText}>{selectedDateStr}</Text>
        <Ionicons name="calendar-outline" size={18} color="#666" />
      </TouchableOpacity>
    </View>
  );
}