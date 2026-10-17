export type PhotoId = string;
export type ReviewAction = "keep" | "delete_approved" | "skip";
export type PhotoCategory =
  | "family"
  | "sports"
  | "trips"
  | "work"
  | "pets"
  | "screenshots"
  | "events"
  | "places"
  | "other";
export interface PhotoRecord {
  id: PhotoId;
  capturedAt?: string;
  categories: PhotoCategory[];
}
export interface Recommendation {
  assetIds: PhotoId[];
  suggestedKeeperId?: PhotoId;
  reason: string;
  requiresApproval: true;
}
export interface ReviewDecision {
  assetIds: PhotoId[];
  action: ReviewAction;
  timestamp: string;
}

/** M1 review intent is deliberately distinct from an authorized PhotoKit deletion. */
export type DemoReviewAction = "keep" | "review_for_deletion" | "skip";
export type CleanupKind = "duplicates" | "similar" | "blurry" | "screenshots";
export interface DemoPhoto extends PhotoRecord {
  title: string;
  assetKey: string;
  bytes: number;
  width: number;
  height: number;
  location: string;
  protected: boolean;
  protectionReason?: string;
}
export interface CleanupGroup extends Recommendation {
  id: string;
  kind: CleanupKind;
  title: string;
  candidateIds: PhotoId[];
}
export interface Album {
  id: string;
  name: string;
  category?: PhotoCategory;
  custom?: boolean;
}
export interface DemoDecision {
  /** False when the user paused learning; review history is still retained. */
  learningEligible?: boolean;
  id: string;
  groupId: string;
  assetIds: PhotoId[];
  action: DemoReviewAction;
  timestamp: string;
}
export interface AlbumCorrection {
  photoId: string;
  albumId: string;
  assigned: boolean;
  timestamp: string;
}
export interface LocalState {
  version: 1;
  decisions: DemoDecision[];
  albums: Album[];
  memberships: Record<PhotoId, string[]>;
  corrections: AlbumCorrection[];
  learningEnabled: boolean;
  learningSince: string | null;
  ignoredCategories: PhotoCategory[];
  organizationPreview: boolean;
}
