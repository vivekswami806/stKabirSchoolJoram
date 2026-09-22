import { ThemeContext } from "@/action/theme/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useContext, useState } from "react";
import { Platform, SafeAreaView, Text, TouchableOpacity, View } from "react-native";
import CheckHomework from "./checkhomework";
import CreateHomework from "./createhomework";
import UpdateHomework from "./updateHomework";

type Tab = "create" | "check" | "update";

const HomeworkApp = () => {
  const [tab, setTab] = useState<Tab>("check");
  const [updateItem, setUpdateItem] = useState<any>(null);
  const router = useRouter();
  const themeState = useContext(ThemeContext);
  if (!themeState) return null;
  const { theme } = themeState;
  const isDark = theme.mode === "dark";
  const textColor = isDark ? "#fff" : "#000104";

  const handleEdit = (item: any) => {
    setUpdateItem(item);
    setTab("update");
  };

  const handleUpdateDone = () => {
    setUpdateItem(null);
    setTab("check");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background, paddingTop: Platform.OS === "ios" ? 40 : 30 }}>

      {/* ── Header ── */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", padding: 16, borderBottomWidth: 1, borderColor: "#eee" }}>
        <Ionicons
          name={tab === "update" ? "arrow-back" : "arrow-back"}
          size={28}
          style={{ color: textColor }}
          onPress={() => {
            if (tab === "update") {
              setUpdateItem(null);
              setTab("check");
            } else {
              router.replace("/(tabs)/home");
            }
          }}
        />
        <Text style={{ fontSize: 20, fontWeight: "700", color: textColor }}>
          {tab === "update" ? "Update Homework" : "Homework"}
        </Text>
        <View style={{ width: 28 }} />
      </View>

      {/* ── Tabs (hidden on update) ── */}
      {tab !== "update" && (
        <View style={{ flexDirection: "row" }}>
          {(["create", "check"] as Tab[]).map((t) => (
            <TouchableOpacity
              key={t}
              style={{ flex: 1, padding: 12, borderBottomWidth: 3, borderColor: tab === t ? "#6C63FF" : "transparent" }}
              onPress={() => setTab(t)}
            >
              <Text style={{ textAlign: "center", fontWeight: tab === t ? "700" : "400", color: tab === t ? "#6C63FF" : textColor }}>
                {t === "create" ? "Create Homework" : "Check Homework"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* ── Content ── */}
      {tab === "create" && <CreateHomework />}
      {tab === "check" && <CheckHomework onEdit={handleEdit} />}
      {tab === "update" && updateItem && (
        <UpdateHomework
          item={updateItem}
          onDone={handleUpdateDone}
        />
      )}
    </SafeAreaView>
  );
};

export default HomeworkApp;