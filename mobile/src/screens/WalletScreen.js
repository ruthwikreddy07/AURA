import { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl, Alert, Modal } from "react-native";
import * as SecureStore from "expo-secure-store";
import { SafeAreaView } from "react-native-safe-area-context";

import { useColors } from "../context/ThemeContext";
import { getUserWallet, getUserBankAccounts, fundWallet, withdrawWallet, verifyTransactionPin } from "../api/api";
import Card from "../components/Card";
import Button from "../components/Button";
import Input from "../components/Input";

export default function WalletScreen({ navigation }) {
  const c = useColors();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [wallets, setWallets] = useState([]);
  const [banks, setBanks] = useState([]);

  // Modal state
  const [modalType, setModalType] = useState(null); // "fund" | "withdraw" | null
  const [modalAmount, setModalAmount] = useState("");
  const [modalPin, setModalPin] = useState("");
  const [modalLoading, setModalLoading] = useState(false);

  const loadData = async () => {
    try {
      const userId = await SecureStore.getItemAsync("user_id");
      if (!userId) return navigation.replace("Auth");
      const [wRes, bRes] = await Promise.all([
        getUserWallet(userId).catch(() => []),
        getUserBankAccounts(userId).catch(() => []),
      ]);
      setWallets(Array.isArray(wRes) ? wRes : [wRes]);
      setBanks(bRes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const totalBalance = wallets.reduce((sum, w) => sum + (Number(w.balance) || 0), 0);
  const onlineWallet = wallets.find(w => w.wallet_type === "online") || wallets[0];
  const offlineWallet = wallets.find(w => w.wallet_type === "offline");
  const primaryBank = banks.find(b => b.is_primary) || banks[0];

  const handleFundWithdraw = async () => {
    if (!modalAmount || Number(modalAmount) <= 0) return Alert.alert("Invalid", "Enter a valid amount.");
    if (!modalPin || modalPin.length < 4) return Alert.alert("PIN Required", "Enter your transaction PIN.");
    if (!onlineWallet) return Alert.alert("No Wallet", "No wallet found. Please create a wallet first.");
    if (!primaryBank) return Alert.alert("No Bank", "Please link a bank account first.");

    setModalLoading(true);
    try {
      // Verify PIN first
      await verifyTransactionPin(modalPin);

      const data = {
        wallet_id: onlineWallet.id,
        amount: Number(modalAmount),
        bank_account_id: primaryBank.id,
        pin: modalPin,
      };

      if (modalType === "fund") {
        await fundWallet(data);
        Alert.alert("Success", `₹${modalAmount} added to wallet.`);
      } else {
        await withdrawWallet(data);
        Alert.alert("Success", `₹${modalAmount} withdrawn to bank.`);
      }
      setModalType(null);
      setModalAmount("");
      setModalPin("");
      loadData();
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setModalLoading(false);
    }
  };

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
          <Text style={[styles.cardTitle, { color: c.text }]}>₹{totalBalance.toLocaleString()}</Text>
        </Card>

        <View style={styles.splitGrid}>
          <Card style={[styles.splitCard, { borderColor: c.emerald + "30" }]}>
            <View style={[styles.iconBox, { backgroundColor: c.emerald + "15" }]}>
              <Text style={{ color: c.emerald }}>🌐</Text>
            </View>
            <Text style={[styles.splitTitle, { color: c.textSecondary }]}>Online Funds</Text>
            <Text style={[styles.splitAmt, { color: c.text }]}>₹{(Number(onlineWallet?.balance) || 0).toLocaleString()}</Text>
            <Button variant="secondary" style={styles.btnSm} onPress={() => setModalType("fund")}>Add Money</Button>
          </Card>

          <Card style={[styles.splitCard, { borderColor: c.violet + "30" }]}>
            <View style={[styles.iconBox, { backgroundColor: c.violet + "15" }]}>
              <Text style={{ color: c.violet }}>🔒</Text>
            </View>
            <Text style={[styles.splitTitle, { color: c.textSecondary }]}>Offline Vault</Text>
            <Text style={[styles.splitAmt, { color: c.text }]}>₹{(Number(offlineWallet?.balance) || 0).toLocaleString()}</Text>
            <Button variant="secondary" style={styles.btnSm} onPress={() => navigation.navigate("Tokens")}>Manage Tokens</Button>
          </Card>
        </View>

        {/* Withdraw Button */}
        <Button variant="secondary" style={{ marginTop: 16, borderColor: c.amber + "50" }} onPress={() => setModalType("withdraw")}>
          Withdraw to Bank
        </Button>

        <Text style={[styles.sectionTitle, { color: c.text, marginTop: 32 }]}>Linked Accounts</Text>
        {banks.length === 0 ? (
          <Card style={styles.bankCard}>
            <Text style={{ color: c.textMuted, textAlign: "center", flex: 1 }}>No bank accounts linked.</Text>
            <Button variant="ghost" onPress={() => navigation.navigate("BankAccounts")}>Link Account</Button>
          </Card>
        ) : (
          banks.map((acc) => (
            <Card key={acc.id} style={styles.bankCard}>
              <View style={[styles.iconBox, { backgroundColor: c.border }]}>
                <Text style={{ fontSize: 18 }}>🏦</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.bankName, { color: c.text }]}>{acc.bank_name}{acc.is_primary ? " ★" : ""}</Text>
                <Text style={[styles.bankAcct, { color: c.textMuted }]}>{acc.account_number_masked}</Text>
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      {/* ═══ FUND / WITHDRAW MODAL ═══ */}
      <Modal visible={!!modalType} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: c.card, borderColor: c.border }]}>
            <Text style={[styles.modalTitle, { color: c.text }]}>
              {modalType === "fund" ? "Add Money to Wallet" : "Withdraw to Bank"}
            </Text>
            {primaryBank && (
              <Text style={{ color: c.textMuted, marginBottom: 16, fontSize: 13 }}>
                {modalType === "fund" ? "From" : "To"}: {primaryBank.bank_name} ({primaryBank.account_number_masked})
              </Text>
            )}
            <Input label="Amount (₹)" placeholder="Enter amount" value={modalAmount} onChangeText={setModalAmount} keyboardType="numeric" />
            <Input label="Transaction PIN" placeholder="4-digit PIN" value={modalPin} onChangeText={setModalPin} keyboardType="numeric" secureTextEntry maxLength={6} />
            <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
              <Button variant="secondary" style={{ flex: 1 }} onPress={() => { setModalType(null); setModalAmount(""); setModalPin(""); }}>Cancel</Button>
              <Button style={{ flex: 1 }} onPress={handleFundWithdraw} disabled={modalLoading}>
                {modalLoading ? "Processing..." : (modalType === "fund" ? "Add Money" : "Withdraw")}
              </Button>
            </View>
          </View>
        </View>
      </Modal>
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
  bankCard: { flexDirection: "row", alignItems: "center", gap: 16, padding: 16, marginBottom: 8 },
  bankName: { fontSize: 16, fontWeight: "700", marginBottom: 2 },
  bankAcct: { fontSize: 14, fontWeight: "500" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, borderWidth: 1, borderBottomWidth: 0 },
  modalTitle: { fontSize: 20, fontWeight: "800", marginBottom: 8 },
});
