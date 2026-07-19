import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import type { MediaStore } from "../ports/index.js";

const extension = (mimeType: string) => ({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" })[mimeType] ?? "bin";

export class LocalMediaStore implements MediaStore {
  constructor(private readonly directory: string) {}
  async save(bytes: Uint8Array, mimeType: string) {
    const buffer = Buffer.from(bytes), sha256 = createHash("sha256").update(buffer).digest("hex"), storageKey = sha256 + "." + extension(mimeType);
    await mkdir(this.directory, { recursive: true });
    const temporary = join(this.directory, "." + randomUUID() + ".tmp");
    await writeFile(temporary, buffer, { flag: "wx" });
    await rename(temporary, join(this.directory, storageKey));
    return { storageKey, sha256, byteSize: buffer.byteLength };
  }
  async read(storageKey: string) { if (basename(storageKey) !== storageKey) throw new Error("invalid_storage_key"); return readFile(join(this.directory, storageKey)); }
  async delete(storageKey: string) { if (basename(storageKey) !== storageKey) throw new Error("invalid_storage_key"); await rm(join(this.directory, storageKey), { force: true }); }
}

export class MemoryMediaStore implements MediaStore {
  private readonly files = new Map<string, Uint8Array>();
  async save(bytes: Uint8Array, mimeType: string) { const copy = Uint8Array.from(bytes), sha256 = createHash("sha256").update(copy).digest("hex"), storageKey = sha256 + "." + extension(mimeType); this.files.set(storageKey, copy); return { storageKey, sha256, byteSize: copy.byteLength }; }
  async read(storageKey: string) { const value = this.files.get(storageKey); if (!value) throw new Error("media_not_found"); return Uint8Array.from(value); }
  async delete(storageKey: string) { this.files.delete(storageKey); }
}
