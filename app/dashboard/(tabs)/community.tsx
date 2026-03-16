import { RootState } from "@/action/store";
import { ThemeContext } from "@/action/theme/ThemeContext";
import Skeleton from "@/components/Skeleton";
import { API_BASE_URL } from "@/config";
import { downloadDocument } from "@/helper/downloadDocument";
import { getDeviceId } from "@/helper/getDeviceId";

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Buffer } from "buffer";
import { router } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
import {
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ToastService } from "react-native-toastier";
import { useSelector } from "react-redux";

// ---------------- TYPES ----------------
interface StudentDocument {
  id: string;
  title: string;
  fileName: string;
  contentType: string;
  documentType: string;
  ownerName: string;
  ownerType: string;
  uploadedAt: string;
  fileSize?: number;
  ownerId: string;
}

// ---------------- COMPONENT ----------------
const StudentDocuments: React.FC = () => {
  const [docs, setDocs] = useState<StudentDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const themeState = useContext(ThemeContext);
  const { userDetail } = useSelector((state: RootState) => state.user);
  if (!themeState) return null;
  const { theme } = themeState;

  const styles = getStyles(theme);

  // ---------------- API ----------------
  const fetchDocuments = async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);

      const token = await AsyncStorage.getItem("auth_token");
      const encodedTenant = await AsyncStorage.getItem("auth_tenant");
      let auth_role = await AsyncStorage.getItem("auth_role");
      if (auth_role === "PARENT") auth_role = "STUDENT";
      if (auth_role === "STAFF") auth_role = "STAFF";
      const deviceId = await getDeviceId();

      if (!token || !encodedTenant) throw new Error("Auth missing");
      const tenantId = Buffer.from(encodedTenant, "base64").toString("utf-8");

      const res = await axios.get(
        `${API_BASE_URL}documents/my-documents/${auth_role}/${userDetail.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Tenant-ID": tenantId,
            "X-Device-ID": deviceId,
          },
        }
      );
      setDocs(
        res.data.data.map((doc: any, index: number) => ({
          id: index.toString(),
          title: doc.documentType,
          fileName: doc.fileName,
          contentType: doc.contentType,
          documentType: doc.documentType,
          ownerName: doc.ownerName,
          ownerType: doc.ownerType,
          uploadedAt: doc.uploadedAt,
          fileSize: doc.fileSize,
          ownerId: doc.ownerId
        }))
      );
    } catch (err: any) {
      ToastService.show({
        type: "danger",
        title: "Error",
        message:
          err.response?.data?.message ||
          err.message ||
          "Failed to fetch documents",
        duration: 2000,
        contentContainerStyle: { flex: 1 },
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  // ---------------- RENDER ITEM ----------------
  const renderItem = ({ item }: { item: StudentDocument }) => (
    <View style={styles.card}>
      {/* Top row */}
      <View style={styles.cardHeader}>
        <Text style={styles.title}>{item.title}</Text>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.ownerType}</Text>
        </View>
      </View>

      {/* Meta info */}
      <Text style={styles.subText}>Owner: {item.ownerName}</Text>

      {item.fileSize && (
        <Text style={styles.subText}>
          Size: {(item.fileSize / 1024).toFixed(2)} KB
        </Text>
      )}

      <Text style={styles.date}>
        Uploaded on {new Date(item.uploadedAt).toLocaleDateString()}
      </Text>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.viewBtn]}
          onPress={() =>
            downloadDocument(
              item.ownerType,
              item.ownerId,
              item.documentType,
              item.fileName,
              "open"
            ).catch(console.log)
          }
        >
          <Ionicons name="eye-outline" size={16} color="#fff" />
          <Text style={styles.btnText}>View</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.downloadBtn]}
          onPress={() =>
            downloadDocument(
              item.ownerType,
              item.ownerId,
              item.documentType,
              item.fileName,
              "open"
            ).catch(console.log)
          }
        >
          <Ionicons name="download-outline" size={16} color="#fff" />
          <Text style={styles.btnText}>Download</Text>
        </TouchableOpacity>
      </View>
    </View>
  );


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons
            name="arrow-back"
            size={22}
            color={theme.mode === "dark" ? "#fff" : "#111"}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Documents</Text>
      </View>

      {/* Content */}
      {loading ? (
        <Skeleton isDark={theme.mode === "dark"} />
      ) : (
        <FlatList
          data={docs}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchDocuments(true)}
              tintColor="#2563eb"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No documents uploaded yet.</Text>
            </View>
          }
          contentContainerStyle={{ padding: 16 }}
        />
      )}
    </SafeAreaView>
  );
};

export default StudentDocuments;

const getStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      paddingTop:16
    },

    /* Header */
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: theme.mode === "dark" ? "#2a2a2a" : "#e5e7eb",
    },
    backBtn: {
      padding: 6,
      borderRadius: 20,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "700",
      marginLeft: 12,
      color: theme.mode === "dark" ? "#fff" : "#111827",
    },

    /* Empty */
    emptyContainer: {
      alignItems: "center",
      marginTop: 120,
    },
    emptyText: {
      fontSize: 16,
      color: "#9CA3AF",
    },

    /* Card */
    card: {
      backgroundColor: theme.mode === "dark" ? "#1f2937" : "#ffffff",
      padding: 16,
      borderRadius: 16,
      marginBottom: 14,
      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 3,
    },

    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 6,
    },

    title: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.mode === "dark" ? "#F9FAFB" : "#1F2937",
    },

    badge: {
      backgroundColor: "#2563EB22",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
    },
    badgeText: {
      fontSize: 12,
      fontWeight: "600",
      color: "#2563EB",
    },

    subText: {
      fontSize: 14,
      color: "#9CA3AF",
      marginTop: 2,
    },

    date: {
      fontSize: 12,
      color: "#6B7280",
      marginTop: 8,
    },

    divider: {
      height: 1,
      backgroundColor: theme.mode === "dark" ? "#374151" : "#E5E7EB",
      marginVertical: 12,
    },

    /* Actions */
    actions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: 10,
    },

    actionBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 10,
    },

    viewBtn: {
      backgroundColor: "#2563EB",
    },

    downloadBtn: {
      backgroundColor: "#10B981",
    },

    btnText: {
      color: "#fff",
      fontWeight: "600",
      fontSize: 14,
    },
  });
