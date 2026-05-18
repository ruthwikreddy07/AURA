/**
 * OfflineOutboxService — Persistent Transaction Queue for Offline-First Payments
 *
 * Architecture:
 *   1. When a payment is made offline (or network fails mid-request), it's queued here.
 *   2. Each entry is persisted to AsyncStorage so it survives app kills.
 *   3. When connectivity returns, the outbox drains automatically via NetInfo listener.
 *   4. Failed retries use exponential backoff (max 5 attempts).
 *   5. Backend sync endpoint receives batch submissions for reconciliation.
 *
 * This ensures zero transaction loss — the core promise of AURA's offline protocol.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import * as SecureStore from "expo-secure-store";

const OUTBOX_KEY = "aura_offline_outbox";
const SYNC_LOG_KEY = "aura_sync_log";
const MAX_RETRIES = 5;
const BASE_DELAY_MS = 2000;

class OfflineOutboxService {
  constructor() {
    this.isSyncing = false;
    this.unsubscribeNetInfo = null;
    this.onSyncStatusChange = null;
    this.syncLog = []; // in-memory log of recent sync events
  }

  // ═══════════ INITIALIZATION ═══════════

  /**
   * Start listening for connectivity changes.
   * Call this once from App.js or Navigation.js on mount.
   */
  init(onSyncStatusChange = null) {
    this.onSyncStatusChange = onSyncStatusChange;
    this.unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable) {
        this.drainQueue();
      }
    });
    // Load sync log from storage
    this._loadSyncLog();
  }

  destroy() {
    if (this.unsubscribeNetInfo) {
      this.unsubscribeNetInfo();
      this.unsubscribeNetInfo = null;
    }
  }

  // ═══════════ QUEUE MANAGEMENT ═══════════

  /**
   * Add a transaction to the offline outbox.
   * @param {object} entry - { id, type, endpoint, method, body, createdAt }
   */
  async enqueue(entry) {
    const queue = await this._loadQueue();
    const record = {
      id: entry.id || `outbox_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      type: entry.type || "payment",
      endpoint: entry.endpoint,
      method: entry.method || "POST",
      body: entry.body,
      createdAt: entry.createdAt || new Date().toISOString(),
      retries: 0,
      lastError: null,
      status: "pending",
    };
    queue.push(record);
    await this._saveQueue(queue);
    console.log(`[Outbox] Enqueued: ${record.id} (${record.type})`);
    this._notifyStatus();

    // Try immediate drain if online
    const netState = await NetInfo.fetch();
    if (netState.isConnected && netState.isInternetReachable) {
      this.drainQueue();
    }

    return record.id;
  }

  async getQueue() {
    return this._loadQueue();
  }

  async getStatus() {
    const queue = await this._loadQueue();
    return {
      total: queue.length,
      pending: queue.filter((e) => e.status === "pending").length,
      failed: queue.filter((e) => e.status === "failed").length,
      syncing: this.isSyncing,
    };
  }

  async removeItem(id) {
    let queue = await this._loadQueue();
    queue = queue.filter((e) => e.id !== id);
    await this._saveQueue(queue);
  }

  async clearAll() {
    await AsyncStorage.removeItem(OUTBOX_KEY);
  }

  /**
   * Manually retry a specific failed item.
   */
  async retryItem(id) {
    const queue = await this._loadQueue();
    const item = queue.find((e) => e.id === id);
    if (item) {
      item.status = "pending";
      item.retries = Math.max(0, item.retries - 1); // give it another chance
      item.lastError = null;
      await this._saveQueue(queue);
      this._notifyStatus();
      this.drainQueue();
    }
  }

  // ═══════════ SYNC ENGINE ═══════════

  /**
   * Attempt to drain the queue by submitting all pending items.
   * Uses exponential backoff for failures.
   * After draining, pushes a batch summary to the backend sync endpoint.
   */
  async drainQueue(requestFn = null) {
    if (this.isSyncing) return;
    this.isSyncing = true;
    this._notifyStatus();

    const syncResults = [];

    try {
      const queue = await this._loadQueue();
      const pendingItems = queue.filter(
        (e) => e.status === "pending" || e.status === "failed"
      );

      if (pendingItems.length === 0) {
        this.isSyncing = false;
        this._notifyStatus();
        return;
      }

      console.log(`[Outbox] Draining ${pendingItems.length} pending items...`);

      for (const item of pendingItems) {
        if (item.retries >= MAX_RETRIES) {
          item.status = "failed";
          syncResults.push({ id: item.id, status: "max_retries_reached" });
          continue;
        }

        item.status = "syncing";
        await this._saveQueue(queue);

        try {
          const submitFn = requestFn || this._defaultSubmit.bind(this);
          const response = await submitFn(item);

          // Success — remove from queue
          const updatedQueue = (await this._loadQueue()).filter(
            (e) => e.id !== item.id
          );
          await this._saveQueue(updatedQueue);
          console.log(`[Outbox] ✓ Synced: ${item.id}`);

          syncResults.push({
            id: item.id,
            status: "synced",
            serverResponse: response,
            syncedAt: new Date().toISOString(),
          });
        } catch (error) {
          item.retries += 1;
          item.lastError = error.message;
          item.status = item.retries >= MAX_RETRIES ? "failed" : "pending";
          await this._saveQueue(queue);
          console.warn(
            `[Outbox] ✗ Failed: ${item.id} (attempt ${item.retries}/${MAX_RETRIES}) — ${error.message}`
          );

          syncResults.push({
            id: item.id,
            status: "failed",
            error: error.message,
            retries: item.retries,
          });

          // Exponential backoff
          const delay = BASE_DELAY_MS * Math.pow(2, item.retries - 1);
          await new Promise((r) => setTimeout(r, Math.min(delay, 30000)));
        }
      }

      // ═══ BACKEND SYNC RECONCILIATION ═══
      // Push a batch summary to the backend for server-side reconciliation
      if (syncResults.length > 0) {
        await this._pushSyncReconciliation(syncResults);
      }
    } catch (e) {
      console.error("[Outbox] Drain error:", e);
    } finally {
      this.isSyncing = false;
      this._notifyStatus();

      const newQueue = await this._loadQueue();
      if (newQueue.some((e) => e.status === "pending")) {
        setTimeout(() => this.drainQueue(requestFn), 100);
      }
    }
  }

  // ═══════════ BACKEND SYNC INTEGRATION ═══════════

  /**
   * Push a batch of sync results to the backend for reconciliation.
   * The backend uses this to update server-side transaction ledger.
   */
  async _pushSyncReconciliation(results) {
    try {
      const token = await SecureStore.getItemAsync("auth_token");
      const userId = await SecureStore.getItemAsync("user_id");
      const apiBase = process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:8000/api/v1";

      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const payload = {
        user_id: userId,
        device_timestamp: new Date().toISOString(),
        sync_batch: results.map((r) => ({
          outbox_id: r.id,
          status: r.status,
          error: r.error || null,
          synced_at: r.syncedAt || null,
        })),
      };

      const res = await fetch(`${apiBase}/sync/reconcile`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        console.log(`[Outbox] Backend reconciliation pushed (${results.length} items).`);
        await this._addSyncLog("reconcile_success", `${results.length} items reconciled`);
      } else {
        console.warn("[Outbox] Backend reconciliation failed:", res.status);
        await this._addSyncLog("reconcile_failed", `HTTP ${res.status}`);
      }
    } catch (e) {
      // Non-critical — we log but don't throw.
      // The local queue already reflects the correct state.
      console.warn("[Outbox] Reconciliation request failed:", e.message);
      await this._addSyncLog("reconcile_error", e.message);
    }
  }

  // ═══════════ DEFAULT SUBMIT (uses fetch) ═══════════

  async _defaultSubmit(item) {
    const token = await SecureStore.getItemAsync("auth_token");
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const apiBase = process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:8000/api/v1";

    const res = await fetch(`${apiBase}${item.endpoint}`, {
      method: item.method,
      headers,
      body: JSON.stringify(item.body),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || `HTTP ${res.status}`);
    }

    return res.json();
  }

  // ═══════════ SYNC LOG ═══════════

  async _addSyncLog(event, detail) {
    const entry = {
      event,
      detail,
      timestamp: new Date().toISOString(),
    };
    this.syncLog.unshift(entry);
    // Keep last 50 entries
    if (this.syncLog.length > 50) this.syncLog = this.syncLog.slice(0, 50);
    await AsyncStorage.setItem(SYNC_LOG_KEY, JSON.stringify(this.syncLog));
  }

  async _loadSyncLog() {
    try {
      const raw = await AsyncStorage.getItem(SYNC_LOG_KEY);
      this.syncLog = raw ? JSON.parse(raw) : [];
    } catch {
      this.syncLog = [];
    }
  }

  async getSyncLog() {
    if (this.syncLog.length === 0) await this._loadSyncLog();
    return this.syncLog;
  }

  // ═══════════ STORAGE HELPERS ═══════════

  async _loadQueue() {
    try {
      const raw = await AsyncStorage.getItem(OUTBOX_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  async _saveQueue(queue) {
    await AsyncStorage.setItem(OUTBOX_KEY, JSON.stringify(queue));
  }

  _notifyStatus() {
    if (this.onSyncStatusChange) {
      this.getStatus().then((status) => this.onSyncStatusChange(status));
    }
  }
}

export default new OfflineOutboxService();
