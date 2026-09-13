import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import CryptoJS from 'crypto-js';
import { ServiceResult } from '../types';
import { getVendorErrorMessage } from '../utils';

const PIN_HASH_ALIAS = 'SOLARPIX_PIN_HASH_V1';
const PIN_SALT_ALIAS = 'SOLARPIX_PIN_SALT_V1';

const PBKDF2_ITERATIONS = 10000;
const KEY_SIZE_WORDS = 256 / 32; // 8 words = 256 bits

/**
 * Derives a PBKDF2 hash string from raw PIN and salt string.
 */
export function derivePinHash(pin: string, saltHex: string): string {
  const salt = CryptoJS.enc.Hex.parse(saltHex);
  const derivedKey = CryptoJS.PBKDF2(pin, salt, {
    keySize: KEY_SIZE_WORDS,
    iterations: PBKDF2_ITERATIONS,
    hasher: CryptoJS.algo.SHA256,
  });
  return derivedKey.toString(CryptoJS.enc.Hex);
}

/**
 * Generates a random 16-byte hex salt for key derivation.
 */
function generateSalt(): string {
  if (Crypto.getRandomBytes) {
    const bytes = Crypto.getRandomBytes(16);
    return Array.from(bytes)
      .map((b) => (b as number).toString(16).padStart(2, '0'))
      .join('');
  }
  const hexChars = '0123456789abcdef';
  let salt = '';
  for (let i = 0; i < 32; i++) {
    salt += hexChars[Math.floor(Math.random() * 16)];
  }
  return salt;
}

export class PinAuthService {
  private inMemoryHash: string | null = null;
  private inMemorySalt: string | null = null;

  async isPinConfigured(): Promise<boolean> {
    try {
      const isAvailable = await SecureStore.isAvailableAsync();
      if (isAvailable) {
        const hash = await SecureStore.getItemAsync(PIN_HASH_ALIAS);
        return !!hash;
      }
    } catch {
      // Fallback check
    }
    return !!this.inMemoryHash;
  }

  async setupPin(pin: string): Promise<ServiceResult<boolean>> {
    try {
      if (!pin || pin.trim().length < 4) {
        return {
          success: false,
          error: {
            code: 'UNKNOWN_ERROR',
            message: 'PIN must be at least 4 digits.',
            userFacingMessage: 'Security PIN must be at least 4 digits.',
          },
        };
      }

      const salt = generateSalt();
      const hash = derivePinHash(pin, salt);

      try {
        const isAvailable = await SecureStore.isAvailableAsync();
        if (isAvailable) {
          await SecureStore.setItemAsync(PIN_SALT_ALIAS, salt, {
            keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
          });
          await SecureStore.setItemAsync(PIN_HASH_ALIAS, hash, {
            keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
          });
        }
      } catch {
        // Fallback for headless environments
      }

      this.inMemorySalt = salt;
      this.inMemoryHash = hash;

      return { success: true, data: true };
    } catch (err: any) {
      const code = 'UNKNOWN_ERROR';
      return {
        success: false,
        error: {
          code,
          message: err?.message || 'Failed to configure security PIN.',
          userFacingMessage: getVendorErrorMessage(code),
        },
      };
    }
  }

  async verifyPin(pin: string): Promise<ServiceResult<boolean>> {
    try {
      let salt: string | null = null;
      let storedHash: string | null = null;

      try {
        const isAvailable = await SecureStore.isAvailableAsync();
        if (isAvailable) {
          salt = await SecureStore.getItemAsync(PIN_SALT_ALIAS);
          storedHash = await SecureStore.getItemAsync(PIN_HASH_ALIAS);
        }
      } catch {
        // Fallback
      }

      if (!salt) salt = this.inMemorySalt;
      if (!storedHash) storedHash = this.inMemoryHash;

      if (!salt || !storedHash) {
        return {
          success: false,
          error: {
            code: 'UNKNOWN_ERROR',
            message: 'No PIN is configured on device.',
            userFacingMessage: 'No security PIN has been set up on this device.',
          },
        };
      }

      const computedHash = derivePinHash(pin, salt);
      if (computedHash === storedHash) {
        return { success: true, data: true };
      } else {
        return {
          success: false,
          error: {
            code: 'UNKNOWN_ERROR',
            message: 'Incorrect PIN entered.',
            userFacingMessage: 'Incorrect security PIN. Access denied.',
          },
        };
      }
    } catch (err: any) {
      const code = 'UNKNOWN_ERROR';
      return {
        success: false,
        error: {
          code,
          message: err?.message || 'PIN verification error.',
          userFacingMessage: getVendorErrorMessage(code),
        },
      };
    }
  }

  async resetPin(): Promise<void> {
    try {
      const isAvailable = await SecureStore.isAvailableAsync();
      if (isAvailable) {
        await SecureStore.deleteItemAsync(PIN_SALT_ALIAS);
        await SecureStore.deleteItemAsync(PIN_HASH_ALIAS);
      }
    } catch {
      // Ignore
    }
    this.inMemorySalt = null;
    this.inMemoryHash = null;
  }
}

export const pinAuthService = new PinAuthService();
