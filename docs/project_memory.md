# SolarPix Project Memory

## Environment & Tooling
- **Framework:** Expo (React Native SDK v57)
- **Language:** TypeScript 6.x
- **Navigation:** React Navigation 7+
- **Database Engine:** Encrypted SQLite (`@op-engineering/op-sqlite` with SQLCipher)
- **Key Storage:** Hardware-backed `expo-secure-store` (iOS Keychain / Android Keystore)
- **Repository:** https://github.com/Sairitik008/solarpix-master.git

## Key Constraints
- All database operations must be encrypted at rest using SQLCipher AES-256.
- Business logic is strictly isolated in `/src/services` and `/src/db`.
- Immutable ledger transactions (`transactions` table) for all credit/debit record keeping.
- Zero build warnings or type errors allowed in production state.

---

## Decisions Log

### Decision 1: Encrypted Local Database Engine (`@op-engineering/op-sqlite`)
- **Date:** 2026-09-13
- **Status:** Approved & Implemented (Phase 1)
- **Library:** `@op-engineering/op-sqlite` (v15.1.6)
- **Reasoning:**
  1. **Performance:** `@op-engineering/op-sqlite` utilizes C++ JSI bindings directly attaching to the JS runtime, yielding query execution speeds up to 10x faster than legacy bridge-based SQLite drivers.
  2. **SQLCipher AES-256 Encryption:** Out-of-the-box native support for SQLCipher, enabling full database encryption at rest. Raw database files on disk are binary encrypted and unreadable without the per-device key.
  3. **Expo SDK 57 Compatibility:** Full compatibility with Expo dev builds via Config Plugins (`@op-engineering/op-sqlite` plugin).

### Decision 2: Hardware-Backed Key Management (`expo-secure-store`)
- **Date:** 2026-09-13
- **Status:** Approved & Implemented (Phase 1)
- **Library:** `expo-secure-store` (v14.0.1) & `expo-crypto` (v14.0.1)
- **Reasoning:**
  1. **Security:** Generates a cryptographically secure 256-bit random key on first launch (`expo-crypto`) and persists it in hardware-backed storage (iOS Keychain / Android Keystore).
  2. **Zero Plaintext Exposure:** Key is never logged, written to disk in plain text, or exposed outside of the encrypted SQLite connection initialization module (`src/db/keyManager.ts`).
