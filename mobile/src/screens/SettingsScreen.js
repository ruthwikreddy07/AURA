import { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";

import { useTheme, useColors } from "../context/ThemeContext";
import { setTransactionPin, updateUserProfile, getUserProfile } from "../api/api";
import Card from "../components/Card";
import Toggle from "../components/Toggle";
import Button from "../components/Button";
import Input from "../components/Input";

export default function SettingsScreen({ navigation }) {
  const { dark, toggle } = useTheme();
  const c = useColors();
  const [profile, setProfile] = useState(null);

  // PIN management
  const [showPinForm, setShowPinForm] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [settingPin, setSettingPin] = useState(false);

  // Notification prefs
  const [pushNotifs, setPushNotifs] = useState(true);
  const [txnAlerts, setTxnAlerts] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await getUserProfile();
      setProfile(res);
    } catch (e) { /* silent */ }
  };

  const handleLogout = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out", style: "destructive",
        onPress: async () => {
          await SecureStore.deleteItemAsync("auth_token");
          await SecureStore.deleteItemAsync("user_id");
          await SecureStore.deleteItemAsync("app_lock_enabled");
          navigation.replace("Auth");
        },
      },
    ]);
  };

  const handleSetPin = async () => {
    if (newPin.length < 4) return Alert.alert("Invalid", "PIN must be at least 4 digits.");
    if (newPin !== confirmPin) return Alert.alert("Mismatch", "PINs do not match.");
    setSettingPin(true);
    try {
      await setTransactionPin(newPin);
      await SecureStore.setItemAsync("app_lock_pin", newPin);
      setShowPinForm(false);
      setNewPin("");
      setConfirmPin("");
      loadProfile();
      Alert.alert("Success", "Transaction PIN updated.");
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setSettingPin(false);
    }
  };

  const handleToggleAppLock = async (value) => {
    try {
      await updateUserProfile({ app_lock_enabled: value });
      if (value) {
        await SecureStore.setItemAsync("app_lock_enabled", "true");
      } else {
        await SecureStore.deleteItemAsync("app_lock_enabled");
      }
      loadProfile();
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  };

  const Row = ({ label, control }) => (
    <View style={[styles.row, { borderBottomColor: c.border }]}>
      <Text style={[styles.label, { color: c.text }]}>{label}</Text>
      {control}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.text }]}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* ═══ PREFERENCES ═══ */}
        <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>Preferences</Text>
        <Card style={styles.card}>
          <Row label="Dark Mode" control={<Toggle value={dark} onValueChange={toggle} />} />
          <Row label="Push Notifications" control={<Toggle value={pushNotifs} onValueChange={setPushNotifs} />} />
          <Row label="Transaction Alerts" control={<Toggle value={txnAlerts} onValueChange={setTxnAlerts} />} />
        </Card>

        {/* ═══ SECURITY ═══ */}
        <Text style={[styles.sectionTitle, { color: c.textSecondary, marginTop: 32 }]}>Security</Text>
        <Card style={styles.card}>
          <Row
            label="Transaction PIN"
            control={
              <Button variant="ghost" style={styles.btnSm} onPress={() => setShowPinForm(!showPinForm)}>
                {profile?.has_transaction_pin ? "Change" : "Set PIN"}
              </Button>
            }
          />
          {showPinForm && (
            <View style={styles.pinForm}>
              <Input label="New PIN" placeholder="4–6 digits" value={newPin} onChangeText={setNewPin} keyboardType="numeric" secureTextEntry maxLength={6} />
              <Input label="Confirm PIN" placeholder="Re-enter" value={confirmPin} onChangeText={setConfirmPin} keyboardType="numeric" secureTextEntry maxLength={6} />
              <Button onPress={handleSetPin} disabled={settingPin} style={{ marginTop: 8 }}>
                {settingPin ? "Setting..." : "Save PIN"}
              </Button>
            </View>
          )}
          <Row
            label="App Lock"
            control={<Toggle value={profile?.app_lock_enabled || false} onValueChange={handleToggleAppLock} />}
          />
          <Row label="Biometric Auth (FaceID)" control={<Toggle value={true} onValueChange={() => {}} />} />
        </Card>

        {/* ═══ PROTOCOL ═══ */}
        <Text style={[styles.sectionTitle, { color: c.textSecondary, marginTop: 32 }]}>AURA Protocol</Text>
        <Card style={styles.card}>
          <Row label="Key Rotation Frequency" control={<Text style={{ color: c.textMuted }}>Weekly</Text>} />
          <Row label="Risk Engine Strictness" control={<Text style={{ color: c.textMuted }}>Standard</Text>} />
          <Row label="Offline Sync (Background)" control={<Toggle value={true} onValueChange={() => {}} />} />
          <Row label="Clear TEE Storage" control={<Button variant="ghost" style={styles.btnSm} onPress={() => Alert.alert("Reset", "TEE storage cleared (simulated).")}>Reset</Button>} />
        </Card>

        {/* ═══ ABOUT ═══ */}
        <Text style={[styles.sectionTitle, { color: c.textSecondary, marginTop: 32 }]}>About</Text>
        <Card style={styles.card}>
          <Row label="Version" control={<Text style={{ color: c.textMuted }}>2.0.0-native</Text>} />
          <Row label="Protocol" control={<Text style={{ color: c.textMuted }}>AURA v2</Text>} />
          <Row label="Security" control={<Text style={{ color: c.emerald, fontWeight: "600" }}>AES-256-GCM</Text>} />
        </Card>

        <View style={styles.footer}>
          <Button variant="secondary" style={[styles.logoutBtn, { borderColor: c.red }]} onPress={handleLogout}>
            <Text style={{ color: c.red, fontWeight: "700" }}>Sign Out</Text>
          </Button>
          <Text style={[styles.version, { color: c.textMuted }]}>AURA Protocol v2.0-native</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingBottom: 10 },
  title: { fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },
  scroll: { padding: 20, paddingTop: 10 },
  
  sectionTitle: { fontSize: 13, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, marginLeft: 4 },
  card: { padding: 0, overflow: "hidden" },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 1 },
  label: { fontSize: 15, fontWeight: "600" },
  btnSm: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  pinForm: { padding: 16, borderBottomWidth: 1, borderBottomColor: "#8881" },
  
  footer: { marginTop: 40, alignItems: "center" },
  logoutBtn: { width: "100%", borderWidth: 1 },
  version: { marginTop: 24, fontSize: 12, fontWeight: "500", marginBottom: 40 },
});
