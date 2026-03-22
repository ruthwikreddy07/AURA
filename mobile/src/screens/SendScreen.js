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

const MODES = ["QR", "BLE", "NFC"];

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
  const [bleStatus, setBleStatus] = useState("idle"); // idle, scanning, connecting, writing, sent, error

  // NFC state
  const [nfcStatus, setNfcStatus] = useState("idle"); // idle, waiting, writing, sent, error

  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    return () => {
      BLEService.stopScan();
      NFCService.cancelRequest();
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

      await submitMotionProof({
        session_id: session.session_id,
        user_id: senderId,
        motion_hash: "sender-motion-ok"
      });

      const payload = {
        sender_id: senderId,
        receiver_id: receiverId,
        token_id: Math.random().toString(36).substring(2),
        risk_score: riskScore / 100
      };

      const encryptedResp = await encryptPacket({
        session_key: session.session_key,
        payload: payload
      });

      const packetStr = JSON.stringify({
        s: session.session_id,
        n: encryptedResp.nonce,
        c: encryptedResp.ciphertext
      });
      setEncryptedPacketStr(packetStr);

      if (activeMode === "QR") {
        setQrData(packetStr);
        setStep("qr-display");
      } else if (activeMode === "BLE") {
        setStep("ble-scan");
        startBLEScan();
      } else if (activeMode === "NFC") {
        setStep("nfc-tap");
        startNFCWrite(packetStr);
      }
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

    setBleStatus("scanning");
    setBleDevices([]);
    BLEService.scanForReceivers((device) => {
      setBleDevices((prev) => {
        if (prev.find((d) => d.id === device.id)) return prev;
        return [...prev, device];
      });
    }, 15000);
  };

  const handleBLEConnect = async (deviceId) => {
    setBleStatus("connecting");
    try {
      const result = await BLEService.sendPacket(deviceId, encryptedPacketStr, (status) => {
        setBleStatus(status);
      });
      if (result.success) {
        setBleStatus("sent");
        setTimeout(() => setStep("success"), 1500);
      }
    } catch (e) {
      setBleStatus("error");
      Alert.alert("BLE Error", e.message);
    }
  };

  /* ═══ NFC ═══ */
  const startNFCWrite = async (packet) => {
    const { supported, enabled } = await NFCService.init();
    if (!supported) return Alert.alert("Not Supported", "NFC is not supported on this device");
    if (!enabled) {
      Alert.alert("NFC Disabled", "Please enable NFC in Settings");
      NFCService.goToSettings();
      return;
    }

    setNfcStatus("waiting");
    const success = await NFCService.writePacket(packet, (status) => setNfcStatus(status));
    if (success) {
      setNfcStatus("sent");
      setTimeout(() => setStep("success"), 1500);
    }
  };

  const reset = () => {
    setStep("input"); setAmount(""); setReceiverId(""); setQrData(null);
    setEncryptedPacketStr(null); setBleDevices([]); setBleStatus("idle"); setNfcStatus("idle");
    BLEService.stopScan();
    NFCService.cancelRequest();
  };

  const handshakeState = (status) => {
    if (status === "scanning" || status === "waiting") return "searching";
    if (status === "connecting" || status === "discovering") return "connecting";
    if (status === "writing") return "handshake";
    if (status === "sent") return "verified";
    return "searching";
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.text }]}>Send Offline</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>

          {/* ═══ INPUT STEP ═══ */}
          {step === "input" && (
            <Card>
              <Input label="Receiver User ID" placeholder="User ID" value={receiverId} onChangeText={setReceiverId} />
              <Input label="Amount" placeholder="₹ 0.00" value={amount} onChangeText={setAmount} keyboardType="numeric" />

              <Text style={[styles.label, { color: c.textSecondary, marginTop: 16 }]}>Transmission Mode</Text>
              <View style={styles.modeRow}>
                {MODES.map((m) => (
                  <TouchableOpacity
                    key={m}
                    onPress={() => setActiveMode(m)}
                    style={[styles.modeBtn, { borderColor: activeMode === m ? c.indigo : c.border, backgroundColor: activeMode === m ? c.indigo + "10" : "transparent" }]}
                  >
                    <ModeBadge mode={m} active={activeMode === m} size="sm" />
                  </TouchableOpacity>
                ))}
              </View>

              <Button onPress={handleNext} disabled={loading || !amount} style={{ marginTop: 32 }}>
                {loading ? "Processing..." : "Continue"}
              </Button>
            </Card>
          )}

          {/* ═══ RISK STEP ═══ */}
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

          {/* ═══ BLE SCAN & SEND ═══ */}
          {step === "ble-scan" && (
            <Card>
              <View style={{ alignItems: "center", marginBottom: 24 }}>
                <HandshakeIndicator state={handshakeState(bleStatus)} />
                <Text style={[styles.sectionTitle, { color: c.text, marginTop: 16 }]}>
                  {bleStatus === "scanning" ? "Scanning for Receivers..." :
                   bleStatus === "connecting" ? "Connecting..." :
                   bleStatus === "writing" ? "Transferring Packet..." :
                   bleStatus === "sent" ? "Sent!" : "BLE Transfer"}
                </Text>
              </View>

              {bleStatus === "scanning" && (
                <>
                  <Text style={[styles.label, { color: c.textSecondary, marginBottom: 12 }]}>Nearby AURA Devices</Text>
                  {bleDevices.length === 0 ? (
                    <Text style={{ color: c.textMuted, textAlign: "center", padding: 20 }}>Searching for devices nearby...</Text>
                  ) : (
                    bleDevices.map((d) => (
                      <TouchableOpacity
                        key={d.id}
                        onPress={() => handleBLEConnect(d.id)}
                        style={[styles.bleDevice, { backgroundColor: c.card, borderColor: c.border }]}
                      >
                        <View>
                          <Text style={[styles.bleDevName, { color: c.text }]}>{d.name}</Text>
                          <Text style={{ color: c.textMuted, fontSize: 12 }}>Signal: {d.rssi} dBm</Text>
                        </View>
                        <Text style={{ color: c.indigo, fontWeight: "700" }}>Connect →</Text>
                      </TouchableOpacity>
                    ))
                  )}
                </>
              )}

              <Button variant="secondary" style={{ marginTop: 24 }} onPress={reset}>Cancel</Button>
            </Card>
          )}

          {/* ═══ NFC TAP ═══ */}
          {step === "nfc-tap" && (
            <Card style={{ alignItems: "center", paddingVertical: 40 }}>
              <HandshakeIndicator state={handshakeState(nfcStatus)} />
              <Text style={[styles.sectionTitle, { color: c.text, marginTop: 24, marginBottom: 8 }]}>
                {nfcStatus === "waiting" ? "Tap to Send ₹" + amount :
                 nfcStatus === "writing" ? "Transferring..." :
                 nfcStatus === "sent" ? "Sent!" : "NFC Transfer"}
              </Text>
              <Text style={{ color: c.textSecondary, textAlign: "center", marginBottom: 32 }}>
                {nfcStatus === "waiting" ? "Hold your phone near the receiver's device" :
                 nfcStatus === "sent" ? "Payment packet delivered securely" : "Processing..."}
              </Text>
              <Button variant="secondary" style={{ width: "100%" }} onPress={reset}>Cancel</Button>
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
  modeRow: { flexDirection: "row", gap: 8 },
  modeBtn: { flex: 1, paddingVertical: 12, borderWidth: 1, borderRadius: 12, alignItems: "center" },

  sectionTitle: { fontSize: 20, fontWeight: "800" },
  reviewRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  reviewAmt: { fontSize: 20, fontWeight: "800", letterSpacing: -0.5 },

  qrWrapper: { padding: 16, borderRadius: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },

  bleDevice: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 8 },
  bleDevName: { fontSize: 15, fontWeight: "700", marginBottom: 2 },

  successIcon: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: 40, fontWeight: "900", letterSpacing: -1 },
});
