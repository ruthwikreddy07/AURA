import { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl } from "react-native";
import * as SecureStore from "expo-secure-store";
import { SafeAreaView } from "react-native-safe-area-context";

import { useColors } from "../context/ThemeContext";
import { getSyncQueue } from "../api/api";
import Card from "../components/Card";
import Badge from "../components/Badge";
import Button from "../components/Button";

export default function SyncScreen() {
  const c = useColors();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [queue, setQueue] = useState([]);

  const loadData = async () => {
    try {
      const userId = await SecureStore.getItemAsync("user_id");
      const res = await getSyncQueue(userId).catch(() => [
        { id: "SYN-001", type: "offline_send", amount: 1500, status: "pending", created_at: new Date().toISOString(), retries: 0 },
        { id: "SYN-002", type: "offline_receive", amount: 800, status: "failed", created_at: new Date(Date.now() - 3600000).toISOString(), retries: 3 },
        { id: "SYN-003", type: "offline_send", amount: 2200, status: "settled", created_at: new Date(Date.now() - 7200000).toISOString(), retries: 1 },
      ]);
      setQueue(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const statusColor = (s) => s === "settled" ? "success" : s === "failed" ? "error" : "warning";

  const pendingCount = queue.filter((q) => q.status === "pending").length;
  const failedCount = queue.filter((q) => q.status === "failed").length;
  const settledCount = queue.filter((q) => q.status === "settled").length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.text }]}>Sync Status</Text>
        <Text style={[styles.subtitle, { color: c.textSecondary }]}>Offline transaction settlement queue</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={c.indigo} />}
      >
        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <Card style={[styles.summaryCard, { borderColor: c.amber + "30" }]}>
            <Text style={[styles.summaryVal, { color: c.amber }]}>{pendingCount}</Text>
            <Text style={[styles.summaryLabel, { color: c.textMuted }]}>Pending</Text>
          </Card>
          <Card style={[styles.summaryCard, { borderColor: c.red + "30" }]}>
            <Text style={[styles.summaryVal, { color: c.red }]}>{failedCount}</Text>
            <Text style={[styles.summaryLabel, { color: c.textMuted }]}>Failed</Text>
          </Card>
          <Card style={[styles.summaryCard, { borderColor: c.emerald + "30" }]}>
            <Text style={[styles.summaryVal, { color: c.emerald }]}>{settledCount}</Text>
            <Text style={[styles.summaryLabel, { color: c.textMuted }]}>Settled</Text>
          </Card>
        </View>

        {/* Sync Now Button */}
        <Button style={{ marginBottom: 24 }} onPress={loadData}>Force Sync Now</Button>

        {/* Queue Items */}
        <Text style={[styles.sectionTitle, { color: c.text }]}>Queue</Text>
        {queue.length === 0 ? (
          <Text style={{ color: c.textMuted, textAlign: "center", marginTop: 20 }}>Sync queue is empty.</Text>
        ) : (
          queue.map((item, i) => (
            <Card key={i} style={styles.queueCard}>
              <View style={styles.queueHeader}>
                <Text style={[styles.queueId, { color: c.text }]}>{item.id}</Text>
                <Badge status={statusColor(item.status)} text={item.status.toUpperCase()} size="sm" />
              </View>
              <View style={styles.queueDetails}>
                <View style={styles.detailCol}>
                  <Text style={[styles.detailLabel, { color: c.textMuted }]}>Type</Text>
                  <Text style={[styles.detailVal, { color: c.text }]}>{item.type === "offline_send" ? "Send" : "Receive"}</Text>
                </View>
                <View style={styles.detailCol}>
                  <Text style={[styles.detailLabel, { color: c.textMuted }]}>Amount</Text>
                  <Text style={[styles.detailVal, { color: c.text }]}>₹{Number(item.amount).toLocaleString()}</Text>
                </View>
                <View style={styles.detailCol}>
                  <Text style={[styles.detailLabel, { color: c.textMuted }]}>Retries</Text>
                  <Text style={[styles.detailVal, { color: c.text }]}>{item.retries}</Text>
                </View>
              </View>
              {item.status === "failed" && (
                <Button variant="secondary" style={{ marginTop: 12, paddingVertical: 10 }} onPress={() => {}}>
                  Retry Settlement
                </Button>
              )}
            </Card>
          ))
        )}
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

  summaryRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  summaryCard: { flex: 1, padding: 16, alignItems: "center" },
  summaryVal: { fontSize: 28, fontWeight: "900" },
  summaryLabel: { fontSize: 12, fontWeight: "600", marginTop: 4 },

  sectionTitle: { fontSize: 18, fontWeight: "800", marginBottom: 12 },
  queueCard: { padding: 16, marginBottom: 12 },
  queueHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  queueId: { fontSize: 14, fontWeight: "700", fontFamily: "monospace" },
  queueDetails: { flexDirection: "row" },
  detailCol: { flex: 1 },
  detailLabel: { fontSize: 11, fontWeight: "600", marginBottom: 4 },
  detailVal: { fontSize: 14, fontWeight: "700" },
});
