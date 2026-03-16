import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, StyleSheet, View } from "react-native";

export default function LeaveSkeleton({ isDark }: { isDark: boolean }) {
  const shimmerValue = useRef(new Animated.Value(-1)).current;
  const screenWidth = Dimensions.get("window").width;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerValue, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    ).start();
  }, [shimmerValue]);

  const translateX = shimmerValue.interpolate({
    inputRange: [-1, 1],
    outputRange: [-screenWidth, screenWidth],
  });

  const baseColor = isDark ? "#1F2937" : "#E5E7EB";
  const highlightColor = isDark ? "#374151" : "#F3F4F6";

  return (
    <View style={styles.container}>
      {Array.from({ length: 6 }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.card,
            {
              backgroundColor: baseColor,
              shadowColor: isDark ? "#000" : "#AAA",
            },
          ]}
        >
          <View style={styles.row}>
            <View style={styles.blockSmall} />
            <View style={styles.blockMedium} />
          </View>

          <View style={styles.divider} />

          <View style={styles.blockLarge} />
          <View style={styles.blockSmall} />

          {/* Shimmer Overlay */}
          <Animated.View
            style={[
              styles.shimmer,
              {
                transform: [{ translateX }],
                backgroundColor: highlightColor,
              },
            ]}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 12, paddingTop: 12 },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3, // Android shadow
  },
  row: { flexDirection: "row", justifyContent: "space-between" },
  blockSmall: {
    width: "35%",
    height: 12,
    borderRadius: 6,
    backgroundColor: "#D1D5DB",
    marginTop: 8,
  },
  blockMedium: {
    width: "20%",
    height: 12,
    borderRadius: 6,
    backgroundColor: "#D1D5DB",
  },
  blockLarge: {
    width: "75%",
    height: 14,
    borderRadius: 6,
    backgroundColor: "#D1D5DB",
    marginTop: 12,
  },
  divider: {
    height: 1,
    backgroundColor: "#CBD5E1",
    marginVertical: 12,
    borderRadius: 1,
  },
  shimmer: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "30%",
    height: "100%",
    opacity: 0.3,
  },
});
