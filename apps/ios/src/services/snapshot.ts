import type {
  Album,
  AlbumCorrection,
  DemoDecision,
  LocalState,
  PhotoCategory,
} from "../../../../packages/domain/src";
import { initialState, groups } from "../data/demo";

type ObjectValue = Record<string, unknown>;
const object = (value: unknown): value is ObjectValue =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const identifier = (value: unknown): value is string =>
  typeof value === "string" &&
  /^[a-zA-Z0-9_-]+$/.test(value) &&
  !["__proto__", "constructor", "prototype"].includes(value);
const date = (value: unknown): value is string =>
  typeof value === "string" &&
  /^\d{4}-\d{2}-\d{2}T/.test(value) &&
  Number.isFinite(Date.parse(value));
const categories: PhotoCategory[] = [
  "family",
  "sports",
  "trips",
  "work",
  "pets",
  "screenshots",
  "events",
  "places",
  "other",
];
const category = (value: unknown): value is PhotoCategory =>
  categories.includes(value as PhotoCategory);

export class SnapshotError extends Error {
  constructor(
    readonly payload: string,
    readonly kind: "malformed" | "unsupported" | "damaged",
    readonly recoverable: LocalState | null = null,
    readonly repairs = 0,
  ) {
    super("Unsupported or damaged local data. No data was overwritten.");
    this.name = "SnapshotError";
  }
}

/** Validate every nested value before it can reach a screen or domain function.
 * Only the known v1 schema is salvageable; unknown versions are never downgraded implicitly.
 */
export function decodeSnapshot(payload: string): LocalState {
  let source: unknown;
  try {
    source = JSON.parse(payload);
  } catch {
    throw new SnapshotError(payload, "malformed");
  }
  if (!object(source)) throw new SnapshotError(payload, "damaged");
  if (source.version !== 1) throw new SnapshotError(payload, "unsupported");
  const state = initialState();
  let repairs = 0;
  function entries<T>(
    value: unknown,
    valid: (entry: unknown) => entry is T,
    fallback: T[] = [],
  ): T[] {
    if (!Array.isArray(value)) {
      repairs++;
      return fallback;
    }
    return value.filter((entry): entry is T => {
      if (valid(entry)) return true;
      repairs++;
      return false;
    });
  }
  const albumIds = new Set<string>();
  state.albums = entries<Album>(
    source.albums,
    (entry): entry is Album => {
      if (
        !object(entry) ||
        !identifier(entry.id) ||
        albumIds.has(entry.id) ||
        typeof entry.name !== "string" ||
        !entry.name.trim() ||
        entry.name.length > 60 ||
        (entry.category !== undefined && !category(entry.category)) ||
        (entry.custom !== undefined && typeof entry.custom !== "boolean")
      )
        return false;
      albumIds.add(entry.id);
      return true;
    },
    state.albums,
  );
  state.albums.forEach((album) => albumIds.add(album.id));
  for (const album of initialState().albums) {
    if (!albumIds.has(album.id)) {
      repairs++;
      state.albums.push(album);
      albumIds.add(album.id);
    }
  }
  const photoIds = new Set(Object.keys(state.memberships));
  const memberships = object(source.memberships) ? source.memberships : {};
  if (!object(source.memberships)) repairs++;
  // Missing/corrupt assignments become unassigned, rather than inventing user intent.
  state.memberships = Object.fromEntries(
    [...photoIds].map((id) => {
      const ids = entries<string>(
        memberships[id],
        (value): value is string =>
          typeof value === "string" && albumIds.has(value),
      );
      const unique = [...new Set(ids)];
      if (unique.length !== ids.length) repairs++;
      return [id, unique];
    }),
  );
  if (Object.keys(memberships).some((id) => !photoIds.has(id))) repairs++;
  const decisionIds = new Set<string>();
  state.decisions = entries<DemoDecision>(
    source.decisions,
    (entry): entry is DemoDecision => {
      if (
        !object(entry) ||
        typeof entry.id !== "string" ||
        !entry.id ||
        decisionIds.has(entry.id) ||
        !date(entry.timestamp) ||
        !["keep", "skip", "review_for_deletion"].includes(
          entry.action as string,
        ) ||
        (entry.learningEligible !== undefined &&
          typeof entry.learningEligible !== "boolean")
      )
        return false;
      const group = groups.find((group) => group.id === entry.groupId);
      if (
        !group ||
        !Array.isArray(entry.assetIds) ||
        !entry.assetIds.length ||
        !entry.assetIds.every(
          (id) => typeof id === "string" && group.assetIds.includes(id),
        ) ||
        new Set(entry.assetIds).size !== entry.assetIds.length
      )
        return false;
      // Corruption must never turn a protected memory or keeper into a removal intention.
      if (
        entry.action === "review_for_deletion" &&
        entry.assetIds.some(
          (id) =>
            !group.candidateIds.includes(id) || id === group.suggestedKeeperId,
        )
      )
        return false;
      decisionIds.add(entry.id);
      return true;
    },
  );
  state.corrections = entries<AlbumCorrection>(
    source.corrections,
    (entry): entry is AlbumCorrection =>
      object(entry) &&
      typeof entry.photoId === "string" &&
      photoIds.has(entry.photoId) &&
      typeof entry.albumId === "string" &&
      albumIds.has(entry.albumId) &&
      typeof entry.assigned === "boolean" &&
      date(entry.timestamp),
  );
  state.ignoredCategories = entries<PhotoCategory>(
    source.ignoredCategories,
    category,
  );
  if (typeof source.learningEnabled === "boolean")
    state.learningEnabled = source.learningEnabled;
  else {
    repairs++;
    state.learningEnabled = false;
  }
  if (source.learningSince === null || date(source.learningSince))
    state.learningSince = source.learningSince;
  else {
    repairs++;
    state.learningEnabled = false;
  }
  if (typeof source.organizationPreview === "boolean")
    state.organizationPreview = source.organizationPreview;
  else {
    repairs++;
    state.organizationPreview = false;
  }
  if (repairs) throw new SnapshotError(payload, "damaged", state, repairs);
  return state;
}
