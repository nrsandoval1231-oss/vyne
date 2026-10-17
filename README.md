# VYNE

**Your life in focus.** A privacy-first intelligent iPhone photo curator.

## Current status
M1 application foundation is implemented in Expo / React Native with clearly labeled, bundled demonstration photos. All seven product screens are accessible. Local SQLite persists cleanup intentions, review history, many-to-many album assignments, user collections, settings and deterministic preference signals.

**No real photo scanning, AI inference, Apple Photos synchronization or deletion is implemented.** M1 has no backend, accounts or photo uploads. Native iPhone execution remains to be verified on a Mac/device; Linux bundle and browser verification do not substitute for that gate.

## Start
Requires Node 24+, npm, and for native execution a Mac with Xcode and its iOS tooling.

```sh
git clone https://github.com/nrsandoval1231-oss/vyne.git
cd vyne
npm --prefix apps/ios ci
npm start
```

For a native development build, use `cd apps/ios && npx expo run:ios`. See [the exact Mac and physical iPhone checklist](docs/TESTING.md), including the branch checkout and verification evidence.

```sh
npm run typecheck
npm run lint
npm test
```

## Explore
- Home: overview, simulated analysis, sample storage, album previews and recent organization.
- Cleanup: duplicate/similar comparisons, protected blurry memory, screenshots, explanations, Keep/Skip/Review for Deletion with confirmation. These are local intentions, not deletions.
- Albums: filters, custom collections, photo grids and multiple memberships.
- Photo details: bundled image, fictional metadata, classification corrections and full-screen zoom viewer.
- Personal intelligence: explainable counts, contextual hints, ignored preferences, pause and Reset Learning.
- Storage: deduplicated estimates and append-only review history; actual recovered space remains zero.
- Settings: native-integration status, privacy, organization preview preference and complete demo reset.

## Architecture
`apps/ios` holds screens, reusable UI, fixtures, state and SQLite. `packages/domain` extends M0 contracts without redefining real deletion authorization. `packages/intelligence` contains pure safety, storage and preference functions. `packages/design-tokens` retains the approved palette. `modules/photo-intelligence` defines unimplemented TypeScript and Swift integration contracts.

Originals remain in Apple Photos in the future native architecture; current records reference bundled licensed previews. Photos can belong to multiple collections without copying assets.

## Documentation
- [Canonical PRD](docs/PRD.md)
- [Brand](docs/BRAND.md)
- [UI/UX](docs/UI-UX.md)
- [Architecture and M1 implementation](docs/ARCHITECTURE.md)
- [Roadmap](docs/ROADMAP.md)
- [Repository structure](docs/STRUCTURE.md)
- [Testing, limitations and native run instructions](docs/TESTING.md)
- [Demo asset provenance](apps/ios/assets/demo/README.md)

## Safety
No automatic deletion, personal photo logging, cloud analysis, or Apple Photos mutations. Future deletion must revalidate asset revisions and use explicit PhotoKit authorization. iOS background organization will be best-effort, with foreground catch-up.
