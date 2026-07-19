import { LocalMediaStore } from "./adapters/media.js";
import { OpenLibraryProvider } from "./adapters/openlibrary.js";
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
const media = new LocalMediaStore(config.mediaDirectory || "./data/media");
const bibliography = config.bibliographicEnabled === false ? undefined : new OpenLibraryProvider("LittleLinkedLibrarian/0.1 (" + (config.bibliographicContact || config.publicBaseUrl.href) + ")");
const app = buildApp({
  config, db, store, media,
  ...(bibliography ? { bibliography } : {}),
  ...(vision ? {
    vision,
    embedder: new OpenAIEmbedder(openaiApiKey!, config.embeddingModel)
  } : {})
});

await app.listen({ host: config.host, port: config.port });
const stop = async () => { await app.close(); db.close(); };
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
