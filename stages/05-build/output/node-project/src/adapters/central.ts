export type CentralHeartbeatOptions = {
  baseUrl: URL;
  nodeId: string;
  apiKey: string;
  timeoutMs?: number;
};

export class CentralHeartbeatClient {
  private readonly timeoutMs: number;

  constructor(
    private readonly options: CentralHeartbeatOptions,
    private readonly fetchFn: typeof fetch = globalThis.fetch,
  ) {
    this.timeoutMs = options.timeoutMs ?? 8_000;
  }

  async heartbeat(): Promise<void> {
    const path = `/api/network/nodes/${encodeURIComponent(this.options.nodeId)}/heartbeat`;
    const response = await this.fetchFn(new URL(path, this.options.baseUrl), {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${this.options.apiKey}`,
      },
      signal: AbortSignal.timeout(this.timeoutMs),
    });

    if (!response.ok) {
      throw new Error(`Central heartbeat failed with HTTP ${response.status}`);
    }
  }
}
