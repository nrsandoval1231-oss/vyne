import type { PhotoRecord } from "../../../packages/domain/src";
export type LibraryPermission =
  "notDetermined" | "limited" | "authorized" | "denied" | "restricted";
export interface NativePhotoMetadata extends PhotoRecord {
  revision: string;
  width: number;
  height: number;
  mediaType: "image" | "video";
  isLivePhoto: boolean;
}
/** Future Swift / PhotoKit contract. No implementation is registered in M1. */
export interface PhotoLibraryService {
  getPermission(): Promise<LibraryPermission>;
  requestPermission(): Promise<LibraryPermission>;
  inventory(
    cursor?: string,
    signal?: AbortSignal,
  ): Promise<{ assets: NativePhotoMetadata[]; nextCursor?: string }>;
  thumbnail(
    id: string,
    size: { width: number; height: number },
  ): Promise<{ uri: string; releaseToken: string }>;
  releaseThumbnail(token: string): Promise<void>;
  observeChanges(
    listener: (change: {
      changed: string[];
      removed: string[];
      requiresReconciliation: boolean;
    }) => void,
  ): () => void;
  metadata(id: string): Promise<NativePhotoMetadata | null>;
  extractFeatures(
    id: string,
    revision: string,
  ): Promise<{ version: string; fingerprint?: string; blur?: number }>;
  syncAlbum(request: {
    title: string;
    assetIds: string[];
    explicitlyAuthorized: true;
  }): Promise<{ albumId: string }>;
  requestDeletion(request: {
    assets: { id: string; revision: string }[];
    explicitlyAuthorized: true;
  }): Promise<{ status: "completed" | "cancelled"; deletedIds: string[] }>;
}
export const nativeIntegration = {
  available: false,
  reason:
    "PhotoKit integration is planned for M2. M1 uses bundled demonstration photos only.",
} as const;
