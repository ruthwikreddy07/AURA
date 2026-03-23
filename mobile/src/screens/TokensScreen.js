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
      // Tokens are fetched by wallet_id — for now we use userId as fallback
      const res = await getUserTokens(userId).catch(() => [
        { id: "TKN-1234", token_value: 1000, remaining_value: 750, status: "active", issued_at: new Date().toISOString(), expires_at: new Date(Date.now() + 86400000).toISOString() },
        { id: "TKN-5678", token_value: 500, remaining_value: 0, status: "spent", issued_at: new Date().toISOString(), expires_at: new Date().toISOString() },
        { id: "TKN-9012", token_value: 2000, remaining_value: 2000, status: "active", issued_at: new Date().toISOString(), expires_at: new Date(Date.now() + 172800000).toISOString() },
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
      await issueToken({
        wallet_id: userId,
        token_value: Number(amount),
        expires_at: new Date(Date.now() + 7 * 86400000).toISOString(), // 7 day expiry
      });
      setAmount("");
      loadData();
    } catch (e) {
      Alert.alert("Issue Failed", e.message);
    } finally {
      setIssuing(false);
    }
  };

  const getSpendPercent = (tkn) => {
    const total = Number(tkn.token_value) || 1;
    const remaining = Number(tkn.remaining_value) || 0;
    return ((total - remaining) / total) * 100;
  };

  const getTimeLeft = (expiresAt) => {
    const diff = new Date(expiresAt) - new Date();
    if (diff <= 0) return "Expired";
    const hours = Math.floor(diff / 3600000);
    if (hours < 24) return `${hours}h left`;
    const days = Math.floor(hours / 24);
    return `${days}d left`;
  };

  const statusColor = (status) => {
    if (status === "active") return "success";
    if (status === "spent") return "info";
    if (status === "expired") return "warning";
    return "info";
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
          tokens.map((tkn, i) => {
            const spentPct = getSpendPercent(tkn);
            const tokenValue = Number(tkn.token_value) || Number(tkn.amount) || 0;
            const remainingValue = Number(tkn.remaining_value) ?? tokenValue;
            const isPartiallySpent = remainingValue < tokenValue && remainingValue > 0;

            return (
              <Card key={i} style={styles.tknCard}>
                <View style={styles.tknHeader}>
                  <Text style={[styles.tknId, { color: c.text }]}>
                    {(tkn.id || "").substring(0, 8).toUpperCase()}
                  </Text>
                  <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
                    <Badge 
                      status={statusColor(tkn.status)} 
                      text={tkn.status?.toUpperCase() || "UNKNOWN"} 
                      size="sm" 
                    />
                    {tkn.expires_at && tkn.status === "active" && (
                      <Text style={[styles.timeLeft, { color: c.amber }]}>{getTimeLeft(tkn.expires_at)}</Text>
                    )}
                  </View>
                </View>

                {/* Amount display */}
                <View style={styles.amountRow}>
                  <View>
                    <Text style={[styles.tknLabel, { color: c.textMuted }]}>Face Value</Text>
                    <Text style={[styles.tknAmt, { color: c.text }]}>₹{tokenValue.toLocaleString()}</Text>
                  </View>
                  {isPartiallySpent && (
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={[styles.tknLabel, { color: c.textMuted }]}>Remaining</Text>
                      <Text style={[styles.tknRemaining, { color: c.emerald }]}>₹{remainingValue.toLocaleString()}</Text>
                    </View>
                  )}
                </View>

                {/* Spend progress bar */}
                {tkn.status === "active" && (
                  <View style={styles.progressSection}>
                    <View style={[styles.progressBar, { backgroundColor: c.border }]}>
                      <View style={[styles.progressFill, { 
                        width: `${Math.min(spentPct, 100)}%`, 
                        backgroundColor: spentPct > 80 ? c.red : spentPct > 50 ? c.amber : c.emerald 
                      }]} />
                    </View>
                    <View style={styles.progressLabels}>
                      <Text style={[styles.progressText, { color: c.textMuted }]}>
                        {spentPct > 0 ? `${Math.round(spentPct)}% spent` : "Unspent"}
                      </Text>
                      <Text style={[styles.progressText, { color: c.textMuted }]}>
                        ₹{(tokenValue - remainingValue).toLocaleString()} used
                      </Text>
                    </View>
                  </View>
                )}

                <Text style={[styles.tknDate, { color: c.textMuted }]}>
                  Issued {new Date(tkn.issued_at || tkn.created_at).toLocaleDateString()}
                </Text>
              </Card>
            );
          })
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
  timeLeft: { fontSize: 11, fontWeight: "700" },
  amountRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12 },
  tknLabel: { fontSize: 11, fontWeight: "600", marginBottom: 2 },
  tknAmt: { fontSize: 24, fontWeight: "800" },
  tknRemaining: { fontSize: 20, fontWeight: "800" },
  progressSection: { marginBottom: 12 },
  progressBar: { width: "100%", height: 6, borderRadius: 3, overflow: "hidden", marginBottom: 4 },
  progressFill: { height: "100%", borderRadius: 3 },
  progressLabels: { flexDirection: "row", justifyContent: "space-between" },
  progressText: { fontSize: 11, fontWeight: "500" },
  tknDate: { fontSize: 12, fontWeight: "500" },
});
