import React from "react";
import { StyleSheet, View } from "react-native";

const Skeleton = ({ isDark }: { isDark: boolean }) => {
  return (
    <View style={{ padding: 16 }}>
      {[1, 2, 3].map((_, i) => (
        <View
          key={i}
          style={[
            styles.card,
            { backgroundColor: isDark ? "#1f2933" : "#fff" },
          ]}
        >
          <View style={styles.lineLarge} />
          <View style={styles.lineSmall} />
          <View style={styles.btnRow}>
            <View style={styles.btnSkeleton} />
            <View style={styles.btnSkeleton} />
          </View>
        </View>
      ))}
    </View>
  );
};

export default Skeleton;

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
  },
  lineLarge: {
    height: 14,
    backgroundColor: "#e5e7eb",
    borderRadius: 4,
    width: "70%",
    marginBottom: 10,
  },
  lineSmall: {
    height: 10,
    backgroundColor: "#e5e7eb",
    borderRadius: 4,
    width: "40%",
    marginBottom: 16,
  },
  btnRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  btnSkeleton: {
    width: 60,
    height: 24,
    backgroundColor: "#e5e7eb",
    borderRadius: 6,
  },
});
