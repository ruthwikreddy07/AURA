/**
 * BLE Service — Bluetooth Low Energy peer-to-peer payment transfer
 *
 * Architecture:
 *  SENDER   → Scans for nearby AURA receivers → Connects → Writes encrypted packet as characteristic
 *  RECEIVER → Advertises as GATT peripheral → Listens for incoming writes → Parses packet
 *
 * Uses react-native-ble-plx for both scanning and advertising.
 * NOTE: Requires Expo dev build (npx expo run:android). Will NOT work in Expo Go.
 */

import { BleManager } from "react-native-ble-plx";
import { Platform, PermissionsAndroid } from "react-native";
import { Buffer } from "buffer";

// AURA BLE Protocol Constants
const AURA_SERVICE_UUID = "aura0001-0000-1000-8000-00805f9b34fb";
const AURA_CHAR_PACKET_UUID = "aura0002-0000-1000-8000-00805f9b34fb";
const AURA_CHAR_STATUS_UUID = "aura0003-0000-1000-8000-00805f9b34fb";
const AURA_DEVICE_PREFIX = "AURA-PAY";

class BLEService {
  constructor() {
    this.manager = new BleManager();
    this.connectedDevice = null;
    this.isScanning = false;
  }

  /* ═══════════ PERMISSIONS ═══════════ */
  async requestPermissions() {
    if (Platform.OS === "android") {
      const apiLevel = Platform.Version;
      if (apiLevel >= 31) {
        const result = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
        return Object.values(result).every((v) => v === "granted");
      } else {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
    }
    return true; // iOS handles permissions via Info.plist
  }

  /* ═══════════ SENDER: SCAN & SEND ═══════════ */

  /**
   * Scan for nearby AURA receiver devices
   * @param {function} onDeviceFound - callback with { id, name, rssi }
   * @param {number} timeoutMs - scanning timeout in ms (default 10s)
   */
  scanForReceivers(onDeviceFound, timeoutMs = 10000) {
    this.isScanning = true;

    this.manager.startDeviceScan(null, { allowDuplicates: false }, (error, device) => {
      if (error) {
        console.warn("BLE Scan Error:", error.message);
        return;
      }

      if (device?.name?.startsWith(AURA_DEVICE_PREFIX)) {
        onDeviceFound({
          id: device.id,
          name: device.name,
          rssi: device.rssi,
        });
      }
    });

    // Auto-stop after timeout
    setTimeout(() => this.stopScan(), timeoutMs);
  }

  stopScan() {
    if (this.isScanning) {
      this.manager.stopDeviceScan();
      this.isScanning = false;
    }
  }

  /**
   * Connect to a receiver device and send encrypted payment packet
   * @param {string} deviceId - BLE device ID from scan
   * @param {string} encryptedPacket - JSON string of encrypted payment data
   * @param {function} onProgress - callback with status: connecting, writing, sent, error
   */
  async sendPacket(deviceId, encryptedPacket, onProgress = () => {}) {
    try {
      onProgress("connecting");
      this.stopScan();

      // Connect
      const device = await this.manager.connectToDevice(deviceId, {
        requestMTU: 512, // Request larger MTU for bigger payloads
      });
      this.connectedDevice = device;

      onProgress("discovering");
      // Discover services
      await device.discoverAllServicesAndCharacteristics();

      onProgress("writing");
      // Write the encrypted packet as a characteristic value
      const base64Packet = Buffer.from(encryptedPacket, "utf-8").toString("base64");
      
      await device.writeCharacteristicWithResponseForService(
        AURA_SERVICE_UUID,
        AURA_CHAR_PACKET_UUID,
        base64Packet
      );

      // Read status back from receiver
      const statusChar = await device.readCharacteristicForService(
        AURA_SERVICE_UUID,
        AURA_CHAR_STATUS_UUID
      );
      const statusValue = Buffer.from(statusChar.value, "base64").toString("utf-8");

      onProgress("sent");
      return { success: statusValue === "ACK", status: statusValue };
    } catch (error) {
      onProgress("error");
      throw new Error(`BLE Send Error: ${error.message}`);
    } finally {
      await this.disconnect();
    }
  }

  /* ═══════════ RECEIVER: ADVERTISE & LISTEN ═══════════ */

  /**
   * Start advertising as an AURA receiver and listen for incoming packets.
   * 
   * NOTE: Full BLE peripheral mode (GATT server) requires native module setup.
   * This implementation handles the scanning/discovery side.
   * For production, you would use a native GATT server plugin.
   * 
   * @param {function} onPacketReceived - callback with the received encrypted packet string
   * @param {function} onStatusChange - callback with status: advertising, connected, receiving
   */
  async startReceiving(onPacketReceived, onStatusChange = () => {}) {
    onStatusChange("advertising");

    // In a real implementation, this would start a GATT server.
    // For demo purposes, we use a monitor approach:
    // The sender writes to a known characteristic, and we poll for it.
    
    // Start scanning for senders who are looking for us
    this.manager.startDeviceScan(null, { allowDuplicates: false }, async (error, device) => {
      if (error) return;

      if (device?.name?.startsWith(AURA_DEVICE_PREFIX + "-SEND")) {
        this.stopScan();
        onStatusChange("connected");

        try {
          const connectedDevice = await this.manager.connectToDevice(device.id);
          await connectedDevice.discoverAllServicesAndCharacteristics();

          onStatusChange("receiving");

          // Monitor characteristic for incoming writes
          connectedDevice.monitorCharacteristicForService(
            AURA_SERVICE_UUID,
            AURA_CHAR_PACKET_UUID,
            (err, characteristic) => {
              if (err) {
                console.warn("BLE Monitor Error:", err.message);
                return;
              }
              if (characteristic?.value) {
                const packet = Buffer.from(characteristic.value, "base64").toString("utf-8");
                onPacketReceived(packet);
              }
            }
          );
        } catch (e) {
          onStatusChange("error");
        }
      }
    });
  }

  stopReceiving() {
    this.stopScan();
    this.disconnect();
  }

  /* ═══════════ UTILITY ═══════════ */

  async disconnect() {
    if (this.connectedDevice) {
      try {
        await this.connectedDevice.cancelConnection();
      } catch (e) {
        // Already disconnected
      }
      this.connectedDevice = null;
    }
  }

  destroy() {
    this.stopScan();
    this.disconnect();
    this.manager.destroy();
  }
}

// Singleton instance
export default new BLEService();
