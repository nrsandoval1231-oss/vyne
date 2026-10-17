# VYNE — Delivery Plan
- **M0 — Foundation:** canonical PRD, brand, UX, architecture, folder tree, shared types and tokens.
- **M1 — Real iPhone shell:** Expo project, navigation, approved dark UI, deterministic fixtures; run on Mac/iPhone.
- **M2 — PhotoKit:** permissions, thumbnails, inventory, incremental scans, restart recovery.
- **M3 — Safe cleanup:** exact/near duplicates, blur/screenshots, explainable comparison and approved deletion.
- **M4 — Smart Albums:** content categories, multiple membership, corrections, optional Apple Photos sync.
- **M5 — Personal Taste Engine:** local feedback learning, reset, evaluation of recommendation improvement.
- **M6 — Release:** performance, accessibility, privacy review, TestFlight and naming/legal checks.

No phase is marked implemented until verified on a device.

## Implementation update — 2026-10-17
M1 code is implemented with seven navigable screens, bundled fixtures, local SQLite, review confirmation, overlapping albums and deterministic preference hints. Automated domain tests and iOS/web bundling have been exercised in Linux. **M1 device acceptance is still pending**: the repository's rule that milestones require device verification remains in force.

M2–M6 remain unimplemented. M1 simulated grouping/classification and preference counts are not completion of M3–M5 native intelligence milestones. See `TESTING.md` for exact verification evidence and the remaining Mac/iPhone gate.
