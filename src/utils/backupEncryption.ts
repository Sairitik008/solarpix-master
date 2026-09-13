import CryptoJS from 'crypto-js';
import { ServiceResult } from '../types';

export interface BackupPackage {
  version: string;
  algorithm: string;
  salt: string; // 32-char hex (16 bytes)
  iv: string; // 32-char hex (16 bytes)
  ciphertext: string; // hex
  hmac: string; // 64-char hex (32 bytes HMAC-SHA256)
}

const PBKDF2_ITERATIONS = 10000;

/**
 * Generates random 16-byte hex salt or IV
 */
function generateRandomHex(lengthBytes: number = 16): string {
  try {
    const Crypto = require('expo-crypto');
    if (Crypto && Crypto.getRandomBytes) {
      const bytes = Crypto.getRandomBytes(lengthBytes);
      return Array.from(bytes)
        .map((b) => (b as number).toString(16).padStart(2, '0'))
        .join('');
    }
  } catch {
    // Fallback for headless node environment
  }

  const hexChars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < lengthBytes * 2; i++) {
    result += hexChars[Math.floor(Math.random() * 16)];
  }
  return result;
}

/**
 * Derives a 512-bit key material (256-bit AES key + 256-bit HMAC key) from PIN and Salt
 */
function deriveKeys(pin: string, saltHex: string) {
  const salt = CryptoJS.enc.Hex.parse(saltHex);
  // Derive 512 bits (16 words)
  const keyMaterial = CryptoJS.PBKDF2(pin, salt, {
    keySize: 16, // 16 words = 512 bits
    iterations: PBKDF2_ITERATIONS,
    hasher: CryptoJS.algo.SHA256,
  });

  const keyHex = keyMaterial.toString(CryptoJS.enc.Hex);
  const encKeyHex = keyHex.substring(0, 64); // First 256 bits for AES
  const hmacKeyHex = keyHex.substring(64, 128); // Next 256 bits for HMAC

  return {
    encKey: CryptoJS.enc.Hex.parse(encKeyHex),
    hmacKey: CryptoJS.enc.Hex.parse(hmacKeyHex),
  };
}

/**
 * Computes HMAC-SHA256 over salt + iv + ciphertext using derived HMAC key
 */
export function computeBackupHmac(
  saltHex: string,
  ivHex: string,
  ciphertextHex: string,
  hmacKey: CryptoJS.lib.WordArray
): string {
  const message = saltHex + ivHex + ciphertextHex;
  return CryptoJS.HmacSHA256(message, hmacKey).toString(CryptoJS.enc.Hex);
}

/**
 * Encrypts a JSON backup data string using AES-256-CBC and signs it with HMAC-SHA256
 */
export function encryptBackupPayload(dataJson: string, pin: string): BackupPackage {
  const saltHex = generateRandomHex(16);
  const ivHex = generateRandomHex(16);

  const { encKey, hmacKey } = deriveKeys(pin, saltHex);
  const iv = CryptoJS.enc.Hex.parse(ivHex);

  const encrypted = CryptoJS.AES.encrypt(dataJson, encKey, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  const ciphertextHex = encrypted.ciphertext.toString(CryptoJS.enc.Hex);
  const hmacHex = computeBackupHmac(saltHex, ivHex, ciphertextHex, hmacKey);

  return {
    version: '1.0',
    algorithm: 'AES-256-CBC-HMAC-SHA256',
    salt: saltHex,
    iv: ivHex,
    ciphertext: ciphertextHex,
    hmac: hmacHex,
  };
}

/**
 * Verifies HMAC integrity and decrypts AES-256 backup package using vendor PIN
 */
export function decryptBackupPayload(pkg: BackupPackage, pin: string): ServiceResult<string> {
  try {
    if (!pkg || !pkg.salt || !pkg.iv || !pkg.ciphertext || !pkg.hmac) {
      return {
        success: false,
        error: {
          code: 'CORRUPTED_BACKUP',
          message: 'Invalid backup package structure.',
          userFacingMessage: 'Selected backup file is invalid or malformed.',
        },
      };
    }

    const { encKey, hmacKey } = deriveKeys(pin, pkg.salt);

    // 1. HMAC Integrity Verification
    const expectedHmac = computeBackupHmac(pkg.salt, pkg.iv, pkg.ciphertext, hmacKey);
    if (expectedHmac !== pkg.hmac) {
      return {
        success: false,
        error: {
          code: 'HMAC_VERIFICATION_FAILED',
          message: 'HMAC signature mismatch. Data corrupted or tampered.',
          userFacingMessage:
            'Backup integrity check failed! The backup file has been tampered with or corrupted.',
        },
      };
    }

    // 2. AES-256 Decryption
    const iv = CryptoJS.enc.Hex.parse(pkg.iv);
    const cipherParams = CryptoJS.lib.CipherParams.create({
      ciphertext: CryptoJS.enc.Hex.parse(pkg.ciphertext),
    });

    const decrypted = CryptoJS.AES.decrypt(cipherParams, encKey, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);

    if (!decryptedText || decryptedText.length === 0) {
      return {
        success: false,
        error: {
          code: 'INVALID_PIN',
          message: 'Decryption produced empty output.',
          userFacingMessage: 'Incorrect security PIN. Decryption failed.',
        },
      };
    }

    // Validate JSON string
    JSON.parse(decryptedText);

    return { success: true, data: decryptedText };
  } catch (err: any) {
    return {
      success: false,
      error: {
        code: 'DECRYPTION_FAILED',
        message: err?.message || 'AES decryption error.',
        userFacingMessage: 'Decryption failed. Please verify your PIN and try again.',
      },
    };
  }
}
