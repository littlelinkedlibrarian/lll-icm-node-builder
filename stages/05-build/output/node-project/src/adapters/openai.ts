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

export class OpenAIVisionExtractor implements VisionExtractor {
  private readonly client: OpenAI;
  constructor(apiKey: string, private readonly model = "gpt-5.6-sol") { this.client = new OpenAI({ apiKey }); }
  async extract(image: { mimeType: string; bytes: Uint8Array }): Promise<{ fields: CandidateFields; provenance: Record<string, unknown> }> {
    const imageUrl = `data:${image.mimeType};base64,${Buffer.from(image.bytes).toString("base64")}`;
    const response = await this.client.responses.create({
      model: this.model,
      input: [{
        role: "user",
        content: [
          { type: "input_text", text: "Read this book cover. Propose bibliographic fields. Use null when the image does not support a value; never invent an ISBN." },
          { type: "input_image", image_url: imageUrl, detail: "high" }
        ]
      }],
      text: { format: { type: "json_schema", name: "book_candidate", strict: true, schema: candidateSchema } }
    });
    return {
      fields: JSON.parse(response.output_text) as CandidateFields,
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
