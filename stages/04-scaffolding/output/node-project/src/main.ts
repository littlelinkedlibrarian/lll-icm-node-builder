import { loadConfig } from "./config.js";

const config = loadConfig();
console.log(`LLL node scaffold configured for ${config.publicBaseUrl.origin}`);
