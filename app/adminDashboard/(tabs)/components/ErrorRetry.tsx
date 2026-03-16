import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type ErrorRetryProps = {
  message: string;
  onRetry: () => void;
  isDark?: boolean;
  retryText?: string;
  loading?: boolean;
};

export default function ErrorRetry({
  message,
  onRetry,
  isDark = false,
  retryText = "Retry",
  loading = false,
}: ErrorRetryProps) {
  const colors = {
    bg: isDark ? "#0F172A" : "#F9FAFB",
    text: isDark ? "#E5E7EB" : "#111827",
    subText: isDark ? "#9CA3AF" : "#6B7280",
    error: isDark ? "#FCA5A5" : "#DC2626",
    button: "#3B82F6",
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Ionicons
        name="alert-circle-outline"
        size={64}
        color={colors.error}
      />

      <Text style={[styles.title, { color: colors.text }]}>
        Something went wrong
      </Text>

      <Text style={[styles.message, { color: colors.subText }]}>
        {message}
      </Text>

      <TouchableOpacity
        onPress={onRetry}
        activeOpacity={0.8}
        disabled={loading}
        style={[
          styles.button,
          { opacity: loading ? 0.7 : 1 },
        ]}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>{retryText}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "700",
  },
  message: {
    marginTop: 6,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  button: {
    marginTop: 20,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#3B82F6",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
});
