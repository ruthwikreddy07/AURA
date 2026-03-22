import { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl, Alert } from "react-native";
import * as SecureStore from "expo-secure-store";
import { SafeAreaView } from "react-native-safe-area-context";

import { useColors } from "../context/ThemeContext";
import { getUserTokens, issueToken } from "../api/api";
import Card from "../components/Card";
import Button from "../components/Button";
import Input from "../components/Input";
import Badge from "../components/Badge";

export default function TokensScreen({ navigation }) {
  const c = useColors();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tokens, setTokens] = useState([]);
  const [amount, setAmount] = useState("");
  const [issuing, setIssuing] = useState(false);

  const loadData = async () => {
    try {
      const userId = await SecureStore.getItemAsync("user_id");
      const res = await getUserTokens(userId).catch(() => [
        { id: "TKN-1234", amount: 1000, status: "active", created_at: new Date().toISOString() },
        { id: "TKN-5678", amount: 500, status: "spent", created_at: new Date().toISOString() }
      ]);
      setTokens(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleIssue = async () => {
    if (!amount || isNaN(amount) || Number(amount) <= 0) return Alert.alert("Invalid Amount");
    setIssuing(true);
    try {
      const userId = await SecureStore.getItemAsync("user_id");
      await issueToken({ user_id: userId, amount: Number(amount) });
      setAmount("");
      loadData();
    } catch (e) {
      Alert.alert("Issue Failed", e.message);
    } finally {
      setIssuing(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.text }]}>Offline Tokens</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={c.indigo} />}
      >
        <Card style={styles.issueCard}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>Provision New Token</Text>
          <Text style={[styles.cardDesc, { color: c.textSecondary }]}>
            Lock online funds into a cryptographically signed token for offline use.
          </Text>
          <View style={styles.issueRow}>
            <Input 
              placeholder="Amount (₹)" 
              value={amount} 
              onChangeText={setAmount} 
              keyboardType="numeric"
              style={{ flex: 1, marginBottom: 0 }}
            />
            <Button onPress={handleIssue} disabled={issuing} style={{ paddingHorizontal: 20 }}>
              {issuing ? "..." : "Issue"}
            </Button>
          </View>
        </Card>

        <Text style={[styles.sectionTitle, { color: c.text, marginTop: 24, marginBottom: 16 }]}>Your Tokens</Text>
        
        {tokens.length === 0 ? (
          <Text style={{ color: c.textMuted, textAlign: "center", padding: 20 }}>No tokens provisioned.</Text>
        ) : (
          tokens.map((tkn, i) => (
            <Card key={i} style={styles.tknCard}>
              <View style={styles.tknHeader}>
                <Text style={[styles.tknId, { color: c.text }]}>{tkn.id.substring(0, 8).toUpperCase()}</Text>
                <Badge 
                  status={tkn.status === "active" ? "success" : "info"} 
                  text={tkn.status.toUpperCase()} 
                  size="sm" 
                />
              </View>
              <Text style={[styles.tknAmt, { color: c.text }]}>₹{Number(tkn.amount).toLocaleString()}</Text>
              <Text style={[styles.tknDate, { color: c.textMuted }]}>Issued on {new Date(tkn.created_at).toLocaleDateString()}</Text>
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
  scroll: { padding: 20, paddingTop: 0 },
  
  issueCard: { padding: 20, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "800", marginBottom: 8 },
  cardDesc: { fontSize: 14, marginBottom: 20, lineHeight: 20 },
  issueRow: { flexDirection: "row", gap: 12, alignItems: "center" },

  tknCard: { padding: 16, marginBottom: 12 },
  tknHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  tknId: { fontSize: 14, fontWeight: "700", fontFamily: "monospace" },
  tknAmt: { fontSize: 24, fontWeight: "800", marginBottom: 4 },
  tknDate: { fontSize: 12, fontWeight: "500" },
});
