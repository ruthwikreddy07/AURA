import { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl, Animated, TouchableOpacity } from "react-native";
import * as SecureStore from "expo-secure-store";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

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
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.02, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const loadData = async () => {
    try {
      const userId = await SecureStore.getItemAsync("user_id");
      if (!userId) return navigation.replace("Auth");

      const [pRes, wRes, tRes, syncRes] = await Promise.all([
        getUserProfile().catch(() => null),
        getUserWallet(userId).catch(() => []),
        getUserTransactions(userId).catch(() => []),
        OfflineOutboxService.getStatus().catch(() => ({ pending: 0 }))
      ]);
      setProfile(pRes);
      const walletsList = Array.isArray(wRes) ? wRes : [wRes].filter(Boolean);
      setWallets(walletsList);
      setTxs((tRes || []).slice(0, 5));
      setSyncStatus(syncRes);

      const offlineWallet = walletsList.find(w => w.wallet_type === "offline");
      if (offlineWallet) {
        const tokRes = await getUserTokens(offlineWallet.id).catch(() => []);
        setTokens(tokRes);
      } else {
        setTokens([]);
      }
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

  const quickActions = [
    { label: "Send", icon: "paper-plane", color: c.indigo, screen: "Send" },
    { label: "Receive", icon: "download", color: c.emerald, screen: "Receive" },
    { label: "Tokens", icon: "shield-checkmark", color: c.violet, onPress: () => navigation.getParent()?.navigate('More', { screen: 'Tokens' }) },
    { label: "Bank", icon: "business", color: c.amber, onPress: () => navigation.getParent()?.navigate('More', { screen: 'BankAccounts' }) },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
      <ScrollView 
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.indigo} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.greeting, { color: c.textSecondary }]}>{greeting},</Text>
            <Text style={[styles.userName, { color: c.text }]}>{firstName}</Text>
          </View>
          <TouchableOpacity 
            style={[styles.avatar, { backgroundColor: c.indigo + '20', borderColor: c.indigo + '40' }]}
            onPress={() => navigation.getParent()?.navigate('More', { screen: 'Profile' })}
          >
            <Text style={[styles.avatarText, { color: c.indigo }]}>{firstName.charAt(0).toUpperCase()}</Text>
          </TouchableOpacity>
        </View>

        {/* Emergency Off-Grid Banner */}
        {isOffline && (
          <View style={[styles.emergencyBanner, { backgroundColor: c.amber + '10', borderColor: c.amber + '30' }]}>
            <View style={styles.emergencyHeader}>
              <Ionicons name="warning" size={20} color={c.amber} />
              <Text style={[styles.emergencyTitle, { color: c.amber }]}>Off-Grid Mode Active</Text>
            </View>
            <Text style={[styles.emergencyText, { color: c.textSecondary }]}>
              No network detected. Securely operating from local vault. Send via BLE or Sound.
            </Text>
          </View>
        )}

        {/* Balance Card */}
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <Card variant="glow" style={styles.balanceCard}>
            <View style={styles.balanceHeader}>
              <Text style={[styles.balanceLabel, { color: c.textSecondary }]}>Total Balance</Text>
              <View style={[styles.liveDot, { backgroundColor: isOffline ? c.amber : c.emerald }]} />
            </View>
            <Text style={[styles.balanceAmount, { color: c.text }]}>₹{Number(totalBalance).toLocaleString('en-IN')}</Text>
            
            <View style={[styles.divider, { backgroundColor: c.border }]} />
            
            <View style={styles.splitRow}>
              <View style={styles.splitCol}>
                <View style={styles.splitIconRow}>
                  <Ionicons name="cloud" size={14} color={c.emerald} />
                  <Text style={[styles.splitLabel, { color: c.textMuted }]}>Online</Text>
                </View>
                <Text style={[styles.splitVal, { color: c.emerald }]}>₹{Number(onlineBalance).toLocaleString('en-IN')}</Text>
              </View>
              <View style={[styles.splitDivider, { backgroundColor: c.border }]} />
              <View style={styles.splitCol}>
                <View style={styles.splitIconRow}>
                  <Ionicons name="hardware-chip" size={14} color={c.violet} />
                  <Text style={[styles.splitLabel, { color: c.textMuted }]}>Offline Vault</Text>
                </View>
                <Text style={[styles.splitVal, { color: c.violet }]}>₹{Number(offlineBalance).toLocaleString('en-IN')}</Text>
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          {quickActions.map((action, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.actionBtn, { backgroundColor: action.color + '10', borderColor: action.color + '20' }]}
              onPress={action.screen ? () => navigation.navigate(action.screen) : action.onPress}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: action.color + '20' }]}>
                <Ionicons name={action.icon} size={20} color={action.color} />
              </View>
              <Text style={[styles.actionLabel, { color: c.text }]}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* KPIs */}
        <View style={styles.kpiRow}>
          <KPICard title="Offline Tokens" value={tokens.length.toString()} subtext="Active tokens" color="emerald" icon="🛡️" />
          <KPICard title="Sync Queue" value={syncStatus.pending.toString()} subtext="Pending sync" color="amber" icon="🔄" />
        </View>

        {/* Recent Txs */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>Recent Transfers</Text>
          <TouchableOpacity onPress={() => navigation.navigate('History')}>
            <Text style={[styles.seeAll, { color: c.indigo }]}>See All</Text>
          </TouchableOpacity>
        </View>
        
        <Card style={styles.txCard}>
          {txs.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={32} color={c.textMuted} />
              <Text style={[styles.emptyText, { color: c.textMuted }]}>No recent transactions</Text>
            </View>
          ) : (
            txs.map((tx, i) => {
              const isSend = tx.tx_type === "offline_send";
              return (
                <View key={i} style={[styles.txRow, i !== txs.length - 1 && { borderBottomWidth: 1, borderBottomColor: c.border }]}>
                  <View style={[styles.txIcon, { backgroundColor: (isSend ? c.red : c.emerald) + '12' }]}>
                    <Ionicons name={isSend ? "arrow-up" : "arrow-down"} size={18} color={isSend ? c.red : c.emerald} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.txTitle, { color: c.text }]}>{isSend ? "Sent Payment" : "Received Payment"}</Text>
                    <Text style={[styles.txDate, { color: c.textMuted }]}>{new Date(tx.created_at).toLocaleDateString()}</Text>
                  </View>
                  <Text style={[styles.txAmt, { color: isSend ? c.red : c.emerald }]}>
                    {isSend ? "-" : "+"}₹{Number(tx.amount || 0).toLocaleString('en-IN')}
                  </Text>
                </View>
              );
            })
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingTop: 10, paddingBottom: 40 },
  
  // Header
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  greeting: { fontSize: 14, fontWeight: "500", marginBottom: 4, letterSpacing: 0.2 },
  userName: { fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },
  avatar: { 
    width: 48, height: 48, borderRadius: 24, 
    alignItems: "center", justifyContent: "center",
    borderWidth: 2,
  },
  avatarText: { fontSize: 20, fontWeight: "800" },

  // Emergency
  emergencyBanner: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 20 },
  emergencyHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  emergencyTitle: { fontSize: 15, fontWeight: "700" },
  emergencyText: { fontSize: 13, fontWeight: "500", lineHeight: 20 },

  // Balance
  balanceCard: { padding: 24, marginBottom: 24 },
  balanceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  balanceLabel: { fontSize: 13, fontWeight: "600", textTransform: 'uppercase', letterSpacing: 1 },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  balanceAmount: { fontSize: 42, fontWeight: "900", letterSpacing: -1.5, marginBottom: 20 },
  divider: { height: 1, marginBottom: 16 },
  splitRow: { flexDirection: "row", alignItems: "center" },
  splitCol: { flex: 1 },
  splitIconRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  splitLabel: { fontSize: 12, fontWeight: "600" },
  splitVal: { fontSize: 18, fontWeight: "800" },
  splitDivider: { width: 1, height: 36, marginHorizontal: 20 },

  // Quick Actions
  quickActions: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  actionBtn: { 
    flex: 1, alignItems: 'center', paddingVertical: 16, 
    borderRadius: 16, borderWidth: 1,
  },
  actionIcon: { 
    width: 40, height: 40, borderRadius: 14, 
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  actionLabel: { fontSize: 12, fontWeight: "700" },

  // KPIs
  kpiRow: { flexDirection: "row", gap: 12, marginBottom: 28 },

  // Transactions
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 18, fontWeight: "800" },
  seeAll: { fontSize: 13, fontWeight: "600" },
  txCard: { padding: 0, overflow: "hidden" },
  txRow: { flexDirection: "row", alignItems: "center", padding: 16, gap: 14 },
  txIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  txTitle: { fontSize: 15, fontWeight: "700", marginBottom: 3 },
  txDate: { fontSize: 12, fontWeight: "500" },
  txAmt: { fontSize: 16, fontWeight: "800" },
  emptyState: { alignItems: 'center', padding: 32, gap: 10 },
  emptyText: { fontSize: 14, fontWeight: '500' },
});
