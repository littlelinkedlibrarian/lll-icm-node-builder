CREATE TABLE boxes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  latitude REAL,
  longitude REAL,
  visibility TEXT NOT NULL CHECK (visibility IN ('public', 'private')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK ((latitude IS NULL AND longitude IS NULL) OR
         (latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180))
);

CREATE TABLE books (
  id TEXT PRIMARY KEY,
  box_id TEXT NOT NULL REFERENCES boxes(id),
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  isbn TEXT,
  genre TEXT,
  description TEXT,
  language TEXT,
  condition TEXT,
  visibility TEXT NOT NULL CHECK (visibility IN ('public', 'private')),
  ai_provenance TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX books_box_id ON books(box_id);

CREATE TABLE scan_candidates (
  id TEXT PRIMARY KEY,
  box_id TEXT NOT NULL REFERENCES boxes(id),
  state TEXT NOT NULL CHECK (state IN ('pending', 'confirmed', 'rejected')),
  fields TEXT NOT NULL,
  provenance TEXT NOT NULL,
  approved_book_id TEXT REFERENCES books(id),
  idempotency_key TEXT UNIQUE,
  actor TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE book_embeddings (
  id INTEGER PRIMARY KEY,
  book_id TEXT NOT NULL UNIQUE REFERENCES books(id) ON DELETE CASCADE,
  representation TEXT NOT NULL,
  source_hash TEXT NOT NULL,
  model TEXT NOT NULL,
  dimensions INTEGER NOT NULL CHECK (dimensions = 1536),
  created_at TEXT NOT NULL
);

CREATE VIRTUAL TABLE book_vectors USING vec0(embedding float[1536]);

CREATE TABLE audit_events (
  id TEXT PRIMARY KEY,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  correlation_key TEXT,
  created_at TEXT NOT NULL
);
