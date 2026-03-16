import { ThemeContext } from "@/action/theme/ThemeContext";
import { Theme } from "@/action/theme/themeReducer";
import { memo, useContext, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface Props {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  onPress?: () => void;
}

function CollapsibleCard({ title, children, defaultOpen = false, onPress }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const themeState = useContext(ThemeContext);
  if (!themeState) return null;
  const { theme } = themeState;
  const styles = getStyles(theme, open);

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      setOpen(!open);
    }
  };

  return (
    <View style={styles.card}>
      <TouchableOpacity onPress={handlePress} style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.chevron}>{open ? "−" : "+"}</Text>
      </TouchableOpacity>

      {!onPress && open && <View style={styles.body}>{children}</View>}
    </View>
  );
}

export default memo(CollapsibleCard);

/* =========================
   THEME-AWARE STYLES
========================= */
const getStyles = (theme: Theme, open: boolean) => {
  const isDark = theme.mode === "dark";

  return StyleSheet.create({
    card: {
      backgroundColor: isDark ? "#1F2937" : "#f9fafb",
      borderRadius: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: isDark ? "#374151" : "#E5E7EB",
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 16,
      backgroundColor: open
        ? isDark
          ? "#111827"
          : "#f3f4f6"
        : "transparent",
    },
    title: {
      fontSize: 16,
      fontWeight: "700",
      color: isDark ? "#E9EFFC" : "#111827",
    },
    chevron: {
      fontSize: 20,
      fontWeight: "700",
      color: isDark ? "#E9EFFC" : "#111827",
    },
    body: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: isDark ? "#111827" : "#ffffff",
      borderTopWidth: 1,
      borderTopColor: isDark ? "#374151" : "#E5E7EB",
    },
  });
};
