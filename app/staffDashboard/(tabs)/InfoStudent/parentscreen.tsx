import { RootState } from "@/action/store";
import React, { useState } from "react";
import { View } from "react-native";
import { useSelector } from "react-redux";
import StudentDetail from "./studentDetail";
import StudentInfo from "./studentInfo";

export default function ParentScreen() {
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const { userDetail } = useSelector((state: RootState) => state.user);
  return (
    <View style={{ flex: 1 }}>
      <StudentInfo
        className= {userDetail?.className}
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
