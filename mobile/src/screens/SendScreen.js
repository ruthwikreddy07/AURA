import { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Animated, TouchableOpacity, Alert, FlatList, TextInput } from "react-native";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import QRCode from "react-native-qrcode-svg";
import { CameraView } from "expo-camera";
import * as Contacts from "expo-contacts";
import { Ionicons } from "@expo/vector-icons";

import { useColors, useTheme } from "../context/ThemeContext";
import { createPaymentSession, submitMotionProof, encryptPacket, verifyTransactionPin, searchAuraUsers, getUserWallet, getUserTokens, issueToken } from "../api/api";
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
const TX_LOCK_KEY = "@aura_tx_lock";
const TX_LOCK_TIMEOUT = 5000; // 5 seconds

export default function SendScreen({ navigation }) {
  const c = useColors();
  const { isOffline } = useTheme();
  const [step, setStep] = useState("input");
  const [amount, setAmount] = useState("");
  const [receiverId, setReceiverId] = useState("");
  const [activeMode, setActiveMode] = useState("QR");
  const [loading, setLoading] = useState(false);
  const [pin, setPin] = useState("");
  const [showContacts, setShowContacts] = useState(false);
  const [contactsList, setContactsList] = useState([]);
  const [contactSearch, setContactSearch] = useState("");

  const [session, setSession] = useState(null);
  const [riskScore, setRiskScore] = useState(10);
  const [riskLevel, setRiskLevel] = useState("Safe");
  const [qrData, setQrData] = useState(null);
  const [resolvedReceiverId, setResolvedReceiverId] = useState("");
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

  const loadContacts = async () => {
    if (showContacts) {
      setShowContacts(false);
      return;
    }
    const { status } = await Contacts.requestPermissionsAsync();
    if (status === 'granted') {
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers],
      });
      if (data.length > 0) {
        const validContacts = data.filter(c => c.phoneNumbers && c.phoneNumbers.length > 0);
        setContactsList(validContacts);
        setShowContacts(true);
      }
    } else {
      Alert.alert("Permission Denied", "Contact permissions are required to select a receiver.");
    }
  };

  /* ═══ DOUBLE-SPEND LOCK ═══ */
  const acquireTxLock = async () => {
    const existing = await AsyncStorage.getItem(TX_LOCK_KEY);
    if (existing) {
      const lockTime = parseInt(existing, 10);
      if (Date.now() - lockTime < TX_LOCK_TIMEOUT) {
        throw new Error("Transaction already in progress. Please wait.");
      }
    }
    await AsyncStorage.setItem(TX_LOCK_KEY, Date.now().toString());
  };

  const releaseTxLock = async () => {
    await AsyncStorage.removeItem(TX_LOCK_KEY);
  };

  const handleNext = async () => {
    if (!amount || !receiverId) return;
    setLoading(true);
    try {
      const senderId = await SecureStore.getItemAsync("user_id");
      const pubKey = await SecureStore.getItemAsync("device_public_key") || "SENDER_PUB_KEY_MOCK";

      let finalReceiverId = receiverId;
      if (/^\+?\d{8,15}$/.test(receiverId.replace(/\D/g, ''))) {
        const users = await searchAuraUsers(receiverId.replace(/\D/g, ''));
        if (users && users.length > 0) {
          finalReceiverId = users[0].id;
        } else {
          Alert.alert("User Not Found", "No AURA user found with this phone number.");
          setLoading(false);
          return;
        }
      }

      setResolvedReceiverId(finalReceiverId);
      if (isOffline) {
        const sessId = "off_" + Math.random().toString(36).substring(2) + "_" + Date.now();
        const sess = { session_id: sessId, session_key: "offline_key" };
        setSession(sess);
      } else {
        const sess = await createPaymentSession({
          sender_id: senderId,
          receiver_id: finalReceiverId,
          mode: activeMode,
          ephemeral_pub_key: pubKey,
        });
        setSession(sess);
      }
      const score = Number(amount) > 10000 ? 85 : 10;
      setRiskScore(score);
      setRiskLevel(score > 70 ? "High Risk" : "Safe");
      setStep("risk");
      slideIn();
    } catch (e) {
      Alert.alert("Error", e.message || "Failed to create session");
    } finally {
      setLoading(false);
    }
  };

  /* ═══ PIN VERIFICATION → CONFIRM ═══ */
  const handlePinVerify = async () => {
    if (riskLevel === "High Risk") return Alert.alert("Blocked", "Blocked by Risk Engine");
    if (!pin || pin.length < 4) return Alert.alert("PIN Required", "Enter your 4-digit transaction PIN.");
    setLoading(true);
    try {
      await verifyTransactionPin(pin);
      // PIN verified, proceed to confirm
      await handleConfirm();
    } catch (e) {
      Alert.alert("PIN Verification Failed", e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      // Double-spend prevention lock
      await acquireTxLock();

      const senderId = await SecureStore.getItemAsync("user_id");

      // Select/provision token
      const wallets = await getUserWallet(senderId);
      const offlineWallet = wallets.find(w => w.wallet_type === "offline");
      if (!offlineWallet) throw new Error("Offline wallet not found.");

      const tokens = await getUserTokens(offlineWallet.id).catch(() => []);
      let selectedToken = tokens.find(t => t.status === "active" && Number(t.remaining_value) >= Number(amount));

      if (!selectedToken) {
        if (isOffline) {
          throw new Error("No active offline token found with sufficient balance.");
        }
        selectedToken = await issueToken({
          wallet_id: offlineWallet.id,
          token_value: Number(amount),
          expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
        });
      }

      const payload = { 
        sender_id: senderId, 
        receiver_id: resolvedReceiverId || receiverId, 
        token_id: selectedToken.id, 
        amount: Number(amount), 
        risk_score: riskScore / 100,
        mode: activeMode,
        is_offline: isOffline
      };

      let packetStr;
      if (isOffline) {
        packetStr = JSON.stringify({ s: session.session_id, payload });
      } else {
        await submitMotionProof({ session_id: session.session_id, user_id: senderId, motion_hash: "sender-motion-ok" });
        const encryptedResp = await encryptPacket({ session_key: session.session_key, payload });
        packetStr = JSON.stringify({ s: session.session_id, n: encryptedResp.nonce, c: encryptedResp.ciphertext });
      }

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
      await releaseTxLock();
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
      if (result.success) { setBleStatus("sent"); setTimeout(() => { releaseTxLock(); setStep("success"); }, 1500); }
    } catch (e) { setBleStatus("error"); releaseTxLock(); Alert.alert("BLE Error", e.message); }
  };

  /* ═══ NFC ═══ */
  const startNFCWrite = async (packet) => {
    const { supported, enabled } = await NFCService.init();
    if (!supported) return Alert.alert("Not Supported", "NFC not available");
    if (!enabled) { Alert.alert("NFC Disabled", "Enable NFC in Settings"); NFCService.goToSettings(); return; }
    setNfcStatus("waiting");
    const success = await NFCService.writePacket(packet, (s) => setNfcStatus(s));
    if (success) { setNfcStatus("sent"); setTimeout(() => { releaseTxLock(); setStep("success"); }, 1500); }
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
      setTimeout(() => { releaseTxLock(); setStep("success"); }, 1500);
    } catch (e) {
      setSoundStatus("error");
      releaseTxLock();
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
      setTimeout(() => { releaseTxLock(); setStep("success"); }, 1500);
    } catch (e) {
      setLightStatus("error");
      releaseTxLock();
      Alert.alert("Light Error", e.message);
    }
  };

  const reset = () => {
    setStep("input"); setAmount(""); setReceiverId(""); setResolvedReceiverId(""); setPin(""); setQrData(null); setEncryptedPacketStr(null);
    setBleDevices([]); setBleStatus("idle"); setNfcStatus("idle"); setSoundStatus("idle"); setLightStatus("idle");
    setTorchOn(false); setSoundProgress(0); setLightProgress({ bitIndex: 0, totalBits: 0 });
    BLEService.stopScan(); NFCService.cancelRequest(); SoundService.destroy(); LightService.destroy();
    releaseTxLock();
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
              <View style={{flexDirection: 'row', alignItems: 'flex-end', gap: 8}}>
                <View style={{flex: 1}}>
                  <Input label="Receiver User ID or Phone" placeholder="User ID / Phone" value={receiverId} onChangeText={setReceiverId} />
                </View>
                <Button variant="secondary" onPress={loadContacts} style={{paddingHorizontal: 12, marginBottom: 8}}>
                  <Ionicons name="people-outline" size={24} color={c.indigo} />
                </Button>
              </View>
              
              {showContacts && (
                <View style={{maxHeight: 300, borderWidth: 1, borderColor: c.border, borderRadius: 12, marginTop: 8, marginBottom: 16, overflow: 'hidden', backgroundColor: c.card}}>
                  <View style={{padding: 10, borderBottomWidth: 1, borderBottomColor: c.border, flexDirection: 'row', alignItems: 'center'}}>
                    <Ionicons name="search" size={18} color={c.textSecondary} style={{marginRight: 8}} />
                    <TextInput 
                      style={{flex: 1, color: c.text, fontSize: 15, padding: 0}}
                      placeholder="Search contacts..." 
                      placeholderTextColor={c.textMuted}
                      value={contactSearch} 
                      onChangeText={setContactSearch} 
                    />
                  </View>
                  <FlatList
                    nestedScrollEnabled
                    keyboardShouldPersistTaps="handled"
                    data={contactsList.filter(contact => 
                      (contact.name || '').toLowerCase().includes(contactSearch.toLowerCase()) || 
                      (contact.phoneNumbers?.[0]?.number || '').includes(contactSearch)
                    )}
                    keyExtractor={(item) => item.id}
                    initialNumToRender={15}
                    renderItem={({item}) => {
                      const phone = item.phoneNumbers[0].number;
                      return (
                        <TouchableOpacity 
                          style={{padding: 12, borderBottomWidth: 1, borderBottomColor: c.border}}
                          onPress={() => {
                            setReceiverId(phone.replace(/\D/g, ''));
                            setShowContacts(false);
                            setContactSearch("");
                          }}
                        >
                          <Text style={{color: c.text, fontWeight: '600'}}>{item.name}</Text>
                          <Text style={{color: c.textSecondary, fontSize: 12}}>{phone}</Text>
                        </TouchableOpacity>
                      )
                    }}
                  />
                </View>
              )}

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
              <Button onPress={handleNext} disabled={loading || !amount || !receiverId} style={{ marginTop: 32 }}>
                {loading ? "Processing..." : "Continue"}
              </Button>
            </Card>
          )}

          {/* ═══ RISK + PIN ═══ */}
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

              {/* Transaction PIN Input */}
              <View style={styles.pinSection}>
                <Text style={[styles.pinLabel, { color: c.textSecondary }]}>Transaction PIN</Text>
                <Input
                  placeholder="Enter 4-digit PIN"
                  value={pin}
                  onChangeText={setPin}
                  keyboardType="numeric"
                  secureTextEntry
                  maxLength={6}
                />
              </View>

              <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
                <Button variant="secondary" style={{ flex: 1 }} onPress={() => { setStep("input"); setPin(""); }}>Cancel</Button>
                <Button style={{ flex: 1 }} onPress={handlePinVerify} disabled={loading || riskLevel === "High Risk" || pin.length < 4}>
                  {loading ? "Verifying..." : "Authorize"}
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
                <Button style={{ flex: 1 }} onPress={() => { releaseTxLock(); setStep("success"); }}>Done</Button>
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
              {/* Hidden CameraView for real torch control */}
              <CameraView
                style={{ width: 1, height: 1, opacity: 0 }}
                facing="back"
                enableTorch={torchOn}
              />
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
              <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 8 }}>
                {lightProgress.totalBits ? `Bit ${lightProgress.bitIndex} of ${lightProgress.totalBits}` : 'Preparing...'}
              </Text>
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
  pinSection: { marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: "#8881" },
  pinLabel: { fontSize: 13, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
});
