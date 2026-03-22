import { View, StyleSheet, Animated } from "react-native";
import { useEffect, useRef } from "react";
import { useColors } from "../context/ThemeContext";

export default function Skeleton({ width = "100%", height = 20, style, radius = 8 }) {
  const c = useColors();
  const anim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width, height, borderRadius: radius, backgroundColor: c.border, opacity: anim },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  skeleton: { overflow: "hidden" },
});
