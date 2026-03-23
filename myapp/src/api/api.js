const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api/v1";

/*
Centralized request helper
Handles:
- headers
- JSON parsing
- error handling
*/
async function request(endpoint, options = {}) {
  const token = localStorage.getItem("auth_token");
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
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

export const setPin = (data) =>
  request("/auth/set-pin", {
    method: "POST",
    body: JSON.stringify(data)
  });

export const verifyPin = (data) =>
  request("/auth/verify-pin", {
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

export const fundWallet = (data) =>
  request("/wallet/fund", {
    method: "POST",
    body: JSON.stringify(data)
  });

export const withdrawWallet = (data) =>
  request("/wallet/withdraw", {
    method: "POST",
    body: JSON.stringify(data)
  });


/* =========================
   BANK ACCOUNTS
========================= */

export const linkBank = (data) =>
  request("/bank/link", {
    method: "POST",
    body: JSON.stringify(data)
  });

export const getUserBanks = (user_id) =>
  request(`/bank/user/${user_id}`);

export const removeBank = (account_id) =>
  request(`/bank/${account_id}`, {
    method: "DELETE"
  });


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

export const submitMotionProof = (data) =>
  request("/payment-session/motion-proof", {
    method: "POST",
    body: JSON.stringify(data)
  });


/* =========================
   PAYMENT PACKET
========================= */

export const encryptPacket = (data) =>
  request("/payment-packet/encrypt", {
    method: "POST",
    body: JSON.stringify(data)
  });

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