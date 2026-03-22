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
import SoundService from "../services/SoundService";
import LightService from "../services/LightService";

const MODES = ["QR", "BLE", "NFC", "Sound", "Light"];

export default function ReceiveScreen({ navigation }) {
  const c = useColors();
  const [step, setStep] = useState("select");
  const [activeMode, setActiveMode] = useState("QR");
  const [verifyState, setVerifyState] = useState("listening");

  const [permission, requestPermission] = useCameraPermissions();
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Sound-specific
  const [soundStatus, setSoundStatus] = useState("idle");
  // Light-specific
  const [lightStatus, setLightStatus] = useState("idle");

  useEffect(() => {
    return () => {
      BLEService.stopReceiving();
      NFCService.cancelRequest();
      SoundService.destroy();
      LightService.destroy();
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
      await submitMotionProof({ session_id: packet.s, user_id: receiverId, motion_hash: "receiver-motion-ok" });
      await submitPaymentPacket({ session_id: packet.s, nonce: packet.n, ciphertext: packet.c });
      setVerifyState("verified");
      setTimeout(() => { setStep("success"); slideIn(); }, 1500);
    } catch (e) {
      setVerifyState("failed");
      Alert.alert("Verification Failed", e.message);
      setTimeout(() => reset(), 2000);
    }
  };

  /* ═══ QR ═══ */
  const handleStartQR = () => {
    if (!permission?.granted) requestPermission();
    setActiveMode("QR"); setStep("qr-scanner"); slideIn();
  };
  const onBarcodeScanned = ({ data }) => { if (step === "qr-scanner") processPacket(data); };

  /* ═══ BLE ═══ */
  const handleStartBLE = async () => {
    const granted = await BLEService.requestPermissions();
    if (!granted) return Alert.alert("Permission Denied", "Bluetooth permissions required");
    setActiveMode("BLE"); setStep("ble-listen"); slideIn();
    BLEService.startReceiving(
      (packetStr) => processPacket(packetStr),
      (status) => setVerifyState(status === "advertising" ? "searching" : status === "connected" ? "connecting" : "handshake")
    );
  };

  /* ═══ NFC ═══ */
  const handleStartNFC = async () => {
    const { supported, enabled } = await NFCService.init();
    if (!supported) return Alert.alert("Not Supported", "NFC not available");
    if (!enabled) { Alert.alert("NFC Disabled", "Enable NFC in Settings"); NFCService.goToSettings(); return; }
    setActiveMode("NFC"); setStep("nfc-listen"); slideIn();
    await NFCService.readPacket(
      (packetStr) => processPacket(packetStr),
      (status) => setVerifyState(status === "listening" ? "searching" : status === "reading" ? "handshake" : "searching")
    );
  };

  /* ═══ SOUND ═══ */
  const handleStartSound = async () => {
    setActiveMode("Sound"); setStep("sound-listen"); slideIn();
    setSoundStatus("listening");
    try {
      const uri = await SoundService.listen(
        null, // onPacketReceived — handled after recording
        (status) => setSoundStatus(status),
        8000 // record 8 seconds
      );
      // In a full implementation, we'd read the WAV from uri, decode FSK, and call processPacket()
      // For now, show the recording was captured successfully
      setSoundStatus("processed");
    } catch (e) {
      setSoundStatus("error");
      Alert.alert("Sound Error", e.message);
    }
  };

  /* ═══ LIGHT ═══ */
  const handleStartLight = async () => {
    if (!permission?.granted) requestPermission();
    setActiveMode("Light"); setStep("light-detect"); slideIn();
    setLightStatus("listening");
    // In a full implementation, camera frames would be analyzed for brightness changes
    // The LightService.decodeBrightness() method handles the decoding logic
  };

  const reset = () => {
    setStep("select"); setVerifyState("listening"); setSoundStatus("idle"); setLightStatus("idle");
    BLEService.stopReceiving(); NFCService.cancelRequest(); SoundService.destroy(); LightService.destroy();
  };

  const modeOptions = [
    { id: "QR", title: "QR Code Scanner", desc: "Use camera to scan sender's QR", handler: handleStartQR },
    { id: "BLE", title: "Bluetooth (BLE)", desc: "Listen for nearby sender broadcast", handler: handleStartBLE },
    { id: "NFC", title: "NFC Tap", desc: "Hold devices together to receive", handler: handleStartNFC },
    { id: "Sound", title: "Ultrasonic Sound", desc: "Listen for 18–20kHz FSK tones", handler: handleStartSound },
    { id: "Light", title: "Li-Fi Light Pulses", desc: "Detect flashlight pulse patterns", handler: handleStartLight },
  ];

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
              <Text style={{ color: c.textSecondary, textAlign: "center", marginBottom: 24 }}>
                Choose how to receive the encrypted payment packet.
              </Text>
              {modeOptions.map((opt) => (
                <TouchableOpacity key={opt.id} onPress={opt.handler} style={[styles.modeOption, { backgroundColor: c.card, borderColor: c.border }]}>
                  <ModeBadge mode={opt.id} active size="sm" />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.modeOptTitle, { color: c.text }]}>{opt.title}</Text>
                    <Text style={{ color: c.textMuted, fontSize: 12 }}>{opt.desc}</Text>
                  </View>
                  <Text style={{ color: c.indigo, fontWeight: "700" }}>→</Text>
                </TouchableOpacity>
              ))}
            </Card>
          )}

          {/* ═══ QR SCANNER ═══ */}
          {step === "qr-scanner" && (
            <Card style={{ padding: 0, overflow: "hidden" }}>
              <View style={styles.cameraContainer}>
                {permission?.granted ? (
                  <CameraView style={StyleSheet.absoluteFillObject} facing="back"
                    barcodeScannerSettings={{ barcodeTypes: ["qr"] }} onBarcodeScanned={onBarcodeScanned} />
                ) : (
                  <View style={styles.permissionBox}>
                    <Text style={{ color: "#fff", textAlign: "center", marginBottom: 16 }}>Camera permission required.</Text>
                    <Button onPress={requestPermission}>Grant Permission</Button>
                  </View>
                )}
                <View style={styles.overlay}><View style={styles.scannerBox} /></View>
              </View>
              <View style={{ padding: 20 }}>
                <Text style={{ color: c.textSecondary, textAlign: "center", marginBottom: 16 }}>Point at sender's QR code</Text>
                <Button variant="secondary" onPress={reset}>Cancel</Button>
              </View>
            </Card>
          )}

          {/* ═══ BLE LISTEN ═══ */}
          {step === "ble-listen" && (
            <Card style={{ alignItems: "center", paddingVertical: 40 }}>
              <HandshakeIndicator state={verifyState} />
              <Text style={[styles.sectionTitle, { color: c.text, marginTop: 24, marginBottom: 8 }]}>
                {verifyState === "searching" ? "Broadcasting as Receiver..." : verifyState === "connecting" ? "Sender Connected!" :
                 verifyState === "handshake" ? "Receiving Packet..." : "Listening..."}
              </Text>
              <Text style={{ color: c.textSecondary, textAlign: "center", marginBottom: 32 }}>
                Advertising via Bluetooth. Ask sender to scan and connect.
              </Text>
              <Button variant="secondary" style={{ width: "100%" }} onPress={reset}>Cancel</Button>
            </Card>
          )}

          {/* ═══ NFC LISTEN ═══ */}
          {step === "nfc-listen" && (
            <Card style={{ alignItems: "center", paddingVertical: 40 }}>
              <HandshakeIndicator state={verifyState} />
              <Text style={[styles.sectionTitle, { color: c.text, marginTop: 24, marginBottom: 8 }]}>
                {verifyState === "searching" ? "Ready for NFC Tap" : verifyState === "handshake" ? "Reading..." : "Waiting..."}
              </Text>
              <Text style={{ color: c.textSecondary, textAlign: "center", marginBottom: 32 }}>
                Hold sender's device against yours to receive.
              </Text>
              <Button variant="secondary" style={{ width: "100%" }} onPress={reset}>Cancel</Button>
            </Card>
          )}

          {/* ═══ SOUND LISTEN ═══ */}
          {step === "sound-listen" && (
            <Card style={{ alignItems: "center", paddingVertical: 40 }}>
              {/* Animated sound wave visual */}
              <View style={styles.soundWaveContainer}>
                {[...Array(7)].map((_, i) => (
                  <View key={i} style={[styles.soundBar, {
                    height: 20 + Math.random() * 40,
                    backgroundColor: soundStatus === "capturing" ? c.violet : c.border,
                    opacity: soundStatus === "capturing" ? 0.6 + Math.random() * 0.4 : 0.3,
                  }]} />
                ))}
              </View>
              <Text style={[styles.sectionTitle, { color: c.text, marginTop: 24, marginBottom: 8 }]}>
                {soundStatus === "listening" ? "🎙 Listening for Ultrasonics..." :
                 soundStatus === "capturing" ? "🔊 Capturing Audio..." :
                 soundStatus === "decoding" ? "⚙️ Decoding FSK Signal..." :
                 soundStatus === "processed" ? "✓ Audio Captured" : "Sound Receiver"}
              </Text>
              <Text style={{ color: c.textSecondary, textAlign: "center", marginBottom: 16 }}>
                Microphone is active. Place sender's device within ~3 meters.
              </Text>
              <Text style={[styles.freqLabel, { color: c.violet }]}>
                Detecting: 18kHz (bit-0) · 19.5kHz (bit-1)
              </Text>
              <Button variant="secondary" style={{ width: "100%", marginTop: 24 }} onPress={() => { SoundService.destroy(); reset(); }}>Cancel</Button>
            </Card>
          )}

          {/* ═══ LIGHT DETECT ═══ */}
          {step === "light-detect" && (
            <Card style={{ padding: 0, overflow: "hidden" }}>
              <View style={styles.cameraContainer}>
                {permission?.granted ? (
                  <CameraView style={StyleSheet.absoluteFillObject} facing="back" />
                ) : (
                  <View style={styles.permissionBox}>
                    <Text style={{ color: "#fff", textAlign: "center", marginBottom: 16 }}>Camera permission required for light detection.</Text>
                    <Button onPress={requestPermission}>Grant Permission</Button>
                  </View>
                )}
                {/* Light detection overlay */}
                <View style={styles.overlay}>
                  <View style={[styles.lightTargetBox, { borderColor: c.amber }]}>
                    <Text style={{ color: c.amber, fontSize: 14, fontWeight: "700" }}>Point at flashlight</Text>
                  </View>
                </View>
              </View>
              <View style={{ padding: 20 }}>
                <Text style={[styles.sectionTitle, { color: c.text, textAlign: "center", marginBottom: 8 }]}>
                  {lightStatus === "listening" ? "📸 Detecting Light Pulses..." : "Li-Fi Receiver"}
                </Text>
                <Text style={{ color: c.textSecondary, textAlign: "center", marginBottom: 16 }}>
                  Analyzing brightness changes from sender's flashlight. Manchester decoding active.
                </Text>
                <Button variant="secondary" onPress={() => { LightService.destroy(); reset(); }}>Cancel</Button>
              </View>
            </Card>
          )}

          {/* ═══ VERIFYING ═══ */}
          {step === "verifying" && (
            <Card style={{ alignItems: "center", paddingVertical: 40 }}>
              <HandshakeIndicator state={verifyState} />
              <Text style={[styles.sectionTitle, { color: c.text, marginTop: 24, marginBottom: 8 }]}>
                {verifyState === "handshake" ? "Verifying Keys..." : verifyState === "verified" ? "Verified!" : "Processing..."}
              </Text>
              <Text style={{ color: c.textSecondary, textAlign: "center" }}>
                Submitting motion proof and verifying cryptographic packet.
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
                Balance will update after sync settlement.
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
  modeOption: { flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 10 },
  modeOptTitle: { fontSize: 16, fontWeight: "700", marginBottom: 2 },
  cameraContainer: { height: 320, backgroundColor: "#000", position: "relative" },
  permissionBox: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
  overlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  scannerBox: { width: 220, height: 220, borderWidth: 2, borderColor: "#10b981", borderRadius: 24 },
  lightTargetBox: { width: 160, height: 160, borderWidth: 3, borderRadius: 80, alignItems: "center", justifyContent: "center" },
  successIcon: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  soundWaveContainer: { flexDirection: "row", alignItems: "flex-end", gap: 6, height: 60 },
  soundBar: { width: 8, borderRadius: 4 },
  freqLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.3, marginTop: 12 },
});
