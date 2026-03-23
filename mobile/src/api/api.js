const API_BASE = "http://10.0.2.2:8000/api/v1"; // Android emulator → host machine
// For physical device, use your computer's local IP, e.g. "http://192.168.1.X:8000/api/v1"

import * as SecureStore from "expo-secure-store";

async function request(path, options = {}) {
  const token = await SecureStore.getItemAsync("auth_token");
  const headers = { "Content-Type": "application/json", ...options.headers };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Request failed");
  return data;
}

/* ═══ AUTH ═══ */
export const loginUser = (data) =>
  request("/auth/login", { method: "POST", body: JSON.stringify(data) });

export const registerUser = (data) =>
  request("/auth/register", { method: "POST", body: JSON.stringify(data) });

export const setTransactionPin = (pin) =>
  request("/auth/set-pin", { method: "POST", body: JSON.stringify({ pin }) });

export const verifyTransactionPin = (pin) =>
  request("/auth/verify-pin", { method: "POST", body: JSON.stringify({ pin }) });

export const getUserProfile = () => request("/auth/me");

export const updateUserProfile = (data) =>
  request("/auth/me", { method: "PUT", body: JSON.stringify(data) });

/* ═══ WALLET ═══ */
export const getUserWallet = (userId) => request(`/wallet/user/${userId}`);

export const fundWallet = (data) =>
  request("/wallet/fund", { method: "POST", body: JSON.stringify(data) });

export const withdrawWallet = (data) =>
  request("/wallet/withdraw", { method: "POST", body: JSON.stringify(data) });

/* ═══ BANK ═══ */
export const linkBankAccount = (data) =>
  request("/bank/link", { method: "POST", body: JSON.stringify(data) });

export const getUserBankAccounts = (userId) => request(`/bank/user/${userId}`);

export const removeBankAccount = (accountId) =>
  request(`/bank/${accountId}`, { method: "DELETE" });

export const setPrimaryBank = (accountId) =>
  request(`/bank/${accountId}/set-primary`, { method: "PUT" });

/* ═══ TOKENS ═══ */
export const getUserTokens = (walletId) => request(`/tokens/wallet/${walletId}`);
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
