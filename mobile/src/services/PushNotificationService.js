/**
 * PushNotificationService — Mobile FCM setup using expo-notifications.
 *
 * Responsibilities:
 *  1. Request notification permission from the OS
 *  2. Get the Expo push token (works for FCM on Android, APNs on iOS)
 *  3. Register the token with the AURA backend
 *  4. Set up foreground notification handler
 *  5. Set up notification tap handler (deep link to relevant screen)
 *
 * Usage (call from App.js on mount):
 *   import PushNotificationService from './services/PushNotificationService';
 *   await PushNotificationService.init(navigation);
 */

import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000/api/v1';

// ── Notification Presentation (how it looks while the app is in foreground) ───
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class PushNotificationService {
  constructor() {
    this._notificationListener = null;
    this._responseListener = null;
    this._navigation = null;
  }

  // ── Initialise ─────────────────────────────────────────────────────────────

  async init(navigation = null) {
    this._navigation = navigation;

    const token = await this._registerForPushNotifications();
    if (token) {
      await this._sendTokenToBackend(token);
    }

    // Listener: notification received while app is open
    this._notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('[Push] Received:', notification.request.content.title);
      }
    );

    // Listener: user tapped a notification
    this._responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        this._handleNotificationTap(data);
      }
    );
  }

  // ── Request Permission + Get Token ─────────────────────────────────────────

  async _registerForPushNotifications() {
    // Physical device required for push notifications
    if (!Constants.isDevice) {
      console.log('[Push] Skipping — emulator does not support push notifications.');
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('[Push] Notification permission denied.');
      return null;
    }

    // Required for Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('aura-payments', {
        name: 'AURA Payments',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#6366F1',
        sound: 'default',
      });
    }

    try {
      const pushToken = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });
      console.log('[Push] Expo push token acquired:', pushToken.data.slice(0, 30) + '...');
      return pushToken.data;
    } catch (e) {
      console.warn('[Push] Failed to get push token:', e.message);
      return null;
    }
  }

  // ── Send Token to Backend ──────────────────────────────────────────────────

  async _sendTokenToBackend(expoPushToken) {
    try {
      const authToken = await SecureStore.getItemAsync('auth_token');
      if (!authToken) return;

      const res = await fetch(`${API_BASE}/notifications/register-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ fcm_token: expoPushToken }),
      });

      if (res.ok) {
        console.log('[Push] Token registered with backend.');
      } else {
        console.warn('[Push] Backend token registration failed:', res.status);
      }
    } catch (e) {
      console.warn('[Push] Could not send token to backend:', e.message);
    }
  }

  // ── Unregister on Logout ───────────────────────────────────────────────────

  async unregister() {
    try {
      const authToken = await SecureStore.getItemAsync('auth_token');
      if (!authToken) return;

      await fetch(`${API_BASE}/notifications/unregister-token`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      console.log('[Push] Token unregistered from backend.');
    } catch (e) {
      console.warn('[Push] Unregister failed:', e.message);
    }
  }

  // ── Notification Tap Handler (Deep Linking) ────────────────────────────────

  _handleNotificationTap(data) {
    if (!this._navigation || !data) return;

    const type = data.type;
    console.log('[Push] Tapped notification type:', type);

    switch (type) {
      case 'payment_received':
      case 'payment_sent':
        this._navigation.navigate('Transactions');
        break;
      case 'fraud_alert':
        this._navigation.navigate('Notifications');
        break;
      case 'token_expired':
        this._navigation.navigate('Wallet');
        break;
      case 'sync_complete':
        this._navigation.navigate('Sync');
        break;
      default:
        this._navigation.navigate('Notifications');
    }
  }

  // ── Cleanup ────────────────────────────────────────────────────────────────

  destroy() {
    if (this._notificationListener) {
      Notifications.removeNotificationSubscription(this._notificationListener);
    }
    if (this._responseListener) {
      Notifications.removeNotificationSubscription(this._responseListener);
    }
  }
}

export default new PushNotificationService();
