// HomeworkApp.tsx
import { ThemeContext } from "@/action/theme/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useContext, useState } from "react";
import { Platform, SafeAreaView, Text, TouchableOpacity, View } from "react-native";
import CheckHomework from "./checkhomework";
import CreateHomework from "./createhomework";

const HomeworkApp = () => {
  const [tab, setTab] = useState<"create" | "check">("check");
  const router = useRouter();
  const themeState = useContext(ThemeContext);
  if (!themeState) return null;
  const { theme } = themeState;
  let isDark = theme.mode === "dark";
  // const styles = getStyles(theme);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background, paddingTop: Platform.OS === 'ios' ? 60 : 50, }}>
      {/* HEADER */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          padding: 16,
          borderBottomWidth: 1,
          borderColor: "#eee",
        }}
      >
        <Ionicons name="arrow-back" size={28} onPress={()=> router.replace("/(tabs)/home")} style={{color: !isDark ? '#000104' : '#E9EFFC'}} />
        <Text style={{ fontSize: 20, fontWeight: "700", color: !isDark ? '#000104' : '#fff', }}>Homework</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* TABS */}
      <View style={{ flexDirection: "row" }}>
        <TouchableOpacity
          style={{
            flex: 1,
            padding: 12,
            borderBottomWidth: 3,
            borderColor: tab === "create" ? "#6C63FF" : "transparent",
          }}
          onPress={() => setTab("create")}
        >
          <Text
            style={{
              textAlign: "center",
              color: tab === "create" ? "#6C63FF" :  !isDark ? '#000104' : '#fff',
            }}
          >
            Create Homework
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            flex: 1,
            padding: 12,
            borderBottomWidth: 3,
            borderColor: tab === "check" ? "#6C63FF" : "transparent",
          }}
          onPress={() => setTab("check")}
        >
          <Text
            style={{
              textAlign: "center",
              color: tab === "check" ? "#6C63FF" : !isDark ? '#000104' : '#fff',
            }}
          >
            Check Homework
          </Text>
        </TouchableOpacity>
      </View>

      {/* CONTENT */}
      {tab === "create" ? <CreateHomework /> : <CheckHomework />}
    </SafeAreaView>
  );
};

export default HomeworkApp;
