# VYNE — Canonical PRD
Version 1.0 | 2026-10-17

## Vision
An intelligent photo curator that understands what matters to its owner. It automatically organizes their existing Apple Photos library, identifies likely clutter and redundancies, and becomes more personally accurate through user decisions.

## Product pillars
1. **Organize:** New and existing photos are assigned to multiple relevant smart albums based on content, context and learned preferences, without copying originals.
2. **Clean:** Identify exact/near duplicates, bursts, blur, poor exposure, disposable screenshots and redundant captures; compare alternatives and recommend a keeper.
3. **Learn:** Adapt recommendations from Keep, Delete, Skip and album corrections. Skips are ambiguous, not deletion signals.

## Non-negotiable safety
- Never silently delete photos. User explicitly approves deletion through Apple's authorized flow.
- Protect unique or potentially sentimental photos even if technically poor. Blur alone never justifies removal.
- Explain each recommendation and allow corrections.
- Keep original assets in Apple Photos; use a local derived index.
- Prefer on-device intelligence. Cloud analysis is opt-in only.
- Let users reset learned preferences without affecting originals.

## Functional requirements
**Library:** PhotoKit permissions including limited access; incremental inventory, thumbnails and metadata; handle edits, authorization changes, deleted assets and interrupted scans.
**Duplicate detection:** Exact fingerprints and perceptual similarity; preserve meaningful variants, edits and Live Photos; compare sharpness, expressions, composition, resolution and uniqueness when supported.
**Clutter:** Detect low-value screenshots, obsolete references, accidental captures and blurry/redundant photos; uncertainty routes to review, not deletion.
**Smart Albums:** People, sports, family, pets, trips, work, screenshots, events, places and user-defined categories; many-to-many membership; correction feedback; optional explicit sync into Apple Photos albums.
**Ingestion:** Observe changes while active, opportunistic background processing, full catch-up on next launch. iOS does not guarantee immediate processing after every camera capture.
**Review:** Small cleanup sessions; Keep/Skip/Approve Delete; best-shot comparison; rationale; estimated storage impact; native confirmation; revalidate assets before mutation.
**Personalization:** Lightweight local preference model, contextual features, versioned feedback history, drift handling, reset controls, and explainable adjustments. Do not treat inference of sentiment as fact.
**Search:** Metadata/category search initially, semantic natural-language search later.
**Privacy:** No image content or personal feature indexes in telemetry, GitHub or remote services by default. Explain permissions, sync, cloud opt-in and local data removal.

## Experience
Home dashboard → Cleanup Review → Smart Albums → Photo Details → Learning Preferences → Storage Impact → Privacy Settings.

## Delivery priorities
P0: PhotoKit indexing, duplicate grouping, blur/screenshot heuristics, explainable review, safe deletion, baseline smart albums.
P1: personalized ranking, album corrections, incremental ingestion and optional Photos album sync.
P2: natural-language search, advanced on-device models and optional cloud enhancement.

## Acceptance criteria
- A photo can belong to Family and Sports without duplication.
- User can compare five similar photos and approve deletion of four, with clear confirmation.
- Unique blurry family photo is protected from automatic low-quality removal.
- Kept screenshot informs future suggestions but does not create an absolute rule.
- Revoked library permissions do not cause false deletion records.
- After suspension, the app catches up on newly taken photos when relaunched.
- Preference reset never deletes photos.
- Storage estimates avoid double-counting overlapping groups.

## Success metrics
Duplicate-group precision; suggestion acceptance and regret/reversal rates; smart album accuracy and corrections; personalized ranking improvement vs baseline; time to first useful review; battery/memory impact and crash-free sessions.

## Explicit boundaries
Name VYNE and logo require legal/availability review. No guaranteed always-on background classification. No claims of perfect emotional understanding. This PRD defines target behavior, not implemented functionality.
