import { ThemeContext } from "@/action/theme/ThemeContext";
import { Theme } from "@/action/theme/themeReducer";
import {
  getPhoneSize,
  getResponsiveFontSize,
  getResponsivePadding,
  scaleFont,
  scaleH,
  scaleW,
} from "@/utils/responsivedesignsystem";
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
  TouchableOpacity,
  View,
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
  resetKey,
}) => {
  /* ---------------- STATE ---------------- */
  const themeState = useContext(ThemeContext);
  if (!themeState) return null;

  const { theme } = themeState;
  const styles = getStyles(theme);
  const isDark = theme.mode === "dark";

  const [selectedClass, setSelectedClass] = useState<any>(
    initialValues?.className ? { name: initialValues.className } : null
  );
  const [selectedSection, setSelectedSection] = useState<any>(
    initialValues?.section ? { name: initialValues.section } : null
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
        duration: 2500,
        contentContainerStyle: { flex: 1 },
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
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        <View style={styles.container}>
          {/* CLASS */}
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setClassModal(true)}
          >
            <Text style={styles.dropdownText}>
              {selectedClass?.value || "Select Class"}
            </Text>
          </TouchableOpacity>

          {/* SECTION */}
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setSectionModal(true)}
          >
            <Text style={styles.dropdownText}>
              {selectedSection?.name || "Select Section"}
            </Text>
          </TouchableOpacity>

          {/* SUBJECT */}
          <TextInput
            style={styles.input}
            placeholder="Subject"
            value={subject}
            onChangeText={setSubject}
            placeholderTextColor={theme.textSecondary}
          />

          {/* TITLE */}
          <TextInput
            style={styles.input}
            placeholder="Homework Title"
            value={title}
            placeholderTextColor={theme.textSecondary}
            onChangeText={setTitle}
          />

          {/* DATE */}
          <TouchableOpacity
            style={styles.datePicker}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateText}>
              Due Date: {moment(dateObj).format("YYYY-MM-DD")}
            </Text>
            <Ionicons
              name="calendar-outline"
              size={scaleFont(18)}
              style={styles.dateIcon}
            />
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

          {/* ATTACHMENT */}
          <TouchableOpacity onPress={uploadAttachment}>
            <Text style={styles.attachment}>
              {attachment
                ? `Attached: ${attachment.name}`
                : "Upload Attachment"}
            </Text>
          </TouchableOpacity>

          {attachment && (
            <TouchableOpacity onPress={() => setAttachment(null)}>
              <Text style={styles.removeAttachment}>
                Remove attachment
              </Text>
            </TouchableOpacity>
          )}

          {/* DESCRIPTION */}
          <TextInput
            style={styles.textArea}
            placeholder="Homework details..."
            multiline
            placeholderTextColor={theme.textSecondary}
            value={description}
            onChangeText={setDescription}
          />

          {/* SUBMIT */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
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
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default HomeworkForm;

/* ---------------- STYLES ---------------- */
function getStyles(theme: Theme) {
  const isDark = theme.mode === "dark";
  const padding = getResponsivePadding();
  const fonts = getResponsiveFontSize();
  const phoneSize = getPhoneSize();

  const palette = {
    inputBg: theme.background,
    border: theme.border,
    text: theme.text,
    primary: theme.primary,
  };

  return StyleSheet.create({
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: padding.md,
      paddingVertical: scaleH(16),
    },

    container: {
      padding: 0,
    },

    input: {
      backgroundColor: palette.inputBg,
      borderWidth: scaleW(1),
      borderColor: palette.border,
      borderRadius: scaleW(8),
      padding: padding.md,
      marginBottom: scaleH(12),
      color: palette.text,
      fontSize: fonts.body,
    },

    dropdown: {
      backgroundColor: palette.inputBg,
      borderWidth: scaleW(1),
      borderColor: palette.border,
      borderRadius: scaleW(8),
      padding: padding.md,
      marginBottom: scaleH(12),
      minHeight: scaleH(48),
      justifyContent: "center",
    },

    dropdownText: {
      color: palette.text,
      fontSize: fonts.body,
      fontWeight: "500",
    },

    datePicker: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: palette.inputBg,
      borderWidth: scaleW(1),
      borderColor: palette.border,
      padding: padding.md,
      borderRadius: scaleW(8),
      marginBottom: scaleH(12),
      minHeight: scaleH(48),
    },

    dateText: {
      color: palette.text,
      fontSize: fonts.body,
      fontWeight: "500",
      flex: 1,
    },

    dateIcon: {
      color: palette.text,
      marginLeft: padding.sm,
    },

    attachment: {
      color: palette.primary,
      marginBottom: scaleH(12),
      fontSize: fonts.small,
      fontWeight: "500",
    },

    removeAttachment: {
      color: "#ef4444",
      marginBottom: scaleH(12),
      fontSize: fonts.small,
      fontWeight: "500",
    },

    textArea: {
      minHeight: scaleH(130),
      backgroundColor: palette.inputBg,
      borderWidth: scaleW(1),
      borderColor: palette.border,
      borderRadius: scaleW(8),
      padding: padding.md,
      color: palette.text,
      fontSize: fonts.body,
      marginBottom: scaleH(12),
      textAlignVertical: "top",
    },

    button: {
      backgroundColor: palette.primary,
      padding: padding.md,
      borderRadius: scaleW(8),
      alignItems: "center",
      marginTop: scaleH(16),
      minHeight: scaleH(48),
      justifyContent: "center",
    },

    buttonDisabled: {
      opacity: 0.6,
    },

    buttonText: {
      color: "#fff",
      fontWeight: "700",
      fontSize: fonts.body,
    },
  });
}