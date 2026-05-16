import { useState, useRef, useEffect, useCallback } from "react";
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
const VU_BAR_COUNT = 12;

// ═══════════ VU METER COMPONENT ═══════════
function VUMeter({ active, status, colors }) {
  const [bars, setBars] = useState(Array(VU_BAR_COUNT).fill(0));
  const intervalRef = useRef(null);

  useEffect(() => {
    if (active) {
      intervalRef.current = setInterval(() => {
        setBars(prev => prev.map((_, i) => {
          if (status === "capturing" || status === "listening") {
            // Simulate VU meter reacting to ambient sound energy
            const energy = Math.random();
            const decay = 0.7;
            const peak = Math.sin((i / VU_BAR_COUNT) * Math.PI) * energy;
            return Math.min(1, peak + prev[i] * decay * 0.3);
          }
          if (status === "decoding") return Math.sin(Date.now() / 200 + i) * 0.5 + 0.5;
          return 0;
        }));
      }, 80);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setBars(Array(VU_BAR_COUNT).fill(0));
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [active, status]);

  const getBarColor = (level, idx) => {
    if (level < 0.1) return colors.border;
    if (idx >= VU_BAR_COUNT - 2) return "#ef4444"; // red peak
    if (idx >= VU_BAR_COUNT - 4) return colors.amber; // yellow warning
    return colors.emerald; // green normal
  };

  return (
    <View style={vuStyles.container}>
      <View style={vuStyles.barsRow}>
        {bars.map((level, i) => (
          <View key={i} style={vuStyles.barCol}>
            <View style={[vuStyles.bar, {
              height: Math.max(4, level * 56),
              backgroundColor: getBarColor(level, i),
              opacity: level < 0.1 ? 0.2 : 0.7 + level * 0.3,
            }]} />
          </View>
        ))}
      </View>
      <View style={vuStyles.labels}>
        <Text style={[vuStyles.dbLabel, { color: colors.textMuted }]}>-∞ dB</Text>
        <Text style={[vuStyles.dbLabel, { color: colors.textMuted }]}>-20</Text>
        <Text style={[vuStyles.dbLabel, { color: colors.textMuted }]}>-6</Text>
        <Text style={[vuStyles.dbLabel, { color: colors.amber }]}>0 dB</Text>
      </View>
    </View>
  );
}

// ═══════════ BRIGHTNESS GRAPH COMPONENT ═══════════
function BrightnessGraph({ active, colors }) {
  const [frames, setFrames] = useState([]);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (active) {
      intervalRef.current = setInterval(() => {
        const recent = LightService.getRecentFrames(40);
        if (recent.length > 0) {
          setFrames(recent.map(f => f.brightness));
        } else {
          // Simulated ambient brightness during listening
          setFrames(prev => {
            const next = [...prev.slice(-39), Math.random() * 60 + 20];
            return next;
          });
        }
      }, 100);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setFrames([]);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [active]);

  const maxVal = Math.max(255, ...frames);
  const graphH = 60;

  return (
    <View style={bgStyles.container}>
      <View style={[bgStyles.graphBox, { borderColor: colors.border }]}>
        {frames.length > 1 && (
          <View style={bgStyles.barsRow}>
            {frames.map((val, i) => (
              <View key={i} style={[bgStyles.graphBar, {
                height: Math.max(2, (val / maxVal) * graphH),
                backgroundColor: val > 180 ? colors.amber : val > 80 ? colors.emerald : colors.violet,
                opacity: 0.7,
              }]} />
            ))}
          </View>
        )}
        {frames.length <= 1 && (
          <Text style={[bgStyles.placeholder, { color: colors.textMuted }]}>Waiting for frames…</Text>
        )}
      </View>
      <View style={bgStyles.statsRow}>
        <Text style={[bgStyles.stat, { color: colors.textMuted }]}>100Hz sampling</Text>
        <Text style={[bgStyles.stat, { color: colors.amber }]}>{frames.length} frames</Text>
      </View>
    </View>
  );
}

// ═══════════ INTEGRITY STATS BADGE ═══════════
function IntegrityStats({ stats, colors }) {
  if (!stats) return null;
  return (
    <View style={[intStyles.box, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      <Text style={[intStyles.title, { color: colors.text }]}>Integrity Report</Text>
      <View style={intStyles.row}>
        <Text style={[intStyles.label, { color: colors.textMuted }]}>CRC-16</Text>
        <Text style={[intStyles.val, { color: stats.crcOk ? colors.emerald : "#ef4444" }]}>
          {stats.crcOk ? "✓ PASS" : "✗ FAIL"} {stats.crcValue}
        </Text>
      </View>
      <View style={intStyles.row}>
        <Text style={[intStyles.label, { color: colors.textMuted }]}>ECC Parity</Text>
        <Text style={[intStyles.val, { color: stats.eccOk ? colors.emerald : "#ef4444" }]}>
          {stats.eccOk ? "✓ PASS" : "✗ FAIL"}
        </Text>
      </View>
      <View style={intStyles.row}>
        <Text style={[intStyles.label, { color: colors.textMuted }]}>SNR</Text>
        <Text style={[intStyles.val, { color: colors.text }]}>{stats.snrEstimate}</Text>
      </View>
      <View style={intStyles.row}>
        <Text style={[intStyles.label, { color: colors.textMuted }]}>Bits decoded</Text>
        <Text style={[intStyles.val, { color: colors.text }]}>{stats.totalBits}</Text>
      </View>
    </View>
  );
}

// ═══════════ MAIN SCREEN ═══════════
export default function ReceiveScreen({ navigation }) {
  const c = useColors();
  const [step, setStep] = useState("select");
  const [activeMode, setActiveMode] = useState("QR");
  const [verifyState, setVerifyState] = useState("listening");
  const [permission, requestPermission] = useCameraPermissions();
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [receipt, setReceipt] = useState(null);
  const [soundStatus, setSoundStatus] = useState("idle");
  const [lightStatus, setLightStatus] = useState("idle");
  const [soundStats, setSoundStats] = useState(null);
  const [lightStats, setLightStats] = useState(null);
  const brightnessIntervalRef = useRef(null);

  useEffect(() => {
    return () => {
      BLEService.stopReceiving();
      NFCService.cancelRequest();
      SoundService.destroy();
      LightService.destroy();
      if (brightnessIntervalRef.current) clearInterval(brightnessIntervalRef.current);
    };
  }, []);

  const slideIn = () => {
    slideAnim.setValue(50);
    Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 50, useNativeDriver: true }).start();
  };

  const processPacket = async (rawData) => {
    setStep("verifying"); setVerifyState("handshake"); slideIn();
    try {
      const packet = JSON.parse(rawData);
      if (!packet.s || !packet.c) throw new Error("Invalid AURA packet format");
      const receiverId = await SecureStore.getItemAsync("user_id");
      await submitMotionProof({ session_id: packet.s, user_id: receiverId, motion_hash: "receiver-motion-ok" });
      const result = await submitPaymentPacket({ session_id: packet.s, nonce: packet.n, ciphertext: packet.c });
      setReceipt({
        sessionId: packet.s, mode: activeMode, timestamp: new Date().toISOString(),
        txnHash: result?.txn_hash || packet.s.substring(0, 16),
        amount: result?.amount || null, senderName: result?.sender_name || null,
      });
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
    setSoundStatus("listening"); setSoundStats(null);
    try {
      await SoundService.listen(
        (decodedPacket) => {
          setSoundStats(SoundService.lastDecodedStats);
          processPacket(decodedPacket);
        },
        (status) => setSoundStatus(status),
        10000
      );
      // Capture stats even if decoding fell through to "processed"
      if (SoundService.lastDecodedStats) setSoundStats(SoundService.lastDecodedStats);
    } catch (e) {
      setSoundStatus("error");
      Alert.alert("Sound Error", e.message);
    }
  };

  /* ═══ LIGHT ═══ */
  const handleStartLight = async () => {
    if (!permission?.granted) requestPermission();
    setActiveMode("Light"); setStep("light-detect"); slideIn();
    setLightStatus("listening"); setLightStats(null);

    brightnessIntervalRef.current = setInterval(() => {
      const simulatedBrightness = Math.random() * 255;
      LightService.addBrightnessSample(simulatedBrightness);
    }, 10);

    try {
      await LightService.listen(
        (decodedPacket) => {
          setLightStats(LightService.lastFrameStats);
          processPacket(decodedPacket);
        },
        (status) => setLightStatus(status),
        15000
      );
      if (LightService.lastFrameStats) setLightStats(LightService.lastFrameStats);
    } catch (e) {
      setLightStatus("error");
      if (!e.message.includes("Insufficient")) Alert.alert("Light Error", e.message);
    } finally {
      if (brightnessIntervalRef.current) { clearInterval(brightnessIntervalRef.current); brightnessIntervalRef.current = null; }
    }
  };

  const reset = () => {
    setStep("select"); setVerifyState("listening"); setSoundStatus("idle"); setLightStatus("idle");
    setReceipt(null); setSoundStats(null); setLightStats(null);
    BLEService.stopReceiving(); NFCService.cancelRequest(); SoundService.destroy(); LightService.destroy();
    if (brightnessIntervalRef.current) { clearInterval(brightnessIntervalRef.current); brightnessIntervalRef.current = null; }
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

          {/* ═══ SOUND LISTEN + VU METER ═══ */}
          {step === "sound-listen" && (
            <Card style={{ alignItems: "center", paddingVertical: 32 }}>
              {/* Reactive VU Meter */}
              <VUMeter
                active={["listening", "capturing", "decoding"].includes(soundStatus)}
                status={soundStatus}
                colors={c}
              />

              <Text style={[styles.sectionTitle, { color: c.text, marginTop: 20, marginBottom: 8 }]}>
                {soundStatus === "listening" ? "🎙 Listening for Ultrasonics..." :
                 soundStatus === "capturing" ? "🔊 Capturing Audio..." :
                 soundStatus === "decoding" ? "⚙️ Decoding FSK Signal..." :
                 soundStatus === "received" ? "✓ Packet Decoded!" :
                 soundStatus === "processed" ? "✓ Audio Captured" : "Sound Receiver"}
              </Text>
              <Text style={{ color: c.textSecondary, textAlign: "center", marginBottom: 12 }}>
                Microphone is active. Place sender's device within ~3 meters.
              </Text>
              <Text style={[styles.freqLabel, { color: c.violet }]}>
                Detecting: 18kHz (bit-0) · 19.5kHz (bit-1)
              </Text>

              {/* Integrity stats after decode */}
              {soundStats && <IntegrityStats stats={soundStats} colors={c} />}

              <Button variant="secondary" style={{ width: "100%", marginTop: 20 }} onPress={() => { SoundService.destroy(); reset(); }}>Cancel</Button>
            </Card>
          )}

          {/* ═══ LIGHT DETECT + BRIGHTNESS GRAPH ═══ */}
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
                <View style={styles.overlay}>
                  <View style={[styles.lightTargetBox, { borderColor: c.amber }]}>
                    <Text style={{ color: c.amber, fontSize: 14, fontWeight: "700" }}>Point at flashlight</Text>
                  </View>
                </View>
              </View>
              <View style={{ padding: 20 }}>
                {/* Brightness Graph */}
                <BrightnessGraph
                  active={["listening", "decoding"].includes(lightStatus)}
                  colors={c}
                />

                <Text style={[styles.sectionTitle, { color: c.text, textAlign: "center", marginBottom: 8, marginTop: 12 }]}>
                  {lightStatus === "listening" ? "📸 Detecting Light Pulses..." :
                   lightStatus === "decoding" ? "⚙️ Decoding Manchester..." :
                   lightStatus === "received" ? "✓ Decoded!" : "Li-Fi Receiver"}
                </Text>
                <Text style={{ color: c.textSecondary, textAlign: "center", marginBottom: 12 }}>
                  Analyzing brightness changes from sender's flashlight. Manchester decoding active.
                </Text>

                {/* Light frame stats */}
                {lightStats && (
                  <View style={[intStyles.box, { backgroundColor: c.bg, borderColor: c.border }]}>
                    <Text style={[intStyles.title, { color: c.text }]}>Frame Analysis</Text>
                    <View style={intStyles.row}>
                      <Text style={[intStyles.label, { color: c.textMuted }]}>Sampling Rate</Text>
                      <Text style={[intStyles.val, { color: c.emerald }]}>{lightStats.samplingRateHz}Hz</Text>
                    </View>
                    <View style={intStyles.row}>
                      <Text style={[intStyles.label, { color: c.textMuted }]}>Total Frames</Text>
                      <Text style={[intStyles.val, { color: c.text }]}>{lightStats.totalFrames}</Text>
                    </View>
                    <View style={intStyles.row}>
                      <Text style={[intStyles.label, { color: c.textMuted }]}>Threshold</Text>
                      <Text style={[intStyles.val, { color: c.text }]}>{lightStats.threshold}</Text>
                    </View>
                    <View style={intStyles.row}>
                      <Text style={[intStyles.label, { color: c.textMuted }]}>Contrast</Text>
                      <Text style={[intStyles.val, { color: c.amber }]}>{lightStats.contrast}</Text>
                    </View>
                    <View style={intStyles.row}>
                      <Text style={[intStyles.label, { color: c.textMuted }]}>Bits Decoded</Text>
                      <Text style={[intStyles.val, { color: c.violet }]}>{lightStats.decodedBits}</Text>
                    </View>
                  </View>
                )}

                <Button variant="secondary" style={{ marginTop: 12 }} onPress={() => { LightService.destroy(); reset(); }}>Cancel</Button>
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

          {/* ═══ SUCCESS + RECEIPT ═══ */}
          {step === "success" && (
            <Card style={{ alignItems: "center", paddingVertical: 40 }}>
              <View style={[styles.successIcon, { backgroundColor: c.emerald + "20" }]}>
                <Text style={{ fontSize: 40 }}>✓</Text>
              </View>
              <Text style={[styles.sectionTitle, { color: c.text, marginTop: 24, marginBottom: 8 }]}>Payment Received</Text>
              <Text style={{ color: c.textSecondary, textAlign: "center", marginBottom: 8 }}>
                via {activeMode} · Cryptographic verification complete
              </Text>

              {receipt && (
                <View style={[styles.receiptCard, { backgroundColor: c.bg, borderColor: c.border }]}>
                  <Text style={[styles.receiptTitle, { color: c.text }]}>Transfer Receipt</Text>
                  <View style={styles.receiptRow}>
                    <Text style={[styles.receiptLabel, { color: c.textMuted }]}>Mode</Text>
                    <Text style={[styles.receiptValue, { color: c.text }]}>{receipt.mode}</Text>
                  </View>
                  {receipt.amount && (
                    <View style={styles.receiptRow}>
                      <Text style={[styles.receiptLabel, { color: c.textMuted }]}>Amount</Text>
                      <Text style={[styles.receiptValue, { color: c.emerald }]}>₹{Number(receipt.amount).toLocaleString()}</Text>
                    </View>
                  )}
                  {receipt.senderName && (
                    <View style={styles.receiptRow}>
                      <Text style={[styles.receiptLabel, { color: c.textMuted }]}>From</Text>
                      <Text style={[styles.receiptValue, { color: c.text }]}>{receipt.senderName}</Text>
                    </View>
                  )}
                  <View style={styles.receiptRow}>
                    <Text style={[styles.receiptLabel, { color: c.textMuted }]}>Time</Text>
                    <Text style={[styles.receiptValue, { color: c.text }]}>{new Date(receipt.timestamp).toLocaleString()}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={[styles.receiptLabel, { color: c.textMuted }]}>Txn Hash</Text>
                    <Text style={[styles.receiptHash, { color: c.violet }]}>{receipt.txnHash}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={[styles.receiptLabel, { color: c.textMuted }]}>Session</Text>
                    <Text style={[styles.receiptHash, { color: c.textMuted }]}>{receipt.sessionId?.substring(0, 20)}...</Text>
                  </View>
                </View>
              )}

              <Text style={{ color: c.textMuted, textAlign: "center", marginBottom: 32, marginTop: 8 }}>
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

// ═══════════ STYLES ═══════════

const vuStyles = StyleSheet.create({
  container: { width: "100%", marginBottom: 8 },
  barsRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "center", height: 60, gap: 4 },
  barCol: { alignItems: "center", justifyContent: "flex-end", width: 14 },
  bar: { width: 10, borderRadius: 3, minHeight: 4 },
  labels: { flexDirection: "row", justifyContent: "space-between", marginTop: 6, paddingHorizontal: 4 },
  dbLabel: { fontSize: 9, fontWeight: "600" },
});

const bgStyles = StyleSheet.create({
  container: { width: "100%", marginBottom: 8 },
  graphBox: { height: 68, borderWidth: 1, borderRadius: 10, overflow: "hidden", justifyContent: "flex-end", padding: 4 },
  barsRow: { flexDirection: "row", alignItems: "flex-end", gap: 2, height: "100%" },
  graphBar: { flex: 1, borderRadius: 2, minHeight: 2 },
  placeholder: { textAlign: "center", fontSize: 11, paddingTop: 22 },
  statsRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  stat: { fontSize: 10, fontWeight: "600" },
});

const intStyles = StyleSheet.create({
  box: { width: "100%", marginTop: 16, padding: 14, borderRadius: 14, borderWidth: 1 },
  title: { fontSize: 14, fontWeight: "800", marginBottom: 10, textAlign: "center" },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 4 },
  label: { fontSize: 12, fontWeight: "500" },
  val: { fontSize: 12, fontWeight: "700", fontFamily: "monospace" },
});

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
  freqLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.3, marginTop: 8 },
  receiptCard: { width: "100%", marginTop: 20, padding: 16, borderRadius: 16, borderWidth: 1 },
  receiptTitle: { fontSize: 16, fontWeight: "800", marginBottom: 12, textAlign: "center" },
  receiptRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: "#8881" },
  receiptLabel: { fontSize: 13, fontWeight: "500" },
  receiptValue: { fontSize: 14, fontWeight: "700" },
  receiptHash: { fontSize: 11, fontWeight: "600", fontFamily: "monospace" },
});
