import { ThemeContext } from "@/action/theme/ThemeContext";
import { Theme } from "@/action/theme/themeReducer";
import { API_BASE_URL } from "@/config";
import { getDeviceId } from "@/helper/getDeviceId";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import axios from "axios";
import { Buffer } from "buffer";
import * as DocumentPicker from "expo-document-picker";
import moment from "moment";
import React, { useContext, useMemo, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import ModalDropdown from "./modaldropdown";


/* ------------------ COMPONENT ------------------ */
const CreateHomework = () => {
  const themeState = useContext(ThemeContext);
  if (!themeState) return null;
  const { theme } = themeState;

  // const { userDetail } = useSelector((state: RootState) => state.user);

  const styles = getStyles(theme);

  /* ------------------ STATE ------------------ */
  const [classModal, setClassModal] = useState(false);
  const [subjectModal, setSubjectModal] = useState(false);
  const [sectionModal, setSectionModal] = useState(false);

  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedSection, setSelectedSection] = useState<any>(null);

  const [title, setTitle] = useState("");
  const [homeworkText, setHomeworkText] = useState("");
  const [attachment, setAttachment] = useState<any | null>(null);

  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateObj, setDateObj] = useState(new Date());

  /* ------------------ DATA ------------------ */

  const classes = useMemo(
    () => [
      { id: 1, name: "Nur" },
      { id: 2, name: "LKG" },
      { id: 3, name: "UKG" },
      ...Array.from({ length: 10 }, (_, i) => ({
        id: i + 4,
        name: `${i + 1}`,
      })),
    ],
    []
  );
  
  const sections = [
    { id: 1, name: "A" },
    { id: 2, name: "B" },
    { id: 3, name: "C" },
  ];

  // Subjects only from teacher
  const subjects = [{ name: "math" }, { name: "english" }, { name: "hindi" }]
  // useMemo(
  //   () => userDetail?.subjects || [],
  //   [userDetail]
  // );

  /* ------------------ HANDLERS ------------------ */

  const onDateChange = (_: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDateObj(selectedDate);
    }
  };

  const validate = () => {
    if (!selectedClass) return "Please select class";
    if (!selectedSection) return "Please select section";
    if (!selectedSubject.trim()) return "Please select subject";
    if (!title.trim()) return "Enter homework title";
    if (!homeworkText.trim()) return "Enter homework details";
    return null;
  };

  const publishHomework = async () => {
    const error = validate();
    const deviceId = await getDeviceId();
    if (error) {
      Alert.alert("Validation Error", error);
      return;
    }

    try {
      setLoading(true);
      // console.log({
      //   title,
      //   homeworkText,
      //   selectedClass,
      //   selectedSection,
      //   selectedSubject,
      //   attachment,
      // });

      const token = await AsyncStorage.getItem("auth_token");
      const encodedTenant = await AsyncStorage.getItem("auth_tenant");
      if (!token || !encodedTenant) throw new Error("Auth missing");

      const tenantId = Buffer.from(encodedTenant, "base64").toString("utf-8");

      const formData = new FormData();

      formData.append("title", title);
      formData.append("description", homeworkText);
      formData.append("subject", selectedSubject);
      formData.append("className", selectedClass.name);
      formData.append("section", selectedSection.name.charAt(0));
      formData.append("homeworkDate", moment(new Date()).format("YYYY-MM-DD"));

      // ✅ FIXED: Use the actual dueDate state variable
      formData.append("dueDate", moment(dateObj).format("YYYY-MM-DD"));

      if (attachment) {
        if (Platform.OS === 'web') {
          // ✅ FIX FOR WEB: Convert blob URI to actual File object
          const response = await fetch(attachment.uri);
          const blob = await response.blob();
          const file = new File([blob], attachment.name, { type: attachment.type });
          formData.append("files", file);
        } else {
          // ✅ FIX FOR MOBILE (Android/iOS)
          formData.append("files", {
            uri: attachment.uri,
            name: attachment.name,
            type: attachment.type,
          } as any);
        }
      }
      // console.log("---attach|", attachment, "--- token|", token, "--- tenantId|", tenantId, deviceId);

      const res = await axios.post(`${API_BASE_URL}homework/createHomeWork`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Tenant-ID": tenantId,
          "X-Device-ID": deviceId,
          "Content-Type": "multipart/form-data",
        },
      });
      // console.log("--res|", res);

      Alert.alert("Success", "Homework published successfully 🎉");
      setTitle("");
      setHomeworkText("");
      setSelectedClass(null);
      setSelectedSection(null);
      setSelectedSubject("");
      setAttachment(null);
    } catch (err: any) {
      console.log("===== AXIOS ERROR =====");
      console.log("message:", err.message);
      console.log("status:", err.response?.status);
      console.log("data:", err.response?.data);
      console.log("======================");

      Alert.alert(
        "Upload Failed",
        err.response?.data?.message ||
        JSON.stringify(err.response?.data) ||
        err.message
      );
    } finally {
      setLoading(false);
    }
  };


  const uploadAttachment = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) return;

      const asset = result.assets[0];

      // ✅ FIXED: Use URI as is. Android needs content:// and iOS needs file://
      // DocumentPicker already provides the correct prefix.
      const normalizedFile = {
        uri: asset.uri,
        name: asset.name,
        type: asset.mimeType || "application/octet-stream",
      };

      setAttachment(normalizedFile);
      Alert.alert("Success", "File attached successfully ✔");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to pick file");
    }
  };

  /* ------------------ UI ------------------ */
  return (
    <ScrollView style={styles.container}>
      <View style={styles.wrapper}>
        {/* CLASS */}
        <TouchableOpacity
          style={styles.dropdown}
          onPress={() => setClassModal(true)}
        >
          <Text>
            {selectedClass ? selectedClass.name : "Select Class"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dropdown}
          onPress={() => setSectionModal(true)}
        >
          <Text>{selectedSection ? selectedSection.name : "Select Section"}</Text>
        </TouchableOpacity>

        {/* SUBJECT */}
        {/* <TouchableOpacity
          style={styles.dropdown}
          onPress={() =>
            selectedClass
              ? setSubjectModal(true)
              : Alert.alert("Select class first")
          }
        >
          <Text>
            {selectedSubject ? selectedSubject.name : "Select Subject"}
          </Text>
        </TouchableOpacity> */}

        <TextInput
          style={styles.input}
          placeholder="Select Subject"
          value={selectedSubject}
          onChangeText={setSelectedSubject}
        />

        {/* TITLE */}
        <TextInput
          style={styles.input}
          placeholder="Homework Title"
          value={title}
          onChangeText={setTitle}
        />

        {/* DATE PICKER */}
        {showDatePicker && (
          <DateTimePicker
            value={dateObj}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            minimumDate={new Date()}
            onChange={onDateChange}
          />
        )}

        <TouchableOpacity
          style={styles.datePickerContainer}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateText}>
            Due Date: {dateObj.toISOString().split("T")[0]}
          </Text>
          <Ionicons name="calendar-outline" size={18} color="#666" />
        </TouchableOpacity>

        {/* ATTACHMENT */}
        <TouchableOpacity onPress={uploadAttachment}>
          <Text style={styles.attachment}>
            {attachment ? `Attached: ${attachment.name}` : "Upload Attachment"}
          </Text>
        </TouchableOpacity>

        {/* DESCRIPTION */}
        <TextInput
          style={styles.textArea}
          placeholder="Write homework details..."
          multiline
          value={homeworkText}
          onChangeText={setHomeworkText}
        />

        {/* {loading && <ActivityIndicator size="large" color="#6C63FF" />} */}

        {/* PUBLISH */}
        <TouchableOpacity
          style={[styles.publishBtn, loading && { opacity: 0.6 }]}
          disabled={loading}
          onPress={publishHomework}
        >
          <Text style={styles.publishText}>
            {loading ? "Publishing..." : "Publish Homework"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* CLASS MODAL */}
      <ModalDropdown
        visible={classModal}
        data={classes}
        labelKey="name"
        onSelect={(item) => {
          setSelectedClass(item);
          setClassModal(false);
        }}
        onClose={() => setClassModal(false)}
      />

      <ModalDropdown
        visible={sectionModal}
        data={sections}
        labelKey="name"
        onSelect={(item) => {
          setSelectedSection(item);
          setSectionModal(false);
        }}
        onClose={() => setSectionModal(false)}
      />

      {/* SUBJECT MODAL */}
      {/* <ModalDropdown
        visible={subjectModal}
        data={subjects}
        labelKey="name"
        onSelect={(item) => {
          setSubjectModal(false);
        }}
        onClose={() => setSubjectModal(false)}
      /> */}
    </ScrollView>
  );
};

export default CreateHomework;

function getStyles(theme: Theme) {
  let isDark = theme.mode === "dark";
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      //  paddingTop: Platform.OS === 'ios' ? 60 : 50
    },
    datePickerContainer: {
      width: '100%',
      height: 45,
      borderWidth: 1,
      borderColor: '#ccc',
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 10,
      backgroundColor: '#fff',
    },
    dateText: {
      fontSize: 15,
      color: "#495057",
      padding: 12,
    },
    input: {
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
    },
    wrapper: { padding: 16 },
    dropdown: {
      flexDirection: "row",
      justifyContent: "space-between",
      padding: 14,
      borderWidth: 1,
      borderColor: "#ddd",
      borderRadius: 8,
      marginBottom: 14,
    },
    dropdownText: {
      fontSize: 14, color: !isDark
        ? '#000104'
        : '#E9EFFC',
    },
    dropdownIcon: { fontSize: 12, color: "#777" },

    attachment: {
      padding: 14,
      borderWidth: 1,
      borderColor: "#ccc",
      borderRadius: 8,
      marginBottom: 14,
      color: !isDark
        ? '#000104'
        : '#E9EFFC',
    },

    textArea: {
      height: 140,
      borderWidth: 1,
      borderColor: "#ccc",
      borderRadius: 8,
      padding: 14,
      marginBottom: 16,
      color: !isDark
        ? '#000104'
        : '#E9EFFC',
    },

    publishBtn: {
      backgroundColor: "#6C63FF",
      padding: 14,
      borderRadius: 8,
      marginTop: 10,
    },
    publishText: {
      textAlign: "center",
      color: "#fff",
      fontWeight: "700",
      fontSize: 16,
    },
  });
  return styles;
};

function base64ToBlob(staffImage: any, arg1: string) {
  throw new Error("Function not implemented.");
}
