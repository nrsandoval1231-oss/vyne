# Repository structure

```text
vyne/
├── README.md
├── package.json                 # root command shortcuts
├── apps/ios/
│   ├── app/                     # Expo Router routes
│   │   ├── (tabs)/              # Home, Cleanup, Albums
│   │   ├── album/[id].tsx
│   │   ├── photo/[id].tsx
│   │   ├── viewer/[id].tsx
│   │   ├── learning.tsx
│   │   ├── storage.tsx
│   │   ├── settings.tsx
│   │   └── credits.tsx
│   ├── src/components/ui.tsx    # shared brand/UI/motion primitives
│   ├── src/data/                # deterministic records and static asset map
│   ├── src/services/            # versioned SQLite persistence
│   ├── src/state/               # serialized local state provider
│   ├── assets/demo/             # bundled photos, artwork and provenance
│   ├── scripts/smoke.cjs        # browser interaction verification
│   ├── app.json
│   ├── metro.config.js
│   └── package-lock.json
├── packages/
│   ├── design-tokens/src/index.ts
│   ├── domain/src/index.ts
│   └── intelligence/src/index.ts
├── modules/photo-intelligence/
│   ├── src/index.ts             # future native adapter interface
│   └── ios/                     # Swift design contract, not a working module
├── tests/domain.test.ts
└── docs/
    ├── PRD.md
    ├── BRAND.md
    ├── UI-UX.md
    ├── ARCHITECTURE.md
    ├── ROADMAP.md
    ├── STRUCTURE.md
    ├── TESTING.md
    └── screenshots/             # actual browser preview captures
```

Generated native `ios/`, build output and local database files are not committed. Generate the native development project with Expo on a Mac. No production PhotoKit module is claimed.
