import { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl } from "react-native";
import * as SecureStore from "expo-secure-store";
import { SafeAreaView } from "react-native-safe-area-context";

import { useColors } from "../context/ThemeContext";
import { getUserWallet } from "../api/api";
import Card from "../components/Card";
import Button from "../components/Button";

export default function WalletScreen({ navigation }) {
  const c = useColors();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [wallet, setWallet] = useState({ balance: 0, offline_balance: 0 });

  const loadData = async () => {
    try {
      const userId = await SecureStore.getItemAsync("user_id");
      if (!userId) return navigation.replace("Auth");
      const res = await getUserWallet(userId).catch(() => ({ balance: 12400, offline_balance: 4500 }));
      setWallet(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.text }]}>Wallet</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={c.indigo} />}
      >
        <Card style={styles.mainCard}>
          <Text style={[styles.cardSub, { color: c.textSecondary }]}>Total Balance</Text>
          <Text style={[styles.cardTitle, { color: c.text }]}>₹{(wallet.balance + wallet.offline_balance).toLocaleString()}</Text>
        </Card>

        <View style={styles.splitGrid}>
          <Card style={[styles.splitCard, { borderColor: c.emerald + "30" }]}>
            <View style={[styles.iconBox, { backgroundColor: c.emerald + "15" }]}>
              <Text style={{ color: c.emerald }}>🌐</Text>
            </View>
            <Text style={[styles.splitTitle, { color: c.textSecondary }]}>Online Funds</Text>
            <Text style={[styles.splitAmt, { color: c.text }]}>₹{wallet.balance.toLocaleString()}</Text>
            <Button variant="secondary" style={styles.btnSm} onPress={() => {}}>Add Money</Button>
          </Card>

          <Card style={[styles.splitCard, { borderColor: c.violet + "30" }]}>
            <View style={[styles.iconBox, { backgroundColor: c.violet + "15" }]}>
              <Text style={{ color: c.violet }}>🔒</Text>
            </View>
            <Text style={[styles.splitTitle, { color: c.textSecondary }]}>Offline Vault</Text>
            <Text style={[styles.splitAmt, { color: c.text }]}>₹{wallet.offline_balance.toLocaleString()}</Text>
            <Button variant="secondary" style={styles.btnSm} onPress={() => navigation.navigate("Tokens")}>Manage Tokens</Button>
          </Card>
        </View>

        <Text style={[styles.sectionTitle, { color: c.text, marginTop: 32 }]}>Linked Accounts</Text>
        <Card style={styles.bankCard}>
          <View style={[styles.iconBox, { backgroundColor: c.border }]}>
            <Text style={{ fontSize: 18 }}>🏦</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.bankName, { color: c.text }]}>HDFC Bank</Text>
            <Text style={[styles.bankAcct, { color: c.textMuted }]}>•••• 4829</Text>
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
  scroll: { padding: 20, paddingTop: 0 },
  
  mainCard: { padding: 24, marginBottom: 20, alignItems: "center" },
  cardSub: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
  cardTitle: { fontSize: 48, fontWeight: "900", letterSpacing: -1 },

  splitGrid: { flexDirection: "row", gap: 16 },
  splitCard: { flex: 1, padding: 16 },
  iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  splitTitle: { fontSize: 13, fontWeight: "600", marginBottom: 4 },
  splitAmt: { fontSize: 22, fontWeight: "800", marginBottom: 16 },
  btnSm: { paddingVertical: 10 },

  sectionTitle: { fontSize: 18, fontWeight: "800", marginBottom: 16 },
  bankCard: { flexDirection: "row", alignItems: "center", gap: 16, padding: 16 },
  bankName: { fontSize: 16, fontWeight: "700", marginBottom: 2 },
  bankAcct: { fontSize: 14, fontWeight: "500" },
});
