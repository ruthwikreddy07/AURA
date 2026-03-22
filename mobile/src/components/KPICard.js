import { View, Text, StyleSheet } from "react-native";
import { useColors } from "../context/ThemeContext";

export default function KPICard({ title, value, subtext, trend, color = "indigo" }) {
  const c = useColors();
  const themeColor = c[color] || c.indigo;
  const isPositive = trend === "up";

  return (
    <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
      <Text style={[styles.title, { color: c.textMuted }]}>{title}</Text>
      <View style={styles.valRow}>
        <Text style={[styles.value, { color: c.text }]}>{value}</Text>
        {trend && (
          <View style={[styles.trendBadge, { backgroundColor: isPositive ? c.emerald + "15" : c.red + "15" }]}>
            <Text style={[styles.trendText, { color: isPositive ? c.emerald : c.red }]}>
              {isPositive ? "↗" : "↘"}
            </Text>
          </View>
        )}
      </View>
      <Text style={[styles.subtext, { color: c.textSecondary }]}>{subtext}</Text>
      
      {/* Decorative colored bar */}
      <View style={[styles.bar, { backgroundColor: themeColor }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, borderRadius: 16, borderWidth: 1, flex: 1 },
  title: { fontSize: 13, fontWeight: "600", marginBottom: 8 },
  valRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  value: { fontSize: 24, fontWeight: "800", letterSpacing: -0.5 },
  trendBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  trendText: { fontSize: 12, fontWeight: "800" },
  subtext: { fontSize: 12, fontWeight: "500" },
  bar: { position: "absolute", top: 0, left: 16, right: 16, height: 3, borderBottomLeftRadius: 3, borderBottomRightRadius: 3 },
});
