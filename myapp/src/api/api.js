const API_BASE = "http://127.0.0.1:8000/api/v1";

/*
Centralized request helper
Handles:
- headers
- JSON parsing
- error handling
*/
async function request(endpoint, options = {}) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "API request failed");
  }

  return res.json();
}


/* =========================
   AUTH
========================= */

export const registerUser = (data) =>
  request("/auth/register", {
    method: "POST",
    body: JSON.stringify(data)
  });

export const loginUser = (data) =>
  request("/auth/login", {
    method: "POST",
    body: JSON.stringify(data)
  });


/* =========================
   WALLET
========================= */

export const createWallet = (data) =>
  request("/wallet/create", {
    method: "POST",
    body: JSON.stringify(data)
  });

export const getUserWallets = (user_id) =>
  request(`/wallet/user/${user_id}`);


/* =========================
   TOKENS
========================= */

export const issueToken = (data) =>
  request("/tokens/issue", {
    method: "POST",
    body: JSON.stringify(data)
  });

export const getWalletTokens = (wallet_id) =>
  request(`/tokens/wallet/${wallet_id}`);


/* =========================
   TRANSACTIONS
========================= */

export const createTransaction = (data) =>
  request("/transactions/create", {
    method: "POST",
    body: JSON.stringify(data)
  });

export const getUserTransactions = (user_id) =>
  request(`/transactions/user/${user_id}`);


/* =========================
   PAYMENT SESSION
========================= */

export const createPaymentSession = (data) =>
  request("/payment-session/create", {
    method: "POST",
    body: JSON.stringify(data)
  });


/* =========================
   PAYMENT PACKET
========================= */

export const submitPaymentPacket = (data) =>
  request("/payment-packet/submit", {
    method: "POST",
    body: JSON.stringify(data)
  });


/* =========================
   SYNC ENGINE
========================= */

export const enqueueSync = (data) =>
  request("/sync/enqueue", {
    method: "POST",
    body: JSON.stringify(data)
  });

export const processSync = (token_id) =>
  request(`/sync/process/${token_id}`, {
    method: "POST"
  });


/* =========================
   MODE PREFERENCES
========================= */

export const setModePreferences = (data) =>
  request("/mode/set", {
    method: "POST",
    body: JSON.stringify(data)
  });

export const getModePreferences = (user_id) =>
  request(`/mode/user/${user_id}`);


/* =========================
   ANALYTICS
========================= */

export const getMonthlyVolume = () =>
  request("/analytics/monthly-volume");

export const getModeDistribution = () =>
  request("/analytics/mode-distribution");

export const getFraudAttempts = () =>
  request("/analytics/fraud-attempts");

export const getRiskDistribution = () =>
  request("/analytics/risk-distribution");