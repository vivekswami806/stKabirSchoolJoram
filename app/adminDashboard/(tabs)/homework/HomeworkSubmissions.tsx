import { API_BASE_URL } from "@/config";
import { downloadAndHandleFile } from "@/helper/downloadFile";
import { getDeviceId } from "@/helper/getDeviceId";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Buffer } from "buffer";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";


interface FileItem {
  id: string;
  fileName: string;
  fileSizeFormatted: string;
  expiryDate: string;
  expired: boolean;
  fileType: string;
  uploadedAt: string;
}

interface SubmissionItem {
  submissionId: string;
  studentName: string;
  admissionNumber: string;
  status: string;
  submittedAt: string;
  remarks?: string;
  files: FileItem[];
}

const HomeworkSubmissions = () => {
  const { homeworkId, className, section, title } = useLocalSearchParams<{
    homeworkId: string;
    className: string;
    section: string;
    title: string;
  }>();

  const [list, setList] = useState<SubmissionItem[]>([]);
  const [total, setTotal] = useState(0);

  const fetchSubmissions = async () => {
    try {
      const token = await AsyncStorage.getItem("auth_token");
      const encodedTenant = await AsyncStorage.getItem("auth_tenant");
      const deviceId = await getDeviceId();
      if (!token || !encodedTenant) throw new Error("Auth missing");

      const tenantId = Buffer.from(encodedTenant, "base64").toString("utf-8");

      const res = await axios.get(
        `${API_BASE_URL}homework/staff/submissions/${homeworkId}`,
        {
          params: { className, section, page: 0, size: 20 },
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Tenant-ID": tenantId,
            'X-Device-ID': deviceId
          },
        }
      );
      // console.log("---submitHomehowr,", res.data);

      setList(res.data.content);
      setTotal(res.data.totalElements);
    } catch (error) {
      console.error("Fetch submissions error:", error);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const statusColors: Record<string, string> = {
    SUBMITTED: "#22c55e", // green
    LATE: "#ef4444", // red
    PENDING: "#f59e0b", // amber
  };

  // Helper to render file thumbnail or icon
  const renderFileThumbnail = (file: FileItem) => {
    //  console.log("---file: FileItem|", file);
     
    if (file.fileType.startsWith("image/")) {
      // Assume file URL can be constructed or is accessible; otherwise, skip
      // For example, if your API provides file URLs, replace below URL
      // Here, we just show an icon placeholder for demo
      return (
        <Image
          source={{ uri: `https://yourcdn.com/files/${file.id}` }} // Replace with your actual file URL
          style={styles.fileThumbnail}
          resizeMode="cover"
        />
      );
    }
    // Otherwise generic file icon
    return (
      <MaterialIcons name="insert-drive-file" size={40} color="#64748b" />
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() =>
          router.replace("/staffDashboard/(tabs)/homework/homework")
        }
      >
        <MaterialIcons name="arrow-back" size={28} color="#1e293b" />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <Text style={styles.header}>{title}</Text>
      <Text style={styles.count}>{total} student(s) submitted</Text>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      >
      {list.length === 0 && (
  <Text style={styles.emptyText}>No submissions found.</Text>
)}

{list.map((item, idx) => (
  <View key={item.submissionId ?? idx} style={styles.card}>
    <Text style={styles.name}>{item.studentName ?? "Unknown Student"}</Text>
    <Text style={styles.admissionNumber}>
      Admission #: {item.admissionNumber ?? "-"}
    </Text>

    <View style={styles.statusRow}>
      <View
        style={[
          styles.statusBadge,
          { backgroundColor: statusColors[item.status] || "#6b7280" },
        ]}
      >
        <Text style={styles.statusText}>{item.status ?? "N/A"}</Text>
      </View>
      <Text style={styles.date}>
        Submitted: {item.submittedAt
          ? new Date(item.submittedAt).toLocaleString()
          : "-"}
      </Text>
    </View>

    {item.remarks ? (
      <Text style={styles.remarks}>Remarks: {item.remarks}</Text>
    ) : null}

    {(item.files ?? []).length > 0 && (
      <>
        <Text style={styles.attachmentsHeader}>Attachments:</Text>
        <FlatList
          data={item.files ?? []}
          horizontal
          keyExtractor={(file, fIdx) => file.id ?? fIdx.toString()}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 8 }}
          renderItem={({ item: file }) => (
            <View style={styles.fileCard}>
              {renderFileThumbnail(file)}

              <Text style={styles.fileName} numberOfLines={1}>
                {file.fileName ?? "Unknown"}
              </Text>

              <Text style={styles.fileMeta}>
                Size: {file.fileSizeFormatted ?? "-"}
              </Text>

              <Text
                style={[
                  styles.fileMeta,
                  file.expired && { color: "#ef4444" },
                ]}
              >
                Expires: {file.expiryDate
                  ? new Date(file.expiryDate).toLocaleDateString()
                  : "-"}
              </Text>

              <View style={styles.fileActions}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() =>
                    downloadAndHandleFile(file.id, file.fileName, "open")
                  }
                >
                  <MaterialIcons name="download" size={18} color="#2563eb" />
                  <Text style={styles.actionText}>Download</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() =>
                    downloadAndHandleFile(file.id, file.fileName, "share")
                  }
                >
                  <MaterialIcons name="share" size={18} color="#16a34a" />
                  <Text style={styles.actionText}>Share</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      </>
    )}
  </View>
))}

      </ScrollView>
    </View>
  );
};

export default HomeworkSubmissions;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    paddingTop: 32,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 8,
  },
  backText: {
    fontSize: 16,
    color: "#1e293b",
    marginLeft: 4,
    fontWeight: "600",
  },
  header: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0f172a",
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  count: {
    paddingHorizontal: 16,
    fontSize: 14,
    color: "#475569",
    marginBottom: 12,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 18,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  name: {
    fontWeight: "700",
    fontSize: 18,
    color: "#1e293b",
  },
  admissionNumber: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 8,
    fontStyle: "italic",
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  date: {
    fontSize: 12,
    color: "#64748b",
  },
  remarks: {
    marginTop: 6,
    fontStyle: "italic",
    color: "#475569",
    fontSize: 13,
  },
  attachmentsHeader: {
    marginTop: 10,
    fontWeight: "700",
    color: "#334155",
  },
  fileCard: {
    width: 120,
    backgroundColor: "#e2e8f0",
    borderRadius: 10,
    padding: 8,
    marginRight: 10,
    alignItems: "center",
  },
  fileThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 6,
    marginBottom: 6,
    backgroundColor: "#cbd5e1",
  },
  fileName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1e293b",
  },
  fileMeta: {
    fontSize: 10,
    color: "#475569",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    color: "#94a3b8",
    fontSize: 16,
  },
  fileActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },

  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  actionText: {
    fontSize: 12,
    color: "#334155",
  },

});
