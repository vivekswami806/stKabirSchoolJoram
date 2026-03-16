// components/ModalDropdown.tsx
import { ThemeContext } from "@/action/theme/ThemeContext";
import { Theme } from "@/action/theme/themeReducer";
import React, { useContext, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

interface Props {
  visible: boolean;
  data: any[];
  labelKey: string;
  onSelect: (item: any) => void;
  onClose: () => void;
  loading?: boolean;
}

const ModalDropdown: React.FC<Props> = ({
  visible,
  data,
  labelKey,
  onSelect,
  onClose,
  loading,
}) => {
  const [search, setSearch] = useState("");
  const themeState = useContext(ThemeContext);
if (!themeState) return null;

const { theme } = themeState;
const styles = getStyles(theme);
const isDark = theme.mode === "dark";
  const filtered = data.filter((item) =>
    item[labelKey].toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          <Text style={styles.title}>Select Option</Text>

          {/* SEARCH BAR */}
          {/* <TextInput
            style={styles.search}
            placeholder="Search…"
            value={search}
            onChangeText={setSearch}
          /> */}

          {/* LOADING */}
          {loading ? (
            <ActivityIndicator size={26} color={isDark ? "#60a5fa" : "#2563eb"} />
          ) : (
            <ScrollView style={{ maxHeight: 300 }}>
              {filtered.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.item}
                  onPress={() => {
                    onSelect(item);
                    onClose();
                  }}
                >
                  <Text style={styles.itemText}>{item[labelKey]}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default ModalDropdown;

function getStyles(theme: Theme) {
  const isDark = theme.mode === "dark";

  const colors = {
    light: {
      overlay: "rgba(0,0,0,0.4)",
      background: "#ffffff",
      textPrimary: "#111827",
      border: "#e5e7eb",
      itemBorder: "#f1f5f9",
      button: "#2563eb",
    },
    dark: {
      overlay: "rgba(0,0,0,0.6)",
      background: "#1f2937",
      textPrimary: "#f9fafb",
      border: "#374151",
      itemBorder: "#334155",
      button: "#3b82f6",
    },
  };

  const palette = isDark ? colors.dark : colors.light;

  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: palette.overlay,
      justifyContent: "center",
      alignItems: "center",
    },

    modalBox: {
      width: "85%",
      backgroundColor: palette.background,
      padding: 20,
      borderRadius: 12,
      borderWidth: isDark ? 1 : 0,
      borderColor: palette.border,
    },

    title: {
      fontSize: 18,
      fontWeight: "700",
      marginBottom: 12,
      color: palette.textPrimary,
    },

    search: {
      borderWidth: 1,
      borderColor: palette.border,
      borderRadius: 6,
      padding: 10,
      marginBottom: 12,
      color: palette.textPrimary,
    },

    item: {
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderColor: palette.itemBorder,
    },

    itemText: {
      fontSize: 16,
      color: palette.textPrimary,
    },

    closeBtn: {
      marginTop: 12,
      paddingVertical: 12,
      alignItems: "center",
      backgroundColor: palette.button,
      borderRadius: 8,
    },

    closeText: {
      color: "#fff",
      fontWeight: "600",
    },
  });
}
