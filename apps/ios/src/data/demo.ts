import type {
  Album,
  CleanupGroup,
  DemoPhoto,
  LocalState,
  PhotoCategory,
} from "../../../../packages/domain/src";
const photo = (
  id: string,
  title: string,
  assetKey: string,
  categories: PhotoCategory[],
  bytes: number,
  protectedMemory = false,
): DemoPhoto => ({
  id,
  title,
  assetKey,
  categories,
  bytes,
  width: 3024,
  height: 4032,
  capturedAt: "2026-09-12T16:42:00Z",
  location: assetKey === "lake" ? "Lake Como, Italy · demo" : "Sample location",
  protected: protectedMemory,
  protectionReason: protectedMemory
    ? "A potentially unique family memory. Technical quality alone is not a reason to remove it."
    : undefined,
});
export const photos: DemoPhoto[] = [
  photo(
    "lake-1",
    "A little further away",
    "lake",
    ["trips", "places", "events"],
    4200000,
  ),
  photo(
    "lake-2",
    "Lake afternoon · copy",
    "lake",
    ["trips", "places"],
    4200000,
  ),
  photo(
    "family-1",
    "The moments that stay",
    "family",
    ["family", "events"],
    3800000,
    true,
  ),
  photo(
    "family-2",
    "A beautifully imperfect moment",
    "blurry",
    ["family", "events"],
    3100000,
    true,
  ),
  photo(
    "sport-1",
    "One more mile",
    "sports",
    ["sports", "family", "events"],
    5100000,
  ),
  photo(
    "sport-2",
    "Race day · alternate 2",
    "sports",
    ["sports", "family"],
    4800000,
  ),
  photo(
    "sport-3",
    "Race day · alternate 3",
    "sports",
    ["sports", "family"],
    4900000,
  ),
  photo(
    "sport-4",
    "Race day · alternate 4",
    "sports",
    ["sports", "family"],
    4700000,
  ),
  photo(
    "sport-5",
    "Race day · alternate 5",
    "sports",
    ["sports", "family"],
    4600000,
  ),
  photo(
    "pet-1",
    "Your favorite little face",
    "pet",
    ["pets", "family"],
    2900000,
    true,
  ),
  photo("work-1", "Room for new ideas", "work", ["work", "places"], 3500000),
  photo(
    "screen-1",
    "An old reservation",
    "screenshot",
    ["screenshots", "trips"],
    850000,
  ),
  photo(
    "screen-2",
    "Reservation · duplicate",
    "screenshot",
    ["screenshots"],
    850000,
  ),
];
export const albums: Album[] = [
  { id: "family", name: "Family", category: "family" },
  { id: "sports", name: "Sports", category: "sports" },
  { id: "trips", name: "Trips", category: "trips" },
  { id: "work", name: "Work & Projects", category: "work" },
  { id: "pets", name: "Pets", category: "pets" },
  { id: "screenshots", name: "Screenshots", category: "screenshots" },
  { id: "events", name: "Events", category: "events" },
  { id: "places", name: "Places", category: "places" },
];
export const groups: CleanupGroup[] = [
  {
    id: "lake",
    kind: "duplicates",
    title: "One view. Twice captured.",
    assetIds: ["lake-1", "lake-2"],
    candidateIds: ["lake-2"],
    suggestedKeeperId: "lake-1",
    reason:
      "These demo records share the same bundled image. Keep one copy of the view; review the other.",
    requiresApproval: true,
  },
  {
    id: "race",
    kind: "similar",
    title: "Keep the best shot",
    assetIds: ["sport-1", "sport-2", "sport-3", "sport-4", "sport-5"],
    candidateIds: ["sport-2", "sport-3", "sport-4", "sport-5"],
    suggestedKeeperId: "sport-1",
    reason:
      "A simulated five-photo burst. The first is the fixture keeper; real sharpness, expression and similarity analysis are not available in M1.",
    requiresApproval: true,
  },
  {
    id: "screens",
    kind: "screenshots",
    title: "Useful then. Needed now?",
    assetIds: ["screen-1", "screen-2"],
    candidateIds: ["screen-1", "screen-2"],
    reason:
      "An expired sample reservation may be temporary clutter. Check whether you still need the information.",
    requiresApproval: true,
  },
  {
    id: "screen-copy",
    kind: "duplicates",
    title: "Another copy of the details",
    assetIds: ["screen-1", "screen-2"],
    candidateIds: ["screen-2"],
    suggestedKeeperId: "screen-1",
    reason:
      "The same sample reservation appears twice. Storage totals count this overlap only once.",
    requiresApproval: true,
  },
  {
    id: "memory",
    kind: "blurry",
    title: "Some moments are irreplaceable",
    assetIds: ["family-2"],
    candidateIds: [],
    reason:
      "This intentionally softened demo image is marked as potentially sentimental. Blur alone never justifies removal. Keep it or skip this review.",
    requiresApproval: true,
  },
];
export function initialState(): LocalState {
  return {
    version: 1,
    decisions: [],
    albums: albums.map((a) => ({ ...a })),
    memberships: Object.fromEntries(
      photos.map((p) => [p.id, [...p.categories]]),
    ),
    corrections: [],
    learningEnabled: true,
    learningSince: null,
    ignoredCategories: [],
    organizationPreview: true,
  };
}
