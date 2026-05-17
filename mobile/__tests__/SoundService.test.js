/**
 * Unit tests for SoundService — FSK protocol pure logic.
 * We test the data layer (stringToBits / bitsToString) without
 * any native audio APIs (expo-av is auto-mocked by jest-expo).
 */

// Mock expo-av so no native code is called
jest.mock('expo-av', () => ({
  Audio: {
    Sound: { createAsync: jest.fn() },
    Recording: jest.fn(),
    setAudioModeAsync: jest.fn(),
    requestPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
    AndroidOutputFormat: { DEFAULT: 0 },
    AndroidAudioEncoder: { DEFAULT: 0 },
    IOSOutputFormat: { LINEARPCM: 'lpcm' },
    IOSAudioQuality: { MAX: 127 },
  },
}));

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

// Import the class internals via the module
// SoundService exports a singleton, so we import it then access internal methods
import soundService from '../../src/services/SoundService';

// ── stringToBits / bitsToString roundtrip ─────────────────────────────────────

describe('SoundService - FSK Data Layer', () => {
  test('stringToBits returns an array of 0s and 1s', () => {
    const bits = soundService.stringToBits('hello');
    expect(Array.isArray(bits)).toBe(true);
    bits.forEach(bit => expect([0, 1]).toContain(bit));
  });

  test('bitsToString correctly recovers original string (roundtrip)', () => {
    const original = 'hello';
    const bits = soundService.stringToBits(original);
    const recovered = soundService.bitsToString(bits);
    expect(recovered).toBe(original);
  });

  test('roundtrip works for a JSON payment packet', () => {
    const packet = JSON.stringify({
      tokenId: 'abc-123',
      amount: 500,
      sender: 'user_a',
      receiver: 'user_b',
      ts: Date.now(),
    });
    const bits = soundService.stringToBits(packet);
    const recovered = soundService.bitsToString(bits);
    expect(recovered).toBe(packet);
  });

  test('roundtrip works for empty string', () => {
    const bits = soundService.stringToBits('');
    const recovered = soundService.bitsToString(bits);
    expect(recovered).toBe('');
  });

  test('bit length scales with string length', () => {
    const short = soundService.stringToBits('hi');
    const long = soundService.stringToBits('hello world!');
    expect(long.length).toBeGreaterThan(short.length);
  });
});

// ── Goertzel Algorithm ─────────────────────────────────────────────────────────

describe('SoundService - Goertzel Detector', () => {
  test('detects 18000 Hz tone in synthetic signal', () => {
    const SAMPLE_RATE = 44100;
    const TARGET_FREQ = 18000;
    const N = 512;
    const samples = new Float32Array(N);
    // Generate a pure sine wave at TARGET_FREQ
    for (let i = 0; i < N; i++) {
      samples[i] = Math.sin(2 * Math.PI * TARGET_FREQ * i / SAMPLE_RATE);
    }
    const mag18k = soundService.goertzel(samples, 18000, SAMPLE_RATE);
    const mag19k = soundService.goertzel(samples, 19500, SAMPLE_RATE);
    // 18k tone should be significantly stronger
    expect(mag18k).toBeGreaterThan(mag19k * 5);
  });

  test('detects 19500 Hz tone in synthetic signal', () => {
    const SAMPLE_RATE = 44100;
    const N = 512;
    const samples = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      samples[i] = Math.sin(2 * Math.PI * 19500 * i / SAMPLE_RATE);
    }
    const mag19k = soundService.goertzel(samples, 19500, SAMPLE_RATE);
    const mag18k = soundService.goertzel(samples, 18000, SAMPLE_RATE);
    expect(mag19k).toBeGreaterThan(mag18k * 5);
  });
});

// ── State Management ────────────────────────────────────────────────────────────

describe('SoundService - State', () => {
  test('isTransmitting starts false', () => {
    expect(soundService.isTransmitting).toBe(false);
  });

  test('isListening starts false', () => {
    expect(soundService.isListening).toBe(false);
  });

  test('stopTransmitting sets isTransmitting to false', () => {
    soundService.isTransmitting = true;
    soundService.stopTransmitting();
    expect(soundService.isTransmitting).toBe(false);
  });
});
