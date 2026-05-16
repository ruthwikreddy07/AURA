const API_BASE = process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:8000/api/v1";

import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

async function request(path, options = {}) {
  const token = await SecureStore.getItemAsync("auth_token");
  const headers = { "Content-Type": "application/json", ...options.headers };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  
  // Auto-refresh on 401 (expired token)
  if (res.status === 401 && !options._isRetry) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      return request(path, { ...options, _isRetry: true });
    }
  }
  
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Request failed");
  return data;
}

async function tryRefreshToken() {
  try {
    const refreshToken = await SecureStore.getItemAsync("refresh_token");
    if (!refreshToken) return false;
    
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    
    if (!res.ok) return false;
    
    const data = await res.json();
    await SecureStore.setItemAsync("auth_token", data.access_token);
    await SecureStore.setItemAsync("refresh_token", data.refresh_token);
    return true;
  } catch {
    return false;
  }
}

async function requestWithOfflineVault(path, vaultKey, options = {}) {
  try {
    const data = await request(path, options);
    await AsyncStorage.setItem(`vault_${vaultKey}`, JSON.stringify(data));
    return data;
  } catch (error) {
    const cached = await AsyncStorage.getItem(`vault_${vaultKey}`);
    if (cached) {
      console.log(`[Offline Vault] Loaded ${vaultKey} from local storage.`);
      return JSON.parse(cached);
    }
    throw error;
  }
}

/* ═══ AUTH ═══ */
export const requestOtp = (data) =>
  request("/auth/request-otp", { method: "POST", body: JSON.stringify(data) });
export const verifyOtp = (data) =>
  request("/auth/verify-otp", { method: "POST", body: JSON.stringify(data) });
export const completeProfile = (data) =>
  request("/auth/complete-profile", { method: "POST", body: JSON.stringify(data) });
export const approveQrSession = (data) =>
  request("/auth/qr/approve", { method: "POST", body: JSON.stringify(data) });
export const getRiskLogs = (userId) =>
  request(`/risk/logs/${userId}`);
export const loginUser = (data) =>
  request("/auth/login", { method: "POST", body: JSON.stringify(data) });
export const setTransactionPin = (pin) =>
  request("/auth/set-pin", { method: "POST", body: JSON.stringify({ pin }) });
export const verifyTransactionPin = (pin) =>
  request("/auth/verify-pin", { method: "POST", body: JSON.stringify({ pin }) });
export const getUserProfile = () => requestWithOfflineVault("/auth/me", "profile");
export const updateUserProfile = (data) =>
  request("/auth/me", { method: "PUT", body: JSON.stringify(data) });
export const recoverPin = (data) =>
  request("/auth/recover-pin", { method: "POST", body: JSON.stringify(data) });

/* ═══ WALLET ═══ */
export const getUserWallet = (userId) =>
  requestWithOfflineVault(`/wallet/user/${userId}`, `wallet_${userId}`);
export const fundWallet = (data) =>
  request("/wallet/fund", { method: "POST", body: JSON.stringify(data) });
export const withdrawWallet = (data) =>
  request("/wallet/withdraw", { method: "POST", body: JSON.stringify(data) });

/* ═══ BANK ═══ */
export const linkBankAccount = (data) =>
  request("/bank/link", { method: "POST", body: JSON.stringify(data) });
export const getUserBankAccounts = (userId) =>
  requestWithOfflineVault(`/bank/user/${userId}`, `banks_${userId}`);
export const removeBankAccount = (accountId) =>
  request(`/bank/${accountId}`, { method: "DELETE" });
export const setPrimaryBank = (accountId) =>
  request(`/bank/${accountId}/set-primary`, { method: "PUT" });

/* ═══ TOKENS ═══ */
export const getUserTokens = (walletId) =>
  requestWithOfflineVault(`/tokens/wallet/${walletId}`, `tokens_${walletId}`);
export const issueToken = (data) =>
  request("/tokens/issue", { method: "POST", body: JSON.stringify(data) });

/* ═══ TRANSACTIONS ═══ */
export const getUserTransactions = (userId) => request(`/transactions/user/${userId}`);

/* ═══ SYNC ═══ */
export const getSyncQueue = (userId) => request(`/sync/queue/${userId}`);

/* ═══ PAYMENT SESSION ═══ */
export const createPaymentSession = (data) =>
  request("/payment-session/create", { method: "POST", body: JSON.stringify(data) });
export const submitMotionProof = (data) =>
  request("/payment-session/motion-proof", { method: "POST", body: JSON.stringify(data) });

/* ═══ PAYMENT PACKET ═══ */
export const encryptPacket = (data) =>
  request("/payment-packet/encrypt", { method: "POST", body: JSON.stringify(data) });
export const submitPaymentPacket = (data) =>
  request("/payment-packet/submit", { method: "POST", body: JSON.stringify(data) });
