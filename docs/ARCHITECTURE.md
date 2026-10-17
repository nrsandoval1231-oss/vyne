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
