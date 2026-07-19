import type { BookMetadataProposal, CandidateFields } from "../domain/model.js";
import type { BibliographicProvider } from "../ports/index.js";
import { validatedIsbn } from "../application/isbn.js";

type Proposal = Omit<BookMetadataProposal, "id" | "candidateId" | "selected" | "createdAt">;
type OpenLibraryEdition = { key?: string; title?: string; isbn_10?: string[]; isbn_13?: string[]; language?: string[]; publisher?: string[]; publish_date?: string; cover_i?: number };
type OpenLibraryDoc = { key?: string; title?: string; author_name?: string[]; isbn?: string[]; edition_key?: string[]; language?: string[]; publisher?: string[]; publish_date?: string[]; first_publish_year?: number; cover_i?: number; subject?: string[]; first_sentence?: string[] | string; editions?: { docs?: OpenLibraryEdition[] } };

const first = <T>(value: T[] | undefined): T | null => value?.[0] ?? null;
const description = (value: string[] | string | undefined) => Array.isArray(value) ? first(value) : value ?? null;

export class OpenLibraryProvider implements BibliographicProvider {
  private readonly cache = new Map<string, { expires: number; value: Proposal[] }>();
  constructor(private readonly userAgent: string, private readonly timeoutMs = 8000) {}
  async findEditions(fields: CandidateFields): Promise<Proposal[]> {
    const visibleIsbn = validatedIsbn(fields.isbn);
    const params = new URLSearchParams({ limit: "5", fields: "key,title,author_name,isbn,edition_key,language,publisher,publish_date,first_publish_year,cover_i,subject,first_sentence,editions,editions.key,editions.title,editions.isbn_10,editions.isbn_13,editions.language,editions.publisher,editions.publish_date,editions.cover_i" });
    if (visibleIsbn) params.set("isbn", visibleIsbn); else { params.set("title", fields.title); params.set("author", fields.author); }
    if (fields.language?.length === 2) params.set("lang", fields.language);
    const cacheKey = params.toString(), cached = this.cache.get(cacheKey);
    if (cached && cached.expires > Date.now()) return cached.value;
    const response = await fetch("https://openlibrary.org/search.json?" + cacheKey, { headers: { "user-agent": this.userAgent, accept: "application/json" }, signal: AbortSignal.timeout(this.timeoutMs) });
    if (!response.ok) throw new Error("bibliographic_unavailable");
    const payload = await response.json() as { docs?: OpenLibraryDoc[] };
    const value = (payload.docs ?? []).slice(0, 5).map((doc): Proposal => {
      const edition = doc.editions?.docs?.[0];
      const isbn13 = first(edition?.isbn_13?.map(validatedIsbn).filter((item): item is string => Boolean(item))) ?? first(doc.isbn?.map(validatedIsbn).filter((item): item is string => item?.length === 13)) ?? null;
      const isbn10 = first(edition?.isbn_10?.map(validatedIsbn).filter((item): item is string => Boolean(item))) ?? first(doc.isbn?.map(validatedIsbn).filter((item): item is string => item?.length === 10)) ?? null;
      const editionId = edition?.key?.replace("/books/", "") ?? first(doc.edition_key), workId = doc.key?.replace("/works/", "") ?? null;
      const coverId = edition?.cover_i ?? doc.cover_i, sourceId = editionId ? "/books/" + editionId : workId ? "/works/" + workId : "/search";
      return { provider: "openlibrary", workId, editionId: editionId ?? null, isbn10, isbn13, title: edition?.title ?? doc.title ?? fields.title, authors: doc.author_name?.slice(0, 5) ?? [fields.author], description: description(doc.first_sentence), language: first(edition?.language) ?? first(doc.language), publisher: first(edition?.publisher) ?? first(doc.publisher), publishedDate: edition?.publish_date ?? first(doc.publish_date) ?? (doc.first_publish_year ? String(doc.first_publish_year) : null), subjects: doc.subject?.slice(0, 12) ?? [], coverUrl: coverId ? "https://covers.openlibrary.org/b/id/" + coverId + "-M.jpg?default=false" : null, sourceUrl: "https://openlibrary.org" + sourceId };
    });
    this.cache.set(cacheKey, { expires: Date.now() + 24 * 60 * 60 * 1000, value });
    return value;
  }
}
