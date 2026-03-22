import { View, Text, StyleSheet } from "react-native";
import { useColors } from "../context/ThemeContext";

const MODE_COLORS = {
  BLE: "blue", NFC: "indigo", QR: "emerald", Sound: "violet", Light: "amber",
};

export default function ModeBadge({ mode, active = false, size = "md" }) {
  const c = useColors();
  const color = c[MODE_COLORS[mode] || "indigo"];
  const isSm = size === "sm";

  return (
    <View
      style={[
        styles.badge,
        isSm && styles.badgeSm,
        {
          backgroundColor: active ? color + "20" : c.card,
          borderColor: active ? color + "50" : c.border,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          isSm && styles.textSm,
          { color: active ? color : c.textMuted },
        ]}
      >
        {mode}
      </Text>
      {active && <View style={[styles.dot, { backgroundColor: color }]} />}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  badgeSm: { paddingVertical: 4, paddingHorizontal: 8 },
  text: { fontSize: 12, fontWeight: "700", letterSpacing: 0.3 },
  textSm: { fontSize: 11 },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
