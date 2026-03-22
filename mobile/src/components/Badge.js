import { View, Text, StyleSheet } from "react-native";
import { useColors } from "../context/ThemeContext";

const STATUS_COLORS = {
  success: "emerald", warning: "amber", error: "red", info: "blue",
};

export default function Badge({ status, text, size = "md" }) {
  const c = useColors();
  const color = c[STATUS_COLORS[status] || "indigo"];
  const isSm = size === "sm";

  return (
    <View style={[styles.badge, isSm && styles.badgeSm, { backgroundColor: color + "15", borderColor: color + "30" }]}>
      <Text style={[styles.text, isSm && styles.textSm, { color }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  badgeSm: { paddingVertical: 2, paddingHorizontal: 6, borderRadius: 6 },
  text: { fontSize: 12, fontWeight: "700" },
  textSm: { fontSize: 10 },
});
