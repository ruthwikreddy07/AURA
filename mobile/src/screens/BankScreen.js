import { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl, Alert, TouchableOpacity, Modal } from "react-native";
import * as SecureStore from "expo-secure-store";
import { SafeAreaView } from "react-native-safe-area-context";

import { useColors } from "../context/ThemeContext";
import { getUserBankAccounts, linkBankAccount, removeBankAccount, setPrimaryBank } from "../api/api";
import Card from "../components/Card";
import Button from "../components/Button";
import Input from "../components/Input";
import Badge from "../components/Badge";

export default function BankScreen({ navigation }) {
  const c = useColors();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linking, setLinking] = useState(false);

  // Link form fields
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [upiId, setUpiId] = useState("");

  const loadData = async () => {
    try {
      const userId = await SecureStore.getItemAsync("user_id");
      if (!userId) return;
      const res = await getUserBankAccounts(userId).catch(() => []);
      setAccounts(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleLink = async () => {
    if (!bankName || !accountName || !accountNumber) {
      return Alert.alert("Missing Fields", "Please fill in bank name, account name, and account number.");
    }
    setLinking(true);
    try {
      await linkBankAccount({
        bank_name: bankName,
        account_name: accountName,
        account_number_masked: accountNumber.slice(-4).padStart(accountNumber.length, "•"),
        ifsc_code: ifscCode || null,
        upi_id: upiId || null,
      });
      resetForm();
      setShowLinkModal(false);
      loadData();
      Alert.alert("Success", "Bank account linked successfully.");
    } catch (e) {
      Alert.alert("Link Failed", e.message);
    } finally {
      setLinking(false);
    }
  };

  const handleRemove = (id, name) => {
    Alert.alert("Remove Account", `Remove ${name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove", style: "destructive",
        onPress: async () => {
          try {
            await removeBankAccount(id);
            loadData();
          } catch (e) {
            Alert.alert("Error", e.message);
          }
        },
      },
    ]);
  };

  const handleSetPrimary = async (id) => {
    try {
      await setPrimaryBank(id);
      loadData();
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  };

  const resetForm = () => {
    setBankName(""); setAccountName(""); setAccountNumber(""); setIfscCode(""); setUpiId("");
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.text }]}>Bank Accounts</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={c.indigo} />}
      >
        <Button onPress={() => setShowLinkModal(true)} style={{ marginBottom: 20 }}>
          + Link New Account
        </Button>

        {accounts.length === 0 ? (
          <Card style={{ padding: 32, alignItems: "center" }}>
            <Text style={{ fontSize: 40, marginBottom: 16 }}>🏦</Text>
            <Text style={[styles.emptyTitle, { color: c.text }]}>No Accounts Linked</Text>
            <Text style={{ color: c.textMuted, textAlign: "center" }}>
              Link a bank account to fund your wallet and enable withdrawals.
            </Text>
          </Card>
        ) : (
          accounts.map((acc) => (
            <Card key={acc.id} style={styles.bankCard}>
              <View style={styles.bankRow}>
                <View style={[styles.iconBox, { backgroundColor: c.indigo + "10" }]}>
                  <Text style={{ fontSize: 20 }}>🏦</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Text style={[styles.bankName, { color: c.text }]}>{acc.bank_name}</Text>
                    {acc.is_primary && <Badge status="success" text="PRIMARY" size="sm" />}
                  </View>
                  <Text style={[styles.bankAcct, { color: c.textMuted }]}>{acc.account_name}</Text>
                  <Text style={[styles.bankAcct, { color: c.textMuted }]}>{acc.account_number_masked}</Text>
                  {acc.upi_id && <Text style={[styles.bankAcct, { color: c.violet }]}>{acc.upi_id}</Text>}
                </View>
              </View>
              <View style={styles.bankActions}>
                {!acc.is_primary && (
                  <TouchableOpacity onPress={() => handleSetPrimary(acc.id)}>
                    <Text style={{ color: c.indigo, fontWeight: "700", fontSize: 13 }}>Set Primary</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => handleRemove(acc.id, acc.bank_name)}>
                  <Text style={{ color: c.red, fontWeight: "700", fontSize: 13 }}>Remove</Text>
                </TouchableOpacity>
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      {/* ═══ LINK MODAL ═══ */}
      <Modal visible={showLinkModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: c.card, borderColor: c.border }]}>
            <Text style={[styles.modalTitle, { color: c.text }]}>Link Bank Account</Text>
            <ScrollView style={{ maxHeight: 400 }}>
              <Input label="Bank Name" placeholder="e.g. HDFC Bank" value={bankName} onChangeText={setBankName} />
              <Input label="Account Holder Name" placeholder="Full name" value={accountName} onChangeText={setAccountName} />
              <Input label="Account Number" placeholder="Account number" value={accountNumber} onChangeText={setAccountNumber} keyboardType="numeric" />
              <Input label="IFSC Code (optional)" placeholder="e.g. HDFC0001234" value={ifscCode} onChangeText={setIfscCode} />
              <Input label="UPI ID (optional)" placeholder="e.g. name@upi" value={upiId} onChangeText={setUpiId} />
            </ScrollView>
            <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
              <Button variant="secondary" style={{ flex: 1 }} onPress={() => { resetForm(); setShowLinkModal(false); }}>
                Cancel
              </Button>
              <Button style={{ flex: 1 }} onPress={handleLink} disabled={linking}>
                {linking ? "Linking..." : "Link Account"}
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
  scroll: { padding: 20, paddingTop: 10 },
  emptyTitle: { fontSize: 18, fontWeight: "800", marginBottom: 8 },
  bankCard: { padding: 16, marginBottom: 12 },
  bankRow: { flexDirection: "row", gap: 14, alignItems: "flex-start" },
  iconBox: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  bankName: { fontSize: 16, fontWeight: "700", marginBottom: 2 },
  bankAcct: { fontSize: 13, fontWeight: "500", marginTop: 1 },
  bankActions: { flexDirection: "row", justifyContent: "flex-end", gap: 20, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#8881" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, borderWidth: 1, borderBottomWidth: 0 },
  modalTitle: { fontSize: 20, fontWeight: "800", marginBottom: 20 },
});
