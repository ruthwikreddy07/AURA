import { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useColors } from "../context/ThemeContext";
import Card from "../components/Card";
import Toggle from "../components/Toggle";
import ModeBadge from "../components/ModeBadge";

const ALL_MODES = [
  { id: "QR", name: "QR Code", desc: "Camera-based encrypted QR scanning", range: "Line of sight", latency: "~1.2s", available: true },
  { id: "BLE", name: "Bluetooth LE", desc: "Peer-to-peer BLE GATT transfer", range: "~30 meters", latency: "~0.8s", available: true },
  { id: "NFC", name: "NFC Tap", desc: "Near-field contactless data exchange", range: "~4 cm", latency: "~0.3s", available: true },
  { id: "Sound", name: "Ultrasonic", desc: "FSK tones at 18–20kHz (inaudible)", range: "~3 meters", latency: "~2.5s", available: true },
  { id: "Light", name: "Li-Fi", desc: "Manchester-encoded flashlight pulses", range: "~1 meter", latency: "~3.0s", available: true },
];

export default function ModeControlScreen() {
  const c = useColors();
  const [enabled, setEnabled] = useState({ QR: true, BLE: true, NFC: true, Sound: true, Light: true });
  const [priority, setPriority] = useState("QR");

  const toggleMode = (id) => setEnabled((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.text }]}>Mode Control</Text>
        <Text style={[styles.subtitle, { color: c.textSecondary }]}>Configure offline communication channels</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Active Priority */}
        <Card style={styles.priorityCard}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>Active Priority</Text>
          <View style={styles.priorityRow}>
            {ALL_MODES.filter((m) => m.available).map((m) => (
              <TouchableOpacity
                key={m.id}
                onPress={() => setPriority(m.id)}
                style={[styles.priorityBtn, { borderColor: priority === m.id ? c.indigo : c.border, backgroundColor: priority === m.id ? c.indigo + "10" : "transparent" }]}
              >
                <ModeBadge mode={m.id} active={priority === m.id} size="sm" />
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* All Modes */}
        <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>All Channels</Text>
        {ALL_MODES.map((m) => (
          <Card key={m.id} style={styles.modeCard}>
            <View style={styles.modeHeader}>
              <View style={styles.modeLeft}>
                <ModeBadge mode={m.id} active={enabled[m.id]} />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={[styles.modeName, { color: c.text }]}>{m.name}</Text>
                  <Text style={[styles.modeDesc, { color: c.textMuted }]}>{m.desc}</Text>
                </View>
              </View>
              <Toggle value={enabled[m.id]} onValueChange={() => m.available && toggleMode(m.id)} />
            </View>

            {!m.available && (
              <View style={[styles.unavailableTag, { backgroundColor: c.amber + "15", borderColor: c.amber + "30" }]}>
                <Text style={[styles.unavailableText, { color: c.amber }]}>
                  Research phase — experimental mode
                </Text>
              </View>
            )}

            <View style={styles.statsRow}>
              <View style={styles.statCol}>
                <Text style={[styles.statLabel, { color: c.textMuted }]}>Range</Text>
                <Text style={[styles.statVal, { color: c.text }]}>{m.range}</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: c.border }]} />
              <View style={styles.statCol}>
                <Text style={[styles.statLabel, { color: c.textMuted }]}>Latency</Text>
                <Text style={[styles.statVal, { color: c.text }]}>{m.latency}</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: c.border }]} />
              <View style={styles.statCol}>
                <Text style={[styles.statLabel, { color: c.textMuted }]}>Status</Text>
                <Text style={[styles.statVal, { color: m.available ? c.emerald : c.amber }]}>{m.available ? "Active" : "Pending"}</Text>
              </View>
            </View>
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingBottom: 10 },
  title: { fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },
  subtitle: { fontSize: 14, fontWeight: "500", marginTop: 4 },
  scroll: { padding: 20, paddingTop: 10, gap: 12 },

  priorityCard: { padding: 16, marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  priorityRow: { flexDirection: "row", gap: 10 },
  priorityBtn: { borderWidth: 1, borderRadius: 12, padding: 8 },

  sectionLabel: { fontSize: 13, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4, marginLeft: 4, marginTop: 12 },
  modeCard: { padding: 16 },
  modeHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  modeLeft: { flexDirection: "row", alignItems: "center", flex: 1, marginRight: 12 },
  modeName: { fontSize: 16, fontWeight: "700" },
  modeDesc: { fontSize: 12, fontWeight: "500", marginTop: 2 },

  unavailableTag: { marginTop: 12, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, alignSelf: "flex-start" },
  unavailableText: { fontSize: 11, fontWeight: "700" },

  statsRow: { flexDirection: "row", marginTop: 16, alignItems: "center" },
  statCol: { flex: 1, alignItems: "center" },
  statDivider: { width: 1, height: 28 },
  statLabel: { fontSize: 11, fontWeight: "600", marginBottom: 4 },
  statVal: { fontSize: 14, fontWeight: "800" },
});
