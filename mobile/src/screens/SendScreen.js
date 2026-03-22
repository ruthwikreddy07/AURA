import { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Animated, TouchableOpacity, Alert } from "react-native";
import * as SecureStore from "expo-secure-store";
import { SafeAreaView } from "react-native-safe-area-context";
import QRCode from "react-native-qrcode-svg";

import { useColors } from "../context/ThemeContext";
import { createPaymentSession, submitMotionProof, encryptPacket } from "../api/api";
import Card from "../components/Card";
import Button from "../components/Button";
import Input from "../components/Input";
import ModeBadge from "../components/ModeBadge";
import RiskCard from "../components/RiskCard";
import HandshakeIndicator from "../components/HandshakeIndicator";
import BLEService from "../services/BLEService";
import NFCService from "../services/NFCService";
import SoundService from "../services/SoundService";
import LightService from "../services/LightService";

const MODES = ["QR", "BLE", "NFC", "Sound", "Light"];

export default function SendScreen({ navigation }) {
  const c = useColors();
  const [step, setStep] = useState("input");
  const [amount, setAmount] = useState("");
  const [receiverId, setReceiverId] = useState("");
  const [activeMode, setActiveMode] = useState("QR");
  const [loading, setLoading] = useState(false);

  const [session, setSession] = useState(null);
  const [riskScore, setRiskScore] = useState(10);
  const [riskLevel, setRiskLevel] = useState("Safe");
  const [qrData, setQrData] = useState(null);
  const [encryptedPacketStr, setEncryptedPacketStr] = useState(null);

  // BLE state
  const [bleDevices, setBleDevices] = useState([]);
  const [bleStatus, setBleStatus] = useState("idle");

  // NFC state
  const [nfcStatus, setNfcStatus] = useState("idle");

  // Sound state
  const [soundStatus, setSoundStatus] = useState("idle");
  const [soundProgress, setSoundProgress] = useState(0);

  // Light state
  const [lightStatus, setLightStatus] = useState("idle");
  const [lightProgress, setLightProgress] = useState({ bitIndex: 0, totalBits: 0 });
  const [torchOn, setTorchOn] = useState(false);

  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    return () => {
      BLEService.stopScan();
      NFCService.cancelRequest();
      SoundService.destroy();
      LightService.destroy();
    };
  }, []);

  const slideIn = () => {
    slideAnim.setValue(50);
    Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 50, useNativeDriver: true }).start();
  };

  const handleNext = async () => {
    if (!amount || !receiverId) return;
    setLoading(true);
    try {
      const senderId = await SecureStore.getItemAsync("user_id");
      const sess = await createPaymentSession({
        sender_id: senderId,
        receiver_id: receiverId,
        ephemeral_pub_key: "SENDER_PUB_KEY_MOCK",
      });
      setSession(sess);
      const score = Number(amount) > 10000 ? 85 : 10;
      setRiskScore(score);
      setRiskLevel(score > 70 ? "High Risk" : "Safe");
      setStep("risk");
      slideIn();
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (riskLevel === "High Risk") return Alert.alert("Blocked", "Blocked by Risk Engine");
    setLoading(true);
    try {
      const senderId = await SecureStore.getItemAsync("user_id");
      await submitMotionProof({ session_id: session.session_id, user_id: senderId, motion_hash: "sender-motion-ok" });

      const payload = { sender_id: senderId, receiver_id: receiverId, token_id: Math.random().toString(36).substring(2), risk_score: riskScore / 100 };
      const encryptedResp = await encryptPacket({ session_key: session.session_key, payload });
      const packetStr = JSON.stringify({ s: session.session_id, n: encryptedResp.nonce, c: encryptedResp.ciphertext });
      setEncryptedPacketStr(packetStr);

      if (activeMode === "QR")          { setQrData(packetStr); setStep("qr-display"); }
      else if (activeMode === "BLE")    { setStep("ble-scan"); startBLEScan(); }
      else if (activeMode === "NFC")    { setStep("nfc-tap"); startNFCWrite(packetStr); }
      else if (activeMode === "Sound")  { setStep("sound-emit"); startSoundTransmit(packetStr); }
      else if (activeMode === "Light")  { setStep("light-flash"); startLightTransmit(packetStr); }
      slideIn();
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  /* ═══ BLE ═══ */
  const startBLEScan = async () => {
    const granted = await BLEService.requestPermissions();
    if (!granted) return Alert.alert("Permission Denied", "Bluetooth permissions required");
    setBleStatus("scanning"); setBleDevices([]);
    BLEService.scanForReceivers((device) => {
      setBleDevices((prev) => prev.find((d) => d.id === device.id) ? prev : [...prev, device]);
    }, 15000);
  };
  const handleBLEConnect = async (deviceId) => {
    setBleStatus("connecting");
    try {
      const result = await BLEService.sendPacket(deviceId, encryptedPacketStr, (s) => setBleStatus(s));
      if (result.success) { setBleStatus("sent"); setTimeout(() => setStep("success"), 1500); }
    } catch (e) { setBleStatus("error"); Alert.alert("BLE Error", e.message); }
  };

  /* ═══ NFC ═══ */
  const startNFCWrite = async (packet) => {
    const { supported, enabled } = await NFCService.init();
    if (!supported) return Alert.alert("Not Supported", "NFC not available");
    if (!enabled) { Alert.alert("NFC Disabled", "Enable NFC in Settings"); NFCService.goToSettings(); return; }
    setNfcStatus("waiting");
    const success = await NFCService.writePacket(packet, (s) => setNfcStatus(s));
    if (success) { setNfcStatus("sent"); setTimeout(() => setStep("success"), 1500); }
  };

  /* ═══ SOUND ═══ */
  const startSoundTransmit = async (packet) => {
    setSoundStatus("encoding");
    try {
      await SoundService.transmit(packet, ({ phase, progress }) => {
        setSoundStatus(phase);
        setSoundProgress(Math.round((progress || 0) * 100));
      });
      setSoundStatus("complete");
      setTimeout(() => setStep("success"), 1500);
    } catch (e) {
      setSoundStatus("error");
      Alert.alert("Sound Error", e.message);
    }
  };

  /* ═══ LIGHT ═══ */
  const startLightTransmit = async (packet) => {
    setLightStatus("encoding");
    try {
      await LightService.transmit(
        packet,
        (on) => setTorchOn(on),
        ({ phase, bitIndex, totalBits }) => {
          setLightStatus(phase);
          setLightProgress({ bitIndex: bitIndex || 0, totalBits: totalBits || 0 });
        }
      );
      setLightStatus("complete");
      setTimeout(() => setStep("success"), 1500);
    } catch (e) {
      setLightStatus("error");
      Alert.alert("Light Error", e.message);
    }
  };

  const reset = () => {
    setStep("input"); setAmount(""); setReceiverId(""); setQrData(null); setEncryptedPacketStr(null);
    setBleDevices([]); setBleStatus("idle"); setNfcStatus("idle"); setSoundStatus("idle"); setLightStatus("idle");
    setTorchOn(false); setSoundProgress(0); setLightProgress({ bitIndex: 0, totalBits: 0 });
    BLEService.stopScan(); NFCService.cancelRequest(); SoundService.destroy(); LightService.destroy();
  };

  const handshakeState = (status) => {
    if (["scanning", "waiting", "encoding", "listening"].includes(status)) return "searching";
    if (["connecting", "discovering", "preamble"].includes(status)) return "connecting";
    if (["writing", "transmitting"].includes(status)) return "handshake";
    if (["sent", "complete"].includes(status)) return "verified";
    return "searching";
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.text }]}>Send Offline</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>

          {/* ═══ INPUT ═══ */}
          {step === "input" && (
            <Card>
              <Input label="Receiver User ID" placeholder="User ID" value={receiverId} onChangeText={setReceiverId} />
              <Input label="Amount" placeholder="₹ 0.00" value={amount} onChangeText={setAmount} keyboardType="numeric" />
              <Text style={[styles.label, { color: c.textSecondary, marginTop: 16 }]}>Transmission Mode</Text>
              <View style={styles.modeRow}>
                {MODES.map((m) => (
                  <TouchableOpacity key={m} onPress={() => setActiveMode(m)}
                    style={[styles.modeBtn, { borderColor: activeMode === m ? c.indigo : c.border, backgroundColor: activeMode === m ? c.indigo + "10" : "transparent" }]}>
                    <ModeBadge mode={m} active={activeMode === m} size="sm" />
                  </TouchableOpacity>
                ))}
              </View>
              <Button onPress={handleNext} disabled={loading || !amount} style={{ marginTop: 32 }}>
                {loading ? "Processing..." : "Continue"}
              </Button>
            </Card>
          )}

          {/* ═══ RISK ═══ */}
          {step === "risk" && (
            <Card>
              <Text style={[styles.sectionTitle, { color: c.text, textAlign: "center", marginBottom: 24 }]}>Review Transfer</Text>
              <View style={styles.reviewRow}>
                <Text style={{ color: c.textSecondary }}>Amount</Text>
                <Text style={[styles.reviewAmt, { color: c.text }]}>₹{amount}</Text>
              </View>
              <View style={[styles.reviewRow, { marginBottom: 24 }]}>
                <Text style={{ color: c.textSecondary }}>Mode</Text>
                <ModeBadge mode={activeMode} active size="sm" />
              </View>
              <RiskCard score={riskScore} level={riskLevel} />
              <View style={{ flexDirection: "row", gap: 12, marginTop: 32 }}>
                <Button variant="secondary" style={{ flex: 1 }} onPress={() => setStep("input")}>Cancel</Button>
                <Button style={{ flex: 1 }} onPress={handleConfirm} disabled={loading || riskLevel === "High Risk"}>
                  {loading ? "Encrypting..." : "Authorize"}
                </Button>
              </View>
            </Card>
          )}

          {/* ═══ QR DISPLAY ═══ */}
          {step === "qr-display" && (
            <Card style={{ alignItems: "center", paddingVertical: 40 }}>
              <Text style={[styles.sectionTitle, { color: c.text, marginBottom: 8 }]}>Scan to Receive ₹{amount}</Text>
              <Text style={{ color: c.textSecondary, marginBottom: 32 }}>Ask the receiver to scan this QR code.</Text>
              <View style={[styles.qrWrapper, { backgroundColor: "#fff" }]}>
                {qrData && <QRCode value={qrData} size={220} color="#000" backgroundColor="#fff" />}
              </View>
              <View style={{ flexDirection: "row", gap: 12, marginTop: 40, width: "100%" }}>
                <Button variant="secondary" style={{ flex: 1 }} onPress={reset}>Cancel</Button>
                <Button style={{ flex: 1 }} onPress={() => setStep("success")}>Done</Button>
              </View>
            </Card>
          )}

          {/* ═══ BLE SCAN ═══ */}
          {step === "ble-scan" && (
            <Card>
              <View style={{ alignItems: "center", marginBottom: 24 }}>
                <HandshakeIndicator state={handshakeState(bleStatus)} />
                <Text style={[styles.sectionTitle, { color: c.text, marginTop: 16 }]}>
                  {bleStatus === "scanning" ? "Scanning for Receivers..." : bleStatus === "connecting" ? "Connecting..." :
                   bleStatus === "writing" ? "Transferring Packet..." : bleStatus === "sent" ? "Sent!" : "BLE Transfer"}
                </Text>
              </View>
              {bleStatus === "scanning" && bleDevices.map((d) => (
                <TouchableOpacity key={d.id} onPress={() => handleBLEConnect(d.id)} style={[styles.bleDevice, { backgroundColor: c.card, borderColor: c.border }]}>
                  <View>
                    <Text style={[styles.bleDevName, { color: c.text }]}>{d.name}</Text>
                    <Text style={{ color: c.textMuted, fontSize: 12 }}>Signal: {d.rssi} dBm</Text>
                  </View>
                  <Text style={{ color: c.indigo, fontWeight: "700" }}>Connect →</Text>
                </TouchableOpacity>
              ))}
              {bleStatus === "scanning" && bleDevices.length === 0 && <Text style={{ color: c.textMuted, textAlign: "center", padding: 20 }}>Searching...</Text>}
              <Button variant="secondary" style={{ marginTop: 24 }} onPress={reset}>Cancel</Button>
            </Card>
          )}

          {/* ═══ NFC TAP ═══ */}
          {step === "nfc-tap" && (
            <Card style={{ alignItems: "center", paddingVertical: 40 }}>
              <HandshakeIndicator state={handshakeState(nfcStatus)} />
              <Text style={[styles.sectionTitle, { color: c.text, marginTop: 24, marginBottom: 8 }]}>
                {nfcStatus === "waiting" ? "Tap to Send ₹" + amount : nfcStatus === "sent" ? "Sent!" : "NFC Transfer"}
              </Text>
              <Text style={{ color: c.textSecondary, textAlign: "center", marginBottom: 32 }}>
                {nfcStatus === "waiting" ? "Hold your phone near the receiver's device" : "Processing..."}
              </Text>
              <Button variant="secondary" style={{ width: "100%" }} onPress={reset}>Cancel</Button>
            </Card>
          )}

          {/* ═══ SOUND EMIT ═══ */}
          {step === "sound-emit" && (
            <Card style={{ alignItems: "center", paddingVertical: 40 }}>
              <HandshakeIndicator state={handshakeState(soundStatus)} />
              <Text style={[styles.sectionTitle, { color: c.text, marginTop: 24, marginBottom: 8 }]}>
                {soundStatus === "encoding" ? "Encoding to Ultrasonics..." :
                 soundStatus === "transmitting" ? `Transmitting — ${soundProgress}%` :
                 soundStatus === "complete" ? "Sent via Sound!" : "Sound Transfer"}
              </Text>
              <Text style={{ color: c.textSecondary, textAlign: "center", marginBottom: 16 }}>
                Emitting encrypted data as near-ultrasonic FSK tones (18–20kHz).
              </Text>
              {/* Progress bar */}
              <View style={[styles.progressBar, { backgroundColor: c.border }]}>
                <View style={[styles.progressFill, { width: `${soundProgress}%`, backgroundColor: c.violet }]} />
              </View>
              <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 8 }}>{soundProgress}% complete</Text>
              <Button variant="secondary" style={{ width: "100%", marginTop: 24 }} onPress={() => { SoundService.destroy(); reset(); }}>Cancel</Button>
            </Card>
          )}

          {/* ═══ LIGHT FLASH ═══ */}
          {step === "light-flash" && (
            <Card style={{ alignItems: "center", paddingVertical: 40 }}>
              {/* Visual torch indicator */}
              <View style={[styles.torchIndicator, { backgroundColor: torchOn ? c.amber : c.border }]}>
                <Text style={{ fontSize: 48 }}>{torchOn ? "💡" : "🔦"}</Text>
              </View>
              <Text style={[styles.sectionTitle, { color: c.text, marginTop: 24, marginBottom: 8 }]}>
                {lightStatus === "encoding" ? "Encoding to Light Pulses..." :
                 lightStatus === "preamble" ? "Sending Preamble..." :
                 lightStatus === "transmitting" ? `Flashing — Bit ${lightProgress.bitIndex}/${lightProgress.totalBits}` :
                 lightStatus === "complete" ? "Sent via Light!" : "Li-Fi Transfer"}
              </Text>
              <Text style={{ color: c.textSecondary, textAlign: "center", marginBottom: 16 }}>
                Transmitting via Manchester-encoded flashlight pulses. Keep devices facing each other.
              </Text>
              {/* Progress bar */}
              <View style={[styles.progressBar, { backgroundColor: c.border }]}>
                <View style={[styles.progressFill, { width: `${lightProgress.totalBits ? (lightProgress.bitIndex / lightProgress.totalBits * 100) : 0}%`, backgroundColor: c.amber }]} />
              </View>
              <Button variant="secondary" style={{ width: "100%", marginTop: 24 }} onPress={() => { LightService.destroy(); reset(); }}>Cancel</Button>
            </Card>
          )}

          {/* ═══ SUCCESS ═══ */}
          {step === "success" && (
            <Card style={{ alignItems: "center", paddingVertical: 40 }}>
              <View style={[styles.successIcon, { backgroundColor: c.emerald + "20" }]}>
                <Text style={{ fontSize: 40 }}>✓</Text>
              </View>
              <Text style={[styles.sectionTitle, { color: c.text, marginTop: 24, marginBottom: 8 }]}>Transfer Sent</Text>
              <Text style={[styles.cardTitle, { color: c.text, marginBottom: 4 }]}>₹{amount}</Text>
              <Text style={{ color: c.textMuted, marginBottom: 32 }}>via {activeMode} · Queued for sync</Text>
              <Button style={{ width: "100%" }} onPress={reset}>Send Another</Button>
            </Card>
          )}

        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingBottom: 10 },
  title: { fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },
  scroll: { padding: 20, paddingTop: 10 },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 12 },
  modeRow: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  modeBtn: { paddingVertical: 10, paddingHorizontal: 6, borderWidth: 1, borderRadius: 12, alignItems: "center", minWidth: 56 },
  sectionTitle: { fontSize: 20, fontWeight: "800" },
  reviewRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  reviewAmt: { fontSize: 20, fontWeight: "800", letterSpacing: -0.5 },
  qrWrapper: { padding: 16, borderRadius: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
  bleDevice: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 8 },
  bleDevName: { fontSize: 15, fontWeight: "700", marginBottom: 2 },
  successIcon: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: 40, fontWeight: "900", letterSpacing: -1 },
  progressBar: { width: "100%", height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  torchIndicator: { width: 100, height: 100, borderRadius: 50, alignItems: "center", justifyContent: "center" },
});
