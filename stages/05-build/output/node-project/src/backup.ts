import { resolve } from "node:path";
import { backupDatabase, integrityCheck, openDatabase } from "./db/database.js";

const source = process.env.DATABASE_PATH ?? "./data/lll-node.sqlite";
const destination = process.env.BACKUP_DESTINATION;
if (!destination) throw new Error("BACKUP_DESTINATION is required");
const resolvedDestination = resolve(destination);

const sourceDb = openDatabase(source);
try {
  integrityCheck(sourceDb);
  await backupDatabase(sourceDb, resolvedDestination);
} finally {
  sourceDb.close();
}

const backupDb = openDatabase(resolvedDestination);
try {
  integrityCheck(backupDb);
} finally {
  backupDb.close();
}
console.log(`SQLite backup verified: ${resolvedDestination}`);
