/**
 * LightService — Li-Fi Data-Over-Light Transfer (Manchester Pulse Protocol)
 *
 * Custom AURA Optical Protocol:
 *  1. DATA LAYER:     Encrypted packet string → binary bits
 *  2. ENCODING LAYER: Binary → Manchester-encoded pulse pattern (ON/OFF = transitions)
 *  3. TRANSMISSION:   Flashlight ON/OFF via camera torch API
 *  4. DECODING LAYER: Camera brightness analysis → detect transitions → reconstruct bits
 *  5. VALIDATION:     JSON parse + checksum (shared with SoundService)
 *
 * Manchester encoding: each bit is represented by a transition
 *   "0" = LOW→HIGH (OFF then ON)
 *   "1" = HIGH→LOW (ON then OFF)
 * This ensures clock recovery — the receiver can detect bit boundaries.
 *
 * Uses expo-camera for torch control (sender) and brightness detection (receiver).
 */

import { Camera } from "expo-camera";

// ═══════════ PROTOCOL CONSTANTS ═══════════
const BIT_HALF_PERIOD = 80;   // ms — each Manchester half-bit lasts 80ms
const BIT_PERIOD      = 160;  // ms — full bit period (2 × half)
const PREAMBLE_FLASHES = 8;   // 8 rapid flashes to signal start (40ms each)
const PREAMBLE_HALF    = 40;  // ms per preamble flash
const END_PAUSE        = 500; // ms — long OFF to signal end

class LightService {
  constructor() {
    this.isTransmitting = false;
    this.isListening = false;
    this.abortController = null;
  }

  // ═══════════ LAYER 1: DATA → BINARY ═══════════
  // (Reusing same encoding as SoundService for protocol consistency)

  stringToBits(str) {
    const bits = [];
    // 16-bit length header
    const len = str.length;
    for (let i = 15; i >= 0; i--) bits.push((len >> i) & 1);
    // 8-bit per character
    for (const char of str) {
      const code = char.charCodeAt(0);
      for (let i = 7; i >= 0; i--) bits.push((code >> i) & 1);
    }
    // 8-bit XOR checksum
    let checksum = 0;
    for (const char of str) checksum ^= char.charCodeAt(0);
    for (let i = 7; i >= 0; i--) bits.push((checksum >> i) & 1);
    return bits;
  }

  bitsToString(bits) {
    let len = 0;
    for (let i = 0; i < 16; i++) len = (len << 1) | bits[i];
    let result = "";
    for (let c = 0; c < len; c++) {
      let code = 0;
      const off = 16 + c * 8;
      for (let i = 0; i < 8; i++) code = (code << 1) | (bits[off + i] || 0);
      result += String.fromCharCode(code);
    }
    // Verify checksum
    const csOff = 16 + len * 8;
    let expected = 0;
    for (let i = 0; i < 8; i++) expected = (expected << 1) | (bits[csOff + i] || 0);
    let actual = 0;
    for (const ch of result) actual ^= ch.charCodeAt(0);
    if (expected !== actual) throw new Error("Checksum mismatch — light data corrupted");
    return result;
  }

  // ═══════════ LAYER 2 + 3: ENCODING + TRANSMISSION (SENDER) ═══════════

  /**
   * Transmit data as flashlight pulses using Manchester encoding
   * @param {string} data - Encrypted packet string
   * @param {object} cameraRef - Reference to expo-camera component (for torch control)
   * @param {function} onProgress - callback with { phase, bitIndex, totalBits }
   */
  async transmit(data, torchControl, onProgress = () => {}) {
    if (this.isTransmitting) throw new Error("Already transmitting");
    this.isTransmitting = true;
    this.abortController = { aborted: false };

    try {
      const bits = this.stringToBits(data);
      const totalBits = bits.length;

      onProgress({ phase: "encoding", bitIndex: 0, totalBits });

      // === PREAMBLE: rapid flashes to alert receiver ===
      onProgress({ phase: "preamble", bitIndex: 0, totalBits });
      for (let i = 0; i < PREAMBLE_FLASHES; i++) {
        if (this.abortController.aborted) return;
        torchControl(true);  // ON
        await this._sleep(PREAMBLE_HALF);
        torchControl(false); // OFF
        await this._sleep(PREAMBLE_HALF);
      }

      // Short pause after preamble
      await this._sleep(200);

      // === DATA: Manchester encoding ===
      onProgress({ phase: "transmitting", bitIndex: 0, totalBits });
      for (let i = 0; i < bits.length; i++) {
        if (this.abortController.aborted) return;

        if (bits[i] === 1) {
          // "1" = HIGH→LOW (ON first, then OFF)
          torchControl(true);
          await this._sleep(BIT_HALF_PERIOD);
          torchControl(false);
          await this._sleep(BIT_HALF_PERIOD);
        } else {
          // "0" = LOW→HIGH (OFF first, then ON)
          torchControl(false);
          await this._sleep(BIT_HALF_PERIOD);
          torchControl(true);
          await this._sleep(BIT_HALF_PERIOD);
        }

        // Progress every 8 bits
        if (i % 8 === 0) {
          onProgress({ phase: "transmitting", bitIndex: i, totalBits });
        }
      }

      // === END MARKER: long OFF ===
      torchControl(false);
      await this._sleep(END_PAUSE);

      onProgress({ phase: "complete", bitIndex: totalBits, totalBits });
      return true;
    } catch (error) {
      onProgress({ phase: "error", error: error.message });
      throw error;
    } finally {
      torchControl(false); // Always turn off
      this.isTransmitting = false;
    }
  }

  // ═══════════ LAYER 3 + 4: CAPTURE + DECODING (RECEIVER) ═══════════

  /**
   * The receiver uses the camera to detect brightness changes.
   * This method processes a series of brightness readings to decode Manchester bits.
   *
   * In practice, the camera preview frames are analyzed for average brightness.
   * The caller provides brightness samples at regular intervals.
   *
   * @param {number[]} brightnessSamples - Array of brightness values (0-255) sampled at ~10ms intervals
   * @returns {string} decoded data string
   */
  decodeBrightness(brightnessSamples) {
    if (!brightnessSamples || brightnessSamples.length < 100) {
      throw new Error("Insufficient brightness data");
    }

    // Step 1: Determine threshold (midpoint between min and max brightness)
    const sorted = [...brightnessSamples].sort((a, b) => a - b);
    const low = sorted[Math.floor(sorted.length * 0.1)];
    const high = sorted[Math.floor(sorted.length * 0.9)];
    const threshold = (low + high) / 2;

    // Step 2: Convert to binary signal (above threshold = 1, below = 0)
    const signal = brightnessSamples.map((b) => (b > threshold ? 1 : 0));

    // Step 3: Detect preamble (8 rapid transitions)
    let dataStart = this._findPreambleEnd(signal);
    if (dataStart === -1) throw new Error("No light preamble detected");

    // Step 4: Decode Manchester bits
    const samplesPer = Math.round(BIT_PERIOD / 10); // samples per full bit at 10ms sampling
    const samplesHalf = Math.round(BIT_HALF_PERIOD / 10);
    const bits = [];

    let pos = dataStart;
    while (pos + samplesPer <= signal.length) {
      // Average of first half
      const firstHalf = this._avgSlice(signal, pos, pos + samplesHalf);
      // Average of second half
      const secondHalf = this._avgSlice(signal, pos + samplesHalf, pos + samplesPer);

      // Check for end marker (long low)
      if (firstHalf < 0.3 && secondHalf < 0.3) break;

      // Manchester decode: HIGH→LOW = 1, LOW→HIGH = 0
      if (firstHalf > 0.5 && secondHalf < 0.5) {
        bits.push(1);
      } else if (firstHalf < 0.5 && secondHalf > 0.5) {
        bits.push(0);
      } else {
        // Ambiguous — skip (noise)
        bits.push(firstHalf > 0.5 ? 1 : 0);
      }

      pos += samplesPer;
    }

    // Step 5: Convert bits back to string
    return this.bitsToString(bits);
  }

  /**
   * Find the end of the preamble in a binary signal
   */
  _findPreambleEnd(signal) {
    const rapidWindow = Math.round(PREAMBLE_HALF / 10); // samples per preamble flash
    let transitionCount = 0;
    let lastState = signal[0];

    for (let i = 1; i < signal.length; i++) {
      if (signal[i] !== lastState) {
        transitionCount++;
        lastState = signal[i];

        // After detecting enough preamble transitions, look for the pause
        if (transitionCount >= PREAMBLE_FLASHES * 2 - 2) {
          // Find the pause after preamble (200ms of low signal)
          const pauseSamples = 20; // 200ms / 10ms
          for (let j = i; j < Math.min(i + 50, signal.length - pauseSamples); j++) {
            const pauseAvg = this._avgSlice(signal, j, j + pauseSamples);
            if (pauseAvg < 0.3) {
              return j + pauseSamples;
            }
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

  _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ═══════════ UTILITY ═══════════

  stopTransmitting() {
    if (this.abortController) this.abortController.aborted = true;
    this.isTransmitting = false;
  }

  stopListening() {
    this.isListening = false;
  }

  destroy() {
    this.stopTransmitting();
    this.stopListening();
  }
}

export default new LightService();
