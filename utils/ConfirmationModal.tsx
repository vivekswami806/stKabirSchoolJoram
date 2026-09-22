import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

interface ConfirmationModalProps {
  visible: boolean;
  loading?: boolean;
  icon?: keyof typeof MaterialIcons.glyphMap;
  iconColor?: string;
  iconBackgroundColor?: string;

  title: string;
  message: string;

  confirmText?: string;
  cancelText?: string;

  confirmButtonColor?: string;

  onConfirm: () => void;
  onCancel: () => void;

  isDark?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  loading = false,
  icon = "delete-outline",
  iconColor = "#EF4444",
  iconBackgroundColor = "#FEE2E2",

  title,
  message,

  confirmText = "Delete",
  cancelText = "Cancel",

  confirmButtonColor = "#EF4444",

  onConfirm,
  onCancel,

  isDark = false,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: isDark ? "#1F2937" : "#fff",
            },
          ]}
        >
          <View
            style={[
              styles.iconWrapper,
              { backgroundColor: iconBackgroundColor },
            ]}
          >
            <MaterialIcons
              name={icon}
              size={40}
              color={iconColor}
            />
          </View>

          <Text
            style={[
              styles.title,
              { color: isDark ? "#fff" : "#111827" },
            ]}
          >
            {title}
          </Text>

          <Text
            style={[
              styles.message,
              { color: isDark ? "#D1D5DB" : "#6B7280" },
            ]}
          >
            {message}
          </Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancel}
              disabled={loading}
            >
              <Text
                style={{
                  color: isDark ? "#fff" : "#111827",
                  fontWeight: "600",
                }}
              >
                {cancelText}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.confirmButton,
                { backgroundColor: confirmButtonColor },
              ]}
              onPress={onConfirm}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.confirmText}>
                  {confirmText}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ConfirmationModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },

  container: {
    width: "85%",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
  },

  iconWrapper: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
  },

  message: {
    marginTop: 8,
    textAlign: "center",
    fontSize: 15,
    lineHeight: 22,
  },

  buttonRow: {
    flexDirection: "row",
    marginTop: 24,
  },

  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginRight: 8,
  },

  confirmButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginLeft: 8,
  },

  confirmText: {
    color: "#fff",
    fontWeight: "700",
  },
});