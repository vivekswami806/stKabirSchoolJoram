import { ThemeContext } from "@/action/theme/ThemeContext";
import { Theme } from "@/action/theme/themeReducer";
import Spinner from "@/components/spinner";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import axios from "axios";
import { Buffer } from "buffer";
import { useRouter } from "expo-router";
import React, { useContext, useState } from "react";
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function AddNoticeScreen() {
  const router = useRouter();
  const themeState = useContext(ThemeContext);
  if (!themeState) return null;
  const { theme } = themeState;
  const styles = getStyles(theme);

  const [title, setTitle] = useState("");
  const [date, setDate] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  /* ================= DATE VALIDATION ================= */

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const onDateChange = (_: any, selectedDate?: Date) => {
    setShowPicker(false);
    if (!selectedDate) return;

    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);

    if (selected < today) {
      Alert.alert("Invalid Date", "You cannot select a past date");
      return;
    }

    setDate(selected);
  };

  /* ================= SUBMIT NOTICE ================= */

  const submitNotice = async () => {
    if (!title.trim()) {
      Alert.alert("Validation", "Please enter notice title");
      return;
    }

    if (!date) {
      Alert.alert("Validation", "Please select notice date");
      return;
    }

    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("auth_token");
      const encodedTenant = await AsyncStorage.getItem("auth_tenant");
      if (!token || !encodedTenant) throw new Error("Auth missing");
      let tenantId = Buffer.from(encodedTenant, "base64").toString("utf-8")

      if (!token || !tenantId) {
        throw new Error("Authentication missing");
      }

      await axios.post(
        "https://your-api-url.com/api/notice/create",
        {
          title,
          date: date.toISOString().split("T")[0], // YYYY-MM-DD
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Tenant-ID": tenantId,
            "Content-Type": "application/json",
          },
        }
      );

      Alert.alert("Success", "Notice added successfully");
      router.back();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to add notice");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* TITLE */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.push("/dashboard/(tabs)/notice")}>
          <Ionicons name="arrow-back" size={26} style={styles.backButton} />
        </TouchableOpacity>
        <Text style={styles.headerText}>Notice Title</Text>
        <View style={{ width: 24 }} />
      </View>
      <TextInput
        style={styles.input}
        placeholder="Enter notice title"
        value={title}
        onChangeText={setTitle}
        placeholderTextColor="#999"
      />

      {/* DATE */}
      <Text style={styles.label}>Notice Date</Text>
      <TouchableOpacity
        style={styles.dateInput}
        onPress={() => setShowPicker(true)}
      >
        <Text style={styles.dateText}>
          {date ? date.toDateString() : "Select date"}
        </Text>
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={date || new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          minimumDate={today}
          onChange={onDateChange}
        />
      )}

      {/* SUBMIT */}
      <TouchableOpacity
        style={[styles.button, loading && { opacity: 0.6 }]}
        onPress={submitNotice}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? <Spinner/> : "Add Notice"}
        </Text>
      </TouchableOpacity>
    </View>
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
        borderBottomWidth: 1,
        borderBottomColor: "#e9ecef",
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
      backgroundColor: "#4C8EF7",
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
