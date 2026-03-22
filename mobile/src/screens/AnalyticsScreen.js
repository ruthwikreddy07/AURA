import { View, Text, StyleSheet, ScrollView, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Rect, Line, Text as SvgText, G } from "react-native-svg";

import { useColors } from "../context/ThemeContext";
import Card from "../components/Card";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CHART_W = SCREEN_WIDTH - 80;
const CHART_H = 160;

const MOCK_DAILY = [
  { day: "Mon", amount: 3200 },
  { day: "Tue", amount: 1800 },
  { day: "Wed", amount: 4500 },
  { day: "Thu", amount: 2700 },
  { day: "Fri", amount: 5100 },
  { day: "Sat", amount: 3900 },
  { day: "Sun", amount: 2100 },
];

const RISK_BREAKDOWN = [
  { label: "Safe", pct: 72, color: "emerald" },
  { label: "Verify", pct: 20, color: "amber" },
  { label: "High Risk", pct: 8, color: "red" },
];

export default function AnalyticsScreen() {
  const c = useColors();

  const maxAmount = Math.max(...MOCK_DAILY.map((d) => d.amount));
  const barWidth = (CHART_W - 40) / MOCK_DAILY.length - 8;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.text }]}>Analytics</Text>
        <Text style={[styles.subtitle, { color: c.textSecondary }]}>Transaction volume and risk insights</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Summary */}
        <View style={styles.kpiRow}>
          <Card style={styles.kpiCard}>
            <Text style={[styles.kpiLabel, { color: c.textMuted }]}>Total Volume</Text>
            <Text style={[styles.kpiVal, { color: c.text }]}>₹23,300</Text>
          </Card>
          <Card style={styles.kpiCard}>
            <Text style={[styles.kpiLabel, { color: c.textMuted }]}>Avg / Day</Text>
            <Text style={[styles.kpiVal, { color: c.text }]}>₹3,328</Text>
          </Card>
        </View>

        {/* Bar Chart */}
        <Text style={[styles.sectionTitle, { color: c.text }]}>Weekly Volume</Text>
        <Card style={styles.chartCard}>
          <Svg width={CHART_W} height={CHART_H + 30}>
            {/* Horizontal grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
              <Line key={i} x1={0} y1={CHART_H * (1 - pct)} x2={CHART_W} y2={CHART_H * (1 - pct)} stroke={c.border} strokeWidth={1} />
            ))}
            {/* Bars */}
            {MOCK_DAILY.map((d, i) => {
              const barH = (d.amount / maxAmount) * (CHART_H - 10);
              const x = 20 + i * (barWidth + 8);
              return (
                <G key={i}>
                  <Rect x={x} y={CHART_H - barH} width={barWidth} height={barH} rx={6} fill={c.indigo} opacity={0.85} />
                  <SvgText x={x + barWidth / 2} y={CHART_H + 18} fill={c.textMuted} fontSize="10" fontWeight="600" textAnchor="middle">
                    {d.day}
                  </SvgText>
                </G>
              );
            })}
          </Svg>
        </Card>

        {/* Risk Breakdown */}
        <Text style={[styles.sectionTitle, { color: c.text, marginTop: 32 }]}>Risk Analysis</Text>
        <Card>
          {RISK_BREAKDOWN.map((r, i) => (
            <View key={i} style={[styles.riskRow, i !== RISK_BREAKDOWN.length - 1 && { marginBottom: 16 }]}>
              <View style={styles.riskHeader}>
                <View style={[styles.riskDot, { backgroundColor: c[r.color] }]} />
                <Text style={[styles.riskLabel, { color: c.text }]}>{r.label}</Text>
                <Text style={[styles.riskPct, { color: c[r.color] }]}>{r.pct}%</Text>
              </View>
              <View style={[styles.riskBarBg, { backgroundColor: c.border }]}>
                <View style={[styles.riskBarFill, { width: `${r.pct}%`, backgroundColor: c[r.color] }]} />
              </View>
            </View>
          ))}
        </Card>

        {/* Mode Distribution */}
        <Text style={[styles.sectionTitle, { color: c.text, marginTop: 32 }]}>Mode Distribution</Text>
        <Card>
          {[
            { mode: "QR Code", pct: 65, color: "emerald" },
            { mode: "BLE", pct: 25, color: "blue" },
            { mode: "NFC", pct: 10, color: "indigo" },
          ].map((m, i) => (
            <View key={i} style={[styles.riskRow, i < 2 && { marginBottom: 16 }]}>
              <View style={styles.riskHeader}>
                <View style={[styles.riskDot, { backgroundColor: c[m.color] }]} />
                <Text style={[styles.riskLabel, { color: c.text }]}>{m.mode}</Text>
                <Text style={[styles.riskPct, { color: c[m.color] }]}>{m.pct}%</Text>
              </View>
              <View style={[styles.riskBarBg, { backgroundColor: c.border }]}>
                <View style={[styles.riskBarFill, { width: `${m.pct}%`, backgroundColor: c[m.color] }]} />
              </View>
            </View>
          ))}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingBottom: 10 },
  title: { fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },
  subtitle: { fontSize: 14, fontWeight: "500", marginTop: 4 },
  scroll: { padding: 20, paddingTop: 10 },

  kpiRow: { flexDirection: "row", gap: 12, marginBottom: 24 },
  kpiCard: { flex: 1, padding: 16 },
  kpiLabel: { fontSize: 13, fontWeight: "600", marginBottom: 4 },
  kpiVal: { fontSize: 24, fontWeight: "900", letterSpacing: -0.5 },

  sectionTitle: { fontSize: 18, fontWeight: "800", marginBottom: 12 },
  chartCard: { padding: 16, alignItems: "center" },

  riskRow: {},
  riskHeader: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  riskDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  riskLabel: { flex: 1, fontSize: 14, fontWeight: "600" },
  riskPct: { fontSize: 14, fontWeight: "800" },
  riskBarBg: { height: 8, borderRadius: 4, overflow: "hidden" },
  riskBarFill: { height: "100%", borderRadius: 4 },
});
