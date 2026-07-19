export type Visibility = "public" | "private";
export type CandidateState = "pending" | "confirmed" | "rejected";
export type SearchMode = "semantic" | "keyword" | "keyword_fallback";
export type AssortedCaptureState = "pending_review" | "confirmed" | "rejected";
export type ScanActivityState = "processing" | "pending_review" | "completed" | "failed";

export interface Box {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  visibility: Visibility;
  createdAt: string;
  updatedAt: string;
}

export interface Book {
  id: string;
  boxId: string;
  title: string;
  author: string;
  isbn: string | null;
  genre: string | null;
  description: string | null;
  language: string | null;
  condition: string | null;
  visibility: Visibility;
  aiProvenance: Record<string, unknown> | null;
  coverUrl?: string | null;
  publicationYear?: number | null;
  metadataProvenance?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface CandidateFields {
  title: string;
  author: string;
  isbn: string | null;
  genre: string | null;
  description: string | null;
  language: string | null;
  condition: string | null;
}

export interface ScanCandidate {
  id: string;
  boxId: string;
  state: CandidateState;
  fields: CandidateFields;
  provenance: Record<string, unknown>;
  approvedBookId: string | null;
  idempotencyKey: string | null;
  activityId: string | null;
  metadataProposals?: BookMetadataProposal[];
  createdAt: string;
  updatedAt: string;
}

export interface MediaAsset {
  id: string; storageKey: string; mimeType: string; byteSize: number; sha256: string;
  width: number | null; height: number | null; derivativeOf: string | null;
  createdAt: string; deletedAt: string | null;
}

export interface ScanActivity {
  id: string; boxId: string; state: ScanActivityState; mediaAssetId: string;
  provenance: Record<string, unknown>; errorCode: string | null; errorMessage: string | null;
  createdAt: string; updatedAt: string; completedAt: string | null;
}

export interface BookMetadataProposal {
  id: string; candidateId: string; provider: string; workId: string | null; editionId: string | null;
  isbn10: string | null; isbn13: string | null; title: string; authors: string[]; description: string | null;
  language: string | null; publisher: string | null; publishedDate: string | null; subjects: string[];
  coverUrl: string | null; sourceUrl: string; selected: boolean; createdAt: string;
}

export interface ScanActivityEvent {
  id: string; activityId: string; eventType: string; candidateId: string | null; actor: string | null;
  detail: Record<string, unknown>; createdAt: string;
}

export interface AssortedFields {
  title: string;
  category: string | null;
  description: string | null;
  tags: string[];
  condition: string | null;
  quantity: number | null;
  unknowns: string[];
  reviewQuestions: string[];
}

export interface AssortedCapture {
  id: string;
  boxId: string;
  state: AssortedCaptureState;
  mimeType: string;
  imageSha256: string;
  fields: AssortedFields;
  aiProcessed: boolean;
  provenance: Record<string, unknown>;
  actor: string | null;
  idempotencyKey: string | null;
  createdAt: string;
  updatedAt: string;
}
