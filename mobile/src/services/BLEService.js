/**
 * BLE Service — Bluetooth Low Energy peer-to-peer payment transfer
 *
 * Architecture:
 *  SENDER   → Scans for nearby AURA receivers → Connects → Writes encrypted packet as characteristic
 *  RECEIVER → Advertises as GATT peripheral → Listens for incoming writes → Parses packet
 *
 * Uses react-native-ble-plx for scanning (Sender).
 * Uses react-native-ble-peripheral-manager for GATT server (Receiver).
 * NOTE: Requires Expo dev build (npx expo run:android). Will NOT work in Expo Go.
 */

import { Platform, PermissionsAndroid } from "react-native";
import { Buffer } from "buffer";

// AURA BLE Protocol Constants
const AURA_SERVICE_UUID = "12345678-0001-1000-8000-00805F9B34FB";
const AURA_CHAR_PACKET_UUID = "12345678-0002-1000-8000-00805F9B34FB";
const AURA_CHAR_STATUS_UUID = "12345678-0003-1000-8000-00805F9B34FB";
const AURA_DEVICE_PREFIX = "AURA-PAY";

class BLEService {
  constructor() {
    this.connectedDevice = null;
    this.isScanning = false;
    this.isAdvertising = false;
    this.writeSub = null;
    this.stateSub = null;
    
    // Prevent Web crashes: BLE PLX relies on NativeModules which are undefined in standard browsers
    if (Platform.OS !== "web") {
      const { BleManager } = require("react-native-ble-plx");
      this.manager = new BleManager();
      this.blePeripheral = require("react-native-ble-peripheral-manager");
    } else {
      this.manager = null;
      this.blePeripheral = null;
    }
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
    if (!this.manager) {
      console.warn("BLE Scan Error: Bluetooth is not supported on the web platform.");
      return;
    }

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

      // Try to read ACK from receiver (optional — not all peripherals expose this)
      let statusValue = 'ACK';
      try {
        const statusChar = await device.readCharacteristicForService(
          AURA_SERVICE_UUID,
          AURA_CHAR_STATUS_UUID
        );
        statusValue = Buffer.from(statusChar.value, 'base64').toString('utf-8');
      } catch (e) {
        // ACK read failed — assume success if write succeeded
        console.warn('BLE ACK read skipped:', e.message);
      }

      onProgress("sent");
      return { success: true, status: statusValue };
    } catch (error) {
      onProgress("error");
      throw new Error(`BLE Send Error: ${error.message}`);
    } finally {
      await this.disconnect();
    }
  }

  /* ═══════════ RECEIVER: ADVERTISE & LISTEN ═══════════ */

  /**
   * Start advertising as an AURA receiver and listen for incoming packets via GATT server.
   * 
   * @param {function} onPacketReceived - callback with the received encrypted packet string
   * @param {function} onStatusChange - callback with status: advertising, connected, receiving
   */
  async startReceiving(onPacketReceived, onStatusChange = () => {}) {
    onStatusChange("advertising");

    if (!this.blePeripheral) {
      onStatusChange("error");
      console.warn("BLE Receive Error: Bluetooth is not supported on the web platform.");
      return;
    }

    try {
      this.isAdvertising = true;

      const peripheral = this.blePeripheral;

      // Safely remove all services — ignore errors if none exist
      try { peripheral.removeAllServices(); } catch (e) {}

      // Add primary AURA payment service
      peripheral.addService(AURA_SERVICE_UUID, true);

      // Characteristic properties & permissions as raw integers (universal)
      const PROP_WRITE = 0x08;     // Write
      const PROP_READ  = 0x02;     // Read
      const PERM_WRITE = 0x10;     // Writeable
      const PERM_READ  = 0x01;     // Readable

      peripheral.addCharacteristicToService(
        AURA_SERVICE_UUID,
        AURA_CHAR_PACKET_UUID,
        PROP_WRITE,
        PERM_WRITE,
        ''
      );

      peripheral.addCharacteristicToService(
        AURA_SERVICE_UUID,
        AURA_CHAR_STATUS_UUID,
        PROP_READ,
        PERM_READ,
        'ACK'
      );

      peripheral.setName(`${AURA_DEVICE_PREFIX}-RECV`);

      await peripheral.startAdvertising({
        localName: `${AURA_DEVICE_PREFIX}-RECV`,
        serviceUUIDs: [AURA_SERVICE_UUID],
      });

      // Listen for incoming write requests
      this.writeSub = peripheral.onDidReceiveWriteRequests((event) => {
        onStatusChange("receiving");
        const requests = event.requests || [event];
        requests.forEach((req) => {
          const charUUID = (req.characteristicUUID || '').toUpperCase();
          if (charUUID === AURA_CHAR_PACKET_UUID.toUpperCase()) {
            try {
              // Decode base64 → string using Buffer
              const decoded = Buffer.from(req.value, 'base64').toString('utf-8');
              onPacketReceived(decoded);
            } catch (e) {
              console.warn('BLE packet decode error:', e.message);
            }
            try {
              peripheral.respondToRequest(event.requestId || req.requestId, 0);
            } catch (e) {}
          }
        });
      });

    } catch (e) {
      console.warn("BLE GATT Server Error:", e.message);
      onStatusChange("error");
    }
  }

  stopReceiving() {
    this.stopScan();
    this.disconnect();
    
    if (this.blePeripheral && this.isAdvertising) {
       this.blePeripheral.stopAdvertising();
       this.blePeripheral.removeAllServices();
       this.isAdvertising = false;
       
       if (this.writeSub) {
         this.writeSub.remove();
         this.writeSub = null;
       }
    }
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
    if (this.manager) {
      this.manager.destroy();
    }
  }
}

// Singleton instance
export default new BLEService();
