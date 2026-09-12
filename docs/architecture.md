# SolarPix Architecture Document

## Overview
SolarPix is a high-performance React Native + TypeScript mobile application powered by Expo. It features local encrypted SQLite storage for secure photo metadata management.

## System Components
- **UI Layer (`/src/screens`, `/src/components`):** React Native screens and reusable atomic UI elements built with modular component architecture.
- **Navigation (`/src/navigation`):** React Navigation 7+ stack and bottom tab navigators with type-safe route parameters.
- **Services Layer (`/src/services`):** Data access and API services abstracting local database and media storage logic.
- **Database (`/src/db`):** Local SQLite storage powered by an encrypted driver with schema migration runner.
- **State Management & Custom Hooks (`/src/hooks`):** Reactive state handling and custom async operation hooks.
- **Utilities (`/src/utils`):** Centralized constants, formatters, and error mapping utilities.

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
