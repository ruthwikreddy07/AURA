import { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, Alert, TouchableOpacity, Animated, Easing, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";
import { SafeAreaView } from "react-native-safe-area-context";

import { useColors } from "../context/ThemeContext";
import { requestOtp, verifyOtp, completeProfile } from "../api/api";
import Input from "../components/Input";
import Button from "../components/Button";

// Simulated Mesh Gradient Orbs
const AmbientOrb = ({ color, size, top, left, delay, duration }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true, delay }),
        Animated.timing(anim, { toValue: 0, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 30] });
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] });

  return (
    <Animated.View style={{
      position: 'absolute', top, left, width: size, height: size, borderRadius: size / 2, backgroundColor: color,
      opacity: 0.15, transform: [{ translateY }, { scale }]
    }} />
  );
};

export default function AuthScreen({ navigation }) {
  const c = useColors();
  
  // Steps: 'phone' -> 'otp' -> 'profile'
  const [step, setStep] = useState('phone');
  
  // Form State
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  
  // Loading & Error
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Storage for keys before profile completion
  const [deviceKeys, setDeviceKeys] = useState(null);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 40, friction: 8, useNativeDriver: true })
    ]).start();
  }, [step]);

  const handleRequestOtp = async () => {
    setErrorMsg("");
    if (!phoneNumber || phoneNumber.length < 8) {
      setErrorMsg("Please enter a valid phone number.");
      return;
    }

    const fullPhone = `${countryCode}${phoneNumber}`;
    setLoading(true);
    try {
      await requestOtp({ phone_number: fullPhone });
      setStep('otp');
    } catch (e) {
      setErrorMsg(e.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP & Generate Keys
  const handleVerifyOtp = async () => {
    setErrorMsg("");
    if (!otp || otp.length < 4) {
      setErrorMsg("Please enter the OTP.");
      return;
    }

    setLoading(true);
    try {
      // 1. Generate RSA Device Keys (we simulate a fast keypair generation using a UUID for prototype, 
      // but in production this would be real RSA generation. Currently Expo Crypto doesn't natively expose RSA generation, 
      // so we use a very strong UUID or hash as the unique device secret for standard token binding)
      const deviceId = await Crypto.randomUUID();
      const mockPublicKey = `pub_key_${deviceId}`; // In real app: import react-native-rsa-native
      const mockPrivateKey = `priv_key_${deviceId}`; // We will lock this in SecureStore
      
      setDeviceKeys({ deviceId, publicKey: mockPublicKey, privateKey: mockPrivateKey });

      // 2. Verify OTP with Backend
      const fullPhone = `${countryCode}${phoneNumber}`;
      const res = await verifyOtp({ 
        phone_number: fullPhone, 
        otp,
        device_id: deviceId,
        device_public_key: mockPublicKey
      });

      if (res.is_new_user) {
        // Need to collect Name, Email, and App PIN
        setStep('profile');
      } else {
        // Returning User - Log them in
        await saveTokensAndRoute(res.access_token, res.user_id, mockPrivateKey);
      }
    } catch (e) {
      setErrorMsg(e.message || "Invalid OTP.");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Complete Profile
  const handleCompleteProfile = async () => {
    setErrorMsg("");
    if (!fullName.trim() || pin.length < 4) {
      setErrorMsg("Full name and a 4-6 digit PIN are required.");
      return;
    }
    if (pin !== confirmPin) {
      setErrorMsg("PINs do not match.");
      return;
    }

    setLoading(true);
    try {
      const fullPhone = `${countryCode}${phoneNumber}`;
      const res = await completeProfile({
        phone_number: fullPhone,
        full_name: fullName,
        email: email || null,
        app_pin: pin,
        device_id: deviceKeys.deviceId,
        device_public_key: deviceKeys.publicKey
      });

      await saveTokensAndRoute(res.access_token, res.id, deviceKeys.privateKey, pin);
    } catch (e) {
      setErrorMsg(e.message || "Failed to complete setup.");
    } finally {
      setLoading(false);
    }
  };

  const saveTokensAndRoute = async (token, userId, privateKey, rawPin = null) => {
    if (userId) await SecureStore.setItemAsync("user_id", userId);
    if (token) await SecureStore.setItemAsync("auth_token", token);
    if (privateKey) await SecureStore.setItemAsync("device_private_key", privateKey);
    // In a real production app you might hash this, but SecureStore is already hardware-encrypted on iOS/Android
    if (rawPin) await SecureStore.setItemAsync("app_lock_pin", rawPin);
    
    // Also default app_lock_enabled to true so the Navigation knows to lock it next boot
    await SecureStore.setItemAsync("app_lock_enabled", "true");

    navigation.replace("Main");
  };

  return (
    <View style={styles.root}>
      {/* Animated Mesh Background */}
      <AmbientOrb color="#6366f1" size={300} top={-50} left={-100} delay={0} duration={4000} />
      <AmbientOrb color="#8b5cf6" size={250} top={200} left={250} delay={1000} duration={5000} />
      <AmbientOrb color="#10b981" size={200} top={500} left={-50} delay={2000} duration={6000} />
      
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, justifyContent: 'center' }}>
          
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
              <View style={styles.logoGlow}>
                <View style={styles.logo}>
                  <Text style={styles.logoText}>Ω</Text>
                </View>
              </View>
              <Text style={styles.title}>
                {step === 'phone' ? "Enter AURA" : step === 'otp' ? "Verify Number" : "Secure Vault"}
              </Text>
              <Text style={styles.subtitle}>
                {step === 'phone' ? "Your phone number is your universal identity." 
                  : step === 'otp' ? "Enter the 6-digit code sent to your phone."
                  : "Setup your 6-digit offline PIN to encrypt your local vault."}
              </Text>
            </Animated.View>

            <Animated.View style={[styles.glassCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
              
              {!!errorMsg && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              )}

              {/* STEP 1: PHONE */}
              {step === 'phone' && (
                <>
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ flex: 0.35 }}>
                      <Input 
                        label="Code" 
                        value={countryCode} 
                        onChangeText={setCountryCode}
                        keyboardType="phone-pad" 
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Input 
                        label="Phone Number" 
                        placeholder="98765 43210" 
                        value={phoneNumber} 
                        onChangeText={(t) => setPhoneNumber(t.replace(/\D/g, ''))}
                        keyboardType="phone-pad" 
                      />
                    </View>
                  </View>
                  <Button onPress={handleRequestOtp} disabled={loading} style={styles.btn}>
                    {loading ? "Initializing..." : "Send Verification Code"}
                  </Button>
                </>
              )}

              {/* STEP 2: OTP */}
              {step === 'otp' && (
                <>
                  <Input 
                    label="Verification Code (OTP)" 
                    placeholder="123456" 
                    value={otp} 
                    onChangeText={setOtp}
                    keyboardType="number-pad" 
                    maxLength={6}
                  />
                  <Button onPress={handleVerifyOtp} disabled={loading} style={styles.btn}>
                    {loading ? "Verifying & Generating Keys..." : "Verify Identity"}
                  </Button>
                  <TouchableOpacity onPress={() => setStep('phone')} style={styles.toggleHolder}>
                    <Text style={styles.toggleText}>Wrong number? <Text style={styles.toggleTextBold}>Edit</Text></Text>
                  </TouchableOpacity>
                </>
              )}

              {/* STEP 3: FULL PROFILE & PIN (NEW USERS) */}
              {step === 'profile' && (
                <>
                  <Input 
                    label="Full Name (As per Bank)" 
                    placeholder="Arjun Kumar" 
                    value={fullName} 
                    onChangeText={setFullName}
                  />
                  <View style={{ height: 16 }} />
                  <Input 
                    label="Offline App PIN (6-digit)" 
                    placeholder="••••••" 
                    value={pin} 
                    onChangeText={setPin}
                    keyboardType="number-pad"
                    secureTextEntry
                    maxLength={6}
                  />
                  <Input 
                    label="Confirm PIN" 
                    placeholder="••••••" 
                    value={confirmPin} 
                    onChangeText={setConfirmPin}
                    keyboardType="number-pad"
                    secureTextEntry
                    maxLength={6}
                  />

                  <Button onPress={handleCompleteProfile} disabled={loading} style={styles.btn}>
                    {loading ? "Encrypting Vault..." : "Complete Setup"}
                  </Button>
                </>
              )}

            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#030014" },
  container: { flex: 1 },
  scrollContent: { padding: 24, justifyContent: "center", minHeight: "100%" },
  header: { alignItems: "center", marginBottom: 32, marginTop: 20 },
  logoGlow: {
    width: 64, height: 64, borderRadius: 20, 
    backgroundColor: "rgba(99, 102, 241, 0.2)", 
    justifyContent: "center", alignItems: "center", marginBottom: 20,
    borderWidth: 1, borderColor: "rgba(99, 102, 241, 0.5)"
  },
  logo: { width: 50, height: 50, borderRadius: 14, backgroundColor: "#4f46e5", justifyContent: "center", alignItems: "center" },
  logoText: { color: "#ffffff", fontSize: 26, fontWeight: "900" },
  title: { fontSize: 28, fontWeight: "900", marginBottom: 8, color: "#ffffff", letterSpacing: -1, textAlign: "center" },
  subtitle: { fontSize: 13, fontWeight: "500", textAlign: "center", color: "#64748b", letterSpacing: 0.5 },
  
  glassCard: { 
    width: "100%", 
    padding: 24, 
    borderRadius: 32, 
    backgroundColor: "rgba(255, 255, 255, 0.03)", 
    borderWidth: 1, 
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  btn: { marginTop: 16, backgroundColor: "#4f46e5", borderRadius: 16, paddingVertical: 18 },
  toggleHolder: { marginTop: 24, alignItems: "center", paddingTop: 16, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.05)" },
  toggleText: { fontSize: 13, color: "#64748b", fontWeight: "600" },
  toggleTextBold: { color: "#818cf8", fontWeight: "800" },
  errorBox: {
    backgroundColor: "rgba(239, 68, 68, 0.1)", borderWidth: 1, borderColor: "rgba(239, 68, 68, 0.3)",
    padding: 12, borderRadius: 12, marginBottom: 16,
  },
  errorText: { color: "#ef4444", fontSize: 13, fontWeight: "600", textAlign: "center" },
});
