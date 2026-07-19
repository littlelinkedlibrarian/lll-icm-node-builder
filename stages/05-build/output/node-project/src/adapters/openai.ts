import OpenAI from "openai";
import type { CandidateFields } from "../domain/model.js";
import type { Embedder, VisionExtractor } from "../ports/index.js";

const candidateSchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "author", "isbn", "genre", "description", "language", "condition"],
  properties: {
    title: { type: "string" }, author: { type: "string" },
    isbn: { type: ["string", "null"] }, genre: { type: ["string", "null"] },
    description: { type: ["string", "null"] }, language: { type: ["string", "null"] },
    condition: { type: ["string", "null"] }
  }
} as const;

const scanBatchSchema = {
  type: "object",
  additionalProperties: false,
  required: ["candidates"],
  properties: { candidates: { type: "array", minItems: 1, maxItems: 15, items: candidateSchema } }
} as const;

export class OpenAIVisionExtractor implements VisionExtractor {
  private readonly client: OpenAI;
  constructor(apiKey: string, private readonly model = "gpt-5.6-sol") { this.client = new OpenAI({ apiKey }); }
  async extract(image: { mimeType: string; bytes: Uint8Array }): Promise<{ candidates: CandidateFields[]; provenance: Record<string, unknown> }> {
    const imageUrl = `data:${image.mimeType};base64,${Buffer.from(image.bytes).toString("base64")}`;
    const response = await this.client.responses.create({
      model: this.model,
      input: [{
        role: "user",
        content: [
          { type: "input_text", text: "Catalog every distinct book visibly supported by this photo. It may show one cover or many shelf spines. Return one candidate per visible book, in left-to-right order. Use an empty string when title or author is unreadable, null for other unsupported values, and never invent an ISBN. Do not merge adjacent books." },
          { type: "input_image", image_url: imageUrl, detail: "high" }
        ]
      }],
      text: { format: { type: "json_schema", name: "book_scan_batch", strict: true, schema: scanBatchSchema } }
    });
    const parsed = JSON.parse(response.output_text) as { candidates: CandidateFields[] };
    return {
      candidates: parsed.candidates,
      provenance: { provider: "openai", model: this.model, responseId: response.id, extractedAt: new Date().toISOString() }
    };
  }
}

export class OpenAIEmbedder implements Embedder {
  private readonly client: OpenAI;
  constructor(apiKey: string, private readonly model = "text-embedding-3-small") { this.client = new OpenAI({ apiKey }); }
  async embed(text: string): Promise<number[]> {
    const response = await this.client.embeddings.create({ model: this.model, input: text, encoding_format: "float" });
    const vector = response.data[0]?.embedding;
    if (!vector || vector.length !== 1536) throw new Error("embedding_dimension");
    return vector;
  }
}
