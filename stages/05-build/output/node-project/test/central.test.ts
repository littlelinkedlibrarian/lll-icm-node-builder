import { describe, expect, it, vi } from "vitest";
import { CentralHeartbeatClient } from "../src/adapters/central.js";
import { loadConfig } from "../src/config.js";

describe("Central heartbeat adapter", () => {
  it("sends only the node credential to the encoded heartbeat route", async () => {
    const fetchFn = vi.fn<typeof fetch>(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }));
    const client = new CentralHeartbeatClient({
      baseUrl: new URL("https://central.example/root"),
      nodeId: "lll-happy-box",
      apiKey: "node-secret",
    }, fetchFn as typeof fetch);

    await client.heartbeat();

    expect(fetchFn).toHaveBeenCalledOnce();
    const [url, init] = fetchFn.mock.calls[0]!;
    expect(String(url)).toBe("https://central.example/api/network/nodes/lll-happy-box/heartbeat");
    expect(init).toMatchObject({
      method: "POST",
      headers: { accept: "application/json", authorization: "Bearer node-secret" },
    });
  });

  it("reports a rejected heartbeat without exposing the response body", async () => {
    const client = new CentralHeartbeatClient({
      baseUrl: new URL("https://central.example"),
      nodeId: "lll-happy-box",
      apiKey: "node-secret",
    }, vi.fn<typeof fetch>(async () => new Response("sensitive upstream detail", { status: 403 })));

    await expect(client.heartbeat()).rejects.toThrow("Central heartbeat failed with HTTP 403");
  });

  it("requires the complete Central configuration only when discovery is enabled", () => {
    expect(() => loadConfig({ DISCOVERY_ENABLED: "true" })).toThrow("Central discovery requires");
    expect(loadConfig({ DISCOVERY_ENABLED: "false" }).central).toBeUndefined();
    expect(loadConfig({
      DISCOVERY_ENABLED: "true",
      CENTRAL_BASE_URL: "https://central.example",
      CENTRAL_NODE_ID: "lll-happy-box",
      CENTRAL_NODE_API_KEY: "node-secret",
      CENTRAL_HEARTBEAT_INTERVAL_SECONDS: "60",
    }).central).toMatchObject({
      nodeId: "lll-happy-box",
      heartbeatIntervalMs: 60_000,
    });
  });
});
