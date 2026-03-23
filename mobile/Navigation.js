import { NavigationContainer, DarkTheme, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";

import { useTheme, useColors } from "./src/context/ThemeContext";

// Screens
import AuthScreen from "./src/screens/AuthScreen";
import HomeScreen from "./src/screens/HomeScreen";
import SendScreen from "./src/screens/SendScreen";
import ReceiveScreen from "./src/screens/ReceiveScreen";
import TransactionsScreen from "./src/screens/TransactionsScreen";
import WalletScreen from "./src/screens/WalletScreen";
import TokensScreen from "./src/screens/TokensScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import ModeControlScreen from "./src/screens/ModeControlScreen";
import SyncScreen from "./src/screens/SyncScreen";
import AnalyticsScreen from "./src/screens/AnalyticsScreen";
import BankScreen from "./src/screens/BankScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import NotificationsScreen from "./src/screens/NotificationsScreen";
import AppLockScreen from "./src/screens/AppLockScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const MoreStack = createNativeStackNavigator();

function MoreNavigator() {
  return (
    <MoreStack.Navigator screenOptions={{ headerShown: false }}>
      <MoreStack.Screen name="MoreMenu" component={MoreMenuScreen} />
      <MoreStack.Screen name="Wallet" component={WalletScreen} />
      <MoreStack.Screen name="Tokens" component={TokensScreen} />
      <MoreStack.Screen name="ModeControl" component={ModeControlScreen} />
      <MoreStack.Screen name="SyncStatus" component={SyncScreen} />
      <MoreStack.Screen name="Analytics" component={AnalyticsScreen} />
      <MoreStack.Screen name="Settings" component={SettingsScreen} />
      <MoreStack.Screen name="BankAccounts" component={BankScreen} />
      <MoreStack.Screen name="Profile" component={ProfileScreen} />
      <MoreStack.Screen name="Notifications" component={NotificationsScreen} />
    </MoreStack.Navigator>
  );
}

// Simple menu screen for the More tab
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function MoreMenuScreen({ navigation }) {
  const c = useColors();

  const items = [
    { label: "Wallet", icon: "💳", screen: "Wallet" },
    { label: "Bank Accounts", icon: "🏦", screen: "BankAccounts" },
    { label: "Offline Tokens", icon: "🪙", screen: "Tokens" },
    { label: "Profile & KYC", icon: "👤", screen: "Profile" },
    { label: "Notifications", icon: "🔔", screen: "Notifications" },
    { label: "Mode Control", icon: "📡", screen: "ModeControl" },
    { label: "Sync Status", icon: "🔄", screen: "SyncStatus" },
    { label: "Analytics", icon: "📊", screen: "Analytics" },
    { label: "Settings", icon: "⚙️", screen: "Settings" },
  ];

  return (
    <SafeAreaView style={[menuStyles.container, { backgroundColor: c.bg }]}>
      <View style={menuStyles.header}>
        <Text style={[menuStyles.title, { color: c.text }]}>More</Text>
      </View>
      <ScrollView contentContainerStyle={menuStyles.scroll}>
        {items.map((item, i) => (
          <TouchableOpacity
            key={i}
            style={[menuStyles.item, { backgroundColor: c.card, borderColor: c.border }]}
            onPress={() => navigation.navigate(item.screen)}
            activeOpacity={0.7}
          >
            <View style={[menuStyles.iconBox, { backgroundColor: c.indigo + "10" }]}>
              <Text style={{ fontSize: 20 }}>{item.icon}</Text>
            </View>
            <Text style={[menuStyles.label, { color: c.text }]}>{item.label}</Text>
            <Text style={{ color: c.textMuted, fontSize: 18 }}>›</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const menuStyles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingBottom: 10 },
  title: { fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },
  scroll: { padding: 20, paddingTop: 10, gap: 10 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
  },
  iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  label: { flex: 1, fontSize: 16, fontWeight: "600" },
});

function TabNavigator() {
  const c = useColors();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: c.card,
          borderTopColor: c.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: c.indigo,
        tabBarInactiveTintColor: c.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: "Home" }} />
      <Tab.Screen name="Send" component={SendScreen} options={{ tabBarLabel: "Send" }} />
      <Tab.Screen name="Receive" component={ReceiveScreen} options={{ tabBarLabel: "Receive" }} />
      <Tab.Screen name="History" component={TransactionsScreen} options={{ tabBarLabel: "History" }} />
      <Tab.Screen name="More" component={MoreNavigator} options={{ tabBarLabel: "More" }} />
    </Tab.Navigator>
  );
}

export default function AppNavigation() {
  const { dark } = useTheme();
  const [locked, setLocked] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkAppLock();
  }, []);

  const checkAppLock = async () => {
    try {
      const enabled = await SecureStore.getItemAsync("app_lock_enabled");
      setLocked(enabled === "true");
    } catch (e) {
      /* no lock */
    } finally {
      setChecking(false);
    }
  };

  if (checking) return null;

  if (locked) {
    return <AppLockScreen onUnlock={() => setLocked(false)} />;
  }

  return (
    <NavigationContainer theme={dark ? DarkTheme : DefaultTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen name="Main" component={TabNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
