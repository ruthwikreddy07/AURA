/**
 * NFC Service — Near Field Communication tap-to-pay transfer
 *
 * Architecture:
 *  SENDER   → Writes encrypted payment packet as an NDEF record to NFC tag/peer
 *  RECEIVER → Reads NDEF record on tap → Parses encrypted packet → Submits to backend
 *
 * Uses react-native-nfc-manager.
 * NOTE: Requires Expo dev build (npx expo run:android). Will NOT work in Expo Go.
 */

import NfcManager, { NfcTech, Ndef } from "react-native-nfc-manager";

class NFCService {
  constructor() {
    this.isSupported = false;
    this.isEnabled = false;
  }

  /* ═══════════ INIT ═══════════ */

  async init() {
    try {
      this.isSupported = await NfcManager.isSupported();
      if (this.isSupported) {
        await NfcManager.start();
        this.isEnabled = await NfcManager.isEnabled();
      }
      return { supported: this.isSupported, enabled: this.isEnabled };
    } catch (e) {
      console.warn("NFC Init Error:", e.message);
      return { supported: false, enabled: false };
    }
  }

  /* ═══════════ SENDER: WRITE NDEF ═══════════ */

  /**
   * Write an encrypted payment packet as an NDEF text record.
   * The sender taps their phone to the receiver's phone or an NFC tag.
   * 
   * @param {string} encryptedPacket - JSON string of encrypted payment data
   * @param {function} onProgress - callback with status: waiting, writing, sent, error
   * @returns {Promise<boolean>} success
   */
  async writePacket(encryptedPacket, onProgress = () => {}) {
    try {
      onProgress("waiting");

      // Request NFC technology
      await NfcManager.requestTechnology(NfcTech.Ndef);

      onProgress("writing");

      // Encode packet as NDEF text record
      const bytes = Ndef.encodeMessage([
        Ndef.textRecord(encryptedPacket, "en"),
      ]);

      // Write to the NFC tag/peer
      await NfcManager.ndefHandler.writeNdefMessage(bytes);

      onProgress("sent");
      return true;
    } catch (e) {
      onProgress("error");
      console.warn("NFC Write Error:", e.message);
      return false;
    } finally {
      this.cancelRequest();
    }
  }

  /* ═══════════ RECEIVER: READ NDEF ═══════════ */

  /**
   * Listen for an NFC tap and read the NDEF payload.
   * 
   * @param {function} onPacketReceived - callback with the decrypted packet string
   * @param {function} onStatusChange - callback with status: listening, reading, received, error
   */
  async readPacket(onPacketReceived, onStatusChange = () => {}) {
    try {
      onStatusChange("listening");

      // Request NDEF technology — this blocks until a tag/peer is tapped
      await NfcManager.requestTechnology(NfcTech.Ndef);

      onStatusChange("reading");

      // Read the NDEF tag
      const tag = await NfcManager.getTag();

      if (tag?.ndefMessage && tag.ndefMessage.length > 0) {
        // Decode the first NDEF record
        const record = tag.ndefMessage[0];
        const payload = Ndef.text.decodePayload(new Uint8Array(record.payload));

        onStatusChange("received");
        onPacketReceived(payload);
        return payload;
      } else {
        throw new Error("No NDEF message found on tag");
      }
    } catch (e) {
      onStatusChange("error");
      console.warn("NFC Read Error:", e.message);
      return null;
    } finally {
      this.cancelRequest();
    }
  }

  /* ═══════════ UTILITY ═══════════ */

  cancelRequest() {
    try {
      NfcManager.cancelTechnologyRequest();
    } catch (e) {
      // Already cancelled
    }
  }

  async goToSettings() {
    return NfcManager.goToNfcSetting();
  }

  destroy() {
    this.cancelRequest();
  }
}

// Singleton instance
export default new NFCService();
