import { randomUUID } from "node:crypto";
import type { DatabaseSync, SQLInputValue } from "node:sqlite";
import type { Book, Box, CandidateFields, ScanCandidate, Visibility } from "../domain/model.js";
import type { CandidateRepository, Page, VectorIndex } from "../ports/index.js";

type Row = Record<string, unknown>;
const now = () => new Date().toISOString();
const text = (value: unknown) => value === null || value === undefined ? null : String(value);

function boxFrom(row: Row): Box {
  return {
    id: String(row.id), name: String(row.name), description: text(row.description),
    location: text(row.location), latitude: row.latitude === null ? null : Number(row.latitude),
    longitude: row.longitude === null ? null : Number(row.longitude),
    visibility: String(row.visibility) as Visibility,
    createdAt: String(row.created_at), updatedAt: String(row.updated_at)
  };
}

function bookFrom(row: Row): Book {
  return {
    id: String(row.id), boxId: String(row.box_id), title: String(row.title), author: String(row.author),
    isbn: text(row.isbn), genre: text(row.genre), description: text(row.description),
    language: text(row.language), condition: text(row.condition), visibility: String(row.visibility) as Visibility,
    aiProvenance: row.ai_provenance ? JSON.parse(String(row.ai_provenance)) as Record<string, unknown> : null,
    createdAt: String(row.created_at), updatedAt: String(row.updated_at)
  };
}

function candidateFrom(row: Row): ScanCandidate {
  return {
    id: String(row.id), boxId: String(row.box_id), state: String(row.state) as ScanCandidate["state"],
    fields: JSON.parse(String(row.fields)) as CandidateFields,
    provenance: JSON.parse(String(row.provenance)) as Record<string, unknown>,
    approvedBookId: text(row.approved_book_id), idempotencyKey: text(row.idempotency_key),
    createdAt: String(row.created_at), updatedAt: String(row.updated_at)
  };
}

export class SqliteStore implements CandidateRepository, VectorIndex {
  constructor(private readonly db: DatabaseSync) {}

  create(input: Omit<Box, "id" | "createdAt" | "updatedAt">): Box;
  create(input: Omit<Book, "id" | "createdAt" | "updatedAt">): Book;
  create(input: Omit<Box, "id" | "createdAt" | "updatedAt"> | Omit<Book, "id" | "createdAt" | "updatedAt">): Box | Book {
    return "boxId" in input ? this.createBook(input) : this.createBox(input);
  }

  private createBox(input: Omit<Box, "id" | "createdAt" | "updatedAt">): Box {
    const id = randomUUID(), timestamp = now();
    this.db.prepare(`INSERT INTO boxes VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      id, input.name, input.description, input.location, input.latitude, input.longitude, input.visibility, timestamp, timestamp
    );
    return this.getBox(id)!;
  }

  private createBook(input: Omit<Book, "id" | "createdAt" | "updatedAt">): Book {
    const id = randomUUID(), timestamp = now();
    this.db.prepare(`INSERT INTO books VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      id, input.boxId, input.title, input.author, input.isbn, input.genre, input.description,
      input.language, input.condition, input.visibility,
      input.aiProvenance ? JSON.stringify(input.aiProvenance) : null, timestamp, timestamp
    );
    return this.getBook(id)!;
  }

  get(id: string, publicOnly?: boolean): Box | Book | undefined {
    return this.getBox(id, publicOnly) ?? this.getBook(id, publicOnly);
  }
  getBox(id: string, publicOnly = false): Box | undefined {
    const row = this.db.prepare(`SELECT * FROM boxes WHERE id = ?${publicOnly ? " AND visibility = 'public'" : ""}`).get(id) as Row | undefined;
    return row ? boxFrom(row) : undefined;
  }
  getBook(id: string, publicOnly = false): Book | undefined {
    const row = this.db.prepare(`SELECT b.* FROM books b JOIN boxes x ON x.id=b.box_id WHERE b.id = ?${publicOnly ? " AND b.visibility='public' AND x.visibility='public'" : ""}`).get(id) as Row | undefined;
    return row ? bookFrom(row) : undefined;
  }

  list(page: number, limit: number, publicOnly?: boolean): Page<Box>;
  list(page: number, limit: number, boxId?: string, publicOnly?: boolean): Page<Book>;
  list(page: number, limit: number, third?: string | boolean, fourth?: boolean): Page<Box> | Page<Book> {
    return typeof third === "string" ? this.listBooks(page, limit, third, fourth) : this.listBoxes(page, limit, third);
  }
  listBoxes(page: number, limit: number, publicOnly = false): Page<Box> {
    const where = publicOnly ? " WHERE visibility='public'" : "";
    const data = this.db.prepare(`SELECT * FROM boxes${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(limit, (page - 1) * limit) as Row[];
    const count = this.db.prepare(`SELECT COUNT(*) total FROM boxes${where}`).get() as Row;
    return { data: data.map(boxFrom), page, limit, total: Number(count.total) };
  }
  listBooks(page: number, limit: number, boxId?: string, publicOnly = false): Page<Book> {
    const terms: string[] = [], params: SQLInputValue[] = [];
    if (boxId) { terms.push("b.box_id=?"); params.push(boxId); }
    if (publicOnly) terms.push("b.visibility='public'", "x.visibility='public'");
    const where = terms.length ? ` WHERE ${terms.join(" AND ")}` : "";
    const data = this.db.prepare(`SELECT b.* FROM books b JOIN boxes x ON x.id=b.box_id${where} ORDER BY b.created_at DESC LIMIT ? OFFSET ?`).all(...params, limit, (page - 1) * limit) as Row[];
    const count = this.db.prepare(`SELECT COUNT(*) total FROM books b JOIN boxes x ON x.id=b.box_id${where}`).get(...params) as Row;
    return { data: data.map(bookFrom), page, limit, total: Number(count.total) };
  }

  update(id: string, input: Partial<Omit<Box, "id" | "createdAt" | "updatedAt">>): Box | undefined;
  update(id: string, input: Partial<Omit<Book, "id" | "createdAt" | "updatedAt">>): Book | undefined;
  update(id: string, input: Record<string, unknown>): Box | Book | undefined {
    return this.getBox(id) ? this.updateBox(id, input) : this.getBook(id) ? this.updateBook(id, input) : undefined;
  }
  private updateBox(id: string, input: Record<string, unknown>): Box {
    const current = this.getBox(id)!;
    const next = { ...current, ...input, updatedAt: now() };
    this.db.prepare(`UPDATE boxes SET name=?,description=?,location=?,latitude=?,longitude=?,visibility=?,updated_at=? WHERE id=?`).run(
      next.name, next.description, next.location, next.latitude, next.longitude, next.visibility, next.updatedAt, id
    );
    return this.getBox(id)!;
  }
  private updateBook(id: string, input: Record<string, unknown>): Book {
    const current = this.getBook(id)!;
    const next = { ...current, ...input, updatedAt: now() };
    this.db.prepare(`UPDATE books SET box_id=?,title=?,author=?,isbn=?,genre=?,description=?,language=?,condition=?,visibility=?,ai_provenance=?,updated_at=? WHERE id=?`).run(
      next.boxId, next.title, next.author, next.isbn, next.genre, next.description, next.language,
      next.condition, next.visibility, next.aiProvenance ? JSON.stringify(next.aiProvenance) : null, next.updatedAt, id
    );
    return this.getBook(id)!;
  }

  delete(id: string): boolean | "deleted" | "missing" | "not_empty" {
    if (this.getBox(id)) {
      const count = this.db.prepare("SELECT COUNT(*) total FROM books WHERE box_id=?").get(id) as Row;
      if (Number(count.total) > 0) return "not_empty";
      return this.db.prepare("DELETE FROM boxes WHERE id=?").run(id).changes ? "deleted" : "missing";
    }
    if (!this.getBook(id)) return false;
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const embedding = this.db.prepare("SELECT id FROM book_embeddings WHERE book_id=?").get(id) as Row | undefined;
      if (embedding) this.db.prepare("DELETE FROM book_vectors WHERE rowid=?").run(BigInt(String(embedding.id)));
      const result = this.db.prepare("DELETE FROM books WHERE id=?").run(id);
      this.db.exec("COMMIT");
      return Boolean(result.changes);
    } catch (error) { this.db.exec("ROLLBACK"); throw error; }
  }

  keyword(query: string, boxId?: string): Book[] {
    const like = `%${query.toLowerCase()}%`;
    const params: SQLInputValue[] = [like, like, like];
    const box = boxId ? " AND b.box_id=?" : "";
    if (boxId) params.push(boxId);
    const rows = this.db.prepare(`SELECT b.* FROM books b JOIN boxes x ON x.id=b.box_id WHERE b.visibility='public' AND x.visibility='public' AND (lower(b.title) LIKE ? OR lower(b.author) LIKE ? OR lower(coalesce(b.description,'')) LIKE ?)${box} LIMIT 50`).all(...params) as Row[];
    return rows.map(bookFrom);
  }

  createCandidate(boxId: string, fields: CandidateFields, provenance: Record<string, unknown>): ScanCandidate {
    const id = randomUUID(), timestamp = now();
    this.db.prepare("INSERT INTO scan_candidates(id,box_id,state,fields,provenance,created_at,updated_at) VALUES (?,?,'pending',?,?,?,?)").run(
      id, boxId, JSON.stringify(fields), JSON.stringify(provenance), timestamp, timestamp
    );
    return this.getCandidate(id)!;
  }
  getCandidate(id: string): ScanCandidate | undefined {
    const row = this.db.prepare("SELECT * FROM scan_candidates WHERE id=?").get(id) as Row | undefined;
    return row ? candidateFrom(row) : undefined;
  }
  updateFields(id: string, fields: CandidateFields): ScanCandidate | undefined {
    const candidate = this.getCandidate(id);
    if (!candidate || candidate.state !== "pending") return undefined;
    this.db.prepare("UPDATE scan_candidates SET fields=?,updated_at=? WHERE id=?").run(JSON.stringify(fields), now(), id);
    return this.getCandidate(id);
  }
  reject(id: string): ScanCandidate | undefined {
    const candidate = this.getCandidate(id);
    if (!candidate || candidate.state !== "pending") return undefined;
    this.db.prepare("UPDATE scan_candidates SET state='rejected',updated_at=? WHERE id=?").run(now(), id);
    return this.getCandidate(id);
  }
  confirm(id: string, actor: string, idempotencyKey: string): { candidate: ScanCandidate; book: Book } {
    const existing = this.db.prepare("SELECT * FROM scan_candidates WHERE idempotency_key=?").get(idempotencyKey) as Row | undefined;
    if (existing) {
      const candidate = candidateFrom(existing);
      if (candidate.id !== id) throw new Error("idempotency_conflict");
      return { candidate, book: this.getBook(candidate.approvedBookId!)! };
    }
    const candidate = this.getCandidate(id);
    if (!candidate || candidate.state !== "pending") throw new Error("invalid_candidate_state");
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const book = this.createBook({
        boxId: candidate.boxId, ...candidate.fields, visibility: "public",
        aiProvenance: candidate.provenance
      });
      const timestamp = now();
      this.db.prepare("UPDATE scan_candidates SET state='confirmed',approved_book_id=?,idempotency_key=?,actor=?,updated_at=? WHERE id=?").run(
        book.id, idempotencyKey, actor, timestamp, id
      );
      this.db.prepare("INSERT INTO audit_events VALUES (?,?,?,?,?,?,?)").run(
        randomUUID(), actor, "candidate.confirm", "book", book.id, idempotencyKey, timestamp
      );
      this.db.exec("COMMIT");
      return { candidate: this.getCandidate(id)!, book };
    } catch (error) { this.db.exec("ROLLBACK"); throw error; }
  }

  put(bookId: string, vector: number[], representation: string, sourceHash: string, model: string): void {
    if (vector.length !== 1536) throw new Error("embedding_dimension");
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const old = this.db.prepare("SELECT id FROM book_embeddings WHERE book_id=?").get(bookId) as Row | undefined;
      if (old) this.db.prepare("DELETE FROM book_vectors WHERE rowid=?").run(BigInt(String(old.id)));
      this.db.prepare(`INSERT INTO book_embeddings(book_id,representation,source_hash,model,dimensions,created_at)
        VALUES (?,?,?,?,1536,?) ON CONFLICT(book_id) DO UPDATE SET representation=excluded.representation,source_hash=excluded.source_hash,model=excluded.model,dimensions=1536,created_at=excluded.created_at`).run(
        bookId, representation, sourceHash, model, now()
      );
      const row = this.db.prepare("SELECT id FROM book_embeddings WHERE book_id=?").get(bookId) as Row;
      this.db.prepare("INSERT INTO book_vectors(rowid,embedding) VALUES (?,?)").run(BigInt(String(row.id)), Float32Array.from(vector));
      this.db.exec("COMMIT");
    } catch (error) { this.db.exec("ROLLBACK"); throw error; }
  }
  search(vector: number[], limit: number, boxId?: string): Book[] {
    if (vector.length !== 1536) throw new Error("embedding_dimension");
    const box = boxId ? " AND b.box_id=?" : "";
    const params: SQLInputValue[] = [Float32Array.from(vector), limit];
    if (boxId) params.push(boxId);
    const rows = this.db.prepare(`SELECT b.* FROM book_vectors v JOIN book_embeddings e ON e.id=v.rowid JOIN books b ON b.id=e.book_id JOIN boxes x ON x.id=b.box_id WHERE v.embedding MATCH ? AND k=? AND b.visibility='public' AND x.visibility='public'${box} ORDER BY v.distance`).all(...params) as Row[];
    return rows.map(bookFrom);
  }
}
