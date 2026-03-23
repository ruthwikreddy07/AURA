import { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl, Animated, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useColors } from "../context/ThemeContext";
import Card from "../components/Card";
import Badge from "../components/Badge";

// Mock notifications — in production these would come from a backend push/poll endpoint
const MOCK_NOTIFICATIONS = [
  { id: "1", type: "transfer", title: "Payment Received", body: "₹2,500 received via QR Code from User #a3f8", time: "2 min ago", read: false },
  { id: "2", type: "sync", title: "Sync Complete", body: "3 offline transactions settled successfully.", time: "15 min ago", read: false },
  { id: "3", type: "security", title: "New Login Detected", body: "Your account was accessed from a new device.", time: "1 hour ago", read: true },
  { id: "4", type: "token", title: "Token Expiring Soon", body: "Token TKN-7B2F (₹1,000) expires in 24 hours.", time: "3 hours ago", read: true },
  { id: "5", type: "transfer", title: "Payment Sent", body: "₹500 sent via BLE to User #d9c1. Queued for sync.", time: "5 hours ago", read: true },
  { id: "6", type: "system", title: "Welcome to AURA", body: "Your account is set up. Set a transaction PIN for security.", time: "1 day ago", read: true },
];

const ICONS = {
  transfer: "💸",
  sync: "🔄",
  security: "🔐",
  token: "🪙",
  system: "📢",
};

const BADGE_STATUS = {
  transfer: "success",
  sync: "info",
  security: "warning",
  token: "info",
  system: "info",
};

export default function NotificationsScreen({ navigation }) {
  const c = useColors();
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnims = useRef(MOCK_NOTIFICATIONS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    // Staggered fade-in animation
    const anims = fadeAnims.map((anim, i) =>
      Animated.timing(anim, { toValue: 1, duration: 300, delay: i * 60, useNativeDriver: true })
    );
    Animated.parallel(anims).start();
  }, []);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: c.text }]}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={{ color: c.textMuted, fontSize: 13, marginTop: 2 }}>
              {unreadCount} unread
            </Text>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={{ color: c.indigo, fontWeight: "700", fontSize: 14 }}>Mark All Read</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); setTimeout(() => setRefreshing(false), 1000); }} tintColor={c.indigo} />}
      >
        {notifications.length === 0 ? (
          <Card style={{ padding: 40, alignItems: "center" }}>
            <Text style={{ fontSize: 40, marginBottom: 16 }}>🔔</Text>
            <Text style={[styles.emptyTitle, { color: c.text }]}>No Notifications</Text>
            <Text style={{ color: c.textMuted, textAlign: "center" }}>
              You're all caught up! New activity will appear here.
            </Text>
          </Card>
        ) : (
          notifications.map((notif, i) => (
            <Animated.View key={notif.id} style={{ opacity: fadeAnims[i] || 1 }}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  setNotifications((prev) =>
                    prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
                  );
                }}
              >
                <Card style={[styles.notifCard, !notif.read && { borderLeftWidth: 3, borderLeftColor: c.indigo }]}>
                  <View style={styles.notifRow}>
                    <View style={[styles.iconBox, { backgroundColor: c[BADGE_STATUS[notif.type] === "success" ? "emerald" : BADGE_STATUS[notif.type] === "warning" ? "amber" : "indigo"] + "15" }]}>
                      <Text style={{ fontSize: 20 }}>{ICONS[notif.type] || "📢"}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.notifHeader}>
                        <Text style={[styles.notifTitle, { color: c.text, fontWeight: notif.read ? "600" : "800" }]}>
                          {notif.title}
                        </Text>
                        {!notif.read && <View style={[styles.unreadDot, { backgroundColor: c.indigo }]} />}
                      </View>
                      <Text style={[styles.notifBody, { color: c.textSecondary }]}>{notif.body}</Text>
                      <Text style={[styles.notifTime, { color: c.textMuted }]}>{notif.time}</Text>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            </Animated.View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingBottom: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  title: { fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },
  scroll: { padding: 20, paddingTop: 10 },
  emptyTitle: { fontSize: 18, fontWeight: "800", marginBottom: 8 },
  notifCard: { padding: 14, marginBottom: 10 },
  notifRow: { flexDirection: "row", gap: 12 },
  iconBox: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  notifHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  notifTitle: { fontSize: 15 },
  notifBody: { fontSize: 13, lineHeight: 18, marginBottom: 4 },
  notifTime: { fontSize: 11, fontWeight: "500" },
  unreadDot: { width: 8, height: 8, borderRadius: 4 },
});
