import { View, Text, StyleSheet } from "react-native";
import { useColors } from "../context/ThemeContext";

export default function RiskCard({ score, level }) {
  const c = useColors();

  const configs = {
    Safe: { color: c.emerald, bg: c.emerald + "15", border: c.emerald + "30" },
    Verify: { color: c.amber, bg: c.amber + "15", border: c.amber + "30" },
    "High Risk": { color: c.red, bg: c.red + "15", border: c.red + "30" },
  };
  const config = configs[level] || configs.Safe;

  return (
    <View style={[styles.card, { backgroundColor: config.bg, borderColor: config.border }]}>
      <View style={styles.header}>
        <Text style={[styles.level, { color: config.color }]}>{level}</Text>
        <Text style={[styles.score, { color: config.color }]}>{score}%</Text>
      </View>
      <View style={[styles.barBg, { backgroundColor: c.textMuted + "30" }]}>
        <View style={[styles.barFill, { backgroundColor: config.color, width: `${Math.max(0, Math.min(100, score))}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, borderRadius: 16, borderWidth: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  level: { fontSize: 16, fontWeight: "700" },
  score: { fontSize: 24, fontWeight: "900", letterSpacing: -0.5 },
  barBg: { height: 8, borderRadius: 4, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 4 },
});
