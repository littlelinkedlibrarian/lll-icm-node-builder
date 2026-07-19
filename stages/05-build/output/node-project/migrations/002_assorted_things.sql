CREATE TABLE assorted_captures (
  id TEXT PRIMARY KEY,
  box_id TEXT NOT NULL REFERENCES boxes(id),
  state TEXT NOT NULL CHECK (state IN ('pending_review', 'confirmed', 'rejected')),
  mime_type TEXT NOT NULL,
  image BLOB NOT NULL,
  image_sha256 TEXT NOT NULL,
  fields TEXT NOT NULL,
  ai_processed INTEGER NOT NULL DEFAULT 0 CHECK (ai_processed IN (0, 1)),
  provenance TEXT NOT NULL,
  actor TEXT,
  idempotency_key TEXT UNIQUE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX assorted_captures_box_id ON assorted_captures(box_id);
CREATE INDEX assorted_captures_state ON assorted_captures(state);
