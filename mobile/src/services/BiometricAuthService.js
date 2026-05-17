import * as LocalAuthentication from 'expo-local-authentication';

class BiometricAuthService {
  /**
   * Checks if the device has biometric hardware and if it's enrolled.
   */
  async isBiometricReady() {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return hasHardware && isEnrolled;
  }

  /**
   * Authenticates the user via Biometrics (Face ID, Touch ID, Android Biometrics).
   * @param {string} promptMessage Message to display to the user
   * @returns {Promise<boolean>} True if successful, false otherwise
   */
  async authenticate(promptMessage = 'Authenticate to access AURA') {
    try {
      const ready = await this.isBiometricReady();
      if (!ready) {
        return false;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        fallbackLabel: 'Use PIN',
        disableDeviceFallback: false, // Allows them to use device passcode/PIN
        cancelLabel: 'Cancel',
      });

      return result.success;
    } catch (error) {
      console.warn('Biometric authentication failed:', error);
      return false;
    }
  }
}

export default new BiometricAuthService();
