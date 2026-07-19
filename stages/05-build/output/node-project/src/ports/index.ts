import type { AssortedCapture, AssortedFields, Book, Box, CandidateFields, ScanCandidate } from "../domain/model.js";

export interface Page<T> { data: T[]; page: number; limit: number; total: number }
export interface BoxRepository {
  create(input: Omit<Box, "id" | "createdAt" | "updatedAt">): Box;
  get(id: string, publicOnly?: boolean): Box | undefined;
  list(page: number, limit: number, publicOnly?: boolean): Page<Box>;
  update(id: string, input: Partial<Omit<Box, "id" | "createdAt" | "updatedAt">>): Box | undefined;
  delete(id: string): "deleted" | "missing" | "not_empty";
}
export interface BookRepository {
  create(input: Omit<Book, "id" | "createdAt" | "updatedAt">): Book;
  get(id: string, publicOnly?: boolean): Book | undefined;
  list(page: number, limit: number, boxId?: string, publicOnly?: boolean): Page<Book>;
  update(id: string, input: Partial<Omit<Book, "id" | "createdAt" | "updatedAt">>): Book | undefined;
  delete(id: string): boolean;
  keyword(query: string, boxId?: string): Book[];
}
export interface CandidateRepository {
  createCandidate(boxId: string, fields: CandidateFields, provenance: Record<string, unknown>): ScanCandidate;
  getCandidate(id: string): ScanCandidate | undefined;
  updateFields(id: string, fields: CandidateFields): ScanCandidate | undefined;
  reject(id: string): ScanCandidate | undefined;
  confirm(id: string, actor: string, idempotencyKey: string): { candidate: ScanCandidate; book: Book };
}
export interface VisionExtractor {
  extract(image: { mimeType: string; bytes: Uint8Array }): Promise<{ fields: CandidateFields; provenance: Record<string, unknown> }>;
}
export interface AssortedExtractor {
  extractAssorted(image: { mimeType: string; bytes: Uint8Array }): Promise<{ fields: AssortedFields; provenance: Record<string, unknown> }>;
}
export interface AssortedCaptureRepository {
  createAssorted(input: { boxId: string; mimeType: string; bytes: Uint8Array; fields: AssortedFields }): AssortedCapture;
  getAssorted(id: string): AssortedCapture | undefined;
  listAssorted(boxId?: string, state?: AssortedCapture["state"]): AssortedCapture[];
  getAssortedImage(id: string): { mimeType: string; bytes: Uint8Array } | undefined;
  enrichAssorted(id: string, fields: AssortedFields, provenance: Record<string, unknown>): AssortedCapture | undefined;
  updateAssorted(id: string, fields: AssortedFields): AssortedCapture | undefined;
  rejectAssorted(id: string): AssortedCapture | undefined;
  confirmAssorted(id: string, actor: string, idempotencyKey: string): AssortedCapture;
}
export interface Embedder {
  embed(text: string): Promise<number[]>;
}
export interface VectorIndex {
  put(bookId: string, vector: number[], representation: string, sourceHash: string, model: string): void;
  search(vector: number[], limit: number, boxId?: string): Book[];
}
