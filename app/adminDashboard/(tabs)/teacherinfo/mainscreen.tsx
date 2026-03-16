import React, { useState } from "react";
import { View } from "react-native";
import TeacherDetail from "./teacherDetails";
import TeacherInfo from "./teacherinfo";


export default function ParentScreen() {
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  return (
    <View style={{ flex: 1 }}>
      <TeacherInfo
        onSelectStudent={(teacher) => {
            setSelectedTeacher(teacher);
          setModalVisible(true);
        }}
      />

      <TeacherDetail
        visible={modalVisible}
        teacher={selectedTeacher}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}
