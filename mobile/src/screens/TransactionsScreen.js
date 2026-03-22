import { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, RefreshControl } from "react-native";
import * as SecureStore from "expo-secure-store";
import { SafeAreaView } from "react-native-safe-area-context";

import { useColors } from "../context/ThemeContext";
import { getUserTransactions } from "../api/api";
import Card from "../components/Card";
import Badge from "../components/Badge";

export default function TransactionsScreen({ navigation }) {
  const c = useColors();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [txs, setTxs] = useState([]);

  const loadData = async () => {
    try {
      const userId = await SecureStore.getItemAsync("user_id");
      const res = await getUserTransactions(userId).catch(() => []);
      setTxs(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const renderItem = ({ item }) => {
    const isSend = item.tx_type === "offline_send" || item.tx_type === "standard";
    return (
      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={[styles.iconBox, { backgroundColor: isSend ? c.indigo + "15" : c.emerald + "15" }]}>
            <Text style={{ fontSize: 16 }}>{isSend ? "↗" : "↙"}</Text>
          </View>
          <View style={styles.info}>
            <Text style={[styles.title, { color: c.text }]}>
               {isSend ? (item.receiver_id === "external" ? "Online Transfer" : "Sent Offline Payment") : "Received Payment"}
            </Text>
            <Text style={[styles.date, { color: c.textMuted }]}>{new Date(item.created_at).toLocaleString()}</Text>
          </View>
          <View style={styles.amtBox}>
            <Text style={[styles.amt, { color: isSend ? c.text : c.emerald }]}>
              {isSend ? "-" : "+"}₹{Number(item.amount).toLocaleString()}
            </Text>
            <Badge status={item.status === "settled" ? "success" : "warning"} text={item.status.toUpperCase()} size="sm" />
          </View>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.text, fontSize: 28 }]}>History</Text>
      </View>
      
      <FlatList
        data={txs}
        keyExtractor={(item, i) => item.id || i.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={c.indigo} />}
        ListEmptyComponent={
           <Text style={{ color: c.textMuted, textAlign: "center", marginTop: 40 }}>No transactions yet.</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingBottom: 10 },
  list: { padding: 20, paddingTop: 10, gap: 12 },
  
  card: { padding: 16 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBox: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  info: { flex: 1 },
  title: { fontSize: 15, fontWeight: "700", marginBottom: 2 },
  date: { fontSize: 12, fontWeight: "500" },
  
  amtBox: { alignItems: "flex-end", gap: 4 },
  amt: { fontSize: 16, fontWeight: "800" },
});
