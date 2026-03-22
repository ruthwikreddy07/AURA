import { useState } from "react";
import { View, Text, StyleSheet, Alert, TouchableOpacity } from "react-native";
import * as SecureStore from "expo-secure-store";
import { SafeAreaView } from "react-native-safe-area-context";

import { useColors } from "../context/ThemeContext";
import { loginUser, registerUser } from "../api/api";
import Input from "../components/Input";
import Button from "../components/Button";

export default function AuthScreen({ navigation }) {
  const c = useColors();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const data = { email, password };
      const res = isLogin ? await loginUser(data) : await registerUser(data);
      
      const userId = res.user?.id || res.id;
      const token = res.access_token || res.user?.access_token;

      if (userId) await SecureStore.setItemAsync("user_id", userId);
      if (token) await SecureStore.setItemAsync("auth_token", token);

      // Navigate to main app
      navigation.replace("Main");
    } catch (e) {
      Alert.alert("Auth Failed", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
      <View style={styles.header}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>Ω</Text>
        </View>
        <Text style={[styles.title, { color: c.text }]}>Welcome to AURA</Text>
        <Text style={[styles.subtitle, { color: c.textSecondary }]}>
          Sign in to access secure offline payments.
        </Text>
      </View>

      <View style={styles.form}>
        <Input 
          label="Email" 
          placeholder="name@company.com" 
          value={email} 
          onChangeText={setEmail}
          keyboardType="email-address" 
        />
        <Input 
          label="Password" 
          placeholder="••••••••" 
          value={password} 
          onChangeText={setPassword}
          secureTextEntry 
        />

        <Button onPress={handleSubmit} disabled={loading} style={styles.btn}>
          {loading ? "Authenticating..." : (isLogin ? "Sign In" : "Create Account")}
        </Button>

        <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={styles.toggleHolder}>
          <Text style={[styles.toggleText, { color: c.textMuted }]}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <Text style={{ color: c.indigo, fontWeight: "600" }}>
              {isLogin ? "Sign up" : "Sign in"}
            </Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center" },
  header: { alignItems: "center", marginBottom: 40 },
  logo: { width: 48, height: 48, borderRadius: 16, backgroundColor: "#4f46e5", justifyContent: "center", alignItems: "center", marginBottom: 16 },
  logoText: { color: "#fff", fontSize: 24, fontWeight: "900" },
  title: { fontSize: 24, fontWeight: "800", marginBottom: 8 },
  subtitle: { fontSize: 14, fontWeight: "500", textAlign: "center" },
  form: { width: "100%" },
  btn: { marginTop: 16 },
  toggleHolder: { marginTop: 24, alignItems: "center" },
  toggleText: { fontSize: 13 },
});
