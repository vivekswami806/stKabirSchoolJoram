// CheckHomework.tsx
import { API_BASE_URL } from "@/config";
import { getDeviceId } from "@/helper/getDeviceId";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Buffer } from "buffer";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";
import LeaveSkeleton from "../leave/LeaveSkeleton";

interface HomeworkItem {
  id: string;
  title: string;
  subject: string;
  className: string;
  section: string;
  homeworkDate: string;
  dueDate: string;
  description: string;
  attachments: any[];
}

interface PageResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean; 
}

const CheckHomework = () => {
  const [list, setList] = useState<HomeworkItem[]>([]);
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState("");

  /* ---------------- API ---------------- */
  const api = {
    async getAllStaffHomework(
      page: number,
      size: number
    ): Promise<PageResponse<HomeworkItem>> {
      const token = await AsyncStorage.getItem("auth_token");
      const encodedTenant = await AsyncStorage.getItem("auth_tenant");
      const deviceId = await getDeviceId();

      if (!token || !encodedTenant) throw new Error("Auth missing");

      const tenantId = Buffer.from(encodedTenant, "base64").toString("utf-8");

      const res = await axios.get(
        `${API_BASE_URL}homework/staff/getStaffHomeWork`,
        {
          params: { page, size },
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Tenant-ID": tenantId,
            "X-Device-ID": deviceId,
          },
        }
      );

      return res.data;
    },
  };

  /* ---------------- Fetch ---------------- */
  const fetchHomework = async (pageNo: number, refresh = false) => {
    if (loading || (!hasMore && !refresh)) return;

    setLoading(true);
    try {
      const res = await api.getAllStaffHomework(pageNo, size);

      setList((prev) =>
        refresh ? res.content : [...prev, ...res.content]
      );

      setHasMore(!res.last);
      setPage(res.pageNumber);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /* ---------------- Pull to Refresh ---------------- */
  const onRefresh = () => {
    setRefreshing(true);
    setHasMore(true);
    fetchHomework(0, true);
  };

  /* ---------------- Delete ---------------- */
  const deleteHomework = async (id: string) => {
    try {
      const token = await AsyncStorage.getItem("auth_token");
      const encodedTenant = await AsyncStorage.getItem("auth_tenant");
      const deviceId = await getDeviceId();

      const tenantId = Buffer.from(encodedTenant!, "base64").toString("utf-8");

      let res = await axios.delete(
        `${API_BASE_URL}homework/deleteHomeWork/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Tenant-ID": tenantId,
            "X-Device-ID": deviceId,
          },
        }
      );
      setList((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      console.log("---err|", err);
      
      Alert.alert("Delete failed");
    }
  };

  useEffect(() => {
    fetchHomework(0);
  }, []);

  const renderItem = ({ item }: { item: HomeworkItem }) => (
    <View style={styles.card}>
      <Pressable
        onPress={() =>
          router.push({
            pathname: "./HomeworkSubmissions",
            params: {
              homeworkId: item.id,
              className: item.className,
              section: item.section,
              title: item.title,
            },
          })
        }
      >
        <Text style={styles.subject}>
          {`${item.subject ?? "—"} • Class ${item.className ?? ""}${item.section ?? ""}`}
        </Text>
  
        <Text style={styles.date}>
          {`Homework: ${item.homeworkDate ?? "N/A"}`}
        </Text>
  
        <Text style={styles.title}>
          {`${item.title ?? "Untitled"}`}
        </Text>
  
        <Text style={styles.attachment}>
          View submissions →
        </Text>
      </Pressable>
  
      <View style={styles.buttonRow}>
        <Pressable
          style={[styles.actionBtn, { backgroundColor: "#2563eb" }]}
          onPress={async () => {
            await AsyncStorage.setItem(
              "UPDATE_HOMEWORK_DATA",
              JSON.stringify(item)
            );
            router.push({
              pathname: "/adminDashboard/(tabs)/homework/updateHomework",
              params: { homeworkId: item.id },
            });
          }}
        >
          <Text style={styles.actionText}>Update</Text>
        </Pressable>
  
        <Pressable
          style={[styles.actionBtn, { backgroundColor: "#ef4444" }]}
          onPress={() => deleteHomework(item.id)}
        >
          <Text style={styles.actionText}>Delete</Text>
        </Pressable>
      </View>
    </View>
  );
  

  /* ---------------- UI ---------------- */
  return (
    <FlatList
      data={list.filter((i) =>
        (i.title ?? "").toLowerCase().includes(search.toLowerCase())
      )}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={{ padding: 10 }}
      refreshing={refreshing}
      onRefresh={onRefresh}
      onEndReached={() => fetchHomework(page + 1)}
      onEndReachedThreshold={0.3}
      ListEmptyComponent={
        loading ? null : (
          <View style={styles.center}>
            <Text style={styles.emptyText}>No homework found</Text>
          </View>
        )
      }
      ListFooterComponent={
        loading ?  (
          <LeaveSkeleton isDark={false}/>
        ) : null
      }
    />
  );
};

export default CheckHomework;

/* ---------------- Styles ---------------- */
const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: "#6B7280",
  },
  card: {
    backgroundColor: "#fafafa",
    padding: 16,
    borderRadius: 10,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#eee",
  },
  subject: { fontWeight: "bold", fontSize: 16 },
  date: { color: "#777", fontSize: 12, marginVertical: 4 },
  title: { fontSize: 15 },
  attachment: {
    marginTop: 6,
    fontSize: 12,
    color: "#4B5563",
    fontStyle: "italic",
  },
  buttonRow: {
    flexDirection: "row",
    marginTop: 10,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: "center",
    marginHorizontal: 4,
  },
  actionText: { color: "#fff", fontWeight: "bold" },
});
