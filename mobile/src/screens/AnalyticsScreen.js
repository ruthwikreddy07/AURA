import { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import Svg, { Rect, Line, Text as SvgText, G } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";

import { useColors } from "../context/ThemeContext";
import { getUserTransactions, getUserTokens } from "../api/api";
import Card from "../components/Card";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CHART_W = SCREEN_WIDTH - 80;
const CHART_H = 160;

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function AnalyticsScreen() {
  const c = useColors();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [tokens, setTokens] = useState([]);

  const loadData = async () => {
    try {
      const userId = await SecureStore.getItemAsync("user_id");
      const [txRes, tokRes] = await Promise.all([
        getUserTransactions(userId).catch(() => []),
        getUserTokens(userId).catch(() => []),
      ]);
      setTransactions(Array.isArray(txRes) ? txRes : []);
      setTokens(Array.isArray(tokRes) ? tokRes : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // Compute analytics from real data
  const totalVolume = transactions.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
  const avgPerDay = transactions.length > 0 ? Math.round(totalVolume / 7) : 0;
  const totalTxCount = transactions.length;
  
  // Group by day of week
  const dailyData = DAYS.map(day => ({
    day,
    amount: transactions
      .filter(tx => DAYS[new Date(tx.created_at).getDay()] === day)
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0)
  }));

  // Transaction type breakdown
  const sendCount = transactions.filter(tx => tx.tx_type === 'offline_send').length;
  const receiveCount = transactions.filter(tx => tx.tx_type === 'offline_receive').length;
  const sendPct = totalTxCount > 0 ? Math.round((sendCount / totalTxCount) * 100) : 0;
  const receivePct = totalTxCount > 0 ? Math.round((receiveCount / totalTxCount) * 100) : 0;
  const otherPct = Math.max(0, 100 - sendPct - receivePct);

  // Token stats
  const activeTokens = tokens.filter(t => t.status === 'active').length;
  const totalTokenValue = tokens.reduce((sum, t) => sum + (Number(t.remaining_value || t.token_value || t.amount) || 0), 0);

  const maxAmount = Math.max(...dailyData.map(d => d.amount), 1);
  const barWidth = (CHART_W - 40) / dailyData.length - 8;

  const hasData = transactions.length > 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.text }]}>Analytics</Text>
        <Text style={[styles.subtitle, { color: c.textSecondary }]}>Transaction insights & metrics</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={c.indigo} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary KPIs */}
        <View style={styles.kpiRow}>
          <Card variant="glow" style={styles.kpiCard}>
            <View style={[styles.kpiIconWrap, { backgroundColor: c.indigo + '15' }]}>
              <Ionicons name="trending-up" size={18} color={c.indigo} />
            </View>
            <Text style={[styles.kpiLabel, { color: c.textMuted }]}>Total Volume</Text>
            <Text style={[styles.kpiVal, { color: c.text }]}>₹{totalVolume.toLocaleString('en-IN')}</Text>
          </Card>
          <Card variant="glow" style={styles.kpiCard}>
            <View style={[styles.kpiIconWrap, { backgroundColor: c.emerald + '15' }]}>
              <Ionicons name="stats-chart" size={18} color={c.emerald} />
            </View>
            <Text style={[styles.kpiLabel, { color: c.textMuted }]}>Avg / Day</Text>
            <Text style={[styles.kpiVal, { color: c.text }]}>₹{avgPerDay.toLocaleString('en-IN')}</Text>
          </Card>
        </View>

        <View style={styles.kpiRow}>
          <Card style={styles.kpiCard}>
            <View style={[styles.kpiIconWrap, { backgroundColor: c.violet + '15' }]}>
              <Ionicons name="shield-checkmark" size={18} color={c.violet} />
            </View>
            <Text style={[styles.kpiLabel, { color: c.textMuted }]}>Active Tokens</Text>
            <Text style={[styles.kpiVal, { color: c.text }]}>{activeTokens}</Text>
          </Card>
          <Card style={styles.kpiCard}>
            <View style={[styles.kpiIconWrap, { backgroundColor: c.amber + '15' }]}>
              <Ionicons name="swap-horizontal" size={18} color={c.amber} />
            </View>
            <Text style={[styles.kpiLabel, { color: c.textMuted }]}>Transactions</Text>
            <Text style={[styles.kpiVal, { color: c.text }]}>{totalTxCount}</Text>
          </Card>
        </View>

        {/* Bar Chart */}
        <Text style={[styles.sectionTitle, { color: c.text }]}>Weekly Volume</Text>
        <Card style={styles.chartCard}>
          {hasData ? (
            <Svg width={CHART_W} height={CHART_H + 30}>
              {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
                <Line key={i} x1={0} y1={CHART_H * (1 - pct)} x2={CHART_W} y2={CHART_H * (1 - pct)} stroke={c.border} strokeWidth={1} strokeDasharray="4,4" />
              ))}
              {dailyData.map((d, i) => {
                const barH = maxAmount > 0 ? (d.amount / maxAmount) * (CHART_H - 10) : 0;
                const x = 20 + i * (barWidth + 8);
                return (
                  <G key={i}>
                    <Rect x={x} y={CHART_H - barH} width={barWidth} height={Math.max(barH, 2)} rx={6} fill={c.indigo} opacity={0.85} />
                    <SvgText x={x + barWidth / 2} y={CHART_H + 18} fill={c.textMuted} fontSize="10" fontWeight="600" textAnchor="middle">
                      {d.day}
                    </SvgText>
                  </G>
                );
              })}
            </Svg>
          ) : (
            <View style={styles.emptyChart}>
              <Ionicons name="bar-chart-outline" size={40} color={c.textMuted} />
              <Text style={[styles.emptyText, { color: c.textMuted }]}>No transaction data yet</Text>
            </View>
          )}
        </Card>

        {/* Transaction Type Breakdown */}
        <Text style={[styles.sectionTitle, { color: c.text, marginTop: 28 }]}>Transaction Breakdown</Text>
        <Card>
          {[
            { label: "Sent", pct: sendPct, color: "red", icon: "arrow-up-circle" },
            { label: "Received", pct: receivePct, color: "emerald", icon: "arrow-down-circle" },
            { label: "Other", pct: otherPct, color: "blue", icon: "ellipsis-horizontal-circle" },
          ].map((r, i) => (
            <View key={i} style={[styles.breakdownRow, i < 2 && { marginBottom: 16 }]}>
              <View style={styles.breakdownHeader}>
                <Ionicons name={r.icon} size={18} color={c[r.color]} style={{ marginRight: 8 }} />
                <Text style={[styles.breakdownLabel, { color: c.text }]}>{r.label}</Text>
                <Text style={[styles.breakdownPct, { color: c[r.color] }]}>{r.pct}%</Text>
              </View>
              <View style={[styles.barBg, { backgroundColor: c.border }]}>
                <View style={[styles.barFill, { width: `${Math.max(r.pct, 1)}%`, backgroundColor: c[r.color] }]} />
              </View>
            </View>
          ))}
        </Card>

        {/* Token Health */}
        <Text style={[styles.sectionTitle, { color: c.text, marginTop: 28 }]}>Token Health</Text>
        <Card variant="elevated">
          <View style={styles.tokenHealthRow}>
            <View style={styles.tokenHealthItem}>
              <Text style={[styles.tokenHealthVal, { color: c.emerald }]}>{activeTokens}</Text>
              <Text style={[styles.tokenHealthLabel, { color: c.textMuted }]}>Active</Text>
            </View>
            <View style={[styles.tokenHealthDivider, { backgroundColor: c.border }]} />
            <View style={styles.tokenHealthItem}>
              <Text style={[styles.tokenHealthVal, { color: c.text }]}>₹{totalTokenValue.toLocaleString('en-IN')}</Text>
              <Text style={[styles.tokenHealthLabel, { color: c.textMuted }]}>Total Value</Text>
            </View>
            <View style={[styles.tokenHealthDivider, { backgroundColor: c.border }]} />
            <View style={styles.tokenHealthItem}>
              <Text style={[styles.tokenHealthVal, { color: c.amber }]}>{tokens.filter(t => t.status === 'spent').length}</Text>
              <Text style={[styles.tokenHealthLabel, { color: c.textMuted }]}>Spent</Text>
            </View>
          </View>
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
  scroll: { padding: 20, paddingTop: 10, paddingBottom: 40 },

  kpiRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  kpiCard: { flex: 1, padding: 16 },
  kpiIconWrap: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  kpiLabel: { fontSize: 12, fontWeight: "600", marginBottom: 4 },
  kpiVal: { fontSize: 22, fontWeight: "900", letterSpacing: -0.5 },

  sectionTitle: { fontSize: 18, fontWeight: "800", marginBottom: 12, marginTop: 12 },
  chartCard: { padding: 16, alignItems: "center" },
  emptyChart: { alignItems: 'center', paddingVertical: 30, gap: 10 },
  emptyText: { fontSize: 14, fontWeight: '500' },

  breakdownRow: {},
  breakdownHeader: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  breakdownLabel: { flex: 1, fontSize: 14, fontWeight: "600" },
  breakdownPct: { fontSize: 14, fontWeight: "800" },
  barBg: { height: 6, borderRadius: 3, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 3 },

  tokenHealthRow: { flexDirection: 'row', alignItems: 'center' },
  tokenHealthItem: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  tokenHealthVal: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  tokenHealthLabel: { fontSize: 12, fontWeight: '600' },
  tokenHealthDivider: { width: 1, height: 40 },
});
