// import { ThemeContext } from "@/action/theme/ThemeContext";
// import { Theme } from "@/action/theme/themeReducer";
// import {
//   getPhoneSize,
//   getResponsiveFontSize,
//   getResponsivePadding,
//   scaleFont,
//   scaleH,
//   scaleW,
// } from "@/utils/responsivedesignsystem";
// import { Ionicons } from "@expo/vector-icons";
// import DateTimePicker from "@react-native-community/datetimepicker";
// import * as DocumentPicker from "expo-document-picker";
// import moment from "moment";
// import React, { useContext, useEffect, useState } from "react";
// import {
//   ActivityIndicator,
//   Alert,
//   KeyboardAvoidingView,
//   Platform,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import { ToastService } from "react-native-toastier";
// import ModalDropdown from "./modaldropdown";

// type Props = {
//   initialValues?: any;
//   loading?: boolean;
//   submitText: string;
//   onSubmit: (data: any) => Promise<boolean | void>;
//   resetKey?: number;
// };

// const HomeworkForm: React.FC<Props> = ({
//   initialValues,
//   loading,
//   submitText,
//   onSubmit,
//   resetKey,
// }) => {
//   /* ---------------- STATE ---------------- */
//   const themeState = useContext(ThemeContext);
//   if (!themeState) return null;

//   const { theme } = themeState;
//   const styles = getStyles(theme);
//   const isDark = theme.mode === "dark";

//   const [selectedClass, setSelectedClass] = useState<any>(
//     initialValues?.className ? { name: initialValues.className } : null
//   );
//   const [selectedSection, setSelectedSection] = useState<any>(
//     initialValues?.section ? { name: initialValues.section } : null
//   );
//   const [subject, setSubject] = useState(initialValues?.subject || "");
//   const [title, setTitle] = useState(initialValues?.title || "");
//   const [description, setDescription] = useState(
//     initialValues?.description || ""
//   );
//   const [dateObj, setDateObj] = useState(
//     initialValues?.dueDate ? new Date(initialValues.dueDate) : new Date()
//   );
//   const [attachment, setAttachment] = useState<any>(null);

//   const [showDatePicker, setShowDatePicker] = useState(false);
//   const [classModal, setClassModal] = useState(false);
//   const [sectionModal, setSectionModal] = useState(false);

//   /* ---------------- HELPERS ---------------- */
//   const validate = () => {
//     if (!selectedClass) return "Select class";
//     if (!selectedSection) return "Select section";
//     if (!subject.trim()) return "Enter subject";
//     if (!title.trim()) return "Enter title";
//     if (!description.trim()) return "Enter description";
//     return null;
//   };

//   const submit = () => {
//     const error = validate();
//     if (error) {
//       ToastService.show({
//         type: "danger",
//         message: error,
//         duration: 2500,
//         contentContainerStyle: { flex: 1 },
//       });
//       return;
//     }

//     onSubmit({
//       selectedClass,
//       selectedSection,
//       subject,
//       title,
//       description,
//       dateObj,
//       attachment,
//     });
//   };

//   const uploadAttachment = async () => {
//     try {
//       const result = await DocumentPicker.getDocumentAsync({
//         type: "*/*",
//         copyToCacheDirectory: true,
//         multiple: false,
//       });

//       if (result.canceled) return;

//       const asset = result.assets[0];

//       const normalizedFile = {
//         uri: asset.uri,
//         name: asset.name,
//         type: asset.mimeType || "application/octet-stream",
//       };

//       setAttachment(normalizedFile);
//       Alert.alert("Success", "File attached successfully ✔");
//     } catch (error) {
//       console.error(error);
//       Alert.alert("Error", "Failed to pick file");
//     }
//   };

//   useEffect(() => {
//     if (!resetKey) return;
//     setSelectedClass(null);
//     setSelectedSection(null);
//     setSubject("");
//     setTitle("");
//     setDescription("");
//     setDateObj(new Date());
//     setAttachment(null);
//   }, [resetKey]);

//   /* ---------------- UI ---------------- */
//   return (
//     <KeyboardAvoidingView
//       style={{ flex: 1, backgroundColor: theme.background }}
//       behavior={Platform.OS === "ios" ? "padding" : "height"}
//       keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
//     >
//       <ScrollView
//         contentContainerStyle={styles.scrollContent}
//         keyboardShouldPersistTaps="handled"
//         bounces={false}
//       >
//         <View style={styles.container}>
//           {/* CLASS */}
//           <TouchableOpacity
//             style={styles.dropdown}
//             onPress={() => setClassModal(true)}
//           >
//             <Text style={styles.dropdownText}>
//               {selectedClass?.value || "Select Class"}
//             </Text>
//           </TouchableOpacity>

//           {/* SECTION */}
//           <TouchableOpacity
//             style={styles.dropdown}
//             onPress={() => setSectionModal(true)}
//           >
//             <Text style={styles.dropdownText}>
//               {selectedSection?.name || "Select Section"}
//             </Text>
//           </TouchableOpacity>

//           {/* SUBJECT */}
//           <TextInput
//             style={styles.input}
//             placeholder="Subject"
//             value={subject}
//             onChangeText={setSubject}
//             placeholderTextColor={theme.textSecondary}
//           />

//           {/* TITLE */}
//           <TextInput
//             style={styles.input}
//             placeholder="Homework Title"
//             value={title}
//             placeholderTextColor={theme.textSecondary}
//             onChangeText={setTitle}
//           />

//           {/* DATE */}
//           <TouchableOpacity
//             style={styles.datePicker}
//             onPress={() => setShowDatePicker(true)}
//           >
//             <Text style={styles.dateText}>
//               Due Date: {moment(dateObj).format("YYYY-MM-DD")}
//             </Text>
//             <Ionicons
//               name="calendar-outline"
//               size={scaleFont(18)}
//               style={styles.dateIcon}
//             />
//           </TouchableOpacity>

//           {showDatePicker && (
//             <DateTimePicker
//               value={dateObj}
//               mode="date"
//               minimumDate={new Date()}
//               onChange={(_, d) => {
//                 setShowDatePicker(false);
//                 if (d) setDateObj(d);
//               }}
//             />
//           )}

//           {/* ATTACHMENT */}
//           <TouchableOpacity onPress={uploadAttachment}>
//             <Text style={styles.attachment}>
//               {attachment
//                 ? `Attached: ${attachment.name}`
//                 : "Upload Attachment"}
//             </Text>
//           </TouchableOpacity>

//           {attachment && (
//             <TouchableOpacity onPress={() => setAttachment(null)}>
//               <Text style={styles.removeAttachment}>
//                 Remove attachment
//               </Text>
//             </TouchableOpacity>
//           )}

//           {/* DESCRIPTION */}
//           <TextInput
//             style={styles.textArea}
//             placeholder="Homework details..."
//             multiline
//             placeholderTextColor={theme.textSecondary}
//             value={description}
//             onChangeText={setDescription}
//           />

//           {/* SUBMIT */}
//           <TouchableOpacity
//             style={[styles.button, loading && styles.buttonDisabled]}
//             disabled={loading}
//             onPress={submit}
//           >
//             {loading ? (
//               <ActivityIndicator color="#fff" />
//             ) : (
//               <Text style={styles.buttonText}>{submitText}</Text>
//             )}
//           </TouchableOpacity>

//           {/* MODALS */}
//           <ModalDropdown
//             visible={classModal}
//             data={[
//               { id: 1, name: "nur", value: "Class Nur" },
//               { id: 2, name: "lkg", value: "Class Lkg" },
//               { id: 3, name: "ukg", value: "Class Ukg" },
//               ...Array.from({ length: 10 }, (_, i) => ({
//                 id: i + 4,
//                 name: `${i + 1}`,
//                 value: `Class ${i + 1}`,
//               })),
//             ]}
//             labelKey="value"
//             onSelect={(item) => {
//               setSelectedClass(item);
//               setClassModal(false);
//             }}
//             onClose={() => setClassModal(false)}
//           />

//           <ModalDropdown
//             visible={sectionModal}
//             data={[
//               { id: 1, name: "A" },
//               { id: 2, name: "B" },
//               { id: 3, name: "C" },
//             ]}
//             labelKey="name"
//             onSelect={(item) => {
//               setSelectedSection(item);
//               setSectionModal(false);
//             }}
//             onClose={() => setSectionModal(false)}
//           />
//         </View>
//       </ScrollView>
//     </KeyboardAvoidingView>
//   );
// };

// export default HomeworkForm;

// /* ---------------- STYLES ---------------- */
// function getStyles(theme: Theme) {
//   const isDark = theme.mode === "dark";
//   const padding = getResponsivePadding();
//   const fonts = getResponsiveFontSize();
//   const phoneSize = getPhoneSize();

//   const palette = {
//     inputBg: theme.background,
//     border: theme.border,
//     text: theme.text,
//     primary: theme.primary,
//   };

//   return StyleSheet.create({
//     scrollContent: {
//       flexGrow: 1,
//       paddingHorizontal: padding.md,
//       paddingVertical: scaleH(16),
//     },

//     container: {
//       padding: 0,
//     },

//     input: {
//       backgroundColor: palette.inputBg,
//       borderWidth: scaleW(1),
//       borderColor: palette.border,
//       borderRadius: scaleW(8),
//       padding: padding.md,
//       marginBottom: scaleH(12),
//       color: palette.text,
//       fontSize: fonts.body,
//     },

//     dropdown: {
//       backgroundColor: palette.inputBg,
//       borderWidth: scaleW(1),
//       borderColor: palette.border,
//       borderRadius: scaleW(8),
//       padding: padding.md,
//       marginBottom: scaleH(12),
//       minHeight: scaleH(48),
//       justifyContent: "center",
//     },

//     dropdownText: {
//       color: palette.text,
//       fontSize: fonts.body,
//       fontWeight: "500",
//     },

//     datePicker: {
//       flexDirection: "row",
//       justifyContent: "space-between",
//       alignItems: "center",
//       backgroundColor: palette.inputBg,
//       borderWidth: scaleW(1),
//       borderColor: palette.border,
//       padding: padding.md,
//       borderRadius: scaleW(8),
//       marginBottom: scaleH(12),
//       minHeight: scaleH(48),
//     },

//     dateText: {
//       color: palette.text,
//       fontSize: fonts.body,
//       fontWeight: "500",
//       flex: 1,
//     },

//     dateIcon: {
//       color: palette.text,
//       marginLeft: padding.sm,
//     },

//     attachment: {
//       color: palette.primary,
//       marginBottom: scaleH(12),
//       fontSize: fonts.small,
//       fontWeight: "500",
//     },

//     removeAttachment: {
//       color: "#ef4444",
//       marginBottom: scaleH(12),
//       fontSize: fonts.small,
//       fontWeight: "500",
//     },

//     textArea: {
//       minHeight: scaleH(130),
//       backgroundColor: palette.inputBg,
//       borderWidth: scaleW(1),
//       borderColor: palette.border,
//       borderRadius: scaleW(8),
//       padding: padding.md,
//       color: palette.text,
//       fontSize: fonts.body,
//       marginBottom: scaleH(12),
//       textAlignVertical: "top",
//     },

//     button: {
//       backgroundColor: palette.primary,
//       padding: padding.md,
//       borderRadius: scaleW(8),
//       alignItems: "center",
//       marginTop: scaleH(16),
//       minHeight: scaleH(48),
//       justifyContent: "center",
//     },

//     buttonDisabled: {
//       opacity: 0.6,
//     },

//     buttonText: {
//       color: "#fff",
//       fontWeight: "700",
//       fontSize: fonts.body,
//     },
//   });
// }


// HomeworkForm.tsx
import { ThemeContext } from "@/action/theme/ThemeContext";
import { Theme } from "@/action/theme/themeReducer";
import { classes, sections } from "@/config";
import {
  getResponsiveFontSize,
  getResponsivePadding,
  scaleH,
  scaleW,
} from "@/utils/responsivedesignsystem";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as DocumentPicker from "expo-document-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import moment from "moment";
import React, { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ToastService } from "react-native-toastier";

const MAX_FILE_SIZE_MB = 1;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/jpg", "image/webp"];

type Props = {
  initialValues?: any;
  loading?: boolean;
  submitText: string;
  onSubmit: (data: any) => Promise<boolean | void>;
  resetKey?: number;
};
const getSafeDate = (dateStr?: string): Date => {
  if (!dateStr) return new Date();
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
};
const HomeworkForm: React.FC<Props> = ({
  initialValues,
  loading,
  submitText,
  onSubmit,
  resetKey,
}) => {
  const themeState = useContext(ThemeContext);
  if (!themeState) return null;
  const { theme } = themeState;
  const styles = getStyles(theme);

  const [selectedClass, setSelectedClass] = useState<any>(
    initialValues?.className
      ? classes.find((c) => c.value === initialValues.className)
      || classes.find((c) => c.label === initialValues.className) // ✅ fallback
      || null
      : null
  );

  const [selectedSection, setSelectedSection] = useState<any>(
    initialValues?.section
      ? sections.find((s) => s.value === initialValues.section)
      || sections.find((s) => s.label === initialValues.section) // ✅ fallback
      || null
      : null
  );
  const [subject, setSubject] = useState(initialValues?.subject || "");
  const [title, setTitle] = useState(initialValues?.title || "");
  const [description, setDescription] = useState(initialValues?.description || "");
  const [dateObj, setDateObj] = useState<Date>(getSafeDate(initialValues?.dueDate));
  const [attachment, setAttachment] = useState<any>(null);
  const [attachmentSize, setAttachmentSize] = useState<string>("");
  const [compressing, setCompressing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [classModal, setClassModal] = useState(false);
  const [sectionModal, setSectionModal] = useState(false);

  const validate = () => {
    if (!selectedClass) return "Please select a class";
    if (!selectedSection) return "Please select a section";
    if (!subject.trim()) return "Please enter subject";
    if (!title.trim()) return "Please enter title";
    if (!description.trim()) return "Please enter description";
    return null;
  };

  const submit = () => {
    const error = validate();
    if (error) {
      ToastService.show({ type: "danger", message: error, duration: 2500, contentContainerStyle: { flex: 1 } });
      return;
    }
    onSubmit({ selectedClass, selectedSection, subject, title, description, dateObj, attachment });
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const compressImage = async (uri: string, originalName: string) => {
    setCompressing(true);
    try {
      let compressed = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1200 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      const res1 = await fetch(compressed.uri);
      const blob1 = await res1.blob();

      if (blob1.size > MAX_FILE_SIZE_BYTES) {
        compressed = await ImageManipulator.manipulateAsync(
          uri,
          [{ resize: { width: 800 } }],
          { compress: 0.4, format: ImageManipulator.SaveFormat.JPEG }
        );
        const res2 = await fetch(compressed.uri);
        const blob2 = await res2.blob();

        if (blob2.size > MAX_FILE_SIZE_BYTES) {
          ToastService.show({ type: "danger", message: "Image too large even after compression. Max 1MB.", duration: 3000, contentContainerStyle: { flex: 1 } });
          return null;
        }
        return { file: { uri: compressed.uri, name: originalName.replace(/\.\w+$/, ".jpg"), type: "image/jpeg" }, size: formatBytes(blob2.size) };
      }

      return { file: { uri: compressed.uri, name: originalName.replace(/\.\w+$/, ".jpg"), type: "image/jpeg" }, size: formatBytes(blob1.size) };
    } finally {
      setCompressing(false);
    }
  };

  const openCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        ToastService.show({ type: "danger", message: "Camera permission denied", duration: 2500, contentContainerStyle: { flex: 1 } });
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      const fileName = `photo_${Date.now()}.jpg`;

      const compressed = await compressImage(asset.uri, fileName);
      if (!compressed) return;

      setAttachment(compressed.file);
      setAttachmentSize(compressed.size);
      ToastService.show({ type: "success", message: "Photo captured and compressed", duration: 2500, contentContainerStyle: { flex: 1 } });
    } catch (error) {
      console.error(error);
      ToastService.show({ type: "danger", message: "Failed to open camera", duration: 2500, contentContainerStyle: { flex: 1 } });
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
      const mimeType = asset.mimeType || "application/octet-stream";
      const isImage = IMAGE_TYPES.includes(mimeType);

      if (isImage) {
        const compressed = await compressImage(asset.uri, asset.name);
        if (!compressed) return;
        setAttachment(compressed.file);
        setAttachmentSize(compressed.size);
        ToastService.show({ type: "success", message: "Image compressed and attached", duration: 2500, contentContainerStyle: { flex: 1 } });
      } else {
        const fileSize = asset.size ?? 0;
        if (fileSize > MAX_FILE_SIZE_BYTES) {
          ToastService.show({ type: "danger", message: `File too large. Max ${MAX_FILE_SIZE_MB}MB. Current: ${formatBytes(fileSize)}`, duration: 3500, contentContainerStyle: { flex: 1 } });
          return;
        }
        setAttachment({ uri: asset.uri, name: asset.name, type: mimeType });
        setAttachmentSize(formatBytes(fileSize));
        ToastService.show({ type: "success", message: "File attached successfully", duration: 2500, contentContainerStyle: { flex: 1 } });
      }
    } catch (error) {
      console.error(error);
      ToastService.show({ type: "danger", message: "Failed to pick file", duration: 2500, contentContainerStyle: { flex: 1 } });
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
    setAttachmentSize("");
  }, [resetKey]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Class & Section Row ── */}
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.pickerBtn, { flex: 1, marginRight: 8 }]}
            onPress={() => setClassModal(true)}
          >
            <Ionicons name="school-outline" size={16} color={selectedClass ? "#4C8EF7" : "#9CA3AF"} />
            <Text style={[styles.pickerText, { color: selectedClass ? theme.text : "#9CA3AF" }]} numberOfLines={1}>
              {selectedClass ? selectedClass.label : "Select Class"}
            </Text>
            <Ionicons name="chevron-down" size={14} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.pickerBtn, { flex: 1, marginLeft: 8 }]}
            onPress={() => setSectionModal(true)}
          >
            <Ionicons name="layers-outline" size={16} color={selectedSection ? "#4C8EF7" : "#9CA3AF"} />
            <Text style={[styles.pickerText, { color: selectedSection ? theme.text : "#9CA3AF" }]} numberOfLines={1}>
              {selectedSection ? selectedSection.label : "Select Section"}
            </Text>
            <Ionicons name="chevron-down" size={14} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* ── Subject ── */}
        <View style={styles.inputWrapper}>
          <Ionicons name="library-outline" size={17} color="#9CA3AF" style={styles.inputIcon} />
          <TextInput
            style={styles.inputWithIcon}
            placeholder="Subject"
            value={subject}
            onChangeText={setSubject}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* ── Title ── */}
        <View style={styles.inputWrapper}>
          <Ionicons name="create-outline" size={17} color="#9CA3AF" style={styles.inputIcon} />
          <TextInput
            style={styles.inputWithIcon}
            placeholder="Homework Title"
            value={title}
            onChangeText={setTitle}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* ── Due Date ── */}
        <TouchableOpacity style={styles.dateCard} onPress={() => setShowDatePicker(true)}>
          <View style={styles.dateIconWrap}>
            <Ionicons name="calendar-outline" size={18} color="#4C8EF7" />
          </View>
          <View>
            <Text style={styles.dateMeta}>Due Date</Text>
            <Text style={[styles.dateValue, { color: theme.text }]}>
              {dateObj && !isNaN(dateObj.getTime())
                ? moment(dateObj).format("DD MMM YYYY")
                : "Select date"}
            </Text>
          </View>
          <View style={{ flex: 1 }} />
          <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={dateObj instanceof Date && !isNaN(dateObj.getTime()) ? dateObj : new Date()}
            mode="date"
            minimumDate={new Date()}
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(_, d) => {
              setShowDatePicker(false);
              if (d && !isNaN(d.getTime())) setDateObj(d);
            }}
          />
        )}

        {/* ── Description ── */}
        <TextInput
          style={styles.textarea}
          placeholder="Homework details..."
          multiline
          numberOfLines={5}
          placeholderTextColor="#9CA3AF"
          value={description}
          onChangeText={setDescription}
          textAlignVertical="top"
        />

        {/* ── Attachment ── */}
        {/* ── Attachment ── */}
        <Text style={[styles.attachSectionLabel, { color: theme.text }]}>
          {"Attachment "}
          <Text style={{ color: "#9CA3AF", fontWeight: "400" }}>(optional)</Text>
        </Text>

        {/* Action buttons row */}
        {!attachment && (
          <View style={styles.attachOptionsRow}>
            <TouchableOpacity
              style={[styles.attachOptionBtn, { flex: 1, marginRight: 8 }]}
              onPress={openCamera}
              disabled={compressing}
            >
              <Ionicons name="camera-outline" size={22} color="#4C8EF7" />
              <Text style={styles.attachOptionText}>Camera</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.attachOptionBtn, { flex: 1, marginLeft: 8 }]}
              onPress={uploadAttachment}
              disabled={compressing}
            >
              <Ionicons name="folder-outline" size={22} color="#4C8EF7" />
              <Text style={styles.attachOptionText}>Browse</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Attached file preview */}
        {(attachment || compressing) && (
          <View style={[styles.attachPreview, compressing && { borderColor: "#4C8EF7" }]}>
            {compressing ? (
              <>
                <ActivityIndicator size="small" color="#4C8EF7" />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[styles.attachLabel, { color: "#4C8EF7" }]}>Compressing...</Text>
                  <Text style={styles.attachMeta}>Please wait</Text>
                </View>
              </>
            ) : (
              <>
                <Ionicons name="document-attach" size={22} color="#4C8EF7" />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.attachLabel} numberOfLines={1} ellipsizeMode="middle">
                    {attachment.name}
                  </Text>
                  <Text style={styles.attachMeta}>{attachmentSize}{" \u2022 "}{attachment.type?.startsWith("image") ? "Image" : "File"}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => { setAttachment(null); setAttachmentSize(""); }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle" size={20} color="#EF4444" />
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {/* ── Submit ── */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && { opacity: 0.6 }]}
          disabled={!!loading}
          onPress={submit}
        >
          {loading ? (
            <View style={styles.submitRow}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.submitText}>Please wait...</Text>
            </View>
          ) : (
            <View style={styles.submitRow}>
              <Ionicons name="send" size={16} color="#fff" />
              <Text style={styles.submitText}>{submitText}</Text>
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* ── Class Modal ── */}
      <Modal visible={classModal} transparent animationType="slide" onRequestClose={() => setClassModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setClassModal(false)} />
        <View style={[styles.modalSheet, { backgroundColor: theme.background }]}>
          <View style={styles.modalHandle} />
          <Text style={[styles.modalTitle, { color: theme.text }]}>Select Class</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {classes.map((c) => (
              <TouchableOpacity
                key={c.value}
                style={[styles.modalOption, selectedClass?.value === c.value && styles.modalOptionActive]}
                onPress={() => { setSelectedClass(c); setClassModal(false); }}
              >
                <Text style={[styles.modalOptionText, { color: selectedClass?.value === c.value ? "#4C8EF7" : theme.text }]}>
                  {c.label}
                </Text>
                {selectedClass?.value === c.value && <Ionicons name="checkmark" size={16} color="#4C8EF7" />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* ── Section Modal ── */}
      <Modal visible={sectionModal} transparent animationType="slide" onRequestClose={() => setSectionModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setSectionModal(false)} />
        <View style={[styles.modalSheet, { backgroundColor: theme.background }]}>
          <View style={styles.modalHandle} />
          <Text style={[styles.modalTitle, { color: theme.text }]}>Select Section</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {sections.map((s) => (
              <TouchableOpacity
                key={s.value}
                style={[styles.modalOption, selectedSection?.value === s.value && styles.modalOptionActive]}
                onPress={() => { setSelectedSection(s); setSectionModal(false); }}
              >
                <Text style={[styles.modalOptionText, { color: selectedSection?.value === s.value ? "#4C8EF7" : theme.text }]}>
                  {s.label}
                </Text>
                {selectedSection?.value === s.value && <Ionicons name="checkmark" size={16} color="#4C8EF7" />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

export default HomeworkForm;

function getStyles(theme: Theme) {
  const padding = getResponsivePadding();
  const fonts = getResponsiveFontSize();

  return StyleSheet.create({
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: padding.md,
      paddingVertical: scaleH(16),
      paddingBottom: scaleH(40),
    },
    row: {
      flexDirection: "row",
      marginBottom: scaleH(12),
    },
    pickerBtn: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: scaleW(10),
      paddingVertical: scaleH(12),
      paddingHorizontal: scaleW(12),
      backgroundColor: theme.background,
    },
    pickerText: {
      flex: 1,
      fontSize: fonts.body,
      fontWeight: "500",
      marginLeft: scaleW(6),
    },
    inputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: scaleW(10),
      paddingHorizontal: scaleW(12),
      backgroundColor: theme.background,
      marginBottom: scaleH(12),
    },
    inputIcon: {
      marginRight: scaleW(8),
    },
    inputWithIcon: {
      flex: 1,
      paddingVertical: scaleH(13),
      color: theme.text,
      fontSize: fonts.body,
    },
    dateCard: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: scaleW(10),
      padding: scaleH(12),
      marginBottom: scaleH(12),
      backgroundColor: theme.background,
    },
    dateIconWrap: {
      width: scaleW(36),
      height: scaleW(36),
      borderRadius: scaleW(18),
      backgroundColor: "#EFF6FF",
      alignItems: "center",
      justifyContent: "center",
      marginRight: scaleW(10),
    },
    dateMeta: {
      fontSize: fonts.small,
      color: "#9CA3AF",
      fontWeight: "500",
    },
    dateValue: {
      fontSize: fonts.body,
      fontWeight: "600",
      marginTop: 2,
    },
    textarea: {
      minHeight: scaleH(120),
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: scaleW(10),
      padding: scaleH(12),
      color: theme.text,
      fontSize: fonts.body,
      marginBottom: scaleH(12),
      backgroundColor: theme.background,
    },
    attachBtn: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1.5,
      borderColor: theme.border,
      borderRadius: scaleW(10),
      borderStyle: "dashed",
      padding: scaleH(14),
      marginBottom: scaleH(12),
    },
    attachBtnActive: {
      borderColor: "#4C8EF7",
      borderStyle: "solid",
      backgroundColor: "#EFF6FF",
    },
    submitBtn: {
      backgroundColor: theme.primary,
      padding: scaleH(15),
      borderRadius: scaleW(10),
      alignItems: "center",
      marginTop: scaleH(8),
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    submitRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    submitText: {
      color: "#fff",
      fontWeight: "700",
      fontSize: fonts.body,
      marginLeft: scaleW(8),
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.4)",
    },
    modalSheet: {
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: scaleH(20),
      maxHeight: "60%",
      elevation: 10,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
    },
    modalHandle: {
      width: 40,
      height: 4,
      backgroundColor: "#E5E7EB",
      borderRadius: 2,
      alignSelf: "center",
      marginBottom: scaleH(16),
    },
    modalTitle: {
      fontSize: fonts.h3,
      fontWeight: "700",
      marginBottom: scaleH(12),
    },
    modalOption: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: scaleH(13),
      paddingHorizontal: scaleW(4),
      borderBottomWidth: 1,
      borderBottomColor: "#F3F4F6",
    },
    modalOptionActive: {
      borderBottomColor: "#BFDBFE",
    },
    modalOptionText: {
      fontSize: fonts.body,
      fontWeight: "500",
    },
    attachSectionLabel: {
      fontSize: fonts.body,
      fontWeight: "600",
      marginBottom: scaleH(8),
    },
    attachOptionsRow: {
      flexDirection: "row",
      marginBottom: scaleH(12),
    },
    attachOptionBtn: {
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1.5,
      borderColor: "#BFDBFE",
      borderRadius: scaleW(10),
      borderStyle: "dashed",
      paddingVertical: scaleH(16),
      backgroundColor: "#EFF6FF",
    },
    attachOptionText: {
      fontSize: fonts.small,
      color: "#4C8EF7",
      fontWeight: "600",
      marginTop: scaleH(4),
    },
    attachPreview: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1.5,
      borderColor: "#4C8EF7",
      borderRadius: scaleW(10),
      padding: scaleH(14),
      marginBottom: scaleH(12),
      backgroundColor: "#EFF6FF",
    },
    attachLabel: {
      fontSize: fonts.body,
      fontWeight: "600",
      color: theme.text,
    },
    attachMeta: {
      fontSize: fonts.small,
      color: "#9CA3AF",
      marginTop: 2,
    },
  });
}