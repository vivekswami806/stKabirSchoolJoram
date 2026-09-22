import { ThemeContext } from "@/action/theme/ThemeContext";
import { Theme } from "@/action/theme/themeReducer";
import LeaveSkeleton from "@/app/adminDashboard/(tabs)/leave/LeaveSkeleton";
import ConfirmationModal from "@/components/ConfirmationModal";
import { API_BASE_URL } from "@/config";
import { getDeviceId } from "@/helper/getDeviceId";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Buffer } from "buffer";
import { router } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

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

interface Props {
  onEdit: (item: HomeworkItem) => void;
}


const CheckHomework = ({ onEdit }: Props) => {
  const [list, setList] = useState<HomeworkItem[]>([]);
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const themeState = useContext(ThemeContext);
  if (!themeState) return null;
  const { theme } = themeState;
  const styles = getStyles(theme);
  const isDark = theme.mode === "dark";

  const getAuthHeaders = async () => {
    const token = await AsyncStorage.getItem("auth_token");
    const encodedTenant = await AsyncStorage.getItem("auth_tenant");
    const deviceId = await getDeviceId();
    if (!token || !encodedTenant) throw new Error("Auth missing");
    const tenantId = Buffer.from(encodedTenant, "base64").toString("utf-8");
    return {
      Authorization: `Bearer ${token}`,
      "X-Tenant-ID": tenantId,
      "X-Device-ID": deviceId,
    };
  };

  const fetchHomework = async (pageNo: number, refresh = false) => {
    if (loading || (!hasMore && !refresh)) return;
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await axios.get(`${API_BASE_URL}homework/staff/getStaffHomeWork`, {
        params: { page: pageNo, size },
        headers,
      });
      const data: PageResponse<HomeworkItem> = res.data;
      setList((prev) => (refresh ? data.content : [...prev, ...data.content]));
      setHasMore(!data.last);
      setPage(data.pageNumber);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setHasMore(true);
    fetchHomework(0, true);
  };

  const confirmDelete = (id: string) => {
    setSelectedId(id);
    setConfirmVisible(true);
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    const previousList = list;
    try {
      setDeleteLoading(true);
      setDeletingId(selectedId);
      setList((prev) => prev.filter((i) => i.id !== selectedId));
      const headers = await getAuthHeaders();
      await axios.delete(`${API_BASE_URL}homework/deleteHomeWork/${selectedId}`, { headers });
    } catch (err) {
      setList(previousList);
      console.log("Delete error:", err);
    } finally {
      setDeleteLoading(false);
      setDeletingId(null);
      setConfirmVisible(false);
      setSelectedId(null);
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
        {/* ── Card Header ── */}
        <View style={styles.cardHeader}>
          <View style={styles.subjectBadge}>
            <Ionicons name="book-outline" size={13} color="#4C8EF7" />
            <Text style={styles.subjectBadgeText}>{item.subject ?? "—"}</Text>
          </View>
          <View style={styles.classBadge}>
            <Text style={styles.classBadgeText}>
              {"Class "}
              {item.className ?? ""}
              {item.section ? ` - ${item.section}` : ""}
            </Text>
          </View>
        </View>

        {/* ── Title ── */}
        <Text style={styles.title} numberOfLines={2}>{item.title ?? "Untitled"}</Text>

        {/* ── Dates ── */}
        <View style={styles.dateRow}>
          <View style={styles.dateChip}>
            <Ionicons name="calendar-outline" size={12} color="#6B7280" />
            <Text style={styles.dateChipText}>
              {"Assigned: "}
              {item.homeworkDate ?? "N/A"}
            </Text>
          </View>
          {item.dueDate ? (
            <View style={[styles.dateChip, styles.dueDateChip]}>
              <Ionicons name="time-outline" size={12} color="#EF4444" />
              <Text style={[styles.dateChipText, { color: "#EF4444" }]}>
                {"Due: "}
                {item.dueDate}
              </Text>
            </View>
          ) : null}
        </View>

        {/* ── Submissions link ── */}
        <View style={styles.submissionRow}>
          <Ionicons name="people-outline" size={13} color="#4C8EF7" />
          <Text style={styles.submissionText}>View Submissions</Text>
          <Ionicons name="chevron-forward" size={13} color="#4C8EF7" />
        </View>
      </Pressable>

      {/* ── Actions ── */}
      <View style={styles.divider} />
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.updateBtn]}
          onPress={() => onEdit(item)}
        >
          <Ionicons name="create-outline" size={15} color="#fff" />
          <Text style={styles.actionText}>Update</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.deleteBtn, deletingId === item.id && { opacity: 0.6 }]}
          onPress={() => confirmDelete(item.id)}
          disabled={deletingId === item.id}
        >
          {deletingId === item.id ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="trash-outline" size={15} color="#fff" />
              <Text style={styles.actionText}>Delete</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <FlatList
        data={list}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 12, paddingBottom: 30 }}
        refreshing={refreshing}
        onRefresh={onRefresh}
        onEndReached={() => fetchHomework(page + 1)}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          loading ? null : (
            <View style={styles.center}>
              <Ionicons name="document-text-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>No homework found</Text>
              <Text style={styles.emptySubText}>Pull down to refresh</Text>
            </View>
          )
        }
        ListFooterComponent={loading ? <LeaveSkeleton isDark={isDark} /> : null}
      />

      <ConfirmationModal
        visible={confirmVisible}
        loading={deleteLoading}
        icon="delete-outline"
        iconColor="#EF4444"
        iconBackgroundColor="#FEE2E2"
        title="Delete Homework"
        message="Are you sure you want to delete this homework? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonColor="#EF4444"
        onConfirm={handleDelete}
        onCancel={() => {
          setConfirmVisible(false);
          setSelectedId(null);
        }}
        isDark={isDark}
      />
    </View>
  );
};

export default CheckHomework;

function getStyles(theme: Theme) {
  return StyleSheet.create({
    center: {
      flex: 1,
      alignItems: "center",
      marginTop: 80,
    },
    emptyText: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.text,
      marginTop: 12,
    },
    emptySubText: {
      fontSize: 13,
      color: "#9CA3AF",
      marginTop: 4,
    },
    card: {
      backgroundColor: theme.card,
      borderRadius: 14,
      marginVertical: 6,
      borderWidth: 1,
      borderColor: theme.border,
      overflow: "hidden",
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingTop: 14,
      paddingBottom: 8,
    },
    subjectBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#EFF6FF",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 20,
      marginRight: 8,
    },
    subjectBadgeText: {
      fontSize: 12,
      fontWeight: "600",
      color: "#4C8EF7",
      marginLeft: 4,
    },
    classBadge: {
      backgroundColor: theme.background,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.border,
    },
    classBadgeText: {
      fontSize: 12,
      fontWeight: "500",
      color: theme.text,
    },
    title: {
      fontSize: 15,
      fontWeight: "700",
      color: theme.text,
      paddingHorizontal: 14,
      paddingBottom: 10,
      lineHeight: 22,
    },
    dateRow: {
      flexDirection: "row",
      paddingHorizontal: 14,
      paddingBottom: 10,
    },
    dateChip: {
      flexDirection: "row",
      alignItems: "center",
      marginRight: 10,
    },
    dueDateChip: {
      marginRight: 0,
    },
    dateChipText: {
      fontSize: 11,
      color: "#6B7280",
      marginLeft: 4,
      fontWeight: "500",
    },
    submissionRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingBottom: 14,
    },
    submissionText: {
      fontSize: 12,
      color: "#4C8EF7",
      fontWeight: "600",
      marginLeft: 4,
      marginRight: 2,
    },
    divider: {
      height: 1,
      backgroundColor: theme.border,
    },
    buttonRow: {
      flexDirection: "row",
      padding: 10,
    },
    actionBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 9,
      borderRadius: 8,
      marginHorizontal: 4,
    },
    updateBtn: {
      backgroundColor: "#2563EB",
    },
    deleteBtn: {
      backgroundColor: "#EF4444",
    },
    actionText: {
      color: "#fff",
      fontWeight: "700",
      fontSize: 13,
      marginLeft: 5,
    },
  });
}