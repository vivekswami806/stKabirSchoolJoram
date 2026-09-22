import React from "react";
import { DimensionValue, StyleSheet, View } from "react-native";

const SkeletonBlock = ({
  width,
  height,
}: {
  width: DimensionValue;
  height: number;
}) => (
  <View
    style={{
      width,
      height,
      backgroundColor: "#e5e7eb",
      borderRadius: 6,
    }}
  />
);

const ExamResultSkeleton = ({ isDark }: { isDark: boolean }) => {
  const cardColor = isDark ? "#1f2933" : "#fff";

  return (
    <View style={styles.container}>
      {/* Student Card */}
      <View style={[styles.card, { backgroundColor: cardColor }]}>
        <SkeletonBlock width="100%" height={20} />
        <View style={{ height: 10 }} />
        <SkeletonBlock width="30%" height={12} />
        <View style={{ height: 8 }} />
        <SkeletonBlock width="50%" height={12} />
      </View>

      {/* Score Card */}
      <View style={[styles.card, { backgroundColor: cardColor }]}>
        <View style={styles.scoreRow}>
          <View style={styles.circle} />

          <View style={{ flex: 1, marginLeft: 16 }}>
            <SkeletonBlock width="50%" height={14} />
            <View style={{ height: 10 }} />
            <SkeletonBlock width="40%" height={18} />
            <View style={{ height: 8 }} />
            <SkeletonBlock width="60%" height={12} />
            <View style={{ height: 8 }} />
            <SkeletonBlock width="45%" height={12} />
          </View>
        </View>
      </View>

      {/* Subject Cards */}
      {[1, 2, 3, 4].map((item) => (
        <View
          key={item}
          style={[styles.card, { backgroundColor: cardColor }]}
        >
          <SkeletonBlock width="65%" height={18} />

          <View style={{ height: 14 }} />

          {/* Progress */}
          <SkeletonBlock width="100%" height={8} />

          <View style={{ height: 16 }} />

          <View style={styles.marksRow}>
            <SkeletonBlock width={70} height={35} />
            <SkeletonBlock width={70} height={35} />
            <SkeletonBlock width={70} height={35} />
          </View>
        </View>
      ))}
    </View>
  );
};

export default ExamResultSkeleton;

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },

  card: {
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
  },

  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  circle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#e5e7eb",
  },

  marksRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});