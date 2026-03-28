import { useState, useEffect } from "react";
import { View, Text, StyleSheet, Alert, TouchableOpacity } from "react-native";
import { Camera, CameraView } from "expo-camera";
import * as SecureStore from "expo-secure-store";
import { SafeAreaView } from "react-native-safe-area-context";
import { approveQrSession } from "../api/api";
import { useColors } from "../context/ThemeContext";

export default function ScanWebQRScreen({ navigation }) {
  const c = useColors();
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    };
    getCameraPermissions();
  }, []);

  const handleBarCodeScanned = async ({ type, data }) => {
    if (scanned || processing) return;
    setScanned(true);
    setProcessing(true);

    // data should be the Session UUID
    try {
      // 1. In a real app, sign the UUID with the device private key here using pycryptodome/react-native-rsa
      // For this MVP, we fetch the private key to prove we have it, then approve the session.
      const privateKey = await SecureStore.getItemAsync("device_private_key");
      if (!privateKey) throw new Error("No secure device key found. Cannot authorize.");

      // 2. Mock Signature
      const signature = `signed_by_aura_vault_${data}`;

      // 3. Send to Server (Assuming mobile has valid Bearer token which API wrapper attaches)
      await approveQrSession({
        session_id: data,
        signature: signature
      });

      Alert.alert(
        "AURA Web Approved",
        "Your web dashboard has been successfully unlocked.",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert(
        "Authorization Failed",
        error.message || "Invalid Session QR",
        [{ text: "Try Again", onPress: () => { setScanned(false); setProcessing(false); } }]
      );
    }
  };

  if (hasPermission === null) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
        <Text style={{ color: c.text }}>Requesting camera permission...</Text>
      </SafeAreaView>
    );
  }
  if (hasPermission === false) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
        <Text style={{ color: c.text }}>No access to camera</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
          <Text style={{ color: c.indigo }}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
      >
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>Cancel</Text>
          </TouchableOpacity>
          
          <View style={styles.scanBox}>
            {processing ? (
              <Text style={styles.scanText}>Signing session...</Text>
            ) : (
              <>
                <View style={styles.cornerTL} />
                <View style={styles.cornerTR} />
                <View style={styles.cornerBL} />
                <View style={styles.cornerBR} />
              </>
            )}
          </View>
          
          <Text style={styles.instruction}>
            Point camera at the AURA Web QR to login magically.
          </Text>
        </View>
      </CameraView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  camera: { flex: 1 },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center" },
  backBtn: { position: "absolute", top: 40, left: 20, padding: 10 },
  backText: { color: "#fff", fontSize: 18, fontWeight: "600" },
  scanBox: { width: 250, height: 250, backgroundColor: "transparent", justifyContent: "center", alignItems: "center", position: "relative" },
  scanText: { color: "#4f46e5", fontSize: 18, fontWeight: "800" },
  instruction: { color: "#fff", fontSize: 14, fontWeight: "500", marginTop: 40, textAlign: "center", paddingHorizontal: 40 },
  
  cornerTL: { position: "absolute", top: 0, left: 0, width: 40, height: 40, borderColor: "#4f46e5", borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 16 },
  cornerTR: { position: "absolute", top: 0, right: 0, width: 40, height: 40, borderColor: "#4f46e5", borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 16 },
  cornerBL: { position: "absolute", bottom: 0, left: 0, width: 40, height: 40, borderColor: "#4f46e5", borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 16 },
  cornerBR: { position: "absolute", bottom: 0, right: 0, width: 40, height: 40, borderColor: "#4f46e5", borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 16 },
});
