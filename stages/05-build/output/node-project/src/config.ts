export interface AppConfig {
  host: string;
  port: number;
  databasePath: string;
  nodeName: string;
  publicBaseUrl: URL;
  operatorToken?: string;
  publicDemoOperator?: boolean;
  publicDemoMcp?: boolean;
  openaiApiKey?: string;
  visionModel: string;
  embeddingModel: string;
  discoveryEnabled: boolean;
  central?: {
    baseUrl: URL;
    nodeId: string;
    apiKey: string;
    heartbeatIntervalMs: number;
  };
  mediaDirectory?: string;
  bibliographicEnabled?: boolean;
  bibliographicContact?: string;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const port = Number(env.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("PORT must be 1-65535");
  const discoveryEnabled = env.DISCOVERY_ENABLED === "true";
  const heartbeatIntervalSeconds = Number(env.CENTRAL_HEARTBEAT_INTERVAL_SECONDS ?? 300);
  if (discoveryEnabled && (!env.CENTRAL_BASE_URL || !env.CENTRAL_NODE_ID || !env.CENTRAL_NODE_API_KEY)) {
    throw new Error("Central discovery requires CENTRAL_BASE_URL, CENTRAL_NODE_ID, and CENTRAL_NODE_API_KEY");
  }
  if (discoveryEnabled && (!Number.isFinite(heartbeatIntervalSeconds) || heartbeatIntervalSeconds < 30)) {
    throw new Error("CENTRAL_HEARTBEAT_INTERVAL_SECONDS must be at least 30");
  }
  return {
    host: env.HOST ?? "127.0.0.1",
    port,
    databasePath: env.DATABASE_PATH ?? "./data/lll-node.sqlite",
    nodeName: env.NODE_NAME ?? "My Little Box",
    publicBaseUrl: new URL(env.PUBLIC_BASE_URL ?? `http://localhost:${port}`),
    ...(env.OPERATOR_TOKEN ? { operatorToken: env.OPERATOR_TOKEN } : {}),
    publicDemoOperator: env.PUBLIC_DEMO_OPERATOR === "true",
    publicDemoMcp: env.PUBLIC_DEMO_MCP === "true",
    ...(env.OPENAI_API_KEY ? { openaiApiKey: env.OPENAI_API_KEY } : {}),
    visionModel: env.OPENAI_VISION_MODEL ?? "gpt-5.6-sol",
    embeddingModel: env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small",
    discoveryEnabled,
    ...(discoveryEnabled ? {
      central: {
        baseUrl: new URL(env.CENTRAL_BASE_URL!),
        nodeId: env.CENTRAL_NODE_ID!,
        apiKey: env.CENTRAL_NODE_API_KEY!,
        heartbeatIntervalMs: heartbeatIntervalSeconds * 1_000,
      },
    } : {}),
    mediaDirectory: env.MEDIA_DIRECTORY ?? "./data/media",
    bibliographicEnabled: env.BIBLIOGRAPHIC_ENABLED !== "false",
    ...(env.BIBLIOGRAPHIC_CONTACT ? { bibliographicContact: env.BIBLIOGRAPHIC_CONTACT } : {})
  };
}
