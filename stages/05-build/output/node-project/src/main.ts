import { OpenAIEmbedder, OpenAIVisionExtractor } from "./adapters/openai.js";
import { loadConfig } from "./config.js";
import { openDatabase } from "./db/database.js";
import { SqliteStore } from "./db/store.js";
import { buildApp } from "./http/app.js";

const config = loadConfig();
const db = openDatabase(config.databasePath);
const store = new SqliteStore(db);
const openaiApiKey = config.openaiApiKey;
const vision = openaiApiKey ? new OpenAIVisionExtractor(openaiApiKey, config.visionModel) : undefined;
const app = buildApp({
  config, db, store,
  ...(vision ? {
    vision, assorted: vision,
    embedder: new OpenAIEmbedder(openaiApiKey!, config.embeddingModel)
  } : {})
});

await app.listen({ host: config.host, port: config.port });
const stop = async () => { await app.close(); db.close(); };
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
