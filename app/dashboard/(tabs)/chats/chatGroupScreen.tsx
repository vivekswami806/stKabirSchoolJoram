import { RootState } from "@/action/store";
import { ThemeContext } from "@/action/theme/ThemeContext";
import { Theme } from "@/action/theme/themeReducer";
import { classes, sections } from "@/config";
import chatApiService, {
  ChatGroupAPI,
  StudentAPI,
} from "@/helper/chatApiService";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ToastService } from "react-native-toastier";
import { useSelector } from "react-redux";
import StudentFilters from "../../../../app/adminDashboard/(tabs)/components/StudentFilters";

const ChatGroupsScreen: React.FC = () => {
  const router = useRouter();
  const { userDetail } = useSelector((state: RootState) => state.user);

  /* ================= ROLE ================= */
  const [role, setRole] = useState<string>("");
  const [UserID, setUserID] = useState<string>("");
  useEffect(() => {
    AsyncStorage.getItem("auth_role").then((r) => {
      if (r) setRole(r);
    });
    AsyncStorage.getItem("auth_login_id").then((r) => {
      if (r) setUserID(r);
    });
  }, []);

  const themeState = useContext(ThemeContext);
  if (!themeState) return null;
  const { theme } = themeState;
  const styles = getStyles(theme);

  /* ================= STATE ================= */
  const [groups, setGroups] = useState<ChatGroupAPI[]>([]);
  const [students, setStudents] = useState<StudentAPI[]>([]);
  const [selectedPeople, setSelectedPeople] = useState<string[]>([]);

  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");

  const [classModalVisible, setClassModalVisible] = useState(false);
  const [sectionModalVisible, setSectionModalVisible] = useState(false);

  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupEmoji, setGroupEmoji] = useState("💬");
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  /* ================= LOAD GROUPS ================= */
  const loadGroups = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const data = await chatApiService.getGroups(UserID);
      setGroups(data);
    } catch {
      ToastService.show({
        type: "danger",
        message: "Failed to load groups",
        duration: 3000,
        contentContainerStyle: { flex: 1 },
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  /* ================= LOAD STUDENTS ================= */
  useEffect(() => {
    if (!showCreateModal || !selectedClass) return;

    chatApiService
      .getStudentsByClass(selectedClass, selectedSection)
      .then((data) => {
        const filtered = selectedSection
          ? data.filter((s) => s.classSection === selectedSection)
          : data;
        setStudents(filtered);
      })
      .catch(() => {
        ToastService.show({
          type: "danger",
          message: "Failed to load students",
          duration: 3000,
          contentContainerStyle: { flex: 1 },
        });
      });
  }, [selectedClass, selectedSection, showCreateModal]);

  /* ================= CREATE GROUP ================= */
  const createGroup = async () => {
    if (!groupName.trim()) {
      ToastService.show({
        type: "info",
        message: "Group name is required",
        duration: 3000,
        contentContainerStyle: { flex: 1 },
      });
      return;
    }
  
    if (!selectedClass || !selectedSection) {
      ToastService.show({
        type: "info",
        message: "Select class and section",
        duration: 3000,
        contentContainerStyle: { flex: 1 },
      });
      return;
    }
  
    if (!selectedPeople.length) {
      ToastService.show({
        type: "info",
        message: "Select at least one student",
        duration: 3000,
        contentContainerStyle: { flex: 1 },
      });
      return;
    }
  
    try {
      setCreating(true);
  
      // 🔥 Convert selectedPeople IDs to full member objects
      const members = students
        .filter((s) => selectedPeople.includes(s.id))
        .map((s) => ({
          userId: s.id,
          userName: s.name,
        }));
  
      await chatApiService.createGroup({
        name: groupName,
        description: "Official discussion group",
        groupType: "CLASS_SECTION",
        className: selectedClass,
        section: selectedSection,
        allowStudentMessages: true,
        announcementMode: false,
        members, // ✅ NEW STRUCTURE
      });
  
      // Reset modal state
      setShowCreateModal(false);
      setGroupName("");
      setSelectedPeople([]);
      setSelectedClass("");
      setSelectedSection("");
      setStudents([]);
  
      await loadGroups();
  
      ToastService.show({
        type: "success",
        message: "Group created successfully",
        duration: 3000,
        contentContainerStyle: { flex: 1 },
      });
    } catch (error) {
      ToastService.show({
        type: "danger",
        message: "Failed to create group",
        duration: 3000,
        contentContainerStyle: { flex: 1 },
      });
    } finally {
      setCreating(false);
    }
  };
  

  /* ================= DELETE GROUP ================= */
  // FIX: Alert confirmation FIRST, then delete — not the other way around
  const deleteGroup = (groupId: number) => {
    Alert.alert(
      "Delete Group",
      "Are you sure you want to delete this group? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setDeletingId(groupId);
              await chatApiService.deleteGroup(groupId);
              setGroups((prev) => prev.filter((g) => g.id !== groupId));
              ToastService.show({
                type: "success",
                message: "Group deleted successfully",
                duration: 3000,
                contentContainerStyle: { flex: 1 },
              });
            } catch {
              ToastService.show({
                type: "danger",
                message: "Failed to delete group",
                duration: 3000,
                contentContainerStyle: { flex: 1 },
              });
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  /* ================= CLOSE MODAL ================= */
  const closeModal = () => {
    setShowCreateModal(false);
    setGroupName("");
    setGroupEmoji("💬");
    setSelectedPeople([]);
    setSelectedClass("");
    setSelectedSection("");
    setStudents([]);
  };

  /* ================= FILTERED GROUPS ================= */
  const filteredGroups = groups.filter((g) =>
    g.name.toLowerCase().includes(searchText.toLowerCase())
  );

  /* ================= RENDER ================= */
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Chat Groups</Text>

      {/* Only teachers/admins can create groups */}
      {role !== "PARENT" && (
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="add-circle" size={26} color={theme.primary} />
          <Text style={styles.createText}>Create Group</Text>
        </TouchableOpacity>
      )}

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search groups"
          placeholderTextColor="#999"
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      <FlatList
        data={filteredGroups}
        keyExtractor={(i) => i.id.toString()}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadGroups(true)}
          />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="chatbubbles-outline"
                size={48}
                color="#999"
                style={{ marginBottom: 16 }}
              />
              <Text style={styles.emptyText}>No groups yet</Text>
              <Text style={styles.emptySubText}>
                {role !== "PARENT"
                  ? "Tap Create Group to get started"
                  : "No groups have been created for you yet"}
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={styles.groupItemContainer}>
            <TouchableOpacity
              style={styles.groupItem}
              onPress={() =>
                router.push({
                  pathname: "/dashboard/(tabs)/chats/chatApp",
                  params: {
                    id: item.id.toString(),
                    name: item.name,
                    members: item.memberCount.toString(),
                  },
                })
              }
              activeOpacity={0.7}
            >
              <View style={styles.groupContent}>
                <View style={styles.groupInfo}>
                  <Text style={styles.groupName}>{item.name}</Text>
                  <Text style={styles.groupMembers}>
                  <Text>{item.memberCount} members</Text>
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Only non-parents can delete */}
            {role !== "PARENT" && (
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => deleteGroup(item.id)}
                disabled={deletingId === item.id}
              >
                <Ionicons
                  name={deletingId === item.id ? "hourglass" : "trash"}
                  size={20}
                  color="#FF3B30"
                />
              </TouchableOpacity>
            )}
          </View>
        )}
      />

      {/* ================= CREATE GROUP MODAL ================= */}
      {showCreateModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Group</Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Group name"
              placeholderTextColor="#999"
              value={groupName}
              onChangeText={setGroupName}
            />

            {/* <TextInput
              style={styles.modalInput}
              placeholder="Emoji (e.g. 📚)"
              placeholderTextColor="#999"
              value={groupEmoji}
              onChangeText={setGroupEmoji}
              maxLength={2}
            /> */}

            <StudentFilters
              styles={styles}
              selectedDateStr=""
              classModalVisible={classModalVisible}
              setClassModalVisible={setClassModalVisible}
              sectionModalVisible={sectionModalVisible}
              setSectionModalVisible={setSectionModalVisible}
              classOptions={classes}
              sectionOptions={sections}
              selectedClass={selectedClass}
              setSelectedClass={setSelectedClass}
              selectedSection={selectedSection}
              setSelectedSection={setSelectedSection}
              onDatePress={() => { }}
              role={"STAFF" || "ADMIN"}
            />

            <Text style={styles.sectionTitle}>
              Students ({selectedPeople.length} selected)
            </Text>

            {students.length === 0 && selectedClass ? (
              <Text style={styles.noStudentsText}>
                No students found for this class/section
              </Text>
            ) : null}
            {students.length > 0 && (
              <TouchableOpacity
                style={styles.selectAllRow}
                onPress={() =>
                  setSelectedPeople(
                    selectedPeople.length === students.length
                      ? [] // all selected → deselect all
                      : students.map((s) => s.id) // select all
                  )
                }
              >
                <Ionicons
                  name={
                    selectedPeople.length === students.length && students.length > 0
                      ? "checkmark-circle"
                      : selectedPeople.length > 0
                        ? "remove-circle-outline"   // partial selection
                        : "ellipse-outline"
                  }
                  size={22}
                  color={
                    selectedPeople.length === students.length && students.length > 0
                      ? "#4CAF50"
                      : selectedPeople.length > 0
                        ? "#F09A1A"
                        : "#999"
                  }
                />
                <Text style={styles.selectAllText}>
                  {selectedPeople.length === students.length && students.length > 0
                    ? "Deselect All"
                    : "Select All"}
                </Text>
                <Text style={styles.selectAllCount}>
                  {selectedPeople.length}/{students.length}
                </Text>
              </TouchableOpacity>
            )}

            <FlatList
              data={students}
              keyExtractor={(s) => s.id}
              style={{ maxHeight: 300 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.personRow}
                  onPress={() =>
                    setSelectedPeople((p) =>
                      p.includes(item.id)
                        ? p.filter((id) => id !== item.id)
                        : [...p, item.id]
                    )
                  }
                >
                  <Text style={styles.studentName}>
                    {item.name} ({item.studentClass}-{item.classSection})
                  </Text>
                  {selectedPeople.includes(item.id) && (
                    <Ionicons name="checkmark-circle" size={22} color="#4CAF50" />
                  )}
                </TouchableOpacity>
              )}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={closeModal} style={styles.cancelBtnModal}>
                <Text style={styles.cancel}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.createBtnModal,
                  creating && { opacity: 0.6 },
                ]}
                onPress={createGroup}
                disabled={creating}
              >
                <Text style={styles.create}>
                  {creating ? "Creating..." : "Create Group"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

/* ================= STYLES ================= */
function getStyles(theme: Theme) {
  const isDark = theme.mode === "dark";
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? "#0B1220" : "#FFFFFF",
      paddingTop: Platform.OS === "ios" ? 50 : 20,
    },
    header: {
      fontSize: 28,
      fontWeight: "bold",
      textAlign: "center",
      marginVertical: 20,
      color: isDark ? "#FFF" : "#0B1220",
    },
    searchContainer: {
      flexDirection: "row",
      backgroundColor: isDark ? "#1A1A2E" : "#f5f5f5",
      marginHorizontal: 16,
      marginVertical: 10,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: "center",
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      marginLeft: 10,
      color: isDark ? "#FFF" : "#000",
    },
    groupItemContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginHorizontal: 16,
      marginVertical: 8,
      borderRadius: 12,
      backgroundColor: isDark ? "#1A1A2E" : "#f9f9f9",
      overflow: "hidden",
    },
    groupItem: {
      flex: 1,
      flexDirection: "row",
      paddingVertical: 12,
      paddingHorizontal: 16,
      alignItems: "center",
    },
    groupContent: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
    },
    groupEmoji: { fontSize: 32, marginRight: 12 },
    groupInfo: { flex: 1 },
    groupName: {
      fontSize: 17,
      fontWeight: "600",
      color: isDark ? "#FFF" : "#0B1220",
      marginBottom: 4,
    },
    groupMembers: { fontSize: 14, color: isDark ? "#999" : "#666" },
    deleteBtn: {
      padding: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingTop: 80,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: "600",
      color: isDark ? "#FFF" : "#0B1220",
      marginBottom: 8,
    },
    emptySubText: { fontSize: 14, color: isDark ? "#999" : "#666" },
    createBtn: {
      flexDirection: "row",
      alignSelf: "center",
      alignItems: "center",
      marginBottom: 10,
      paddingVertical: 8,
      paddingHorizontal: 16,
    },
    createText: {
      marginLeft: 6,
      color: theme.primary,
      fontWeight: "600",
      fontSize: 16,
    },
    /* ---- Modal ---- */
    modalOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000,
    },
    modal: {
      width: "92%",
      maxHeight: "90%",
      backgroundColor: isDark ? "#1A1A2E" : "#fff",
      borderRadius: 16,
      padding: 20,
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: isDark ? "#FFF" : "#000",
    },
    modalInput: {
      borderWidth: 1,
      borderColor: isDark ? "#333" : "#ddd",
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
      fontSize: 16,
      color: isDark ? "#FFF" : "#000",
      backgroundColor: isDark ? "#111" : "#fafafa",
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: "600",
      color: isDark ? "#fff" : "#0B1220",
      marginVertical: 10,
    },
    noStudentsText: {
      fontSize: 14,
      color: isDark ? "#888" : "#aaa",
      textAlign: "center",
      marginVertical: 8,
    },
    personRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderBottomWidth: 1,
      borderColor: isDark ? "#333" : "#eee",
    },
    studentName: { fontSize: 15, color: isDark ? "#FFF" : "#0B1220" },
    modalActions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: 12,
      marginTop: 16,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: isDark ? "#333" : "#eee",
    },
    cancelBtnModal: {
      borderRadius: 8,
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderWidth: 1,
      borderColor: "#ff3333",
    },
    cancel: { color: "#ff3333", fontWeight: "600", fontSize: 15 },
    createBtnModal: {
      backgroundColor: "#006600",
      borderRadius: 8,
      paddingVertical: 10,
      paddingHorizontal: 20,
    },
    create: { color: "#fff", fontWeight: "600", fontSize: 15 },
    /* ---- Shared dropdown styles for StudentFilters ---- */
    filterButton: {
      flex: 1,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: isDark ? "#444" : "#ddd",
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDark ? "#111" : "#fff",
    },
    filterContainer: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 12,
    },
    modalContainer: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.3)",
      justifyContent: "center",
      paddingHorizontal: 20,
    },
    modalBox: {
      backgroundColor: isDark ? "#1A1A2E" : "#fff",
      borderRadius: 12,
      paddingVertical: 10,
    },
    modalItem: {
      paddingVertical: 14,
      paddingHorizontal: 15,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? "#333" : "#eee",
    },
    modalItemText: { fontSize: 16, color: isDark ? "#fff" : "#333" },
    classDropdown: {
      flex: 1,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 14,
      backgroundColor: isDark ? "#111" : "white",
      borderRadius: 10,
      borderWidth: 1,
      borderColor: isDark ? "#444" : "#ddd",
    },
    dropdownText: { fontSize: 15, color: isDark ? "#fff" : "#495057" },
    dropdownIcon: { fontSize: 14, color: "#6c757d" },
    selectedText: { fontSize: 16, color: isDark ? "#fff" : "#333" },
    selectAllRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 10,
      paddingHorizontal: 12,
      marginBottom: 4,
      backgroundColor: isDark ? "#151F2E" : "#F5F8FF",
      borderRadius: 8,
      gap: 10,
      borderWidth: 1,
      borderColor: isDark ? "#2A3A50" : "#DDE6FF",
    },
    selectAllText: {
      flex: 1,
      fontSize: 14,
      fontWeight: "600",
      color: isDark ? "#A0B8D0" : "#445",
    },
    selectAllCount: {
      fontSize: 13,
      color: isDark ? "#6A85A0" : "#888",
      fontWeight: "500",
    },
  });
}

export default ChatGroupsScreen;