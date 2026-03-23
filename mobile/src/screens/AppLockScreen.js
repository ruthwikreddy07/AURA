import { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, Alert, Animated } from "react-native";
import * as SecureStore from "expo-secure-store";
import * as LocalAuthentication from "expo-local-authentication";
import { SafeAreaView } from "react-native-safe-area-context";

import { useColors } from "../context/ThemeContext";
import Button from "../components/Button";
import Input from "../components/Input";

export default function AppLockScreen({ onUnlock }) {
  const c = useColors();
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(true);
  const [hasBiometric, setHasBiometric] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    checkBiometric();
  }, []);

  const checkBiometric = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (compatible && enrolled) {
        setHasBiometric(true);
        attemptBiometric();
      }
    } catch (e) {
      /* biometric not available */
    } finally {
      setLoading(false);
    }
  };

  const attemptBiometric = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Unlock AURA",
        cancelLabel: "Use PIN",
        disableDeviceFallback: true,
      });
      if (result.success) onUnlock();
    } catch (e) {
      /* user cancelled or failed */
    }
  };

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handlePinSubmit = async () => {
    if (pin.length < 4) return;
    setLoading(true);
    try {
      const storedHash = await SecureStore.getItemAsync("app_lock_pin");
      // Simple check — in production you'd verify server-side
      if (storedHash === pin) {
        onUnlock();
      } else {
        shake();
        setPin("");
        Alert.alert("Incorrect PIN", "Please try again.");
      }
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateX: shakeAnim }] }]}>
        <View style={[styles.lockIcon, { backgroundColor: c.indigo + "15" }]}>
          <Text style={{ fontSize: 48 }}>🔒</Text>
        </View>

        <Text style={[styles.title, { color: c.text }]}>AURA Locked</Text>
        <Text style={[styles.subtitle, { color: c.textSecondary }]}>
          Enter your PIN or use biometrics to unlock.
        </Text>

        <View style={styles.pinContainer}>
          <Input
            label="PIN"
            placeholder="Enter PIN"
            value={pin}
            onChangeText={setPin}
            keyboardType="numeric"
            secureTextEntry
            maxLength={6}
          />
          <Button onPress={handlePinSubmit} disabled={loading || pin.length < 4} style={{ marginTop: 16 }}>
            {loading ? "Verifying..." : "Unlock"}
          </Button>
        </View>

        {hasBiometric && (
          <Button variant="secondary" onPress={attemptBiometric} style={{ marginTop: 16 }}>
            Use Biometrics
          </Button>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center" },
  content: { padding: 32, alignItems: "center" },
  lockIcon: { width: 100, height: 100, borderRadius: 50, alignItems: "center", justifyContent: "center", marginBottom: 24 },
  title: { fontSize: 28, fontWeight: "800", marginBottom: 8 },
  subtitle: { fontSize: 14, fontWeight: "500", textAlign: "center", marginBottom: 32 },
  pinContainer: { width: "100%" },
});
