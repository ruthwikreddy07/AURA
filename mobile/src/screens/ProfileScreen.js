import { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl, Alert } from "react-native";
import * as SecureStore from "expo-secure-store";
import { SafeAreaView } from "react-native-safe-area-context";

import { useColors } from "../context/ThemeContext";
import { getUserProfile, updateUserProfile, setTransactionPin } from "../api/api";
import Card from "../components/Card";
import Button from "../components/Button";
import Input from "../components/Input";
import Badge from "../components/Badge";
import Toggle from "../components/Toggle";

export default function ProfileScreen({ navigation }) {
  const c = useColors();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Edit states
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  // PIN states
  const [showPinForm, setShowPinForm] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [settingPin, setSettingPin] = useState(false);

  const loadProfile = async () => {
    try {
      const res = await getUserProfile();
      setProfile(res);
      setFullName(res.full_name || "");
      setPhone(res.phone_number || "");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadProfile(); }, []);

  const handleSave = async () => {
    try {
      const res = await updateUserProfile({
        full_name: fullName,
        phone_number: phone || null,
      });
      setProfile(res);
      setEditing(false);
      Alert.alert("Saved", "Profile updated successfully.");
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  };

  const handleSetPin = async () => {
    if (newPin.length < 4) return Alert.alert("Invalid", "PIN must be at least 4 digits.");
    if (newPin !== confirmPin) return Alert.alert("Mismatch", "PINs do not match.");
    setSettingPin(true);
    try {
      await setTransactionPin(newPin);
      // Also store for app lock
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
      const res = await updateUserProfile({ app_lock_enabled: value });
      setProfile(res);
      if (value) {
        await SecureStore.setItemAsync("app_lock_enabled", "true");
      } else {
        await SecureStore.deleteItemAsync("app_lock_enabled");
      }
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  };

  const kycColor = (status) => {
    if (status === "verified") return "success";
    if (status === "pending") return "warning";
    return "info";
  };

  if (loading || !profile) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: c.text }]}>Profile</Text>
        </View>
        <Text style={{ color: c.textMuted, textAlign: "center", marginTop: 40 }}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.text }]}>Profile</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadProfile(); }} tintColor={c.indigo} />}
      >
        {/* Avatar & Name */}
        <Card style={styles.profileCard}>
          <View style={[styles.avatar, { backgroundColor: c.indigo + "20" }]}>
            <Text style={[styles.avatarText, { color: c.indigo }]}>
              {profile.full_name?.charAt(0)?.toUpperCase() || "A"}
            </Text>
          </View>
          <Text style={[styles.profileName, { color: c.text }]}>{profile.full_name}</Text>
          <Text style={[styles.profileEmail, { color: c.textSecondary }]}>{profile.email}</Text>
          <View style={styles.badgeRow}>
            <Badge status={kycColor(profile.kyc_status)} text={`KYC: ${profile.kyc_status.toUpperCase()}`} size="sm" />
            {profile.has_transaction_pin && <Badge status="success" text="PIN SET" size="sm" />}
          </View>
        </Card>

        {/* KYC Upgrade Banner */}
        {profile.kyc_status === "pending" ? (
          <Card style={[styles.infoCard, { backgroundColor: c.amber + "15", borderColor: c.amber + "40", marginBottom: 24 }]}>
            <Text style={[styles.secLabel, { color: c.amber, marginBottom: 8 }]}>Standard Tier (₹5,000 Limit)</Text>
            <Text style={{ color: c.textSecondary, fontSize: 13, marginBottom: 16 }}>
              Upgrade your KYC to unlock the ₹1,00,000 Pro offline transaction limit by verifying your Aadhaar or PAN.
            </Text>
            <Button 
              style={{ backgroundColor: c.amber }} 
              onPress={async () => {
                try {
                  const res = await updateUserProfile({ kyc_status: "verified" });
                  setProfile(res);
                  Alert.alert("Verified!", "Pro Limits Unlocked.");
                } catch(e) { Alert.alert("Error", e.message); }
              }}
            >
              Verify Identity with Aadhaar
            </Button>
          </Card>
        ) : (
          <Card style={[styles.infoCard, { backgroundColor: c.emerald + "15", borderColor: c.emerald + "40", marginBottom: 24 }]}>
            <Text style={[styles.secLabel, { color: c.emerald, marginBottom: 4 }]}>Pro Tier Unlocked</Text>
            <Text style={{ color: c.textSecondary, fontSize: 13 }}>
              Your offline issuance limit has been permanently upgraded to ₹1,00,000.
            </Text>
          </Card>
        )}

        {/* Personal Info */}
        <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>Personal Information</Text>
        <Card style={styles.infoCard}>
          {editing ? (
            <>
              <Input label="Full Name" value={fullName} onChangeText={setFullName} />
              <Input label="Phone Number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
              <View style={{ flexDirection: "row", gap: 12, marginTop: 8 }}>
                <Button variant="secondary" style={{ flex: 1 }} onPress={() => setEditing(false)}>Cancel</Button>
                <Button style={{ flex: 1 }} onPress={handleSave}>Save</Button>
              </View>
            </>
          ) : (
            <>
              <View style={styles.infoRow}>
                <Text style={{ color: c.textMuted, fontSize: 13 }}>Full Name</Text>
                <Text style={[styles.infoValue, { color: c.text }]}>{profile.full_name}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={{ color: c.textMuted, fontSize: 13 }}>Email</Text>
                <Text style={[styles.infoValue, { color: c.text }]}>{profile.email}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={{ color: c.textMuted, fontSize: 13 }}>Phone</Text>
                <Text style={[styles.infoValue, { color: c.text }]}>{profile.phone_number || "Not set"}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={{ color: c.textMuted, fontSize: 13 }}>Phone Verified</Text>
                <Text style={[styles.infoValue, { color: profile.phone_verified ? c.emerald : c.textMuted }]}>
                  {profile.phone_verified ? "Yes" : "No"}
                </Text>
              </View>
              <Button variant="secondary" onPress={() => setEditing(true)} style={{ marginTop: 12 }}>
                Edit Profile
              </Button>
            </>
          )}
        </Card>

        {/* Security */}
        <Text style={[styles.sectionTitle, { color: c.textSecondary, marginTop: 24 }]}>Security</Text>
        <Card style={styles.infoCard}>
          <View style={[styles.securityRow, { borderBottomColor: c.border }]}>
            <View>
              <Text style={[styles.secLabel, { color: c.text }]}>Transaction PIN</Text>
              <Text style={{ color: c.textMuted, fontSize: 12 }}>
                {profile.has_transaction_pin ? "PIN is set" : "No PIN configured"}
              </Text>
            </View>
            <Button variant="ghost" style={styles.btnSm} onPress={() => setShowPinForm(!showPinForm)}>
              {profile.has_transaction_pin ? "Change" : "Set PIN"}
            </Button>
          </View>

          {showPinForm && (
            <View style={styles.pinForm}>
              <Input label="New PIN" placeholder="4–6 digits" value={newPin} onChangeText={setNewPin} keyboardType="numeric" secureTextEntry maxLength={6} />
              <Input label="Confirm PIN" placeholder="Re-enter PIN" value={confirmPin} onChangeText={setConfirmPin} keyboardType="numeric" secureTextEntry maxLength={6} />
              <Button onPress={handleSetPin} disabled={settingPin} style={{ marginTop: 8 }}>
                {settingPin ? "Setting..." : "Save PIN"}
              </Button>
            </View>
          )}

          <View style={styles.securityRow}>
            <View>
              <Text style={[styles.secLabel, { color: c.text }]}>App Lock</Text>
              <Text style={{ color: c.textMuted, fontSize: 12 }}>Require PIN/biometric on app launch</Text>
            </View>
            <Toggle value={profile.app_lock_enabled} onValueChange={handleToggleAppLock} />
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
  scroll: { padding: 20, paddingTop: 10 },

  profileCard: { alignItems: "center", padding: 28, marginBottom: 24 },
  avatar: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  avatarText: { fontSize: 30, fontWeight: "800" },
  profileName: { fontSize: 22, fontWeight: "800", marginBottom: 4 },
  profileEmail: { fontSize: 14, fontWeight: "500", marginBottom: 12 },
  badgeRow: { flexDirection: "row", gap: 8 },

  sectionTitle: { fontSize: 13, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, marginLeft: 4 },
  infoCard: { padding: 16 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#8881" },
  infoValue: { fontSize: 15, fontWeight: "600" },

  securityRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1 },
  secLabel: { fontSize: 15, fontWeight: "600", marginBottom: 2 },
  btnSm: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  pinForm: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#8881" },
});
