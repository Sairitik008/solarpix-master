# SolarPix Architecture Document

## Overview
SolarPix is a high-performance React Native + TypeScript mobile application powered by Expo. It features local encrypted SQLite storage for secure photo metadata management.

## System Components
- **UI Layer (`/src/screens`, `/src/components`):** React Native screens and reusable atomic UI elements built with modular component architecture.
- **Navigation (`/src/navigation`):** React Navigation 7+ stack and bottom tab navigators with type-safe route parameters.
- **Services Layer (`/src/services`):** Data access and API services abstracting local database and media storage logic.
- **Database (`/src/db`):** Local SQLite storage powered by an encrypted driver with schema migration runner.
- **State Management & Custom Hooks (`/src/hooks`):** Reactive state handling and custom async operation hooks.
- **Utilities (`/src/utils`):** Centralized constants, formatters, and backup encryption utilities.

---

## Decisions Log

### Decision 1: Encrypted SQLite Driver Selection
- **Date:** 2026-09-13
- **Status:** Approved
- **Decision:** Selected `@op-engineering/op-sqlite` (supporting SQLCipher encryption) as the primary encrypted SQLite driver for SolarPix.
- **Reasoning:**
  1. **Performance:** `@op-engineering/op-sqlite` is a high-performance C++ JSI binding for SQLite that executes queries up to 10x faster than traditional bridge-based native modules.
  2. **Security & Encryption:** `@op-engineering/op-sqlite` provides built-in SQLCipher integration out of the box, allowing full AES-256 database encryption at rest.
  3. **Expo Compatibility:** Offers full support for Expo dev builds via Config Plugins (`@op-engineering/op-sqlite` plugin), enabling smooth integration in modern Expo projects.
  4. **Active Maintenance:** Highly active community maintenance and optimized compatibility with modern React Native architecture (New Architecture / Fabric / TurboModules).

### Decision 2: Hardware-Backed Key Management (`expo-secure-store`)
- **Date:** 2026-09-13
- **Status:** Approved
- **Decision:** Use `expo-secure-store` (iOS Keychain / Android Keystore) for storing key material.
- **Reasoning:**
  1. Plaintext PINs and encryption keys are never stored on disk.
  2. Protects database keys and salt material using OS-level hardware-backed keystores.

### Decision 3: PIN Key Derivation & Backup Encryption (PBKDF2 + AES-256 + HMAC-SHA256)
- **Date:** 2026-09-13
- **Status:** Approved & Implemented (Phase 4)
- **Architecture & Technical Details:**
  1. **Key Derivation Function (KDF):** Uses PBKDF2 (SHA-256, 10,000 iterations) with a 16-byte random salt to derive 512 bits of key material (256-bit AES encryption key + 256-bit HMAC key).
  2. **Payload Encryption:** Backup JSON payloads are encrypted with AES-256-CBC using an IV generated per backup package.
  3. **HMAC Integrity Signature:** Computes an HMAC-SHA256 signature over `salt + IV + ciphertext` using the derived HMAC key.
  4. **Tamper Detection:** During restore, HMAC verification is performed BEFORE decryption. If any byte of the ciphertext or HMAC is altered, decryption is aborted with an integrity violation error.
