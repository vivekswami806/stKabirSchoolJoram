import React, { useState } from "react";
import { View } from "react-native";
import StudentDetail from "./studentDetail";
import StudentInfo from "./studentInfo";

export default function ParentScreen() {
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // ✅ Admin filter state
  const [selectedClass, setSelectedClass] = useState("1");

  return (
    <View style={{ flex: 1 }}>
      <StudentInfo
        className={selectedClass}
        onSelectStudent={(student) => {
          setSelectedStudent(student);
          setModalVisible(true);
        }}
      />

      <StudentDetail
        visible={modalVisible}
        student={selectedStudent}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}
