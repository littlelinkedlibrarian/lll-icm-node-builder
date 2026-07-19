export interface AppConfig {
  host: string;
  port: number;
  databasePath: string;
  nodeName: string;
  publicBaseUrl: URL;
  operatorToken?: string;
  openaiApiKey?: string;
  visionModel: string;
  embeddingModel: string;
  discoveryEnabled: boolean;
  mediaDirectory?: string;
  bibliographicEnabled?: boolean;
  bibliographicContact?: string;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const port = Number(env.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("PORT must be 1-65535");
  return {
    host: env.HOST ?? "127.0.0.1",
    port,
    databasePath: env.DATABASE_PATH ?? "./data/lll-node.sqlite",
    nodeName: env.NODE_NAME ?? "My Little Box",
    publicBaseUrl: new URL(env.PUBLIC_BASE_URL ?? `http://localhost:${port}`),
    ...(env.OPERATOR_TOKEN ? { operatorToken: env.OPERATOR_TOKEN } : {}),
    ...(env.OPENAI_API_KEY ? { openaiApiKey: env.OPENAI_API_KEY } : {}),
    visionModel: env.OPENAI_VISION_MODEL ?? "gpt-5.6-sol",
    embeddingModel: env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small",
    discoveryEnabled: env.DISCOVERY_ENABLED === "true",
    mediaDirectory: env.MEDIA_DIRECTORY ?? "./data/media",
    bibliographicEnabled: env.BIBLIOGRAPHIC_ENABLED !== "false",
    ...(env.BIBLIOGRAPHIC_CONTACT ? { bibliographicContact: env.BIBLIOGRAPHIC_CONTACT } : {})
  };
}
