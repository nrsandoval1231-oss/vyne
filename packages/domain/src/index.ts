export type PhotoId = string;
export type ReviewAction = 'keep' | 'delete_approved' | 'skip';
export type PhotoCategory = 'family' | 'sports' | 'trips' | 'work' | 'pets' | 'screenshots' | 'events' | 'places' | 'other';
export interface PhotoRecord { id: PhotoId; capturedAt?: string; categories: PhotoCategory[]; }
export interface Recommendation { assetIds: PhotoId[]; suggestedKeeperId?: PhotoId; reason: string; requiresApproval: true; }
export interface ReviewDecision { assetIds: PhotoId[]; action: ReviewAction; timestamp: string; }
