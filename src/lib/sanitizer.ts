import type { MetadataCategory, OutputFormat } from "@/types";

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

const CRITICAL_PNG_CHUNKS = new Set(["IHDR", "PLTE", "IDAT", "tRNS", "IEND"]);

const WEBP_STRIP_CHUNKS = new Set(["EXIF", "XMP ", "ICCP", "C2PA", "JUMB"]);

export interface BinaryChunkFinding {
  key: string;
  value: string;
  category: MetadataCategory;
}

export function isPngBytes(bytes: Uint8Array): boolean {
  if (bytes.length < 8) return false;
  for (let i = 0; i < 8; i++) {
    if (bytes[i] !== PNG_SIGNATURE[i]) return false;
  }
  return true;
}

export function isJpegBytes(bytes: Uint8Array): boolean {
  return bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8;
}

export function isWebpBytes(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 12 &&
    readAscii(bytes, 0, 4) === "RIFF" &&
    readAscii(bytes, 8, 4) === "WEBP"
  );
}

function readAscii(bytes: Uint8Array, start: number, length: number): string {
  let out = "";
  const end = Math.min(bytes.length, start + length);
  for (let i = start; i < end; i++) {
    out += String.fromCharCode(bytes[i]);
  }
  return out;
}

function readUint32BE(bytes: Uint8Array, offset: number): number {
  return (
    ((bytes[offset] << 24) |
      (bytes[offset + 1] << 16) |
      (bytes[offset + 2] << 8) |
      bytes[offset + 3]) >>>
    0
  );
}

function readUint32LE(bytes: Uint8Array, offset: number): number {
  return (
    (bytes[offset] |
      (bytes[offset + 1] << 8) |
      (bytes[offset + 2] << 16) |
      (bytes[offset + 3] << 24)) >>>
    0
  );
}

function writeUint32LE(bytes: Uint8Array, offset: number, value: number): void {
  bytes[offset] = value & 0xff;
  bytes[offset + 1] = (value >>> 8) & 0xff;
  bytes[offset + 2] = (value >>> 16) & 0xff;
  bytes[offset + 3] = (value >>> 24) & 0xff;
}

function concatUint8Arrays(chunks: Uint8Array[]): Uint8Array {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const out = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

function toStandaloneArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const stableBuffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(stableBuffer).set(bytes);
  return stableBuffer;
}

export function stripPngAncillaryChunks(bytes: Uint8Array): Uint8Array {
  if (!isPngBytes(bytes)) return bytes;

  const kept: Uint8Array[] = [bytes.slice(0, 8)];
  let offset = 8;

  while (offset + 12 <= bytes.length) {
    const dataLength = readUint32BE(bytes, offset);
    const totalChunkSize = 12 + dataLength;
    if (offset + totalChunkSize > bytes.length) {
      return bytes;
    }

    const chunkType = readAscii(bytes, offset + 4, 4);
    if (CRITICAL_PNG_CHUNKS.has(chunkType)) {
      kept.push(bytes.slice(offset, offset + totalChunkSize));
    }

    offset += totalChunkSize;
    if (chunkType === "IEND") {
      break;
    }
  }

  return concatUint8Arrays(kept);
}

export function stripJpegMetadataSegments(bytes: Uint8Array): Uint8Array {
  if (!isJpegBytes(bytes)) return bytes;

  const kept: Uint8Array[] = [bytes.slice(0, 2)];
  let offset = 2;

  while (offset + 1 < bytes.length) {
    while (
      offset + 1 < bytes.length &&
      bytes[offset] === 0xff &&
      bytes[offset + 1] === 0xff
    ) {
      offset += 1;
    }

    if (offset + 1 >= bytes.length || bytes[offset] !== 0xff) {
      kept.push(bytes.slice(offset));
      break;
    }

    const marker = bytes[offset + 1];

    // SOS (0xDA) or EOI (0xD9): preserve remaining compressed scan data intact
    if (marker === 0xda || marker === 0xd9) {
      kept.push(bytes.slice(offset));
      break;
    }

    // Standalone markers with no length field (RST0..RST7, TEM, 0x00)
    if (
      marker === 0x00 ||
      marker === 0x01 ||
      (marker >= 0xd0 && marker <= 0xd7)
    ) {
      kept.push(bytes.slice(offset, offset + 2));
      offset += 2;
      continue;
    }

    if (offset + 4 > bytes.length) {
      kept.push(bytes.slice(offset));
      break;
    }

    const segmentLength = (bytes[offset + 2] << 8) | bytes[offset + 3];
    const totalSegmentLength = 2 + segmentLength;

    if (segmentLength < 2 || offset + totalSegmentLength > bytes.length) {
      return bytes;
    }

    // Strip APP1..APP15 (EXIF, XMP, ICC, IPTC, C2PA, Adobe) and COM (0xFE)
    const isMetadataMarker =
      (marker >= 0xe1 && marker <= 0xef) || marker === 0xfe;

    if (!isMetadataMarker) {
      kept.push(bytes.slice(offset, offset + totalSegmentLength));
    }

    offset += totalSegmentLength;
  }

  return concatUint8Arrays(kept);
}

export function stripWebpMetadataChunks(bytes: Uint8Array): Uint8Array {
  if (!isWebpBytes(bytes)) return bytes;

  const kept: Uint8Array[] = [bytes.slice(0, 12)];
  let offset = 12;

  while (offset + 8 <= bytes.length) {
    const fourCC = readAscii(bytes, offset, 4);
    const chunkSize = readUint32LE(bytes, offset + 4);
    const paddedChunkSize = chunkSize + (chunkSize & 1);
    const totalChunkSize = 8 + paddedChunkSize;

    if (offset + totalChunkSize > bytes.length) {
      return bytes;
    }

    if (!WEBP_STRIP_CHUNKS.has(fourCC)) {
      const chunkCopy = bytes.slice(offset, offset + totalChunkSize);
      if (fourCC === "VP8X" && chunkSize >= 1) {
        // Clear ICC (0x20), EXIF (0x08), and XMP (0x04) capability flags
        chunkCopy[8] = chunkCopy[8] & ~(0x20 | 0x08 | 0x04);
      }
      kept.push(chunkCopy);
    }

    offset += totalChunkSize;
  }

  const rebuilt = concatUint8Arrays(kept);
  writeUint32LE(rebuilt, 4, rebuilt.length - 8);
  return rebuilt;
}

/**
 * Strips all ancillary metadata chunks/segments from a PNG, JPEG, or WebP ArrayBuffer
 * purely in browser memory without external Node dependencies.
 */
export async function stripBinaryMetadata(
  fileBuffer: ArrayBuffer,
  fileType: OutputFormat,
): Promise<ArrayBuffer> {
  const bytes = new Uint8Array(fileBuffer);
  let sanitized: Uint8Array = bytes;

  if (fileType === "image/png" || isPngBytes(bytes)) {
    sanitized = stripPngAncillaryChunks(bytes);
  } else if (fileType === "image/jpeg" || isJpegBytes(bytes)) {
    sanitized = stripJpegMetadataSegments(bytes);
  } else if (fileType === "image/webp" || isWebpBytes(bytes)) {
    sanitized = stripWebpMetadataChunks(bytes);
  }

  return toStandaloneArrayBuffer(sanitized);
}

export async function sanitizeImageBlob(blob: Blob): Promise<Blob> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let sanitized: Uint8Array = bytes;

  if (isPngBytes(bytes)) {
    sanitized = stripPngAncillaryChunks(bytes);
  } else if (isJpegBytes(bytes)) {
    sanitized = stripJpegMetadataSegments(bytes);
  } else if (isWebpBytes(bytes)) {
    sanitized = stripWebpMetadataChunks(bytes);
  }

  if (sanitized === bytes) {
    return blob;
  }

  return new Blob([toStandaloneArrayBuffer(sanitized)], { type: blob.type });
}

export async function computeBufferSha256(
  buffer: ArrayBuffer,
): Promise<string> {
  if (typeof globalThis.crypto !== "undefined" && globalThis.crypto.subtle) {
    const digest = await globalThis.crypto.subtle.digest("SHA-256", buffer);
    const hashBytes = new Uint8Array(digest);
    let hex = "";
    for (const byte of hashBytes) {
      hex += byte.toString(16).padStart(2, "0");
    }
    return hex;
  }

  // Deterministic 64-bit FNV-1a fallback when SubtleCrypto is unavailable
  const bytes = new Uint8Array(buffer);
  let h1 = 0x811c9dc5;
  let h2 = 0x811c9dc5;
  for (let i = 0; i < bytes.length; i++) {
    h1 ^= bytes[i];
    h1 = Math.imul(h1, 0x01000193) >>> 0;
    h2 ^= bytes[bytes.length - 1 - i];
    h2 = Math.imul(h2, 0x01000193) >>> 0;
  }
  return `${h1.toString(16).padStart(8, "0")}${h2.toString(16).padStart(8, "0")}`;
}

export function scanContainerAncillaryMetadata(bytes: Uint8Array): {
  kind: "png" | "jpeg" | "webp" | "unknown";
  findings: BinaryChunkFinding[];
} {
  const findings: BinaryChunkFinding[] = [];

  if (isPngBytes(bytes)) {
    let offset = 8;
    while (offset + 12 <= bytes.length) {
      const dataLength = readUint32BE(bytes, offset);
      const totalChunkSize = 12 + dataLength;
      if (offset + totalChunkSize > bytes.length) break;

      const chunkType = readAscii(bytes, offset + 4, 4);
      if (!CRITICAL_PNG_CHUNKS.has(chunkType)) {
        findings.push({
          key: `PNG ${chunkType}`,
          value: `${dataLength} bytes ancillary chunk`,
          category: classifyPngChunk(chunkType),
        });
      }

      offset += totalChunkSize;
      if (chunkType === "IEND") break;
    }
    return { kind: "png", findings };
  }

  if (isJpegBytes(bytes)) {
    let offset = 2;
    while (offset + 1 < bytes.length) {
      while (
        offset + 1 < bytes.length &&
        bytes[offset] === 0xff &&
        bytes[offset + 1] === 0xff
      ) {
        offset += 1;
      }
      if (offset + 1 >= bytes.length || bytes[offset] !== 0xff) break;

      const marker = bytes[offset + 1];
      if (marker === 0xda || marker === 0xd9) break;
      if (
        marker === 0x00 ||
        marker === 0x01 ||
        (marker >= 0xd0 && marker <= 0xd7)
      ) {
        offset += 2;
        continue;
      }
      if (offset + 4 > bytes.length) break;

      const segmentLength = (bytes[offset + 2] << 8) | bytes[offset + 3];
      if (segmentLength < 2 || offset + 2 + segmentLength > bytes.length) break;

      if ((marker >= 0xe1 && marker <= 0xef) || marker === 0xfe) {
        const label =
          marker === 0xfe
            ? "JPEG COM"
            : `JPEG APP${(marker - 0xe0).toString()}`;
        const category: MetadataCategory =
          marker === 0xe2 ? "icc" : marker === 0xed ? "iptc" : "exif";
        findings.push({
          key: label,
          value: `${segmentLength} bytes metadata segment`,
          category,
        });
      }

      offset += 2 + segmentLength;
    }
    return { kind: "jpeg", findings };
  }

  if (isWebpBytes(bytes)) {
    let offset = 12;
    while (offset + 8 <= bytes.length) {
      const fourCC = readAscii(bytes, offset, 4);
      const chunkSize = readUint32LE(bytes, offset + 4);
      const paddedChunkSize = chunkSize + (chunkSize & 1);
      if (offset + 8 + paddedChunkSize > bytes.length) break;

      if (WEBP_STRIP_CHUNKS.has(fourCC)) {
        const category: MetadataCategory =
          fourCC === "ICCP"
            ? "icc"
            : fourCC === "XMP "
              ? "xmp"
              : fourCC === "C2PA" || fourCC === "JUMB"
                ? "c2pa"
                : "exif";
        findings.push({
          key: `WebP ${fourCC.trim()}`,
          value: `${chunkSize} bytes metadata chunk`,
          category,
        });
      }

      offset += 8 + paddedChunkSize;
    }
    return { kind: "webp", findings };
  }

  return { kind: "unknown", findings };
}

function classifyPngChunk(chunkType: string): MetadataCategory {
  switch (chunkType) {
    case "eXIf":
    case "tIME":
    case "pHYs":
      return "exif";
    case "iCCP":
    case "sRGB":
    case "gAMA":
    case "cHRM":
      return "icc";
    case "c2pa":
    case "jumb":
      return "c2pa";
    default:
      return "xmp";
  }
}
