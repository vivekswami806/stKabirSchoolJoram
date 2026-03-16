import { Theme } from "@/action/theme/themeReducer";
import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

type Props = {
  name: string;
  code: string;
  label: string;
  codeLabel: string;
  theme: Theme;
  type:string;
  reason:string;
  rollNumber: string
};

export default function LeavePersonInfo({
  name,
  code,
  label,
  codeLabel,
  theme,
  type,
  reason,
  rollNumber
}: Props) {
  const isDark = theme.mode === "dark";

  return (
    <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
      <Ionicons
        name="person-outline"
        size={18}
        color={isDark ? "#60A5FA" : "#3B82F6"}
      />
      <View>
        <Text style={{ fontSize: 15, fontWeight: "600", color: isDark ? "#F3F4F6" : "#111827" }}>
          {name}
        </Text>
        <Text style={{ fontSize: 12, color: isDark ? "#9CA3AF" : "#6B7280" }}>
          {codeLabel}: {code} {rollNumber}
        </Text>
        <Text style={{ fontSize: 12, color: isDark ? "#9CA3AF" : "#6B7280" }}>
          TYPE: {type} 
        </Text>
        <Text style={{ fontSize: 12, color: isDark ? "#9CA3AF" : "#6B7280" }}>
          Reason: {reason} 
        </Text>
      </View>
    </View>
  );
}
