import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";

import { useTheme, useColors } from "../context/ThemeContext";
import Card from "../components/Card";
import Toggle from "../components/Toggle";
import Button from "../components/Button";

export default function SettingsScreen({ navigation }) {
  const { dark, toggle } = useTheme();
  const c = useColors();

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync("auth_token");
    await SecureStore.deleteItemAsync("user_id");
    navigation.replace("Auth");
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
        <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>Preferences</Text>
        <Card style={styles.card}>
          <Row label="Dark Mode" control={<Toggle value={dark} onValueChange={toggle} />} />
          <Row label="Biometric Auth (FaceID)" control={<Toggle value={true} onValueChange={() => {}} />} />
          <Row label="Offline Sync (Background)" control={<Toggle value={true} onValueChange={() => {}} />} />
        </Card>

        <Text style={[styles.sectionTitle, { color: c.textSecondary, marginTop: 32 }]}>AURA Protocol</Text>
        <Card style={styles.card}>
          <Row label="Key Rotation Frequency" control={<Text style={{ color: c.textMuted }}>Weekly</Text>} />
          <Row label="Risk Engine Strictness" control={<Text style={{ color: c.textMuted }}>Standard</Text>} />
          <Row label="Clear TEE Storage" control={<Button variant="ghost" style={styles.btnSm} onPress={() => {}}>Reset</Button>} />
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
  
  footer: { marginTop: 40, alignItems: "center" },
  logoutBtn: { width: "100%", borderWidth: 1 },
  version: { marginTop: 24, fontSize: 12, fontWeight: "500" },
});
