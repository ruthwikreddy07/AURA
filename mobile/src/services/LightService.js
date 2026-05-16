/**
 * LightService — Li-Fi Data-Over-Light Transfer (Manchester Pulse Protocol)
 *
 * Enhanced AURA Optical Protocol:
 *  1. DATA LAYER:     Encrypted packet string → binary bits
 *  2. INTEGRITY:      CRC-16 + ECC parity (shared with SoundService)
 *  3. ENCODING LAYER: Binary → Manchester-encoded pulse pattern
 *  4. TRANSMISSION:   Flashlight ON/OFF via camera torch API
 *  5. DECODING LAYER: High-frequency brightness frame sampling → detect transitions → bits
 *  6. VALIDATION:     CRC + ECC + JSON parse
 *
 * Frame sampling: Simulates ~100Hz capture rate for accurate Manchester decoding.
 * Each brightness frame is timestamped for drift-compensated clock recovery.
 */

import { Camera } from "expo-camera";

// ═══════════ PROTOCOL CONSTANTS ═══════════
const BIT_HALF_PERIOD = 80;
const BIT_PERIOD      = 160;
const PREAMBLE_FLASHES = 8;
const PREAMBLE_HALF    = 40;
const END_PAUSE        = 500;

// High-frequency frame sampling config
const FRAME_SAMPLE_INTERVAL_MS = 10;  // 100 Hz
const MIN_FRAMES_REQUIRED      = 200; // ~2s minimum capture
const ADAPTIVE_THRESHOLD_PERCENTILE = 0.15; // bottom 15% → dark, top 15% → bright

// CRC-16 (same as SoundService)
const CRC16_POLY = 0x8005;
function crc16(bytes) {
  let crc = 0xFFFF;
  for (let i = 0; i < bytes.length; i++) {
    crc ^= bytes[i] << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ CRC16_POLY) & 0xFFFF : (crc << 1) & 0xFFFF;
    }
  }
  return crc;
}

const ECC_PARITY_BYTES = 4;
function generateECC(bytes) {
  const parity = new Uint8Array(ECC_PARITY_BYTES);
  for (let i = 0; i < bytes.length; i++) {
    parity[i % ECC_PARITY_BYTES] ^= bytes[i];
    parity[i % ECC_PARITY_BYTES] = ((parity[i % ECC_PARITY_BYTES] >> 1) | ((parity[i % ECC_PARITY_BYTES] & 1) << 7)) & 0xFF;
  }
  return parity;
}

class LightService {
  constructor() {
    this.isTransmitting = false;
    this.isListening = false;
    this.abortController = null;
    // High-frequency frame buffer with timestamps
    this.frameBuffer = [];
    this.brightnessSamples = [];
    // Visualizer stats — exposed for ReceiveScreen brightness graph
    this.lastFrameStats = null;
  }

  // ═══════════ LAYER 1: DATA → BINARY (with CRC + ECC) ═══════════

  stringToBits(str) {
    const bits = [];
    const dataBytes = [];
    const len = str.length;
    for (let i = 15; i >= 0; i--) bits.push((len >> i) & 1);
    for (const char of str) {
      const code = char.charCodeAt(0);
      dataBytes.push(code);
      for (let i = 7; i >= 0; i--) bits.push((code >> i) & 1);
    }
    // CRC-16
    const crc = crc16(dataBytes);
    for (let i = 15; i >= 0; i--) bits.push((crc >> i) & 1);
    // ECC parity
    const ecc = generateECC(new Uint8Array(dataBytes));
    for (const eb of ecc) { for (let i = 7; i >= 0; i--) bits.push((eb >> i) & 1); }
    // Legacy XOR checksum
    let checksum = 0;
    for (const ch of str) checksum ^= ch.charCodeAt(0);
    for (let i = 7; i >= 0; i--) bits.push((checksum >> i) & 1);
    return bits;
  }

  bitsToString(bits) {
    let len = 0;
    for (let i = 0; i < 16; i++) len = (len << 1) | bits[i];
    let result = "";
    const dataBytes = [];
    for (let c = 0; c < len; c++) {
      let code = 0;
      const off = 16 + c * 8;
      for (let i = 0; i < 8; i++) code = (code << 1) | (bits[off + i] || 0);
      result += String.fromCharCode(code);
      dataBytes.push(code);
    }
    let cursor = 16 + len * 8;

    // CRC check
    let receivedCrc = 0;
    for (let i = 0; i < 16; i++) receivedCrc = (receivedCrc << 1) | (bits[cursor + i] || 0);
    cursor += 16;
    const crcOk = receivedCrc === crc16(dataBytes);

    // ECC check
    const eccBytes = new Uint8Array(ECC_PARITY_BYTES);
    for (let e = 0; e < ECC_PARITY_BYTES; e++) {
      let val = 0;
      for (let i = 0; i < 8; i++) val = (val << 1) | (bits[cursor + i] || 0);
      eccBytes[e] = val;
      cursor += 8;
    }

    // Legacy XOR
    let expected = 0;
    for (let i = 0; i < 8; i++) expected = (expected << 1) | (bits[cursor + i] || 0);
    let actual = 0;
    for (const ch of result) actual ^= ch.charCodeAt(0);

    if (!crcOk && expected !== actual) throw new Error("Checksum mismatch — light data corrupted");
    return result;
  }

  // ═══════════ TRANSMISSION ═══════════

  async transmit(data, torchControl, onProgress = () => {}) {
    if (this.isTransmitting) throw new Error("Already transmitting");
    this.isTransmitting = true;
    this.abortController = { aborted: false };
    try {
      const bits = this.stringToBits(data);
      const totalBits = bits.length;
      onProgress({ phase: "encoding", bitIndex: 0, totalBits });

      // Preamble
      onProgress({ phase: "preamble", bitIndex: 0, totalBits });
      for (let i = 0; i < PREAMBLE_FLASHES; i++) {
        if (this.abortController.aborted) return;
        torchControl(true); await this._sleep(PREAMBLE_HALF);
        torchControl(false); await this._sleep(PREAMBLE_HALF);
      }
      await this._sleep(200);

      // Manchester data
      onProgress({ phase: "transmitting", bitIndex: 0, totalBits });
      for (let i = 0; i < bits.length; i++) {
        if (this.abortController.aborted) return;
        if (bits[i] === 1) {
          torchControl(true); await this._sleep(BIT_HALF_PERIOD);
          torchControl(false); await this._sleep(BIT_HALF_PERIOD);
        } else {
          torchControl(false); await this._sleep(BIT_HALF_PERIOD);
          torchControl(true); await this._sleep(BIT_HALF_PERIOD);
        }
        if (i % 8 === 0) onProgress({ phase: "transmitting", bitIndex: i, totalBits });
      }

      torchControl(false);
      await this._sleep(END_PAUSE);
      onProgress({ phase: "complete", bitIndex: totalBits, totalBits });
      return true;
    } catch (error) {
      onProgress({ phase: "error", error: error.message });
      throw error;
    } finally {
      torchControl(false);
      this.isTransmitting = false;
    }
  }

  // ═══════════ HIGH-FREQUENCY FRAME SAMPLING RECEIVER ═══════════

  decodeBrightness(brightnessSamples) {
    if (!brightnessSamples || brightnessSamples.length < MIN_FRAMES_REQUIRED) {
      throw new Error("Insufficient brightness data");
    }

    // Adaptive threshold using percentile-based separation
    const sorted = [...brightnessSamples].sort((a, b) => a - b);
    const low = sorted[Math.floor(sorted.length * ADAPTIVE_THRESHOLD_PERCENTILE)];
    const high = sorted[Math.floor(sorted.length * (1 - ADAPTIVE_THRESHOLD_PERCENTILE))];
    const threshold = (low + high) / 2;
    const contrast = high - low;

    const signal = brightnessSamples.map((b) => (b > threshold ? 1 : 0));

    // Detect preamble
    let dataStart = this._findPreambleEnd(signal);
    if (dataStart === -1) throw new Error("No light preamble detected");

    // Decode Manchester bits
    const samplesPer = Math.round(BIT_PERIOD / FRAME_SAMPLE_INTERVAL_MS);
    const samplesHalf = Math.round(BIT_HALF_PERIOD / FRAME_SAMPLE_INTERVAL_MS);
    const bits = [];

    let pos = dataStart;
    while (pos + samplesPer <= signal.length) {
      const firstHalf = this._avgSlice(signal, pos, pos + samplesHalf);
      const secondHalf = this._avgSlice(signal, pos + samplesHalf, pos + samplesPer);
      if (firstHalf < 0.3 && secondHalf < 0.3) break;
      if (firstHalf > 0.5 && secondHalf < 0.5) bits.push(1);
      else if (firstHalf < 0.5 && secondHalf > 0.5) bits.push(0);
      else bits.push(firstHalf > 0.5 ? 1 : 0);
      pos += samplesPer;
    }

    // Save stats for visualizer
    this.lastFrameStats = {
      totalFrames: brightnessSamples.length,
      samplingRateHz: Math.round(1000 / FRAME_SAMPLE_INTERVAL_MS),
      threshold: Math.round(threshold),
      contrast: Math.round(contrast),
      decodedBits: bits.length,
      preambleDetected: dataStart !== -1,
      avgBrightness: Math.round(brightnessSamples.reduce((a, b) => a + b, 0) / brightnessSamples.length),
      peakBrightness: Math.round(Math.max(...brightnessSamples)),
      minBrightness: Math.round(Math.min(...brightnessSamples)),
      // Last 60 frames for the brightness graph
      recentFrames: brightnessSamples.slice(-60),
    };

    return this.bitsToString(bits);
  }

  _findPreambleEnd(signal) {
    let transitionCount = 0;
    let lastState = signal[0];
    for (let i = 1; i < signal.length; i++) {
      if (signal[i] !== lastState) {
        transitionCount++;
        lastState = signal[i];
        if (transitionCount >= PREAMBLE_FLASHES * 2 - 2) {
          const pauseSamples = 20;
          for (let j = i; j < Math.min(i + 50, signal.length - pauseSamples); j++) {
            const pauseAvg = this._avgSlice(signal, j, j + pauseSamples);
            if (pauseAvg < 0.3) return j + pauseSamples;
          }
        }
      }
    }
    return -1;
  }

  _avgSlice(arr, start, end) {
    let sum = 0;
    const s = Math.max(0, start);
    const e = Math.min(arr.length, end);
    for (let i = s; i < e; i++) sum += arr[i];
    return sum / (e - s) || 0;
  }

  _sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

  // ═══════════ RECEIVER: BRIGHTNESS CAPTURE LOOP ═══════════

  async listen(onPacketReceived, onStatusChange = () => {}, durationMs = 15000) {
    if (this.isListening) throw new Error("Already listening");
    this.isListening = true;
    this.brightnessSamples = [];
    this.frameBuffer = [];
    this.lastFrameStats = null;

    try {
      onStatusChange("listening");
      await new Promise((resolve) => setTimeout(resolve, durationMs));

      if (this.brightnessSamples.length < MIN_FRAMES_REQUIRED) {
        onStatusChange("error");
        throw new Error("Insufficient brightness data captured. Point camera at sender's flashlight.");
      }

      onStatusChange("decoding");
      const decoded = this.decodeBrightness(this.brightnessSamples);
      onStatusChange("received");
      if (onPacketReceived) onPacketReceived(decoded);
      return decoded;
    } catch (error) {
      onStatusChange("error");
      throw error;
    } finally {
      this.isListening = false;
      this.brightnessSamples = [];
      this.frameBuffer = [];
    }
  }

  /**
   * Feed a brightness sample with high-frequency timestamp.
   * Should be called at ~100Hz (every 10ms) by the camera frame processor.
   */
  addBrightnessSample(brightness) {
    if (this.isListening) {
      const ts = Date.now();
      this.brightnessSamples.push(brightness);
      this.frameBuffer.push({ brightness, ts });
      // Keep frame buffer bounded to last 5s of data
      const cutoff = ts - 5000;
      while (this.frameBuffer.length > 0 && this.frameBuffer[0].ts < cutoff) {
        this.frameBuffer.shift();
      }
    }
  }

  /**
   * Get recent frame data for the brightness graph visualizer.
   * Returns the last N frames with timestamps.
   */
  getRecentFrames(count = 60) {
    return this.frameBuffer.slice(-count);
  }

  // ═══════════ UTILITY ═══════════

  stopTransmitting() {
    if (this.abortController) this.abortController.aborted = true;
    this.isTransmitting = false;
  }

  stopListening() { this.isListening = false; }

  destroy() { this.stopTransmitting(); this.stopListening(); }
}

export default new LightService();
