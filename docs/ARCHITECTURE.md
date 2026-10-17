# VYNE — Architecture

## Stack
Expo + React Native + TypeScript UI. Swift PhotoKit/Vision integration through a custom Expo native module and development build (not Expo Go). SQLite local index and decision history. Modular feature extraction, safety policies, ranking and personalization.

## Pipeline
PhotoKit permission → incremental asset inventory → ephemeral thumbnails and derived features → duplicate grouping / classification → memory-protection rules → personalized ranking → review → explicit PhotoKit deletion authorization → decision feedback.

## Boundaries
Originals remain in Apple Photos. Multiple smart-album memberships are references, not copies. No photo upload by default. Cloud inference requires explicit opt-in. No keys or personal images committed.

## Proposed modules
- apps/ios: React Native screens, navigation and state
- packages/design-tokens: visual tokens
- packages/domain: photo, album, decision and recommendation contracts
- packages/intelligence: scoring, safety and preference logic
- modules/photo-intelligence/ios: PhotoKit and Vision Swift bridge

## Lifecycle and correctness
PhotoKit change observation when active; permitted background work opportunistically; foreground reconciliation. Handle limited authorization, missing/edited assets, Live Photos, interrupted scans, battery/thermal limits, schema migration and cancellable indexing.

## Test strategy
Deterministic similarity and decision tests; permission/reconciliation integration tests; native deletion safety tests; on-device performance and accessibility validation. Evaluate preference improvement against baseline without increasing regretted removals.

## M1 implementation (2026-10-17)

The approved module boundaries are now implemented for a demonstration library:

- Expo Router stack with Home/Cleanup/Albums tabs and secondary routes for album, photo, viewer, learning, storage, settings and credits.
- Shared visual primitives consume the canonical palette, use iOS system fonts, respect Dynamic Type defaults, expose accessible labels and support reduced-motion transitions. Native accessibility remains a device verification gate.
- `DemoPhoto` extends `PhotoRecord`; `CleanupGroup` extends `Recommendation`. M0 `ReviewAction.delete_approved` is preserved for future real authorization. M1 uses a separate `DemoReviewAction.review_for_deletion`, never a false deletion record.
- Pure functions enforce protected-memory and keeper exclusions, latest-decision semantics, global Keep protection across overlaps, and unique-asset storage accounting. Category subtotals intentionally overlap and are explicitly non-additive.
- The deterministic learning system counts category-level Keep/removal-review intentions, ignores Skip, uses corrected memberships as context, and adjusts explanations. It does not train or claim an AI model. Reset establishes a time cutoff without erasing review history or album assignments.
- A small React context loads a versioned SQLite snapshot. Mutations serialize through a promise queue; a single parameterized UPSERT atomically writes the complete snapshot before publishing UI state. Persistence failures do not advance committed state. This simple M1 snapshot should become normalized index tables when PhotoKit inventory reaches realistic library size.
- Bundled licensed previews and original sample artwork are independent of record identity. No runtime image URLs, uploads, original-library copies or native permission requests exist.
- TypeScript `PhotoLibraryService` and Swift `PhotoLibraryContract` cover permissions, paginated inventory, thumbnails, change observation, metadata, feature extraction, album sync and explicitly requested deletion. These are contracts only; the Swift file is not compiled or registered as an Expo module in M1.

### M2 integration requirements
Implement a custom Expo Swift module and adapter behind the contract. Reconcile limited/revoked authorization, changed revisions, missing assets and interrupted inventory. Bound thumbnail caches and release temporary resources. Revalidate every candidate immediately before an explicit PhotoKit change request; cancellation must not create deletion records. Observe active changes and reconcile on foreground; background work is never guaranteed. Add device tests for permissions, reconciliation, cancellation, Live Photos, edits and native deletion safety before enabling real mutation UI.
