import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet } from "react-native";

export default function LectureSkeleton() {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const backgroundColor = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: ["#E5E7EB", "#F3F4F6"],
  });

  return <Animated.View style={[styles.card, { backgroundColor }]} />;
}

const styles = StyleSheet.create({
  card: {
    width: 200,
    height: 90,
    marginRight: 12,
    borderRadius: 14,
  },
});
