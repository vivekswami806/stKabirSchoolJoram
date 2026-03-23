import { RootState } from "@/action/store";
import { ThemeContext } from "@/action/theme/ThemeContext";
import { Theme } from "@/action/theme/themeReducer";
import {
    DayType,
    NoteStatus,
    TeacherNote,
    addNote,
    deleteNote,
    getNotes,
    getPendingNotesCount,
    getStats,
    handleDailyUpdate,
    updateStatus,
    waitForDbReady
} from "@/helper/teacherNotesDb";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useContext, useEffect, useState } from "react";
import {
    Alert, FlatList, Modal, RefreshControl, ScrollView, StyleSheet,
    Text, TextInput, TouchableOpacity,
    View
} from "react-native";
import { useSelector } from "react-redux";
import { NoteCard } from "./components/NoteCard";

export default function TeacherNotesScreen() {
  const themeState = useContext(ThemeContext);
  const { userDetail } = useSelector((state: RootState) => state.user);
  if (!themeState) return null;
  const { theme } = themeState;
  const isDark = theme.mode
  const styles = getStyles(theme);
  
  const [notes, setNotes] = useState<TeacherNote[]>([]);
  const [selectedDay, setSelectedDay] = useState<DayType>("today");
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [dbReady, setDbReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [newNote, setNewNote] = useState<{
    title: string;
    description: string;
    priority: "low" | "medium" | "high";
    category: string;
  }>({
    title: "",
    description: "",
    priority: "medium",
    category: ""
  });
  const [popup, setPopup] = useState({
    visible: false,
    type: "success" as "success" | "error" | "failed",
    message: ""
  });
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    failed: 0,
    pending: 0,
    successRate: 0
  });
  const [pendingCounts, setPendingCounts] = useState<Record<DayType, number>>({
    yesterday: 0,
    today: 0,
    tomorrow: 0
  });

  const showPopup = (type: "success" | "error" | "failed", message: string) => {
    setPopup({ visible: true, type, message });
  };

  // Initialize DB on mount
  useEffect(() => {
    let isMounted = true;

    const setup = async () => {
      try {
        // Wait for DB to be ready
        await waitForDbReady();
        
        if (isMounted) {
          handleDailyUpdate();
          setDbReady(true);
          setInitError(null);
        }
      } catch (error) {
        console.error("Database initialization failed:", error);
        if (isMounted) {
          setInitError(error instanceof Error ? error.message : "Failed to initialize database");
          setDbReady(false);
        }
      }
    };

    setup();

    return () => {
      isMounted = false;
    };
  }, []);

  // Load notes when day changes or DB is ready
  const loadNotes = useCallback(() => {
    if (!dbReady) return;
    
    try {
      const fetchedNotes = getNotes({ dayType: selectedDay });
      setNotes(fetchedNotes);
      
      // Update stats
      const dayStats = getStats(selectedDay);
      setStats(dayStats);
      
      // Update pending counts for all days
      setPendingCounts({
        yesterday: getPendingNotesCount("yesterday"),
        today: getPendingNotesCount("today"),
        tomorrow: getPendingNotesCount("tomorrow")
      });
    } catch (error) {
      console.error("Failed to load notes:", error);
      showPopup("error", "Failed to load notes");
    }
  }, [dbReady]);

  useEffect(() => {
    if (dbReady) {
      loadNotes();
    }
  }, [selectedDay, dbReady, loadNotes]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    loadNotes();
    setRefreshing(false);
  }, [loadNotes]);

  const handleAddNote = () => {
    if (!newNote.title.trim()) {
      showPopup("error", "Please enter a title");
      return;
    }

    try {
      addNote({
        title: newNote.title,
        description: newNote.description,
        dayType: selectedDay,
        status: "pending",
        priority: newNote.priority,
        category: newNote.category || undefined,
        createdAt: new Date().toISOString()
      });

      setNewNote({
        title: "",
        description: "",
        priority: "medium",
        category: ""
      });
      setShowAddModal(false);
      loadNotes();
      showPopup("success", "Note added successfully!");
    } catch (error) {
      console.error("Failed to add note:", error);
      showPopup("error", "Failed to add note");
    }
  };

  const handleStatusChange = (noteId: number, status: NoteStatus) => {
    try {
      updateStatus(noteId, status);
      loadNotes();
      showPopup(
        status === "completed" ? "success" : "failed",
        status === "completed" ? "Task completed!" : "Task marked as failed"
      );
    } catch (error) {
      console.error("Failed to update status:", error);
      showPopup("error", "Failed to update status");
    }
  };

  const handleDeleteNote = (noteId: number) => {
    Alert.alert(
      "Delete Note",
      "Are you sure you want to delete this note?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            try {
              deleteNote(noteId);
              loadNotes();
              showPopup("success", "Note deleted");
            } catch (error) {
              console.error("Failed to delete note:", error);
              showPopup("error", "Failed to delete note");
            }
          }
        }
      ]
    );
  };

  const dayTabs: { key: DayType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: "yesterday", label: "Yesterday", icon: "chevron-back" },
    { key: "today", label: "Today", icon: "today" },
    { key: "tomorrow", label: "Tomorrow", icon: "chevron-forward" }
  ];

  // Show error state if initialization failed
  if (initError) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push("/")}>
            <Ionicons name="arrow-back" size={26} color={styles.icon.color} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Teacher Notes</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text style={styles.emptyTitle}>Error</Text>
          <Text style={styles.emptyText}>{initError}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setInitError(null);
              setDbReady(false);
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Show loading state while DB initializes
  if (!dbReady) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push("/")}>
            <Ionicons name="arrow-back" size={26} color={styles.icon.color} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Teacher Notes</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="hourglass-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>Initializing...</Text>
          <Text style={styles.emptyText}>Setting up your notes</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push("/")}>
          <Ionicons name="arrow-back" size={26} color={styles.icon.color} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Teacher Notes</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Stats Card */}
      {stats.total > 0 && (
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: "#10B981" }]}>
              {stats.completed}
            </Text>
            <Text style={styles.statLabel}>Done</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: "#EF4444" }]}>
              {stats.failed}
            </Text>
            <Text style={styles.statLabel}>Failed</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: "#F59E0B" }]}>
              {stats.successRate}%
            </Text>
            <Text style={styles.statLabel}>Success</Text>
          </View>
        </View>
      )}

      {/* Day Tabs */}
      <View style={styles.tabsContainer}>
        {dayTabs.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              selectedDay === tab.key && styles.activeTab
            ]}
            onPress={() => setSelectedDay(tab.key)}
          >
            <Ionicons
              name={tab.icon}
              size={18}
              color={selectedDay === tab.key ? "#3B82F6" : "#6B7280"}
            />
            <Text
              style={[
                styles.tabText,
                selectedDay === tab.key && styles.activeTabText
              ]}
            >
              {tab.label}
            </Text>
            {pendingCounts[tab.key] > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {pendingCounts[tab.key]}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Notes List */}
      <FlatList
        data={notes}
        keyExtractor={item => item.id?.toString() || ""}
        renderItem={({ item }) => (
          <NoteCard
            note={item}
            onStatusChange={status => handleStatusChange(item.id!, status)}
            onDelete={() => handleDeleteNote(item.id!)}
          />
        )}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No notes yet</Text>
            <Text style={styles.emptyText}>
              Tap the + button to add your first note
            </Text>
          </View>
        }
      />

      {/* Add Note Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Note</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter note title"
                value={newNote.title}
                placeholderTextColor={isDark == "dark" ? "#fff" : "#000"} 
                onChangeText={text => setNewNote(prev => ({ ...prev, title: text }))}
              />

              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter note description"
                value={newNote.description}
                onChangeText={text =>
                  setNewNote(prev => ({ ...prev, description: text }))
                }
                multiline
                placeholderTextColor={isDark == "dark" ? "#fff" : "#000"} 
                numberOfLines={4}
              />

              <Text style={styles.inputLabel}>Category</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Homework, Meeting, Reminder"
                value={newNote.category}
                placeholderTextColor={isDark == "dark" ? "#fff" : "#000"} 
                onChangeText={text =>
                  setNewNote(prev => ({ ...prev, category: text }))
                }
              />

              <Text style={styles.inputLabel}>Priority</Text>
              <View style={styles.priorityButtons}>
                {(["low", "medium", "high"] as const).map(priority => (
                  <TouchableOpacity
                    key={priority}
                    style={[
                      styles.priorityButton,
                      newNote.priority === priority && styles.priorityButtonActive
                    ]}
                    onPress={() =>
                      setNewNote(prev => ({ ...prev, priority }))
                    }
                  >
                    <Text
                      style={[
                        styles.priorityButtonText,
                        newNote.priority === priority &&
                          styles.priorityButtonTextActive
                      ]}
                    >
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleAddNote}
              >
                <Text style={styles.saveButtonText}>Add Note</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function getStyles(theme: Theme) {
  const isDark = theme.mode === "dark";

  const colors = {
    background: isDark ? "#0F172A" : "#F9FAFB",
    card: isDark ? "#1E293B" : "#FFFFFF",
    border: isDark ? "#334155" : "#E5E7EB",
    textPrimary: isDark ? "#F1F5F9" : "#111827",
    textSecondary: isDark ? "#94A3B8" : "#6B7280",
    inputBg: isDark ? "#1E293B" : "#F9FAFB",
    tabBg: isDark ? "#1E293B" : "#FFFFFF",
    activeTabBg: isDark ? "#1E3A8A20" : "#EFF6FF",
    modalBg: isDark ? "#1E293B" : "#FFFFFF",
    cancelBtn: isDark ? "#334155" : "#F3F4F6",
    accent: "#3B82F6",
    danger: "#EF4444",
    success: "#10B981",
    warning: "#F59E0B",
  };

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      paddingHorizontal: 7,
      paddingTop: 25,
    },

    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: theme.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },

    headerTitle: {
      fontSize: 24,
      fontWeight: "700",
      color: colors.textPrimary,
    },

    icon: {
      color: colors.textPrimary,
    },

    addButton: {
      backgroundColor: colors.accent,
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 4,
    },

    statsCard: {
      flexDirection: "row",
      backgroundColor: colors.card,
      marginHorizontal: 20,
      marginTop: 16,
      paddingVertical: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },

    statItem: {
      flex: 1,
      alignItems: "center",
    },

    statValue: {
      fontSize: 24,
      fontWeight: "700",
      color: colors.textPrimary,
    },

    statLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
    },

    statDivider: {
      width: 1,
      backgroundColor: colors.border,
    },

    tabsContainer: {
      flexDirection: "row",
      paddingHorizontal: 20,
      marginTop: 16,
      gap: 8,
    },

    tab: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 12,
      borderRadius: 10,
      backgroundColor: colors.tabBg,
      borderWidth: 2,
      borderColor: colors.border,
    },

    activeTab: {
      backgroundColor: colors.activeTabBg,
      borderColor: colors.accent,
    },

    tabText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textSecondary,
    },

    activeTabText: {
      color: colors.accent,
    },

    badge: {
      backgroundColor: colors.danger,
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 6,
    },

    badgeText: {
      color: "#fff",
      fontSize: 11,
      fontWeight: "700",
    },

    listContainer: {
      padding: 20,
      flexGrow: 1,
    },

    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 60,
    },

    emptyTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.textSecondary,
      marginTop: 16,
    },

    emptyText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 8,
      textAlign: "center",
    },

    retryButton: {
      marginTop: 20,
      paddingHorizontal: 24,
      paddingVertical: 12,
      backgroundColor: colors.accent,
      borderRadius: 8,
    },

    retryButtonText: {
      color: "#fff",
      fontWeight: "600",
      fontSize: 16,
    },

    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "flex-end",
    },

    modalContent: {
      backgroundColor: colors.modalBg,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: "90%",
    },

    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },

    modalTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.textPrimary,
    },

    modalBody: {
      padding: 20,
    },

    inputLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.textSecondary,
      marginBottom: 8,
      marginTop: 12,
    },

    input: {
      backgroundColor: colors.inputBg,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 15,
      color: colors.textPrimary,
    },

    textArea: {
      height: 100,
      textAlignVertical: "top",
    },

    priorityButtons: {
      flexDirection: "row",
      gap: 8,
    },

    priorityButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 10,
      backgroundColor: colors.inputBg,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: "center",
    },

    priorityButtonActive: {
      backgroundColor: colors.activeTabBg,
      borderColor: colors.accent,
    },

    priorityButtonText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.textSecondary,
    },

    priorityButtonTextActive: {
      color: colors.accent,
    },

    modalFooter: {
      flexDirection: "row",
      gap: 12,
      padding: 20,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },

    modalButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 10,
      alignItems: "center",
    },

    cancelButton: {
      backgroundColor: colors.cancelBtn,
    },

    cancelButtonText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.textSecondary,
    },

    saveButton: {
      backgroundColor: colors.accent,
    },

    saveButtonText: {
      fontSize: 16,
      fontWeight: "700",
      color: "#fff",
    },
  });
}
