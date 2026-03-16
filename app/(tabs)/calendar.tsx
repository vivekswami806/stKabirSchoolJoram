import { ThemeContext } from "@/action/theme/ThemeContext";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useContext, useState } from "react";
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function Calendar() {
  const [date, setDate] = useState(new Date());
  const [open, setOpen] = useState(true);

  const themeState = useContext(ThemeContext);
  if (!themeState) return null;

  const { theme } = themeState;
  const isDark = theme.mode === "dark";

  const styles = getStyles(isDark);

  const onChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setOpen(false);
    }
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Selected: {date.toDateString()}
      </Text>

      <TouchableOpacity style={styles.button} onPress={() => setOpen(true)}>
        <Text style={styles.buttonText}>Open Calendar</Text>
      </TouchableOpacity>

      {/* IOS MODAL */}
      {Platform.OS === "ios" && (
        <Modal transparent visible={open} animationType="slide">
          <View style={styles.overlay}>
            <View style={styles.modalContainer}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setOpen(false)}
              >
                <Text style={styles.closeText}>Close</Text>
              </TouchableOpacity>

              <DateTimePicker
                value={date}
                mode="date"
                display="spinner"
                onChange={onChange}
                themeVariant={isDark ? "dark" : "light"}
                textColor={isDark ? "#fff" : "#000"}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* ANDROID PICKER */}
      {Platform.OS === "android" && open && (
        <DateTimePicker
          value={date}
          mode="date"
          display="calendar"
          onChange={onChange}
        />
      )}
    </View>
  );
}

/* ================= STYLES ================= */

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: isDark ? "#0f172a" : "#f8fafc",
    },
    title: {
      fontSize: 20,
      marginBottom: 20,
      fontWeight: "600",
      color: isDark ? "#ffffff" : "#111827",
    },
    button: {
      backgroundColor: isDark ? "#3b82f6" : "#2563eb",
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 10,
      elevation: 3,
    },
    buttonText: {
      color: "#ffffff",
      fontSize: 16,
      fontWeight: "600",
    },
    overlay: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: "rgba(0,0,0,0.5)",
    },
    modalContainer: {
      backgroundColor: isDark ? "#1e293b" : "#ffffff",
      padding: 16,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
    },
    closeButton: {
      alignSelf: "flex-end",
      marginBottom: 10,
    },
    closeText: {
      fontSize: 16,
      fontWeight: "600",
      color: isDark ? "#60a5fa" : "#2563eb",
    },
  });
