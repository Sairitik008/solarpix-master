# SolarPix Project Memory

## Environment & Tooling
- **Framework:** Expo (React Native)
- **Language:** TypeScript 5.x
- **Navigation:** React Navigation
- **Database Engine:** Encrypted SQLite (`op-sqlite` with SQLCipher)
- **Repository:** https://github.com/Sairitik008/solarpix-master.git

## Key Constraints
- All database operations must be encrypted at rest using SQLCipher.
- Business logic is strictly isolated in `/src/services` and `/src/db`.
- Shared custom hooks placed in `/src/hooks`.
- Zero build warnings or type errors allowed in production state.
