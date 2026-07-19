CREATE TABLE media_assets (
  id TEXT PRIMARY KEY,
  storage_key TEXT NOT NULL UNIQUE,
  mime_type TEXT NOT NULL,
  byte_size INTEGER NOT NULL CHECK (byte_size > 0),
  sha256 TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  derivative_of TEXT REFERENCES media_assets(id),
  created_at TEXT NOT NULL,
  deleted_at TEXT
);
CREATE INDEX media_assets_sha256 ON media_assets(sha256);

CREATE TABLE scan_activities (
  id TEXT PRIMARY KEY,
  box_id TEXT NOT NULL REFERENCES boxes(id),
  state TEXT NOT NULL CHECK (state IN ('processing', 'pending_review', 'completed', 'failed')),
  media_asset_id TEXT NOT NULL REFERENCES media_assets(id),
  provenance TEXT NOT NULL,
  error_code TEXT,
  error_message TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  completed_at TEXT
);
CREATE INDEX scan_activities_box_created ON scan_activities(box_id, created_at DESC);

ALTER TABLE scan_candidates ADD COLUMN activity_id TEXT REFERENCES scan_activities(id);
CREATE INDEX scan_candidates_activity ON scan_candidates(activity_id);

CREATE TABLE book_metadata_proposals (
  id TEXT PRIMARY KEY,
  candidate_id TEXT NOT NULL REFERENCES scan_candidates(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  work_id TEXT,
  edition_id TEXT,
  isbn_10 TEXT,
  isbn_13 TEXT,
  title TEXT NOT NULL,
  authors TEXT NOT NULL,
  description TEXT,
  language TEXT,
  publisher TEXT,
  published_date TEXT,
  subjects TEXT NOT NULL,
  cover_url TEXT,
  source_url TEXT NOT NULL,
  selected INTEGER NOT NULL DEFAULT 0 CHECK (selected IN (0, 1)),
  created_at TEXT NOT NULL
);
CREATE INDEX book_metadata_candidate ON book_metadata_proposals(candidate_id);

CREATE TABLE scan_activity_events (
  id TEXT PRIMARY KEY,
  activity_id TEXT NOT NULL REFERENCES scan_activities(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  candidate_id TEXT REFERENCES scan_candidates(id),
  actor TEXT,
  detail TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX scan_activity_events_activity ON scan_activity_events(activity_id, created_at);

ALTER TABLE books ADD COLUMN cover_url TEXT;
ALTER TABLE books ADD COLUMN publication_year INTEGER;
ALTER TABLE books ADD COLUMN metadata_provenance TEXT;
