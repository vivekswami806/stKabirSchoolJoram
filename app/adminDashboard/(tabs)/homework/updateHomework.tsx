import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import axios from "axios";
import { Buffer } from "buffer";
import * as DocumentPicker from "expo-document-picker";
import { router, useLocalSearchParams } from "expo-router";
import moment from "moment";
import React, { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemeContext } from "@/action/theme/ThemeContext";
import { API_BASE_URL } from "@/config";
import { getDeviceId } from "@/helper/getDeviceId";
import { ToastService } from "react-native-toastier";
import ModalDropdown from "./modaldropdown";

/* -------------------------------------------------------------------------- */

const STORAGE_KEY = "UPDATE_HOMEWORK_DATA";

const UpdateHomework: React.FC = () => {
  const { homeworkId } = useLocalSearchParams<{ homeworkId: string }>();

  const themeState = useContext(ThemeContext);
  if (!themeState) return null;
  const { theme } = themeState;
  const isDark = theme.mode === "dark";
  const styles = getStyles(theme);

  /* ------------------------------ STATE ------------------------------ */
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [selectedSection, setSelectedSection] = useState<any>(null);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [title, setTitle] = useState("");
  const [homeworkText, setHomeworkText] = useState("");
  const [dateObj, setDateObj] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [attachment, setAttachment] = useState<any | null>(null);

  const [classModal, setClassModal] = useState(false);
  const [sectionModal, setSectionModal] = useState(false);

  /* ------------------------- LOAD FROM STORAGE ------------------------- */
  useEffect(() => {
    loadHomework();
  }, []);

  const loadHomework = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) throw new Error("No homework data found");

      const data = JSON.parse(raw);

      setSelectedClass(data.className);
      setSelectedSection(data.section);
      setSelectedSubject(data.subject);
      setTitle(data.title);
      setHomeworkText(data.description);
      setDateObj(new Date(data.dueDate));
    } catch (e) {
      Alert.alert("Error", "Failed to load homework data");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------ HELPERS ------------------------------ */
  const validate = () => {
    if (!selectedClass) return "Please select class";
    if (!selectedSection) return "Please select section";
    if (!selectedSubject.trim()) return "Enter subject";
    if (!title.trim()) return "Enter title";
    if (!homeworkText.trim()) return "Enter homework details";
    return null;
  };

  const onDateChange = (_: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) setDateObj(date);
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

  /* ------------------------------ UPDATE ------------------------------ */
  const updateHomework = async () => {
    const error = validate();
    if (error) {
      Alert.alert("Validation Error", error);
      return;
    }

    try {
      setSaving(true);

      const token = await AsyncStorage.getItem("auth_token");
      const encodedTenant = await AsyncStorage.getItem("auth_tenant");
      const deviceId = await getDeviceId();

      if (!token || !encodedTenant) throw new Error("Auth missing");

      const tenantId = Buffer.from(encodedTenant, "base64").toString("utf-8");

      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", homeworkText);
      formData.append("subject", selectedSubject);
      formData.append("className", selectedClass.name || selectedClass);
      formData.append("homeworkDate", moment(new Date()).format("YYYY-MM-DD"));
      formData.append(
        "section",
        selectedSection.name?.charAt(0) || selectedSection
      );
      formData.append("dueDate", moment(dateObj).format("YYYY-MM-DD"));

      if (attachment) {
        formData.append("files", {
          uri: attachment.uri,
          name: attachment.name,
          type: attachment.type,
        } as any);
      }

      // const logFormData = (formData: FormData) => {
      //   const fd: any = formData;

      //   if (fd?._parts) {
      //     fd._parts.forEach((part: any[]) => {
      //       console.log("----",part[0], part[1]);
      //     });
      //   } else if (fd?.entries) {
      //     for (const pair of fd.entries()) {
      //       console.log("----",pair[0], pair[1]);
      //     }
      //   } else {
      //     console.log("Unable to log FormData");
      //   }
      // };

      // logFormData(formData);

      let response = await axios.post(
        `${API_BASE_URL}homework/updateHomeWork/${homeworkId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Tenant-ID": tenantId,
            "X-Device-ID": deviceId,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      // console.log("--response|",response);

      await AsyncStorage.removeItem(STORAGE_KEY);
      ToastService.show({
        type: "success",
        message: "Homework Update Successful",
        duration: 2500, contentContainerStyle: { flex: 1, }
      });
      router.replace("/staffDashboard/(tabs)/homework/homework");
    } catch (err: any) {
      console.log("error", err);

      Alert.alert("Update Failed", err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  /* ------------------------------ UI ------------------------------ */
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? "#0f172a" : "#f8fafc", }}>
      {/* HEADER */}
      <View style={styles.header}>
        <Ionicons
          name="arrow-back"
          size={28}
          onPress={() => router.back()}
          color={isDark ? "#fff" : "#000"}
        />
        <Text style={styles.headerTitle}>Update Homework</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.container}>
        <TouchableOpacity style={styles.dropdown} onPress={() => setClassModal(true)}>
          <Text style={{ color: isDark ? "#f1f5f9" : "#0f172a" }}>{selectedClass?.name || selectedClass}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.dropdown} onPress={() => setSectionModal(true)}>
          <Text style={{ color: isDark ? "#f1f5f9" : "#0f172a" }}>{selectedSection?.name || selectedSection}</Text>
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="Subject"
          value={selectedSubject}
          onChangeText={setSelectedSubject}
          placeholderTextColor={isDark ? "#fff" : "#64748b"}
        />

        <TextInput
          style={styles.input}
          placeholder="Title"
          value={title}
          onChangeText={setTitle}
          placeholderTextColor={isDark ? "#fff" : "#64748b"}
        />

        <TouchableOpacity
          style={styles.datePickerContainer}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={{ color: isDark ? "#f1f5f9" : "#0f172a" }}>Due Date: {moment(dateObj).format("YYYY-MM-DD")}</Text>
          <Ionicons name="calendar-outline" size={18} style={{ color: isDark ? "#f1f5f9" : "#0f172a" }} />
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={dateObj}
            mode="date"
            minimumDate={new Date()}
            onChange={onDateChange}
          />
        )}

        <TouchableOpacity onPress={uploadAttachment}>
          <Text style={styles.attachment}>
            {attachment ? `Attached: ${attachment.name}` : "Upload Attachment"}
          </Text>
        </TouchableOpacity>

        <TextInput
          style={styles.textArea}
          placeholder="Homework details..."
          multiline
          value={homeworkText}
          onChangeText={setHomeworkText}
          placeholderTextColor={isDark ? "#94a3b8" : "#64748b"}
        />

        <TouchableOpacity
          style={[styles.publishBtn, saving && { opacity: 0.6 }]}
          disabled={saving}
          onPress={updateHomework}
        >
          <Text style={styles.publishText}>
            {saving ? "Updating..." : "Update Homework"}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* MODALS */}
      <ModalDropdown
        visible={classModal}
        data={Array.from({ length: 10 }, (_, i) => ({ id: i + 1, name: `${i + 1}` }))}
        labelKey="name"
        onSelect={(item) => {
          setSelectedClass(item);
          setClassModal(false);
        }}
        onClose={() => setClassModal(false)}
      />

      <ModalDropdown
        visible={sectionModal}
        data={[
          { id: 1, name: "A" },
          { id: 2, name: "B" },
          { id: 3, name: "C" },
        ]}
        labelKey="name"
        onSelect={(item) => {
          setSelectedSection(item);
          setSectionModal(false);
        }}
        onClose={() => setSectionModal(false)}
      />
    </SafeAreaView>
  );
};

export default UpdateHomework;

/* ------------------------------ STYLES ------------------------------ */
const getStyles = (theme: any) => {
  const isDark = theme.mode === "dark";

  const colors = {
    light: {
      background: "#f8fafc",
      card: "#ffffff",
      textPrimary: "#0f172a",
      textSecondary: "#475569",
      border: "#e2e8f0",
      inputBg: "#ffffff",
      primary: "#2563eb",
    },
    dark: {
      background: "#0f172a",
      card: "#1e293b",
      textPrimary: "#f1f5f9",
      textSecondary: "#cbd5e1",
      border: "#334155",
      inputBg: "#1e293b",
      primary: "#3b82f6",
    },
  };

  const palette = isDark ? colors.dark : colors.light;

  return StyleSheet.create({
    container: {
      padding: 16,
    },

    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 16,
      borderBottomWidth: 1,
      borderColor: palette.border,
    },

    headerTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: palette.textPrimary,
    },

    input: {
      backgroundColor: palette.inputBg,
      borderWidth: 1,
      borderColor: palette.border,
      padding: 12,
      marginBottom: 12,
      borderRadius: 8,
      color: palette.textPrimary,
    },

    textArea: {
      backgroundColor: palette.inputBg,
      borderWidth: 1,
      borderColor: palette.border,
      padding: 12,
      height: 120,
      borderRadius: 8,
      color: palette.textPrimary,
    },

    dropdown: {
      backgroundColor: palette.inputBg,
      borderWidth: 1,
      borderColor: palette.border,
      padding: 12,
      marginBottom: 12,
      borderRadius: 8,
    },

    datePickerContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      backgroundColor: palette.inputBg,
      borderWidth: 1,
      borderColor: palette.border,
      padding: 12,
      marginBottom: 12,
      borderRadius: 8,
    },

    attachment: {
      marginVertical: 12,
      color: palette.primary,
      fontWeight: "600",
    },

    publishBtn: {
      backgroundColor: palette.primary,
      padding: 14,
      borderRadius: 8,
      alignItems: "center",
      marginTop: 16,
    },

    publishText: {
      color: "#fff",
      fontWeight: "600",
    },
  });
};

