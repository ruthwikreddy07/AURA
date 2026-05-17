/**
 * Unit tests for OfflineOutboxService.
 * All AsyncStorage and NetInfo calls are mocked.
 */

// ── Mocks ──────────────────────────────────────────────────────────────────────
jest.mock('@react-native-async-storage/async-storage', () => {
  const store = {};
  return {
    getItem: jest.fn(async (key) => store[key] ?? null),
    setItem: jest.fn(async (key, value) => { store[key] = value; }),
    removeItem: jest.fn(async (key) => { delete store[key]; }),
    _store: store,
    _reset: () => { Object.keys(store).forEach(k => delete store[k]); },
  };
});

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()), // returns unsubscribe fn
  fetch: jest.fn().mockResolvedValue({ isConnected: false, isInternetReachable: false }),
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue('mock_token'),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import outbox from '../../src/services/OfflineOutboxService';

// ── Helpers ────────────────────────────────────────────────────────────────────

const makeEntry = (overrides = {}) => ({
  endpoint: '/transactions/create',
  method: 'POST',
  body: { token_id: 'tok_123', amount: 500 },
  ...overrides,
});

beforeEach(() => {
  AsyncStorage._reset();
  outbox.isSyncing = false;
  outbox.syncLog = [];
});

// ── Enqueue ────────────────────────────────────────────────────────────────────

describe('OfflineOutboxService - enqueue', () => {
  test('enqueues an item and assigns an id', async () => {
    const id = await outbox.enqueue(makeEntry());
    expect(typeof id).toBe('string');
    expect(id).toMatch(/^outbox_/);
  });

  test('persists item to AsyncStorage', async () => {
    await outbox.enqueue(makeEntry({ endpoint: '/wallet/fund' }));
    const queue = await outbox.getQueue();
    expect(queue.length).toBe(1);
    expect(queue[0].endpoint).toBe('/wallet/fund');
  });

  test('item starts with status "pending"', async () => {
    await outbox.enqueue(makeEntry());
    const queue = await outbox.getQueue();
    expect(queue[0].status).toBe('pending');
  });

  test('item starts with retries = 0', async () => {
    await outbox.enqueue(makeEntry());
    const queue = await outbox.getQueue();
    expect(queue[0].retries).toBe(0);
  });

  test('multiple enqueues stack correctly', async () => {
    await outbox.enqueue(makeEntry());
    await outbox.enqueue(makeEntry());
    await outbox.enqueue(makeEntry());
    const queue = await outbox.getQueue();
    expect(queue.length).toBe(3);
  });
});

// ── getStatus ─────────────────────────────────────────────────────────────────

describe('OfflineOutboxService - getStatus', () => {
  test('empty queue reports 0 pending', async () => {
    const status = await outbox.getStatus();
    expect(status.pending).toBe(0);
    expect(status.total).toBe(0);
  });

  test('pending count matches enqueued items', async () => {
    await outbox.enqueue(makeEntry());
    await outbox.enqueue(makeEntry());
    const status = await outbox.getStatus();
    expect(status.pending).toBe(2);
  });
});

// ── removeItem ────────────────────────────────────────────────────────────────

describe('OfflineOutboxService - removeItem', () => {
  test('removes item by id', async () => {
    const id = await outbox.enqueue(makeEntry());
    await outbox.removeItem(id);
    const queue = await outbox.getQueue();
    expect(queue.find(e => e.id === id)).toBeUndefined();
  });
});

// ── clearAll ──────────────────────────────────────────────────────────────────

describe('OfflineOutboxService - clearAll', () => {
  test('clears all items', async () => {
    await outbox.enqueue(makeEntry());
    await outbox.enqueue(makeEntry());
    await outbox.clearAll();
    const queue = await outbox.getQueue();
    expect(queue.length).toBe(0);
  });
});

// ── drainQueue ────────────────────────────────────────────────────────────────

describe('OfflineOutboxService - drainQueue with mock requestFn', () => {
  test('successful drain removes item from queue', async () => {
    await outbox.enqueue(makeEntry());
    const mockSubmit = jest.fn().mockResolvedValue({ success: true });
    await outbox.drainQueue(mockSubmit);
    const queue = await outbox.getQueue();
    expect(queue.length).toBe(0);
    expect(mockSubmit).toHaveBeenCalledTimes(1);
  });

  test('failed drain increments retries', async () => {
    await outbox.enqueue(makeEntry());
    const mockSubmit = jest.fn().mockRejectedValue(new Error('Network error'));
    await outbox.drainQueue(mockSubmit);
    const queue = await outbox.getQueue();
    expect(queue[0].retries).toBe(1);
    expect(queue[0].lastError).toBe('Network error');
  });

  test('does not re-drain if already syncing', async () => {
    outbox.isSyncing = true;
    const mockSubmit = jest.fn();
    await outbox.drainQueue(mockSubmit);
    expect(mockSubmit).not.toHaveBeenCalled();
    outbox.isSyncing = false;
  });
});
