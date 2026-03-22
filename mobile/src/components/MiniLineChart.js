// MiniLineChart - simplified sparkline placeholder

import { View, Text, StyleSheet } from "react-native";
import { useColors } from "../context/ThemeContext";

// Simplified placeholder for MiniLineChart until we need full D3 path rendering
export default function MiniLineChart({ trend = "up", color = "indigo" }) {
  const c = useColors();
  const hex = c[color] || c.indigo;

  return (
    <View style={styles.container}>
      {/* Visual representation of a sparkline for mobile */}
      <View style={[styles.line, { backgroundColor: hex, transform: [{ rotate: trend === "up" ? "-15deg" : "15deg" }] }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: 40, width: "100%", justifyContent: "center", alignItems: "center", overflow: "hidden" },
  line: { width: "80%", height: 3, borderRadius: 2 },
});
