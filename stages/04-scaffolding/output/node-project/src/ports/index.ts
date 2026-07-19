import type { Book, Box } from "../domain/model.js";

export interface Page<T> { data: T[]; page: number; limit: number; total: number }
export interface BoxRepository {
  create(input: Omit<Box, "id" | "createdAt" | "updatedAt">): Box;
  get(id: string, publicOnly?: boolean): Box | undefined;
  list(page: number, limit: number, publicOnly?: boolean): Page<Box>;
}
export interface BookRepository {
  create(input: Omit<Book, "id" | "createdAt" | "updatedAt">): Book;
  get(id: string, publicOnly?: boolean): Book | undefined;
  list(page: number, limit: number, boxId?: string, publicOnly?: boolean): Page<Book>;
}
export interface VisionExtractor {
  extract(image: { mimeType: string; bytes: Uint8Array }): Promise<unknown>;
}
export interface Embedder {
  embed(text: string): Promise<number[]>;
}
