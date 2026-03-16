import { ThemeContext } from "@/action/theme/ThemeContext";
import { Theme } from "@/action/theme/themeReducer";
import { API_BASE_URL } from "@/config";
import { getDeviceId } from "@/helper/getDeviceId";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Buffer } from "buffer";
import * as DocumentPicker from "expo-document-picker";
import { useRouter } from "expo-router";
import moment from "moment";
import React, { useContext, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform, ScrollView, StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { ToastService } from "react-native-toastier";


/* ================== INTERFACES ================== */

export type TargetType = "ALL" | "STAFF" | "STUDENT" | "ALL_STUDENTS";

export interface Attachment {
  id: string;
  fileName: string;
  downloadUrl: string;
  fileType: string;
  fileSize: number;
}

type PickedFile = {
  uri: string;
  name: string;
  type: string;
};

export interface Notice {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  targetType: TargetType;
  attachments?: Attachment[];
}

export default function AddNoticeScreen() {
  const router = useRouter();
  const themeState = useContext(ThemeContext);
  if (!themeState) return null;
  const { theme } = themeState;
  const styles = getStyles(theme);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [noticeDate, setNoticeDate] = useState<Date | null>(null);
  const [expireDate, setExpireDate] = useState<Date | null>(null);
  const [selectTargetType, setSelectTargetType] = useState<TargetType>("ALL");
  const [attachment, setAttachment] = useState<PickedFile | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [activePicker, setActivePicker] = useState<"NOTICE" | "EXPIRE" | null>(null);
  const [loading, setLoading] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  /* =========== DATE HANDLER =========== */
  const onDateChange = (_: any, selectedDate?: Date) => {
    setShowPicker(false);
    if (!selectedDate || !activePicker) return;

    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);

    if (selected < today) {
      ToastService.show({
        type: "info",
        message: "You cannot select a past date",
        duration: 3000,
        contentContainerStyle: { flex: 1 },
      });
      return;
    }

    if (activePicker === "NOTICE") {
      setNoticeDate(selected);
    } else {
      setExpireDate(selected);
    }

    setActivePicker(null);
  };
  /* =========== SUBMIT HANDLER =========== */
  const submitNotice = async () => {
    if (loading) return; // prevent double submit

    if (!title.trim()) {
      ToastService.show({
        type: "info",
        message: "Please enter notice title",
        duration: 3000,
        contentContainerStyle: { flex: 1 },
      });
      return;
    }

    if (!description.trim()) {
      ToastService.show({
        type: "info",
        message: "Please enter notice description",
        duration: 3000,
        contentContainerStyle: { flex: 1 },
      });
      return;
    }

    if (!noticeDate || !expireDate) {
      ToastService.show({
        type: "info",
        message: "Please select both notice and expiry dates",
        duration: 3000,
        contentContainerStyle: { flex: 1 },
      });
      return;
    }

    if (expireDate < noticeDate) {
      ToastService.show({
        type: "info",
        message: "Expiry date must be after notice date",
        duration: 3000,
        contentContainerStyle: { flex: 1 },
      });
      return;
    }

    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("auth_token");
      const encodedTenant = await AsyncStorage.getItem("auth_tenant");

      if (!token || !encodedTenant) {
        throw new Error("Authentication missing");
      }

      const tenantId = Buffer.from(encodedTenant, "base64").toString("utf-8");

      // console.log("-----noticeDate|", noticeDate, moment(noticeDate).format("YYYY-MM-DD"));
      
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("targetType", selectTargetType);
      formData.append("noticeType", "GENERAL");
      formData.append("startingDate", moment(noticeDate!).format("YYYY-MM-DD"));
      formData.append("expiryDate", moment(expireDate!).format("YYYY-MM-DD"));
      formData.append("className", "");
      formData.append("section", "");
      
      if (attachment) {
        formData.append("files", {
          uri: attachment.uri,
          name: attachment.name,
          type: attachment.type,
        } as any);
      }
      
      const response = await fetch(`${API_BASE_URL}notice/createNotice`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Tenant-ID": tenantId,
          "X-Device-ID": await getDeviceId(),
          "Content-Type": "multipart/form-data",
        },
        body: formData,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log("Upload failed:", errorText);
        throw new Error(errorText);
      }
      
      const result = await response.json();
      // console.log("Upload success:", result);

      ToastService.show({
        type: "info",
        message: "Notice added successfully",
        duration: 3000,
        contentContainerStyle: { flex: 1 },
      });

      router.replace("/dashboard/(tabs)/notice");
    } catch (error: any) {
      console.log("Notice error:", error?.response?.data?.message || error);
      
      ToastService.show({
        type: "info",
        message: error?.response?.data?.message || "Failed to add notice",
        duration: 3000,
        contentContainerStyle: { flex: 1 },
      });
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
      ToastService.show({
        type: "info",
        message: "File attached successfully",
        duration: 3000,
        contentContainerStyle: { flex: 1 },
      });
    } catch (error) {
      console.error(error);
      ToastService.show({
        type: "info",
        message: "Failed to pick file",
        duration: 3000,
        contentContainerStyle: { flex: 1 },
      });
    }
  };

  const isFormValid =
    title.trim() &&
    description.trim() &&
    noticeDate &&
    expireDate &&
    !loading;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.push("/dashboard/(tabs)/notice")}>
          <Ionicons name="arrow-back" size={26} style={styles.backButton} />
        </TouchableOpacity>
        <Text style={styles.headerText}>Add Notice</Text>
        <View style={{ width: 24 }} />
      </View>

      <Text style={styles.label}>Notice Title</Text>
      <TextInput style={styles.input} placeholder="Enter notice title" value={title} onChangeText={setTitle} placeholderTextColor="#999" />

      <Text style={styles.label}>Notice Description</Text>
      <TextInput style={[styles.input, { height: 100 }]} placeholder="Enter notice description" value={description} onChangeText={setDescription} multiline placeholderTextColor="#999" />

      <Text style={styles.label}>Notice Date</Text>
      <TouchableOpacity style={styles.dateInput} onPress={() => { setActivePicker("NOTICE"); setShowPicker(true); }}>
        <Text style={styles.dateText}>{noticeDate ? noticeDate.toDateString() : "Select date"}</Text>
      </TouchableOpacity>

      <Text style={styles.label}>Expire Date</Text>
      <TouchableOpacity style={styles.dateInput} onPress={() => { setActivePicker("EXPIRE"); setShowPicker(true); }}>
        <Text style={styles.dateText}>{expireDate ? expireDate.toDateString() : "Select date"}</Text>
      </TouchableOpacity>

      {showPicker && <DateTimePicker value={noticeDate || new Date()} mode="date" display={Platform.OS === "ios" ? "spinner" : "default"} minimumDate={today} onChange={onDateChange} />}

      <Text style={styles.label}>Target Audience</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
        {(["ALL", "STAFF", "STUDENT", "ALL_STUDENTS"] as TargetType[]).map((item) => (
          <TouchableOpacity key={item} onPress={() => setSelectTargetType(item)} style={{ padding: 10, borderRadius: 6, backgroundColor: selectTargetType === item ? "#4C8EF7" : "#E5E7EB" }}>
            <Text style={{ color: selectTargetType === item ? "#FFF" : "#000", fontWeight: "600" }}>{item.replace("_", " ")}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Attachment</Text>
      <TouchableOpacity style={[styles.dateInput, { flexDirection: "row", alignItems: "center" }]} onPress={uploadAttachment}>
        <Ionicons name="attach" size={20} color="#555" />
        <Text style={{ marginLeft: 10, color: attachment ? "#111827" : "#9CA3AF", fontWeight: attachment ? "600" : "400" }} numberOfLines={1} ellipsizeMode="middle">
          {attachment ? attachment.name : "Attach file"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, !isFormValid && { opacity: 0.5 }]} disabled={!isFormValid} onPress={submitNotice}>
        <Text style={styles.buttonText}>{loading ? "Submitting..." : "Add Notice"}</Text>
      </TouchableOpacity>
    </ScrollView>
  </KeyboardAvoidingView>
  );
}

/* ================= STYLES ================= */

function getStyles(theme: Theme) {
  const isDark = theme.mode === "dark";
  return StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: Platform.OS === "ios" ? 60 : 50,
      backgroundColor: isDark ? "#0B1220" : "#FFF",
      paddingHorizontal: 20
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingBottom: 16,
      paddingHorizontal: 20,
      // borderBottomWidth: 1,
      // borderBottomColor: "#e9ecef",
    },

    backButton: {
      width: 40,
      color: isDark ? "#E9EFFC" : "#000104",
    },
    headerText: {
      fontSize: 20,
      fontWeight: "600",
      color: isDark ? "#E9EFFC" : "#000104",
    },
    label: {
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 8,
      color: isDark ? "#E5E7EB" : "#000",
    },
    input: {
      borderWidth: 1,
      borderColor: "#DDD",
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
      color: isDark ? "#FFF" : "#000",
    },
    dateInput: {
      borderWidth: 1,
      borderColor: "#DDD",
      borderRadius: 8,
      padding: 14,
      marginBottom: 24,
      justifyContent: "center",
    },
    dateText: {
      color: "#555",
      fontSize: 15,
    },
    button: {
      backgroundColor:  "#4C8EF7",
      padding: 14,
      borderRadius: 8,
      alignItems: "center",
    },
    buttonText: {
      color: "#FFF",
      fontWeight: "700",
      fontSize: 16,
    },
  });
}
