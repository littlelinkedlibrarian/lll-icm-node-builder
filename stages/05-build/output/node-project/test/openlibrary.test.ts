import { afterEach, describe, expect, it, vi } from "vitest";
import { OpenLibraryProvider } from "../src/adapters/openlibrary.js";

describe("Open Library adapter", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("normalizes array-valued edition dates before metadata is applied", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      docs: [{
        key: "/works/OL1W",
        title: "Stargirl",
        author_name: ["Jerry Spinelli"],
        cover_i: 123,
        editions: { docs: [{
          key: "/books/OL1M",
          title: "Stargirl",
          isbn_13: ["9780679886372"],
          publish_date: ["2000", "2002"],
          publisher: ["Knopf"],
          language: ["eng"],
          cover_i: 456
        }] }
      }]
    }), { status: 200, headers: { "content-type": "application/json" } })));

    const [proposal] = await new OpenLibraryProvider("test-agent").findEditions({
      title: "Stargirl", author: "Jerry Spinelli", isbn: null, genre: null,
      description: null, language: "English", condition: "good"
    });

    expect(proposal).toMatchObject({
      isbn13: "9780679886372",
      publishedDate: "2000",
      publisher: "Knopf",
      language: "eng",
      coverUrl: "https://covers.openlibrary.org/b/id/456-M.jpg?default=false"
    });
  });
});
