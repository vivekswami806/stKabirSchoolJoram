import { ThemeContext } from "@/action/theme/ThemeContext";
import { Theme } from "@/action/theme/themeReducer";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as DocumentPicker from "expo-document-picker";
import moment from "moment";
import React, { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity
} from "react-native";
import { ToastService } from "react-native-toastier";
import ModalDropdown from "./modaldropdown";

type Props = {
  initialValues?: any;
  loading?: boolean;
  submitText: string;
  onSubmit: (data: any) => Promise<boolean | void>;
  resetKey?: number;
};

const HomeworkForm: React.FC<Props> = ({
  initialValues,
  loading,
  submitText,
  onSubmit,
  resetKey
}) => {
  /* ---------------- STATE ---------------- */
  const themeState = useContext(ThemeContext);
  if (!themeState) return null;

  const { theme } = themeState;
  const styles = getStyles(theme);
  const isDark = theme.mode === "dark";
  const [selectedClass, setSelectedClass] = useState<any>(
    initialValues?.className
      ? { name: initialValues.className }
      : null
  );
  const [selectedSection, setSelectedSection] = useState<any>(
    initialValues?.section
      ? { name: initialValues.section }
      : null
  );
  const [subject, setSubject] = useState(initialValues?.subject || "");
  const [title, setTitle] = useState(initialValues?.title || "");
  const [description, setDescription] = useState(
    initialValues?.description || ""
  );
  const [dateObj, setDateObj] = useState(
    initialValues?.dueDate ? new Date(initialValues.dueDate) : new Date()
  );
  const [attachment, setAttachment] = useState<any>(null);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [classModal, setClassModal] = useState(false);
  const [sectionModal, setSectionModal] = useState(false);
  //   const [resetKey, setResetKey] = useState(0);
  /* ---------------- HELPERS ---------------- */
  const validate = () => {
    if (!selectedClass) return "Select class";
    if (!selectedSection) return "Select section";
    if (!subject.trim()) return "Enter subject";
    if (!title.trim()) return "Enter title";
    if (!description.trim()) return "Enter description";
    return null;
  };

  const submit = () => {

    const error = validate();
    if (error) {
      ToastService.show({
        type: "danger",
        message: error,
        duration: 2500, contentContainerStyle: { flex: 1, }
      });
      return;
    }

    onSubmit({
      selectedClass,
      selectedSection,
      subject,
      title,
      description,
      dateObj,
      attachment,
    });
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
  useEffect(() => {
    if (!resetKey) return;
    setSelectedClass(null);
    setSelectedSection(null);
    setSubject("");
    setTitle("");
    setDescription("");
    setDateObj(new Date());
    setAttachment(null);
  }, [resetKey]);

  /* ---------------- UI ---------------- */
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: isDark ? "#111827" : "#F9FAFB" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, padding: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        <ScrollView contentContainerStyle={styles.container}>
          {/* CLASS */}
          <TouchableOpacity style={styles.dropdown} onPress={() => setClassModal(true)}>
            <Text style={{ color: isDark ? "#F9FAFB" : "#111827" }}>{selectedClass?.value || "Select Class"}</Text>
          </TouchableOpacity>

          {/* SECTION */}
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setSectionModal(true)}
          >
            <Text style={{ color: isDark ? "#F9FAFB" : "#111827" }}>{selectedSection?.name || "Select Section"}</Text>
          </TouchableOpacity>

          {/* SUBJECT */}
          <TextInput
            style={styles.input}
            placeholder="Subject"
            value={subject}
            onChangeText={setSubject}
            placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
          />

          {/* TITLE */}
          <TextInput
            style={styles.input}
            placeholder="Homework Title"
            value={title}
            placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
            onChangeText={setTitle}
          />

          {/* DATE */}
          <TouchableOpacity
            style={styles.datePicker}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={{ color: isDark ? "#F9FAFB" : "#111827" }}>Due Date: {moment(dateObj).format("YYYY-MM-DD")}</Text>
            <Ionicons name="calendar-outline" size={18} style={{ color: isDark ? "#F9FAFB" : "#111827" }} />
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={dateObj}
              mode="date"
              minimumDate={new Date()}
              onChange={(_, d) => {
                setShowDatePicker(false);
                if (d) setDateObj(d);
              }}
            />
          )}

          <TouchableOpacity onPress={uploadAttachment}>
            <Text style={styles.attachment}>
              {attachment ? `Attached: ${attachment.name}` : "Upload Attachment"}
            </Text>
          </TouchableOpacity>

          {attachment && (
            <TouchableOpacity onPress={() => setAttachment(null)}>
              <Text style={{ color: "red", marginBottom: 10 }}>
                Remove attachment
              </Text>
            </TouchableOpacity>
          )}

          {/* DESCRIPTION */}
          <TextInput
            style={styles.textArea}
            placeholder="Homework details..."
            multiline
            placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
            value={description}
            onChangeText={setDescription}
          />

          {/* SUBMIT */}
          <TouchableOpacity
            style={[
              styles.button,
              loading && styles.buttonDisabled
            ]}
            disabled={loading}
            onPress={submit}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>{submitText}</Text>
            )}
          </TouchableOpacity>

          {/* MODALS */}
          <ModalDropdown
            visible={classModal}
            data={[
              { id: 1, name: "nur", value: "Class Nur" },
              { id: 2, name: "lkg", value: "Class Lkg" },
              { id: 3, name: "ukg", value: "Class Ukg" },
              ...Array.from({ length: 10 }, (_, i) => ({
                id: i + 4,
                name: `${i + 1}`,
                value: `Class ${i + 1}`,
              })),
            ]}
            labelKey="value"
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
        </ScrollView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default HomeworkForm;

/* ---------------- STYLES ---------------- */
function getStyles(theme: Theme) {
  const isDark = theme.mode === "dark";

  const colors = {
    light: {
      background: "#F9FAFB",
      card: "#FFFFFF",
      text: "#111827",
      placeholder: "#6B7280",
      border: "#E5E7EB",
      inputBg: "#FFFFFF",
      primary: "#2563eb",
      danger: "#ef4444",
    },
    dark: {
      background: "#111827",
      card: "#1F2937",
      text: "#F9FAFB",
      placeholder: "#9CA3AF",
      border: "#374151",
      inputBg: "#1F2937",
      primary: "#3B82F6",
      danger: "#F87171",
    },
  };

  const palette = isDark ? colors.dark : colors.light;

  return StyleSheet.create({
    container: {
      padding: 0,
    },

    buttonDisabled: {
      opacity: 0.6,
    },

    input: {
      backgroundColor: palette.inputBg,
      borderWidth: 1,
      borderColor: palette.border,
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
      color: palette.text,
    },

    dropdown: {
      backgroundColor: palette.inputBg,
      borderWidth: 1,
      borderColor: palette.border,
      borderRadius: 8,
      padding: 14,
      marginBottom: 12,
    },

    datePicker: {
      flexDirection: "row",
      justifyContent: "space-between",
      backgroundColor: palette.inputBg,
      borderWidth: 1,
      borderColor: palette.border,
      padding: 14,
      borderRadius: 8,
      marginBottom: 12,
    },

    attachment: {
      color: palette.primary,
      marginBottom: 12,
    },

    textArea: {
      height: 130,
      backgroundColor: palette.inputBg,
      borderWidth: 1,
      borderColor: palette.border,
      borderRadius: 8,
      padding: 12,
      color: palette.text,
    },

    button: {
      backgroundColor: palette.primary,
      padding: 14,
      borderRadius: 8,
      alignItems: "center",
      marginTop: 16,
    },

    buttonText: {
      color: "#fff",
      fontWeight: "700",
    },
  });
}

