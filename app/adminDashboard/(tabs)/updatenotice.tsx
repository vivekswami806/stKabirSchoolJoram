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
import { useLocalSearchParams, useRouter } from "expo-router";
import moment from "moment";
import React, { useContext, useEffect, useState } from "react";
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ToastService } from "react-native-toastier";

/* ================== TYPES ================== */

export type TargetType = "ALL" | "STAFF" | "STUDENT" | "ALL_STUDENTS";

/* ================== SCREEN ================== */

export default function UpdateNoticeScreen() {
  const router = useRouter();
  const themeState = useContext(ThemeContext);
  if (!themeState) return null;

  const { theme } = themeState;
  const styles = getStyles(theme);

  /* ================== ROUTE PARAMS ================== */

  const {
    id,
    title: pTitle,
    description: pDesc,
    noticeDate: pNoticeDate,
    expireDate: pExpireDate,
    targetType: pTargetType,
  } = useLocalSearchParams();


  /* ================== STATE ================== */

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [noticeDate, setNoticeDate] = useState<Date | null>(null);
  const [expireDate, setExpireDate] = useState<Date | null>(null);
  const [selectTargetType, setSelectTargetType] =
    useState<TargetType>("ALL");

  const [attachment, setAttachment] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [activePicker, setActivePicker] = useState<"NOTICE" | "EXPIRE" | null>(null);
  /* ================== INIT ================== */

  useEffect(() => {
    if (!id) {
      Alert.alert("Error", "Invalid notice");
      router.back();
      return;
    }

    setTitle(String(pTitle || ""));
    setDescription(String(pDesc || ""));
    setSelectTargetType(pTargetType as TargetType);

    if (pNoticeDate) {
      setNoticeDate(new Date(String(pNoticeDate)));
    }

    if (pExpireDate) {
      setExpireDate(new Date(String(pExpireDate)));
    }
  }, []);

  /* ================== DATE ================== */

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const onDateChange = (_: any, selectedDate?: Date) => {
    setShowPicker(false);
    if (!selectedDate || !activePicker) return;

    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);

    if (selected < today) {
      Alert.alert("Invalid Date", "You cannot select a past date");
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
    if (!title.trim()) {
      Alert.alert("Validation", "Please enter notice title");
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
      console.log("---- yahi hai token", token, tenantId, await getDeviceId(), id);
      
      const res = await axios.post(
        `${API_BASE_URL}notice/updateNotice/${id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Tenant-ID": tenantId,
            "X-Device-ID": await getDeviceId(),
            "Content-Type": "multipart/form-data",
          },
        }
      );
      //  console.log("---res|", res);
      
      ToastService.show({
        type: "success",
        message: "Notice Update successfully",
        duration: 3000,
        contentContainerStyle: { flex: 1 },
      });
      router.replace("/dashboard/(tabs)/notice");
    } catch (error: any) {
      console.log("Notice error:", error || error);
  
      ToastService.show({
        type: "danger",
        message: "failed to update Sever Error",
        duration: 3000,
        contentContainerStyle: { flex: 1 },
      });
    } finally {
      setLoading(false);
    }
  };
  /* ================== ATTACHMENT ================== */

  const uploadAttachment = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      setAttachment({
        uri: asset.uri,
        name: asset.name,
        type: asset.mimeType || "application/octet-stream",
      });

      ToastService.show({
        type: "info",
        message: "File attached successfully",
        duration: 3000,
        contentContainerStyle: { flex: 1 },
      });
    } catch {
      ToastService.show({
        type: "danger",
        message: "File pick fail",
        duration: 3000,
        contentContainerStyle: { flex: 1 },
      });
      
    }
  };

  /* ================== UI ================== */

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} style={styles.backButton} />
        </TouchableOpacity>
        <Text style={styles.headerText}>Update Notice</Text>
        <View style={{ width: 24 }} />
      </View>

      <Text style={styles.label}>Notice Title</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, { height: 100 }]}
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <Text style={styles.label}>Notice Date</Text>
      <TouchableOpacity
        style={styles.dateInput}
        onPress={() => {
          setActivePicker("NOTICE");
          setShowPicker(true);
        }}
      >
        <Text>{noticeDate?.toDateString() || "Select date"}</Text>
      </TouchableOpacity>

      <Text style={styles.label}>Expire Date</Text>
      <TouchableOpacity
        style={styles.dateInput}
        onPress={() => {
          setActivePicker("EXPIRE");
          setShowPicker(true);
        }}
      >
        <Text>{expireDate?.toDateString() || "Select date"}</Text>
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          minimumDate={today}
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={onDateChange}
        />
      )}

      <Text style={styles.label}>Target Audience</Text>
      <View style={{ flexDirection: "row", gap: 10 }}>
        {(["ALL", "STAFF", "STUDENT", "ALL_STUDENTS"] as TargetType[]).map(
          (item) => (
            <TouchableOpacity
              key={item}
              onPress={() => setSelectTargetType(item)}
              style={{
                padding: 10,
                borderRadius: 6,
                backgroundColor:
                  selectTargetType === item ? "#4C8EF7" : "#E5E7EB",
              }}
            >
              <Text
                style={{
                  color: selectTargetType === item ? "#FFF" : "#000",
                }}
              >
                {item.replace("_", " ")}
              </Text>
            </TouchableOpacity>
          )
        )}
      </View>

      <Text style={styles.label}>Attachment</Text>
      <TouchableOpacity style={styles.dateInput} onPress={uploadAttachment}>
        <Text>{attachment?.name || "Attach file"}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, loading && { opacity: 0.6 }]}
        onPress={submitNotice}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Updating..." : "Update Notice"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

/* ================== STYLES ================== */

function getStyles(theme: Theme) {
  const isDark = theme.mode === "dark";
  return StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: Platform.OS === "ios" ? 60 : 50,
      paddingHorizontal: 20,
      backgroundColor: isDark ? "#0B1220" : "#FFF",
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 20,
    },
    backButton: {
      color: isDark ? "#FFF" : "#000",
    },
    headerText: {
      fontSize: 20,
      fontWeight: "600",
      color: isDark ? "#FFF" : "#000",
    },
    label: {
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 8,
      marginTop: 12,
      color: isDark ? "#E5E7EB" : "#000",
    },
    input: {
      borderWidth: 1,
      borderColor: "#DDD",
      borderRadius: 8,
      padding: 12,
      color: isDark ? "#FFF" : "#000",
    },
    dateInput: {
      borderWidth: 1,
      borderColor: "#DDD",
      borderRadius: 8,
      padding: 14,
      marginBottom: 10,
    },
    button: {
      backgroundColor: "#4C8EF7",
      padding: 14,
      borderRadius: 8,
      marginTop: 20,
      alignItems: "center",
    },
    buttonText: {
      color: "#FFF",
      fontSize: 16,
      fontWeight: "700",
    },
  });
}
