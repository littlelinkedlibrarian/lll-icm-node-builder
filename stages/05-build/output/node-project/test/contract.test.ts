import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";

describe("OpenAPI compatibility contract", () => {
  const contract = parse(readFileSync(new URL("../contracts/openapi.yaml", import.meta.url), "utf8")) as {
    openapi: string;
    info: { version: string };
    paths: Record<string, Record<string, unknown>>;
  };
  const publicProfile = [
    "/health",
    "/api/books",
    "/api/books/{id}",
    "/api/boxes",
    "/api/boxes/{id}",
    "/api/boxes/{id}/books"
  ];

  it("pins the intended LLL Lite read profile", () => {
    expect(contract.openapi).toBe("3.1.0");
    expect(contract.info.version).toBe("0.1.0");
    for (const path of publicProfile) expect(contract.paths[path]?.get).toBeDefined();
  });

  it("does not expose a public write in the compatibility profile", () => {
    for (const path of publicProfile) {
      expect(contract.paths[path]?.post).toBeUndefined();
      expect(contract.paths[path]?.patch).toBeUndefined();
      expect(contract.paths[path]?.delete).toBeUndefined();
    }
  });
});
