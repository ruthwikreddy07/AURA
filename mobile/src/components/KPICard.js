import { View, Text, StyleSheet } from "react-native";
import { useColors } from "../context/ThemeContext";

export default function KPICard({ title, value, subtext, trend, color = "indigo", icon }) {
  const c = useColors();
  const themeColor = c[color] || c.indigo;
  const isPositive = trend === "up";

  return (
    <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
      {/* Glow accent line */}
      <View style={[styles.glowBar, { backgroundColor: themeColor }]} />
      
      <View style={styles.headerRow}>
        {icon && (
          <View style={[styles.iconWrap, { backgroundColor: themeColor + '15' }]}>
            <Text style={{ fontSize: 16 }}>{icon}</Text>
          </View>
        )}
        <Text style={[styles.title, { color: c.textMuted }]}>{title}</Text>
      </View>
      
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
    </View>
  );
}

const styles = StyleSheet.create({
  card: { 
    padding: 16, 
    borderRadius: 18, 
    borderWidth: 1, 
    flex: 1,
    overflow: 'hidden',
  },
  glowBar: { 
    position: "absolute", 
    top: 0, 
    left: 0, 
    right: 0, 
    height: 3, 
    borderTopLeftRadius: 18, 
    borderTopRightRadius: 18,
    opacity: 0.8,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  iconWrap: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 13, fontWeight: "600" },
  valRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  value: { fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
  trendBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  trendText: { fontSize: 12, fontWeight: "800" },
  subtext: { fontSize: 12, fontWeight: "500" },
});
