/**
 * NFC Service — Near Field Communication tap-to-pay transfer
 *
 * Architecture:
 *  SENDER   → Writes encrypted payment packet as an NDEF record to NFC tag/peer
 *  RECEIVER → Reads NDEF record on tap → Parses encrypted packet → Submits to backend
 *
 * Uses react-native-nfc-manager for reading, and react-native-hce for writing (emulation).
 * NOTE: Requires Expo dev build (npx expo run:android). Will NOT work in Expo Go.
 */

import NfcManager, { NfcTech, Ndef } from "react-native-nfc-manager";
import { HCESession, NFCTagType4NDEFContentType, NFCTagType4 } from "react-native-hce";

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
   * Emulate an NFC tag containing the encrypted payment packet as an NDEF text record.
   * The sender acts as the HCE (Host Card Emulation) tag, and the receiver taps it.
   * 
   * @param {string} encryptedPacket - JSON string of encrypted payment data
   * @param {function} onProgress - callback with status: waiting, writing, sent, error
   * @returns {Promise<boolean>} success
   */
  async writePacket(encryptedPacket, onProgress = () => {}) {
    try {
      onProgress("waiting");

      // Stop any existing session
      if (this.hceSession) {
        await this.hceSession.setEnabled(false);
      }

      const tag = new NFCTagType4({
        type: NFCTagType4NDEFContentType.Text,
        content: encryptedPacket,
        writable: false
      });

      this.hceSession = await HCESession.getInstance();
      this.hceSession.setApplication(tag);
      await this.hceSession.setEnabled(true);

      onProgress("writing");

      // Listen for the tag being read by the receiver
      return new Promise((resolve) => {
        const removeListener = this.hceSession.on(HCESession.Events.HCE_STATE_READ, async () => {
          onProgress("sent");
          removeListener();
          await this.hceSession.setEnabled(false);
          this.hceSession = null;
          resolve(true);
        });
        
        // Timeout after 30 seconds
        setTimeout(async () => {
          removeListener();
          if (this.hceSession) {
             await this.hceSession.setEnabled(false);
             this.hceSession = null;
          }
          resolve(false);
        }, 30000);
      });
    } catch (e) {
      onProgress("error");
      console.warn("NFC HCE Write Error:", e.message);
      return false;
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
    try {
      if (this.hceSession) {
        this.hceSession.setEnabled(false);
        this.hceSession = null;
      }
    } catch (e) { }
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
