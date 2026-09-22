import { ThemeContext } from "@/action/theme/ThemeContext";
import { Theme } from "@/action/theme/themeReducer";
import { API_BASE_URL, classes, sections } from "@/config";
import { getDeviceId } from "@/helper/getDeviceId";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import axios from "axios";
import { Buffer } from "buffer";
import * as DocumentPicker from "expo-document-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import moment from "moment";
import React, { useContext, useEffect, useState } from "react";
import {
  Alert,
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

export type TargetType = "ALL" | "STAFF" | "STUDENT" | "ALL_STUDENTS";

export type NoticeType =
  | "NOTICE"
  | "EVENT"
  | "GENERAL"
  | "IMPORTANT"
  | "EXAM"
  | "HOLIDAY";

type PickedFile = {
  uri: string;
  name: string;
  type: string;
};

const NOTICE_TYPE_CONFIG: {
  value: NoticeType;
  label: string;
  icon: string;
  color: string;
  bg: string;
}[] = [
  { value: "GENERAL", label: "General", icon: "document-text", color: "#6366F1", bg: "#EEF2FF" },
  { value: "NOTICE", label: "Notice", icon: "megaphone", color: "#0EA5E9", bg: "#E0F2FE" },
  { value: "EVENT", label: "Event", icon: "calendar", color: "#F59E0B", bg: "#FEF3C7" },
  { value: "IMPORTANT", label: "Important", icon: "alert-circle", color: "#EF4444", bg: "#FEE2E2" },
  { value: "EXAM", label: "Exam", icon: "school", color: "#8B5CF6", bg: "#F5F3FF" },
  { value: "HOLIDAY", label: "Holiday", icon: "sunny", color: "#10B981", bg: "#D1FAE5" },
];

const TARGET_CONFIG: { value: TargetType; label: string; icon: string }[] = [
  { value: "ALL", label: "All", icon: "people" },
  { value: "STAFF", label: "Staff", icon: "briefcase" },
  { value: "ALL_STUDENTS", label: "All Students", icon: "school" },
  { value: "STUDENT", label: "By Class", icon: "person" },
];

export default function UpdateNoticeScreen() {
  const router = useRouter();
  const themeState = useContext(ThemeContext);
  if (!themeState) return null;
  const { theme } = themeState;
  const styles = getStyles(theme);
  const { notice } = useLocalSearchParams();
  const noticeData = notice ? JSON.parse(notice as string) : null;
  const id = noticeData?.id;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [noticeDate, setNoticeDate] = useState<Date | null>(null);
  const [expireDate, setExpireDate] = useState<Date | null>(null);
  const [selectTargetType, setSelectTargetType] = useState<TargetType>("ALL");
  const [selectNoticeType, setSelectNoticeType] = useState<NoticeType>("GENERAL");
  const [className, setClassName] = useState("");
  const [section, setSection] = useState("");
  const [attachment, setAttachment] = useState<PickedFile | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [activePicker, setActivePicker] = useState<"NOTICE" | "EXPIRE" | null>(null);
  const [showClassModal, setShowClassModal] = useState(false);
  const [showSectionModal, setShowSectionModal] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  useEffect(() => {
    if (!noticeData) {
      Alert.alert("Error", "Invalid notice");
      router.back();
      return;
    }
  
    setTitle(noticeData.title || "");
    setDescription(noticeData.description || "");
    setSelectTargetType((noticeData.targetType as TargetType) || "ALL");
    setSelectNoticeType((noticeData.noticeType as NoticeType) || "GENERAL");
    setClassName(noticeData.className || "");
    setSection(noticeData.section || "");
    if (noticeData.startingDate) { setNoticeDate(new Date(noticeData.startingDate))};
    if (noticeData.expiryDate) { setExpireDate(new Date(noticeData.expiryDate))}
    // if (noticeData.attachments?.length) {console.log(noticeData.attachments);}
  }, []);

  const onDateChange = (_: any, selectedDate?: Date) => {
    setShowPicker(false);
    if (!selectedDate || !activePicker) return;

    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);

    if (selected < today) {
      ToastService.show({ type: "info", message: "You cannot select a past date", duration: 3000, contentContainerStyle: { flex: 1 } });
      return;
    }

    if (activePicker === "NOTICE") {
      setNoticeDate(selected);
    } else {
      setExpireDate(selected);
    }
    setActivePicker(null);
  };

  const submitNotice = async () => {
    if (loading) return;

    if (!title.trim()) {
      ToastService.show({ type: "info", message: "Please enter notice title", duration: 1500, contentContainerStyle: { flex: 1 } });
      return;
    }
    if (!description.trim()) {
      ToastService.show({ type: "info", message: "Please enter notice description", duration: 1500, contentContainerStyle: { flex: 1 } });
      return;
    }
    if (!noticeDate || !expireDate) {
      ToastService.show({ type: "info", message: "Please select both notice and expiry dates", duration: 1500, contentContainerStyle: { flex: 1 } });
      return;
    }
    if (expireDate < noticeDate) {
      ToastService.show({ type: "info", message: "Expiry date must be after notice date", duration: 1500, contentContainerStyle: { flex: 1 } });
      return;
    }
    if (selectTargetType === "STUDENT" && !className) {
      ToastService.show({ type: "info", message: "Please select a class", duration: 1500, contentContainerStyle: { flex: 1 } });
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("auth_token");
      const encodedTenant = await AsyncStorage.getItem("auth_tenant");
      if (!token || !encodedTenant) throw new Error("Authentication missing");
      const tenantId = Buffer.from(encodedTenant, "base64").toString("utf-8");

      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("targetType", selectTargetType);
      formData.append("noticeType", selectNoticeType);
      formData.append("startingDate", moment(noticeDate!).format("YYYY-MM-DD"));
      formData.append("expiryDate", moment(expireDate!).format("YYYY-MM-DD"));
      formData.append("className", selectTargetType === "STUDENT" ? className : "");
      formData.append("section", selectTargetType === "STUDENT" ? section : "");

      if (attachment) {
        formData.append("files", {
          uri: attachment.uri,
          name: attachment.name,
          type: attachment.type,
        } as any);
      }

      await axios.post(`${API_BASE_URL}notice/updateNotice/${id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Tenant-ID": tenantId,
          "X-Device-ID": await getDeviceId(),
          "Content-Type": "multipart/form-data",
        },
      });

      ToastService.show({ type: "info", message: "Notice updated successfully", duration: 3000, contentContainerStyle: { flex: 1 } });
      router.replace("/dashboard/(tabs)/notice");
    } catch (error: any) {
      ToastService.show({ type: "info", message: error?.response?.data?.message || "Failed to update notice", duration: 3000, contentContainerStyle: { flex: 1 } });
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
      setAttachment({ uri: asset.uri, name: asset.name, type: asset.mimeType || "application/octet-stream" });
      ToastService.show({ type: "info", message: "File attached successfully", duration: 1500, contentContainerStyle: { flex: 1 } });
    } catch {
      ToastService.show({ type: "info", message: "Failed to pick file", duration: 1000, contentContainerStyle: { flex: 1 } });
    }
  };

  const isFormValid = title.trim() && description.trim() && noticeDate && expireDate && !loading;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>

        {/* -- Header -- */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={theme.text} />
          </TouchableOpacity>
          <Text style={styles.headerText}>Update Notice</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* -- Notice Type -- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notice Type</Text>
          <View style={styles.noticeTypeGrid}>
            {NOTICE_TYPE_CONFIG.map((item) => {
              const active = selectNoticeType === item.value;
              return (
                <TouchableOpacity
                  key={item.value}
                  onPress={() => setSelectNoticeType(item.value)}
                  style={[
                    styles.noticeTypeCard,
                    { borderColor: active ? item.color : theme.border, backgroundColor: active ? item.bg : theme.background },
                  ]}
                >
                  <View style={[styles.noticeTypeIconWrap, { backgroundColor: active ? item.color : "#E5E7EB" }]}>
                    <Ionicons name={item.icon as any} size={16} color={active ? "#fff" : "#6B7280"} />
                  </View>
                  <Text style={[styles.noticeTypeLabel, { color: active ? item.color : theme.text }]}>
                    {item.label}
                  </Text>
                  {active && (
                    <View style={[styles.noticeTypeDot, { backgroundColor: item.color }]} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* -- Title -- */}
        <View style={styles.section}>
          <Text style={styles.label}>Notice Title</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="create-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
            <TextInput
              style={styles.inputWithIcon}
              placeholder="Enter notice title"
              value={title}
              onChangeText={setTitle}
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        {/* -- Description -- */}
        <View style={styles.section}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={styles.textarea}
            placeholder="Write notice details here..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            placeholderTextColor="#9CA3AF"
            textAlignVertical="top"
          />
        </View>

        {/* -- Dates -- */}
        <View style={styles.section}>
          <Text style={styles.label}>Date Range</Text>
          <View style={styles.dateRow}>
            <TouchableOpacity
              style={[styles.dateCard, { flex: 1, marginRight: 8 }]}
              onPress={() => { setActivePicker("NOTICE"); setShowPicker(true); }}
            >
              <View style={styles.dateCardIconWrap}>
                <Ionicons name="calendar-outline" size={18} color="#4C8EF7" />
              </View>
              <View>
                <Text style={styles.dateCardMeta}>Start Date</Text>
                <Text style={[styles.dateCardValue, { color: noticeDate ? theme.text : "#9CA3AF" }]}>
                  {noticeDate ? moment(noticeDate).format("DD MMM YYYY") : "Select"}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.dateCard, { flex: 1, marginLeft: 8 }]}
              onPress={() => { setActivePicker("EXPIRE"); setShowPicker(true); }}
            >
              <View style={[styles.dateCardIconWrap, { backgroundColor: "#FEE2E2" }]}>
                <Ionicons name="time-outline" size={18} color="#EF4444" />
              </View>
              <View>
                <Text style={styles.dateCardMeta}>Expiry Date</Text>
                <Text style={[styles.dateCardValue, { color: expireDate ? theme.text : "#9CA3AF" }]}>
                  {expireDate ? moment(expireDate).format("DD MMM YYYY") : "Select"}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {showPicker && (
          <DateTimePicker
            value={noticeDate || new Date()}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            minimumDate={today}
            onChange={onDateChange}
          />
        )}

        {/* -- Target Audience -- */}
        <View style={styles.section}>
          <Text style={styles.label}>Target Audience</Text>
          <View style={styles.targetRow}>
            {TARGET_CONFIG.map((item) => {
              const active = selectTargetType === item.value;
              return (
                <TouchableOpacity
                  key={item.value}
                  onPress={() => {
                    setSelectTargetType(item.value);
                    if (item.value !== "STUDENT") {
                      setClassName("");
                      setSection("");
                    }
                  }}
                  style={[
                    styles.targetChip,
                    { backgroundColor: active ? "#4C8EF7" : theme.background, borderColor: active ? "#4C8EF7" : theme.border },
                  ]}
                >
                  <Ionicons name={item.icon as any} size={14} color={active ? "#fff" : "#6B7280"} />
                  <Text style={[styles.targetChipText, { color: active ? "#fff" : theme.text }]}>{item.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* -- Class & Section -- */}
          {selectTargetType === "STUDENT" && (
            <View style={styles.studentFilters}>
              <View style={styles.studentFilterHeader}>
                <Ionicons name="filter" size={14} color="#4C8EF7" />
                <Text style={styles.studentFilterTitle}>Filter by Class</Text>
              </View>
              <View style={styles.classRow}>
                <TouchableOpacity
                  style={[styles.classPickerBtn, { flex: 1, marginRight: 8 }]}
                  onPress={() => setShowClassModal(true)}
                >
                  <Ionicons name="school-outline" size={16} color={className ? "#4C8EF7" : "#9CA3AF"} />
                  <Text style={[styles.classPickerText, { color: className ? theme.text : "#9CA3AF" }]}>
                    {className ? (classes.find((c) => c.value === className)?.label ?? className) : "Select Class"}
                  </Text>
                  <Ionicons name="chevron-down" size={14} color="#9CA3AF" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.classPickerBtn, { flex: 1, marginLeft: 8 }]}
                  onPress={() => setShowSectionModal(true)}
                >
                  <Ionicons name="layers-outline" size={16} color={section ? "#4C8EF7" : "#9CA3AF"} />
                  <Text style={[styles.classPickerText, { color: section ? theme.text : "#9CA3AF" }]}>
                    {section ? (sections.find((s) => s.value === section)?.label ?? section) : "Select Section"}
                  </Text>
                  <Ionicons name="chevron-down" size={14} color="#9CA3AF" />
                </TouchableOpacity>
              </View>

              {(className || section) && (
                <View style={styles.filterSummary}>
                  <Ionicons name="checkmark-circle" size={13} color="#10B981" />
                  <Text style={styles.filterSummaryText}>
                    {className ? (classes.find((c) => c.value === className)?.label ?? "All Classes") : "All Classes"}
                    {section ? ` \u2014 Section ${section}` : ""}
                  </Text>
                  <View style={{ flex: 1 }} />
                  <TouchableOpacity onPress={() => { setClassName(""); setSection(""); }}>
                    <Text style={styles.clearText}>Clear</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>

        {/* -- Attachment -- */}
        <View style={styles.section}>
          <Text style={styles.label}>
            {"Attachment "}
            <Text style={styles.optional}>(optional)</Text>
          </Text>
          <TouchableOpacity
            style={[styles.attachBtn, attachment && styles.attachBtnActive]}
            onPress={uploadAttachment}
          >
            <Ionicons
              name={attachment ? "document-attach" : "cloud-upload-outline"}
              size={22}
              color={attachment ? "#4C8EF7" : "#9CA3AF"}
            />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[styles.attachLabel, { color: attachment ? theme.text : "#9CA3AF" }]} numberOfLines={1} ellipsizeMode="middle">
                {attachment ? attachment.name : "Tap to attach a file"}
              </Text>
              {attachment && <Text style={styles.attachSub}>Tap to change file</Text>}
            </View>
            {attachment && (
              <TouchableOpacity onPress={() => setAttachment(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={20} color="#EF4444" />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </View>

        {/* -- Submit -- */}
        <TouchableOpacity
          style={[styles.submitBtn, !isFormValid && { opacity: 0.55 }]}
          disabled={!isFormValid}
          onPress={submitNotice}
        >
          {loading ? (
            <View style={styles.submitRow}>
              <Ionicons name="sync" size={18} color="#fff" />
              <Text style={styles.submitText}>Updating...</Text>
            </View>
          ) : (
            <View style={styles.submitRow}>
              <Ionicons name="checkmark-done" size={18} color="#fff" />
              <Text style={styles.submitText}>Update Notice</Text>
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* -- Section Modal -- */}
      <Modal visible={showSectionModal} transparent animationType="slide" onRequestClose={() => setShowSectionModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowSectionModal(false)} />
        <View style={[styles.modalSheet, { backgroundColor: theme.background }]}>
          <View style={styles.modalHandle} />
          <Text style={[styles.modalTitle, { color: theme.text }]}>Select Section</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            <TouchableOpacity
              style={[styles.classOption, !section && styles.classOptionActive]}
              onPress={() => { setSection(""); setShowSectionModal(false); }}
            >
              <Text style={[styles.classOptionText, { color: !section ? "#4C8EF7" : theme.text }]}>All Sections</Text>
              {!section && <Ionicons name="checkmark" size={16} color="#4C8EF7" />}
            </TouchableOpacity>
            {sections.map((s) => (
              <TouchableOpacity
                key={s.value}
                style={[styles.classOption, section === s.value && styles.classOptionActive]}
                onPress={() => { setSection(s.value); setShowSectionModal(false); }}
              >
                <Text style={[styles.classOptionText, { color: section === s.value ? "#4C8EF7" : theme.text }]}>{s.label}</Text>
                {section === s.value && <Ionicons name="checkmark" size={16} color="#4C8EF7" />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* -- Class Modal -- */}
      <Modal visible={showClassModal} transparent animationType="slide" onRequestClose={() => setShowClassModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowClassModal(false)} />
        <View style={[styles.modalSheet, { backgroundColor: theme.background }]}>
          <View style={styles.modalHandle} />
          <Text style={[styles.modalTitle, { color: theme.text }]}>Select Class</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            <TouchableOpacity
              style={[styles.classOption, !className && styles.classOptionActive]}
              onPress={() => { setClassName(""); setShowClassModal(false); }}
            >
              <Text style={[styles.classOptionText, { color: !className ? "#4C8EF7" : theme.text }]}>All Classes</Text>
              {!className && <Ionicons name="checkmark" size={16} color="#4C8EF7" />}
            </TouchableOpacity>
            {classes.map((c) => (
              <TouchableOpacity
                key={c.value}
                style={[styles.classOption, className === c.value && styles.classOptionActive]}
                onPress={() => { setClassName(c.value); setShowClassModal(false); }}
              >
                <Text style={[styles.classOptionText, { color: className === c.value ? "#4C8EF7" : theme.text }]}>{c.label}</Text>
                {className === c.value && <Ionicons name="checkmark" size={16} color="#4C8EF7" />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

function getStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: Platform.OS === "ios" ? 60 : 50,
      backgroundColor: theme.background,
      paddingHorizontal: 16,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 20,
    },
    backBtn: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    headerText: {
      fontSize: 20,
      fontWeight: "700",
      color: theme.text,
    },
    section: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: theme.text,
      marginBottom: 10,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    label: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.text,
      marginBottom: 8,
    },
    optional: {
      fontSize: 12,
      fontWeight: "400",
      color: "#9CA3AF",
    },
    noticeTypeGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginHorizontal: -5,
    },
    noticeTypeCard: {
      width: "30%",
      borderWidth: 1.5,
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 8,
      alignItems: "center",
      margin: 5,
      position: "relative",
    },
    noticeTypeIconWrap: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 6,
    },
    noticeTypeLabel: {
      fontSize: 11,
      fontWeight: "600",
    },
    noticeTypeDot: {
      position: "absolute",
      top: 6,
      right: 6,
      width: 7,
      height: 7,
      borderRadius: 4,
    },
    inputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      backgroundColor: theme.background,
    },
    inputIcon: {
      marginRight: 8,
    },
    inputWithIcon: {
      flex: 1,
      paddingVertical: 13,
      color: theme.text,
      fontSize: 15,
    },
    textarea: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 10,
      padding: 12,
      color: theme.text,
      fontSize: 15,
      minHeight: 100,
    },
    dateRow: {
      flexDirection: "row",
    },
    dateCard: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 12,
      padding: 12,
    },
    dateCardIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: "#EFF6FF",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 10,
    },
    dateCardMeta: {
      fontSize: 11,
      color: "#9CA3AF",
      fontWeight: "500",
    },
    dateCardValue: {
      fontSize: 13,
      fontWeight: "600",
      marginTop: 2,
    },
    targetRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginBottom: 12,
    },
    targetChip: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 20,
      borderWidth: 1.5,
      marginRight: 8,
      marginBottom: 8,
    },
    targetChipText: {
      fontSize: 13,
      fontWeight: "600",
      marginLeft: 6,
    },
    studentFilters: {
      backgroundColor: "#EFF6FF",
      borderRadius: 12,
      padding: 14,
      borderWidth: 1,
      borderColor: "#BFDBFE",
    },
    studentFilterHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 10,
    },
    studentFilterTitle: {
      fontSize: 12,
      fontWeight: "700",
      color: "#4C8EF7",
      textTransform: "uppercase",
      letterSpacing: 0.4,
      marginLeft: 5,
    },
    classRow: {
      flexDirection: "row",
    },
    classPickerBtn: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: "#BFDBFE",
      borderRadius: 9,
      paddingVertical: 10,
      paddingHorizontal: 12,
      backgroundColor: "#fff",
    },
    classPickerText: {
      flex: 1,
      fontSize: 13,
      fontWeight: "500",
      marginLeft: 7,
    },
    filterSummary: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 10,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: "#BFDBFE",
    },
    filterSummaryText: {
      fontSize: 12,
      color: "#374151",
      fontWeight: "500",
      marginLeft: 5,
    },
    clearText: {
      fontSize: 12,
      color: "#EF4444",
      fontWeight: "600",
    },
    attachBtn: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1.5,
      borderColor: theme.border,
      borderRadius: 12,
      borderStyle: "dashed",
      padding: 14,
    },
    attachBtnActive: {
      borderColor: "#4C8EF7",
      borderStyle: "solid",
      backgroundColor: "#EFF6FF",
    },
    attachLabel: {
      fontSize: 14,
      fontWeight: "500",
    },
    attachSub: {
      fontSize: 11,
      color: "#9CA3AF",
      marginTop: 2,
    },
    submitBtn: {
      backgroundColor: "#4C8EF7",
      padding: 16,
      borderRadius: 12,
      alignItems: "center",
      marginTop: 4,
      shadowColor: "#4C8EF7",
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
      fontSize: 16,
      marginLeft: 8,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.4)",
    },
    modalSheet: {
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      maxHeight: "60%",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 10,
    },
    modalHandle: {
      width: 40,
      height: 4,
      backgroundColor: "#E5E7EB",
      borderRadius: 2,
      alignSelf: "center",
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: 17,
      fontWeight: "700",
      marginBottom: 14,
    },
    classOption: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 13,
      paddingHorizontal: 4,
      borderBottomWidth: 1,
      borderBottomColor: "#F3F4F6",
    },
    classOptionActive: {
      borderBottomColor: "#BFDBFE",
    },
    classOptionText: {
      fontSize: 15,
      fontWeight: "500",
    },
  });
}