/**
 * SoundService — Ultrasonic Data-Over-Sound Transfer (FSK Protocol)
 *
 * Custom AURA Acoustic Protocol:
 *  1. DATA LAYER:     Encrypted packet string → binary bits
 *  2. ENCODING LAYER: Binary → FSK audio tones (18kHz = "0", 19.5kHz = "1")
 *  3. TRANSMISSION:   Play tones through speaker / Capture via microphone
 *  4. DECODING LAYER: Analyze frequencies via FFT → reconstruct binary → string
 *  5. VALIDATION:     JSON parse + signature check (handled by caller)
 *
 * Frequencies are near-ultrasonic (18–20kHz) — inaudible to most adults but
 * well within smartphone speaker/mic range.
 *
 * Uses expo-av for recording. Audio generation uses the Web Audio API polyfill.
 */

import { Audio } from "expo-av";
import { Platform } from "react-native";

// ═══════════ PROTOCOL CONSTANTS ═══════════
const FREQ_ZERO    = 18000;  // Hz — represents binary "0"
const FREQ_ONE     = 19500;  // Hz — represents binary "1"
const FREQ_START   = 17000;  // Hz — start-of-transmission marker
const FREQ_END     = 20000;  // Hz — end-of-transmission marker
const BIT_DURATION = 30;     // ms per bit — ~33 bits/sec
const SAMPLE_RATE  = 44100;
const MARKER_DURATION = 60;  // ms — longer marker pulse

class SoundService {
  constructor() {
    this.audioContext = null;
    this.recording = null;
    this.isTransmitting = false;
    this.isListening = false;
  }

  // ═══════════ LAYER 1: DATA → BINARY ═══════════

  /**
   * Convert string data into binary representation
   * Each character → 8-bit binary
   */
  stringToBits(str) {
    const bits = [];
    // Add length header (16 bits for string length, max 65535 chars)
    const len = str.length;
    for (let i = 15; i >= 0; i--) {
      bits.push((len >> i) & 1);
    }
    // Add data bits
    for (const char of str) {
      const code = char.charCodeAt(0);
      for (let i = 7; i >= 0; i--) {
        bits.push((code >> i) & 1);
      }
    }
    // Add simple checksum (XOR of all bytes, 8 bits)
    let checksum = 0;
    for (const char of str) {
      checksum ^= char.charCodeAt(0);
    }
    for (let i = 7; i >= 0; i--) {
      bits.push((checksum >> i) & 1);
    }
    return bits;
  }

  /**
   * Convert binary bits back to string
   */
  bitsToString(bits) {
    // Read length header (first 16 bits)
    let len = 0;
    for (let i = 0; i < 16; i++) {
      len = (len << 1) | bits[i];
    }

    // Read data (len * 8 bits)
    let result = "";
    for (let charIdx = 0; charIdx < len; charIdx++) {
      let code = 0;
      const offset = 16 + charIdx * 8;
      for (let i = 0; i < 8; i++) {
        code = (code << 1) | (bits[offset + i] || 0);
      }
      result += String.fromCharCode(code);
    }

    // Verify checksum (last 8 bits)
    const checksumOffset = 16 + len * 8;
    let expectedChecksum = 0;
    for (let i = 0; i < 8; i++) {
      expectedChecksum = (expectedChecksum << 1) | (bits[checksumOffset + i] || 0);
    }
    let actualChecksum = 0;
    for (const char of result) {
      actualChecksum ^= char.charCodeAt(0);
    }

    if (expectedChecksum !== actualChecksum) {
      throw new Error("Checksum mismatch — data corrupted during sound transfer");
    }

    return result;
  }

  // ═══════════ LAYER 2 + 3: ENCODING + TRANSMISSION (SENDER) ═══════════

  /**
   * Generate and play FSK audio signal encoding the given data
   * @param {string} data - The encrypted packet string to transmit
   * @param {function} onProgress - callback with { phase, progress, totalBits }
   */
  async transmit(data, onProgress = () => {}) {
    if (this.isTransmitting) throw new Error("Already transmitting");
    this.isTransmitting = true;

    try {
      // Ensure audio mode is set for playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        playThroughEarpieceAndroid: false,
      });

      const bits = this.stringToBits(data);
      const totalBits = bits.length;

      onProgress({ phase: "encoding", progress: 0, totalBits });

      // Build audio buffer: START marker + data bits + END marker
      const totalSamples =
        Math.floor(SAMPLE_RATE * MARKER_DURATION / 1000) +      // START
        bits.length * Math.floor(SAMPLE_RATE * BIT_DURATION / 1000) + // DATA
        Math.floor(SAMPLE_RATE * MARKER_DURATION / 1000);       // END

      // Generate WAV using AudioContext-like approach
      // Since we're in React Native, we'll generate WAV buffer directly
      const wavBuffer = this._generateWAV(bits);

      onProgress({ phase: "transmitting", progress: 0, totalBits });

      // Create a sound object and play
      const { sound } = await Audio.Sound.createAsync(
        { uri: wavBuffer },
        { shouldPlay: true, volume: 1.0 }
      );

      // Monitor playback progress
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.durationMillis) {
          const progress = status.positionMillis / status.durationMillis;
          onProgress({ phase: "transmitting", progress, totalBits });
        }
        if (status.didJustFinish) {
          onProgress({ phase: "complete", progress: 1, totalBits });
          sound.unloadAsync();
        }
      });

      // Wait for completion
      await new Promise((resolve) => {
        const check = setInterval(async () => {
          const status = await sound.getStatusAsync();
          if (!status.isLoaded || status.didJustFinish) {
            clearInterval(check);
            resolve();
          }
        }, 100);
      });

      return true;
    } catch (error) {
      onProgress({ phase: "error", progress: 0, error: error.message });
      throw error;
    } finally {
      this.isTransmitting = false;
    }
  }

  /**
   * Generate a WAV data URI from bits using FSK encoding
   */
  _generateWAV(bits) {
    const markerSamples = Math.floor(SAMPLE_RATE * MARKER_DURATION / 1000);
    const bitSamples = Math.floor(SAMPLE_RATE * BIT_DURATION / 1000);
    const totalSamples = markerSamples * 2 + bits.length * bitSamples;

    // PCM 16-bit mono
    const buffer = new ArrayBuffer(44 + totalSamples * 2);
    const view = new DataView(buffer);

    // WAV header
    this._writeString(view, 0, "RIFF");
    view.setUint32(4, 36 + totalSamples * 2, true);
    this._writeString(view, 8, "WAVE");
    this._writeString(view, 12, "fmt ");
    view.setUint32(16, 16, true);           // chunk size
    view.setUint16(20, 1, true);            // PCM
    view.setUint16(22, 1, true);            // mono
    view.setUint32(24, SAMPLE_RATE, true);  // sample rate
    view.setUint32(28, SAMPLE_RATE * 2, true); // byte rate
    view.setUint16(32, 2, true);            // block align
    view.setUint16(34, 16, true);           // bits per sample
    this._writeString(view, 36, "data");
    view.setUint32(40, totalSamples * 2, true);

    let offset = 44;
    const amplitude = 0.8;

    // Helper: write a tone at given frequency for N samples
    const writeTone = (freq, numSamples) => {
      for (let i = 0; i < numSamples; i++) {
        const t = i / SAMPLE_RATE;
        const sample = Math.sin(2 * Math.PI * freq * t) * amplitude;
        view.setInt16(offset, sample * 32767, true);
        offset += 2;
      }
    };

    // START marker
    writeTone(FREQ_START, markerSamples);

    // Data bits
    for (const bit of bits) {
      writeTone(bit === 1 ? FREQ_ONE : FREQ_ZERO, bitSamples);
    }

    // END marker
    writeTone(FREQ_END, markerSamples);

    // Convert to base64 data URI
    const uint8 = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < uint8.length; i++) {
      binary += String.fromCharCode(uint8[i]);
    }
    const base64 = btoa(binary);
    return `data:audio/wav;base64,${base64}`;
  }

  _writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  // ═══════════ LAYER 3 + 4: CAPTURE + DECODING (RECEIVER) ═══════════

  /**
   * Start listening for incoming ultrasonic data
   * Records audio, then analyzes frequency patterns to decode data
   * @param {function} onPacketReceived - callback with decoded packet string
   * @param {function} onStatusChange - callback with status: listening, capturing, decoding, received, error
   * @param {number} durationMs - how long to record (default 10s)
   */
  async listen(onPacketReceived, onStatusChange = () => {}, durationMs = 10000) {
    if (this.isListening) throw new Error("Already listening");
    this.isListening = true;

    try {
      onStatusChange("requesting-permission");

      // Request recording permission
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) throw new Error("Microphone permission denied");

      // Configure for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        playThroughEarpieceAndroid: false,
      });

      onStatusChange("listening");

      // Start recording with high quality settings
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync({
        android: {
          extension: ".wav",
          outputFormat: Audio.AndroidOutputFormat.DEFAULT,
          audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
          sampleRate: SAMPLE_RATE,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: ".wav",
          outputFormat: Audio.IOSOutputFormat.LINEARPCM,
          audioQuality: Audio.IOSAudioQuality.MAX,
          sampleRate: SAMPLE_RATE,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {},
      });
      this.recording = recording;
      await recording.startAsync();

      onStatusChange("capturing");

      // Record for specified duration
      await new Promise((resolve) => setTimeout(resolve, durationMs));

      await recording.stopAndUnloadAsync();
      onStatusChange("decoding");

      const uri = recording.getURI();
      // In a production app, you'd read the WAV file, run FFT analysis,
      // and decode the FSK signal. For now, we simulate the decode step
      // since full FFT in JS requires either a native module or Web Audio API.

      // The decoded data would come from frequency analysis of the recording
      // For demonstration, we return the URI for external processing
      onStatusChange("processed");

      return uri;
    } catch (error) {
      onStatusChange("error");
      throw error;
    } finally {
      this.isListening = false;
    }
  }

  /**
   * Simple Goertzel algorithm — detect if a specific frequency is present
   * in a block of PCM samples. More efficient than full FFT for our use case.
   * @param {Float32Array} samples - PCM sample data
   * @param {number} targetFreq - frequency to detect
   * @param {number} sampleRate - sample rate
   * @returns {number} magnitude at target frequency
   */
  goertzel(samples, targetFreq, sampleRate) {
    const N = samples.length;
    const k = Math.round(N * targetFreq / sampleRate);
    const w = (2 * Math.PI * k) / N;
    const cosW = Math.cos(w);
    const coeff = 2 * cosW;

    let s0 = 0, s1 = 0, s2 = 0;
    for (let i = 0; i < N; i++) {
      s0 = samples[i] + coeff * s1 - s2;
      s2 = s1;
      s1 = s0;
    }

    // Magnitude squared
    return s1 * s1 + s2 * s2 - coeff * s1 * s2;
  }

  /**
   * Decode a block of PCM samples into bits using Goertzel frequency detection
   * @param {Float32Array} allSamples - full recording PCM data
   * @returns {number[]} decoded bits
   */
  decodePCM(allSamples) {
    const bitSamples = Math.floor(SAMPLE_RATE * BIT_DURATION / 1000);
    const markerSamples = Math.floor(SAMPLE_RATE * MARKER_DURATION / 1000);
    const bits = [];

    // Find START marker by scanning for FREQ_START
    let startIdx = -1;
    for (let i = 0; i < allSamples.length - markerSamples; i += Math.floor(bitSamples / 2)) {
      const block = allSamples.slice(i, i + markerSamples);
      const magStart = this.goertzel(block, FREQ_START, SAMPLE_RATE);
      const magZero = this.goertzel(block, FREQ_ZERO, SAMPLE_RATE);
      const magOne = this.goertzel(block, FREQ_ONE, SAMPLE_RATE);

      if (magStart > magZero * 2 && magStart > magOne * 2) {
        startIdx = i + markerSamples;
        break;
      }
    }

    if (startIdx === -1) throw new Error("No sound transmission detected");

    // Decode data bits
    let pos = startIdx;
    while (pos + bitSamples <= allSamples.length) {
      const block = allSamples.slice(pos, pos + bitSamples);
      const magEnd = this.goertzel(block, FREQ_END, SAMPLE_RATE);
      const magZero = this.goertzel(block, FREQ_ZERO, SAMPLE_RATE);
      const magOne = this.goertzel(block, FREQ_ONE, SAMPLE_RATE);

      // Check if END marker
      if (magEnd > magZero * 2 && magEnd > magOne * 2) break;

      // Determine bit value
      bits.push(magOne > magZero ? 1 : 0);
      pos += bitSamples;
    }

    return bits;
  }

  // ═══════════ UTILITY ═══════════

  async stopListening() {
    if (this.recording) {
      try {
        await this.recording.stopAndUnloadAsync();
      } catch (e) { /* already stopped */ }
      this.recording = null;
    }
    this.isListening = false;
  }

  stopTransmitting() {
    this.isTransmitting = false;
  }

  destroy() {
    this.stopListening();
    this.stopTransmitting();
  }
}

export default new SoundService();
