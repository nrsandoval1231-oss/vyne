import type {
  CleanupGroup,
  DemoDecision,
  DemoPhoto,
  LocalState,
  PhotoCategory,
} from "../../domain/src";

export function latestDecisions(
  decisions: DemoDecision[],
): Map<string, DemoDecision> {
  return new Map(decisions.map((decision) => [decision.groupId, decision]));
}
export function eligibleIds(
  group: CleanupGroup,
  photos: DemoPhoto[],
  state?: LocalState,
): string[] {
  const keptElsewhere = new Set(
    state
      ? [...latestDecisions(state.decisions).values()]
          .filter((d) => d.groupId !== group.id && d.action === "keep")
          .flatMap((d) => d.assetIds)
      : [],
  );
  return group.candidateIds.filter(
    (id) =>
      id !== group.suggestedKeeperId &&
      !keptElsewhere.has(id) &&
      photos.some((p) => p.id === id && !p.protected),
  );
}
export function applyDecision(
  state: LocalState,
  group: CleanupGroup,
  photos: DemoPhoto[],
  action: DemoDecision["action"],
  timestamp: string,
): LocalState {
  const assetIds =
    action === "review_for_deletion"
      ? eligibleIds(group, photos, state)
      : group.assetIds;
  if (action === "review_for_deletion" && !assetIds.length)
    throw new Error(
      "Protected memories and recommended keepers cannot be queued.",
    );
  const decision: DemoDecision = {
    learningEligible: state.learningEnabled,
    id: `${group.id}:${timestamp}:${state.decisions.length}`,
    groupId: group.id,
    assetIds,
    action,
    timestamp,
  };
  return { ...state, decisions: [...state.decisions, decision] };
}
export function setMembership(
  state: LocalState,
  photoId: string,
  albumId: string,
  assigned: boolean,
  timestamp: string,
): LocalState {
  if (
    !state.albums.some((a) => a.id === albumId) ||
    !state.memberships[photoId]
  )
    throw new Error("Unknown photo or album");
  const ids = new Set(state.memberships[photoId]);
  if (assigned) ids.add(albumId);
  else ids.delete(albumId);
  return {
    ...state,
    memberships: { ...state.memberships, [photoId]: [...ids] },
    corrections: [
      ...state.corrections,
      { photoId, albumId, assigned, timestamp },
    ],
  };
}
export function storageSummary(
  photos: DemoPhoto[],
  groups: CleanupGroup[],
  state: LocalState,
) {
  const latest = latestDecisions(state.decisions);
  // A Keep on any overlapping group protects that asset across every group.
  const kept = new Set(
    [...latest.values()]
      .filter((d) => d.action === "keep")
      .flatMap((d) => d.assetIds),
  );
  const candidates = new Set(
    groups.flatMap((g) => eligibleIds(g, photos)).filter((id) => !kept.has(id)),
  );
  const queued = new Set(
    [...latest.values()]
      .filter((d) => d.action === "review_for_deletion")
      .flatMap((d) => d.assetIds)
      .filter((id) => candidates.has(id)),
  );
  const bytes = (ids: Set<string>) =>
    photos.filter((p) => ids.has(p.id)).reduce((sum, p) => sum + p.bytes, 0);
  return {
    potentialBytes: bytes(candidates),
    queuedBytes: bytes(queued),
    queuedCount: queued.size,
    reviewed: latest.size,
    total: groups.length,
  };
}
export function preferenceSignals(state: LocalState, photos: DemoPhoto[]) {
  const signals = new Map<PhotoCategory, { keep: number; remove: number }>();
  if (!state.learningEnabled) return signals;
  for (const decision of latestDecisions(state.decisions).values()) {
    if (
      decision.action === "skip" ||
      decision.learningEligible === false ||
      (state.learningSince && decision.timestamp <= state.learningSince)
    )
      continue;
    for (const photo of photos.filter((p) =>
      decision.assetIds.includes(p.id),
    )) {
      // Corrected memberships provide local context, not a universal rule.
      const categories = state.albums
        .filter(
          (a) => a.category && state.memberships[photo.id]?.includes(a.id),
        )
        .map((a) => a.category!);
      for (const category of new Set(categories)) {
        if (state.ignoredCategories.includes(category)) continue;
        const score = signals.get(category) ?? { keep: 0, remove: 0 };
        if (decision.action === "keep") score.keep++;
        else score.remove++;
        signals.set(category, score);
      }
    }
  }
  return signals;
}
export function personalExplanation(
  state: LocalState,
  photos: DemoPhoto[],
  group: CleanupGroup,
): string | null {
  const signals = preferenceSignals(state, photos);
  const categories = new Set(
    group.assetIds.flatMap((id) =>
      state.albums
        .filter((a) => a.category && state.memberships[id]?.includes(a.id))
        .map((a) => a.category!),
    ),
  );
  for (const category of categories) {
    const signal = signals.get(category);
    if (signal && signal.keep > signal.remove)
      return `You tend to keep ${category} photos. Take a closer look before setting these aside.`;
    if (signal && signal.remove > signal.keep)
      return `You have set aside ${category} photos before. This is a review hint, never a deletion rule.`;
  }
  return null;
}
export function resetLearning(
  state: LocalState,
  timestamp: string,
): LocalState {
  return { ...state, learningSince: timestamp, ignoredCategories: [] };
}
