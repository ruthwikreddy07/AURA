import { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl } from "react-native";
import * as SecureStore from "expo-secure-store";
import { SafeAreaView } from "react-native-safe-area-context";

import { useColors, useTheme } from "../context/ThemeContext";
import { getUserProfile, getUserWallet, getUserTransactions, getUserTokens } from "../api/api";
import OfflineOutboxService from "../services/OfflineOutboxService";
import Button from "../components/Button";
import Card from "../components/Card";
import KPICard from "../components/KPICard";

export default function HomeScreen({ navigation }) {
  const c = useColors();
  const { isOffline } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [wallets, setWallets] = useState([]);
  const [txs, setTxs] = useState([]);
  const [profile, setProfile] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [syncStatus, setSyncStatus] = useState({ pending: 0 });

  const loadData = async () => {
    try {
      const userId = await SecureStore.getItemAsync("user_id");
      if (!userId) return navigation.replace("Auth");

      const [pRes, wRes, tRes, tokRes, syncRes] = await Promise.all([
        getUserProfile().catch(() => null),
        getUserWallet(userId).catch(() => []),
        getUserTransactions(userId).catch(() => []),
        getUserTokens(userId).catch(() => []),
        OfflineOutboxService.getStatus().catch(() => ({ pending: 0 }))
      ]);
      setProfile(pRes);
      setWallets(Array.isArray(wRes) ? wRes : [wRes].filter(Boolean));
      setTxs((tRes || []).slice(0, 3));
      setTokens(Array.isArray(tokRes) ? tokRes : []);
      setSyncStatus(syncRes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, []);
  const onRefresh = () => { setRefreshing(true); loadData(); };

  const totalBalance = wallets.reduce((sum, w) => sum + (Number(w.balance) || 0), 0);
  const onlineBalance = wallets.find(w => w.wallet_type === "online")?.balance || wallets[0]?.balance || 0;
  const offlineBalance = wallets.find(w => w.wallet_type === "offline")?.balance || 0;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = profile?.full_name?.split(" ")[0] || "User";

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
      <ScrollView 
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.indigo} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: c.textSecondary }]}>{greeting},</Text>
            <Text style={[styles.title, { color: c.text }]}>{firstName}</Text>
          </View>
          <View style={[styles.avatar, { backgroundColor: c.indigo + "20" }]}>
            <Text style={[styles.avatarText, { color: c.indigo }]}>{firstName.charAt(0).toUpperCase()}</Text>
          </View>
        </View>

        {/* Emergency Off-Grid Banner */}
        {isOffline && (
          <View style={[styles.emergencyBanner, { backgroundColor: c.amber + "15", borderColor: c.amber + "50" }]}>
            <Text style={[styles.emergencyTitle, { color: c.amber }]}>⚠️ Off-Grid Mode Active</Text>
            <Text style={[styles.emergencyText, { color: c.textSecondary }]}>
              No network detected. You are securely reading from the local hardware vault. You can still send money via BLE or Sound.
            </Text>
          </View>
        )}

        {/* Total Balance Card */}
        <Card style={styles.mainCard}>
          <Text style={[styles.cardSub, { color: c.textSecondary }]}>Total Balance</Text>
          <Text style={[styles.cardTitle, { color: c.text }]}>₹{Number(totalBalance).toLocaleString()}</Text>
          
          <View style={styles.splitRow}>
            <View style={styles.splitCol}>
              <Text style={[styles.splitLabel, { color: c.textMuted }]}>Online</Text>
              <Text style={[styles.splitVal, { color: c.emerald }]}>₹{Number(onlineBalance).toLocaleString()}</Text>
            </View>
            <View style={[styles.splitDiv, { backgroundColor: c.border }]} />
            <View style={styles.splitCol}>
              <Text style={[styles.splitLabel, { color: c.textMuted }]}>Offline Reserved</Text>
              <Text style={[styles.splitVal, { color: c.violet }]}>₹{Number(offlineBalance).toLocaleString()}</Text>
            </View>
          </View>
        </Card>

        {/* Quick Actions */}
        <View style={styles.actions}>
          <Button style={styles.actionBtn} onPress={() => navigation.navigate("Send")}>Send</Button>
          <Button style={styles.actionBtn} variant="secondary" onPress={() => navigation.navigate("Receive")}>Receive</Button>
        </View>

        {/* KPIs */}
        <View style={styles.kpiRow}>
          <KPICard title="Offline Tokens" value={tokens.length.toString()} subtext="Active tokens" color="emerald" />
          <KPICard title="Sync Queue" value={syncStatus.pending.toString()} subtext="Pending settlement" color="amber" />
        </View>

        {/* Recent Txs */}
        <Text style={[styles.sectionTitle, { color: c.text }]}>Recent Offline Transfers</Text>
        <Card style={styles.txCard}>
          {txs.length === 0 ? (
            <Text style={{ color: c.textMuted, textAlign: "center", padding: 10 }}>No recent transactions.</Text>
          ) : (
            txs.map((tx, i) => (
              <View key={i} style={[styles.txRow, i !== txs.length - 1 && { borderBottomWidth: 1, borderBottomColor: c.border }]}>
                <View>
                  <Text style={[styles.txTitle, { color: c.text }]}>{tx.tx_type === "offline_send" ? "Sent Payment" : "Received Payment"}</Text>
                  <Text style={[styles.txDate, { color: c.textMuted }]}>{new Date(tx.created_at).toLocaleDateString()}</Text>
                </View>
                <Text style={[styles.txAmt, { color: tx.tx_type === "offline_send" ? c.text : c.emerald }]}>
                  {tx.tx_type === "offline_send" ? "-" : "+"}₹{Number(tx.amount || 0).toLocaleString()}
                </Text>
              </View>
            ))
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingTop: 10 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  greeting: { fontSize: 13, fontWeight: "600", marginBottom: 4 },
  title: { fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },
  avatar: { width: 44, height: 44, rounded: 22, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 18, fontWeight: "800" },
  
  mainCard: { padding: 24, marginBottom: 20 },
  cardSub: { fontSize: 13, fontWeight: "600", marginBottom: 6 },
  cardTitle: { fontSize: 40, fontWeight: "900", letterSpacing: -1, marginBottom: 20 },
  splitRow: { flexDirection: "row", alignItems: "center" },
  splitCol: { flex: 1 },
  splitDiv: { width: 1, height: 30, marginHorizontal: 20 },
  splitLabel: { fontSize: 12, fontWeight: "600", marginBottom: 4 },
  splitVal: { fontSize: 16, fontWeight: "800" },

  actions: { flexDirection: "row", gap: 12, marginBottom: 24 },
  actionBtn: { flex: 1 },

  kpiRow: { flexDirection: "row", gap: 12, marginBottom: 32 },

  sectionTitle: { fontSize: 18, fontWeight: "800", marginBottom: 16 },
  txCard: { padding: 0, overflow: "hidden" },
  txRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16 },
  txTitle: { fontSize: 15, fontWeight: "700", marginBottom: 4 },
  txDate: { fontSize: 12, fontWeight: "500" },
  txAmt: { fontSize: 16, fontWeight: "800" },
  emergencyBanner: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 20 },
  emergencyTitle: { fontSize: 16, fontWeight: "800", marginBottom: 6 },
  emergencyText: { fontSize: 13, fontWeight: "500", lineHeight: 20 },
});
