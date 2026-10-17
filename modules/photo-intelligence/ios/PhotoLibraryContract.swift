import Foundation
import Photos

/// M2 design contract only: no Expo module is registered in M1.
/// Revalidate revisions, support limited access, and mutate only after explicit consent.
protocol PhotoLibraryContract {
    func authorizationStatus() -> PHAuthorizationStatus
    func requestAuthorization() async -> PHAuthorizationStatus
    func inventory(after cursor: String?) async throws -> AssetInventoryPage
    func metadata(for identifier: String) async throws -> NativeAssetMetadata?
    func thumbnail(for identifier: String, width: Int, height: Int) async throws -> URL
    func releaseThumbnail(at url: URL) async
    func observeChanges(_ handler: @escaping (AssetChanges) -> Void) -> UUID
    func stopObserving(_ token: UUID)
    func extractFeatures(for identifier: String, revision: String) async throws -> AssetFeatures
    func synchronizeAlbum(title: String, identifiers: [String], consent: ExplicitConsent) async throws -> String
    func requestDeletion(assets: [AssetRevision], consent: ExplicitConsent) async throws -> DeletionResult
}
struct ExplicitConsent { let confirmedAt: Date }
struct AssetRevision { let identifier: String; let revision: String }
struct NativeAssetMetadata {
    let identifier: String
    let revision: String
    let capturedAt: Date?
    let pixelWidth: Int
    let pixelHeight: Int
    let isLivePhoto: Bool
}
struct AssetInventoryPage { let assets: [NativeAssetMetadata]; let nextCursor: String? }
struct AssetChanges { let changed: [String]; let removed: [String]; let requiresReconciliation: Bool }
struct AssetFeatures { let version: String; let fingerprint: String?; let blur: Double? }
enum DeletionResult { case completed(deletedIdentifiers: [String]); case cancelled }
