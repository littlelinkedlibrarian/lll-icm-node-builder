import { mkdirSync, readFileSync } from "node:fs";
import { dirname } from "node:path";
import { backup as sqliteBackup, DatabaseSync } from "node:sqlite";
import * as sqliteVec from "sqlite-vec";

export function openDatabase(path: string): DatabaseSync {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path, { allowExtension: true });
  db.exec("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;");
  sqliteVec.load(db);
  db.exec("CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL)");
  const applied = db.prepare("SELECT 1 FROM schema_migrations WHERE version = 1").get();
  if (!applied) {
    const sql = readFileSync(new URL("../../migrations/001_initial.sql", import.meta.url), "utf8");
    db.exec("BEGIN IMMEDIATE");
    try {
      db.exec(sql);
      db.prepare("INSERT INTO schema_migrations(version, applied_at) VALUES (?, ?)").run(1, new Date().toISOString());
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }
  return db;
}

export function readiness(db: DatabaseSync): { database: "ready"; vector: "ready" } {
  db.prepare("SELECT 1").get();
  db.prepare("SELECT vec_version()").get();
  return { database: "ready", vector: "ready" };
}

export function integrityCheck(db: DatabaseSync): void {
  const row = db.prepare("PRAGMA integrity_check").get() as { integrity_check?: string };
  if (row.integrity_check !== "ok") throw new Error("database_integrity");
}

export async function backupDatabase(db: DatabaseSync, destination: string): Promise<number> {
  mkdirSync(dirname(destination), { recursive: true });
  db.exec("PRAGMA wal_checkpoint(PASSIVE)");
  return sqliteBackup(db, destination);
}
