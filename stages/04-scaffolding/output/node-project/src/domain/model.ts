export type Visibility = "public" | "private";
export type CandidateState = "pending" | "confirmed" | "rejected";

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
  createdAt: string;
  updatedAt: string;
}
