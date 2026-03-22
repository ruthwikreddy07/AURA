import { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Animated, Alert, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import { CameraView, useCameraPermissions } from "expo-camera";

import { useColors } from "../context/ThemeContext";
import { submitMotionProof, submitPaymentPacket } from "../api/api";
import Card from "../components/Card";
import Button from "../components/Button";
import ModeBadge from "../components/ModeBadge";
import HandshakeIndicator from "../components/HandshakeIndicator";
import BLEService from "../services/BLEService";
import NFCService from "../services/NFCService";

const MODES = ["QR", "BLE", "NFC"];

export default function ReceiveScreen({ navigation }) {
  const c = useColors();
  const [step, setStep] = useState("select"); // select, qr-scanner, ble-listen, nfc-listen, verifying, success
  const [activeMode, setActiveMode] = useState("QR");
  const [verifyState, setVerifyState] = useState("listening");
  
  const [permission, requestPermission] = useCameraPermissions();
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    return () => {
      BLEService.stopReceiving();
      NFCService.cancelRequest();
    };
  }, []);

  const slideIn = () => {
    slideAnim.setValue(50);
    Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 50, useNativeDriver: true }).start();
  };

  /* ═══ PROCESS RECEIVED PACKET (shared by all modes) ═══ */
  const processPacket = async (rawData) => {
    setStep("verifying");
    setVerifyState("handshake");
    slideIn();

    try {
      const packet = JSON.parse(rawData);
      if (!packet.s || !packet.c) throw new Error("Invalid AURA packet format");

      const receiverId = await SecureStore.getItemAsync("user_id");

      // 1. Submit motion proof
      await submitMotionProof({
        session_id: packet.s,
        user_id: receiverId,
        motion_hash: "receiver-motion-ok"
      });

      // 2. Submit payment packet to backend
      await submitPaymentPacket({
        session_id: packet.s,
        nonce: packet.n,
        ciphertext: packet.c
      });

      setVerifyState("verified");
      setTimeout(() => { setStep("success"); slideIn(); }, 1500);
    } catch (e) {
      setVerifyState("failed");
      Alert.alert("Verification Failed", e.message);
      setTimeout(() => reset(), 2000);
    }
  };

  /* ═══ QR MODE ═══ */
  const handleStartQR = () => {
    if (!permission?.granted) requestPermission();
    setActiveMode("QR");
    setStep("qr-scanner");
    slideIn();
  };

  const onBarcodeScanned = ({ data }) => {
    if (step !== "qr-scanner") return;
    processPacket(data);
  };

  /* ═══ BLE MODE ═══ */
  const handleStartBLE = async () => {
    const granted = await BLEService.requestPermissions();
    if (!granted) return Alert.alert("Permission Denied", "Bluetooth permissions required");

    setActiveMode("BLE");
    setStep("ble-listen");
    slideIn();

    BLEService.startReceiving(
      (packetStr) => processPacket(packetStr),
      (status) => setVerifyState(status === "advertising" ? "searching" : status === "connected" ? "connecting" : "handshake")
    );
  };

  /* ═══ NFC MODE ═══ */
  const handleStartNFC = async () => {
    const { supported, enabled } = await NFCService.init();
    if (!supported) return Alert.alert("Not Supported", "NFC is not supported on this device");
    if (!enabled) {
      Alert.alert("NFC Disabled", "Please enable NFC in Settings");
      NFCService.goToSettings();
      return;
    }

    setActiveMode("NFC");
    setStep("nfc-listen");
    slideIn();

    const packet = await NFCService.readPacket(
      (packetStr) => processPacket(packetStr),
      (status) => setVerifyState(status === "listening" ? "searching" : status === "reading" ? "handshake" : "searching")
    );
  };

  const reset = () => {
    setStep("select"); setVerifyState("listening");
    BLEService.stopReceiving();
    NFCService.cancelRequest();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.text }]}>Receive Payment</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>

          {/* ═══ MODE SELECTOR ═══ */}
          {step === "select" && (
            <Card style={{ padding: 24 }}>
              <Text style={[styles.sectionTitle, { color: c.text, textAlign: "center", marginBottom: 8 }]}>Select Mode</Text>
              <Text style={{ color: c.textSecondary, textAlign: "center", marginBottom: 32 }}>
                Choose how to receive the encrypted payment packet.
              </Text>

              <TouchableOpacity onPress={handleStartQR} style={[styles.modeOption, { backgroundColor: c.card, borderColor: c.border }]}>
                <ModeBadge mode="QR" active size="sm" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.modeOptTitle, { color: c.text }]}>QR Code Scanner</Text>
                  <Text style={{ color: c.textMuted, fontSize: 12 }}>Use camera to scan sender's QR</Text>
                </View>
                <Text style={{ color: c.indigo, fontWeight: "700" }}>→</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleStartBLE} style={[styles.modeOption, { backgroundColor: c.card, borderColor: c.border }]}>
                <ModeBadge mode="BLE" active size="sm" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.modeOptTitle, { color: c.text }]}>Bluetooth (BLE)</Text>
                  <Text style={{ color: c.textMuted, fontSize: 12 }}>Listen for nearby sender broadcast</Text>
                </View>
                <Text style={{ color: c.indigo, fontWeight: "700" }}>→</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleStartNFC} style={[styles.modeOption, { backgroundColor: c.card, borderColor: c.border }]}>
                <ModeBadge mode="NFC" active size="sm" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.modeOptTitle, { color: c.text }]}>NFC Tap</Text>
                  <Text style={{ color: c.textMuted, fontSize: 12 }}>Hold devices together to receive</Text>
                </View>
                <Text style={{ color: c.indigo, fontWeight: "700" }}>→</Text>
              </TouchableOpacity>
            </Card>
          )}

          {/* ═══ QR SCANNER ═══ */}
          {step === "qr-scanner" && (
            <Card style={{ padding: 0, overflow: "hidden" }}>
              <View style={styles.cameraContainer}>
                {permission?.granted ? (
                  <CameraView
                    style={StyleSheet.absoluteFillObject}
                    facing="back"
                    barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                    onBarcodeScanned={onBarcodeScanned}
                  />
                ) : (
                  <View style={styles.permissionBox}>
                    <Text style={{ color: "#fff", textAlign: "center", marginBottom: 16 }}>Camera permission is required to scan QR codes.</Text>
                    <Button onPress={requestPermission}>Grant Permission</Button>
                  </View>
                )}
                <View style={styles.overlay}>
                  <View style={styles.scannerBox} />
                </View>
              </View>
              <View style={{ padding: 20 }}>
                <Text style={{ color: c.textSecondary, textAlign: "center", marginBottom: 16 }}>
                  Point at sender's QR code to receive payment
                </Text>
                <Button variant="secondary" onPress={reset}>Cancel</Button>
              </View>
            </Card>
          )}

          {/* ═══ BLE LISTEN ═══ */}
          {step === "ble-listen" && (
            <Card style={{ alignItems: "center", paddingVertical: 40 }}>
              <HandshakeIndicator state={verifyState} />
              <Text style={[styles.sectionTitle, { color: c.text, marginTop: 24, marginBottom: 8 }]}>
                {verifyState === "searching" ? "Broadcasting as Receiver..." :
                 verifyState === "connecting" ? "Sender Connected!" :
                 verifyState === "handshake" ? "Receiving Packet..." : "Listening..."}
              </Text>
              <Text style={{ color: c.textSecondary, textAlign: "center", marginBottom: 32 }}>
                Your device is advertising via Bluetooth. Ask the sender to scan and connect.
              </Text>
              <Button variant="secondary" style={{ width: "100%" }} onPress={reset}>Cancel</Button>
            </Card>
          )}

          {/* ═══ NFC LISTEN ═══ */}
          {step === "nfc-listen" && (
            <Card style={{ alignItems: "center", paddingVertical: 40 }}>
              <HandshakeIndicator state={verifyState} />
              <Text style={[styles.sectionTitle, { color: c.text, marginTop: 24, marginBottom: 8 }]}>
                {verifyState === "searching" ? "Ready for NFC Tap" :
                 verifyState === "handshake" ? "Reading Packet..." : "Waiting for Tap..."}
              </Text>
              <Text style={{ color: c.textSecondary, textAlign: "center", marginBottom: 32 }}>
                Hold the sender's device against yours to receive the payment.
              </Text>
              <Button variant="secondary" style={{ width: "100%" }} onPress={reset}>Cancel</Button>
            </Card>
          )}

          {/* ═══ VERIFYING ═══ */}
          {step === "verifying" && (
            <Card style={{ alignItems: "center", paddingVertical: 40 }}>
              <HandshakeIndicator state={verifyState} />
              <Text style={[styles.sectionTitle, { color: c.text, marginTop: 24, marginBottom: 8 }]}>
                {verifyState === "handshake" ? "Verifying Cryptographic Keys..." :
                 verifyState === "verified" ? "Verified!" : "Processing..."}
              </Text>
              <Text style={{ color: c.textSecondary, textAlign: "center" }}>
                Submitting motion proof and decrypting payment packet via AURA backend.
              </Text>
            </Card>
          )}

          {/* ═══ SUCCESS ═══ */}
          {step === "success" && (
            <Card style={{ alignItems: "center", paddingVertical: 40 }}>
              <View style={[styles.successIcon, { backgroundColor: c.emerald + "20" }]}>
                <Text style={{ fontSize: 40 }}>✓</Text>
              </View>
              <Text style={[styles.sectionTitle, { color: c.text, marginTop: 24, marginBottom: 8 }]}>Payment Received</Text>
              <Text style={{ color: c.textSecondary, textAlign: "center", marginBottom: 8 }}>
                via {activeMode} · Cryptographic verification complete
              </Text>
              <Text style={{ color: c.textMuted, textAlign: "center", marginBottom: 32 }}>
                Balance will update after sync settlement completes.
              </Text>
              <Button style={{ width: "100%" }} onPress={reset}>Receive Another</Button>
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

  sectionTitle: { fontSize: 20, fontWeight: "800" },

  modeOption: { flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 12 },
  modeOptTitle: { fontSize: 16, fontWeight: "700", marginBottom: 2 },

  cameraContainer: { height: 350, backgroundColor: "#000", position: "relative" },
  permissionBox: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
  overlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  scannerBox: { width: 220, height: 220, borderWidth: 2, borderColor: "#10b981", borderRadius: 24 },

  successIcon: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
});
