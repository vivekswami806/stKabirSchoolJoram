import { NotePriority, NoteStatus, TeacherNote } from "@/helper/teacherNotesDb";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

interface Props {
  note: TeacherNote;
  onStatusChange: (status: NoteStatus) => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const NoteCard: React.FC<Props> = ({
  note,
  onStatusChange,
  onEdit,
  onDelete
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(1));

  const statusConfig: Record<NoteStatus, { color: string; icon: keyof typeof Ionicons.glyphMap; label: string }> = {
    pending: { color: "#F59E0B", icon: "time-outline", label: "Pending" },
    completed: { color: "#10B981", icon: "checkmark-circle", label: "Completed" },
    failed: { color: "#EF4444", icon: "close-circle", label: "Failed" }
  };

  const priorityConfig: Record<NotePriority, { color: string; label: string }> = {
    high: { color: "#DC2626", label: "High" },
    medium: { color: "#F59E0B", label: "Medium" },
    low: { color: "#10B981", label: "Low" }
  };

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.97,
        duration: 100,
        useNativeDriver: true
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true
      })
    ]).start();
  };

  const currentStatus = statusConfig[note.status];
  const currentPriority = note.priority ? priorityConfig[note.priority] : null;

  return (
    <>
      <Animated.View
        style={[
          styles.card,
          { 
            borderLeftColor: currentStatus.color,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons 
              name={currentStatus.icon} 
              size={24} 
              color={currentStatus.color} 
            />
            <View style={styles.titleContainer}>
              <Text style={styles.title} numberOfLines={2}>
                {note.title}
              </Text>
              {note.category && (
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{note.category}</Text>
                </View>
              )}
            </View>
          </View>

          <TouchableOpacity 
            onPress={() => setShowMenu(true)}
            style={styles.menuButton}
          >
            <Ionicons name="ellipsis-vertical" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Description */}
        {note.description && (
          <Text style={styles.description} numberOfLines={3}>
            {note.description}
          </Text>
        )}

        {/* Metadata */}
        <View style={styles.metadata}>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={14} color="#6B7280" />
            <Text style={styles.metaText}>
              {note.dayType.charAt(0).toUpperCase() + note.dayType.slice(1)}
            </Text>
          </View>

          {currentPriority && (
            <View style={styles.metaItem}>
              <View 
                style={[
                  styles.priorityDot, 
                  { backgroundColor: currentPriority.color }
                ]} 
              />
              <Text style={styles.metaText}>{currentPriority.label}</Text>
            </View>
          )}

          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={14} color="#6B7280" />
            <Text style={styles.metaText}>
              {new Date(note.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Actions */}
        {note.status === "pending" && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.successBtn]}
              onPress={() => {
                handlePress();
                onStatusChange("completed");
              }}
            >
              <Ionicons name="checkmark" size={18} color="#fff" />
              <Text style={styles.actionBtnText}>Complete</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.failBtn]}
              onPress={() => {
                handlePress();
                onStatusChange("failed");
              }}
            >
              <Ionicons name="close" size={18} color="#fff" />
              <Text style={styles.actionBtnText}>Failed</Text>
            </TouchableOpacity>
          </View>
        )}

        {note.status !== "pending" && (
          <View style={styles.statusBadge}>
            <Ionicons 
              name={currentStatus.icon} 
              size={16} 
              color={currentStatus.color} 
            />
            <Text style={[styles.statusText, { color: currentStatus.color }]}>
              {currentStatus.label}
            </Text>
            {note.completedAt && (
              <Text style={styles.completedTime}>
                • {new Date(note.completedAt).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </Text>
            )}
          </View>
        )}
      </Animated.View>

      {/* Menu Modal */}
      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowMenu(false)}>
          <View style={styles.menuContainer}>
            {onEdit && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setShowMenu(false);
                  onEdit();
                }}
              >
                <Ionicons name="create-outline" size={20} color="#3B82F6" />
                <Text style={styles.menuText}>Edit Note</Text>
              </TouchableOpacity>
            )}

            {note.status === "pending" && (
              <>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setShowMenu(false);
                    onStatusChange("completed");
                  }}
                >
                  <Ionicons name="checkmark-circle-outline" size={20} color="#10B981" />
                  <Text style={styles.menuText}>Mark as Completed</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setShowMenu(false);
                    onStatusChange("failed");
                  }}
                >
                  <Ionicons name="close-circle-outline" size={20} color="#EF4444" />
                  <Text style={styles.menuText}>Mark as Failed</Text>
                </TouchableOpacity>
              </>
            )}

            {onDelete && (
              <TouchableOpacity
                style={[styles.menuItem, styles.deleteItem]}
                onPress={() => {
                  setShowMenu(false);
                  onDelete();
                }}
              >
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
                <Text style={[styles.menuText, styles.deleteText]}>Delete Note</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.menuItem, styles.cancelItem]}
              onPress={() => setShowMenu(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12
  },
  headerLeft: {
    flexDirection: "row",
    flex: 1,
    gap: 12
  },
  titleContainer: {
    flex: 1,
    gap: 6
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    lineHeight: 22
  },
  categoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6B7280",
    textTransform: "uppercase"
  },
  menuButton: {
    padding: 4
  },
  description: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
    marginBottom: 12
  },
  metadata: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 12
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  metaText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500"
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  successBtn: {
    backgroundColor: "#10B981"
  },
  failBtn: {
    backgroundColor: "#EF4444"
  },
  actionBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700"
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6"
  },
  statusText: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase"
  },
  completedTime: {
    fontSize: 12,
    color: "#9CA3AF"
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end"
  },
  menuContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingBottom: 24
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6"
  },
  menuText: {
    fontSize: 16,
    color: "#111827",
    fontWeight: "600"
  },
  deleteItem: {
    borderBottomWidth: 0
  },
  deleteText: {
    color: "#EF4444"
  },
  cancelItem: {
    borderBottomWidth: 0,
    justifyContent: "center",
    marginTop: 8
  },
  cancelText: {
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "600",
    textAlign: "center"
  }
});