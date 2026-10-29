import exifr from "exifr";
import { scanContainerAncillaryMetadata } from "@/lib/sanitizer";
import { formatBytes } from "@/lib/utils";
import type {
  MetadataCategory,
  MetadataReport,
  MetadataTagEntry,
  OutputFormat,
} from "@/types";

const AI_KEYWORDS = [
  "ChatGPT",
  "DALL-E",
  "OpenAI",
  "Midjourney",
  "Stable Diffusion",
  "ComfyUI",
  "TrainedAlgorithmicMedia",
  "Firefly",
  "Adobe Firefly",
  "InvokeAI",
  "Automatic1111",
  "NovelAI",
  "Imagen",
  "Gemini",
];

// Intrinsic image geometry & container-framing fields emitted by clean encoders
// (PNG IHDR and JPEG APP0 JFIF / SOF). These are pixel-layout parameters, not metadata.
const STRUCTURAL_CONTAINER_KEYS = new Set([
  "JFIFVersion",
  "ResolutionUnit",
  "XResolution",
  "YResolution",
  "ThumbnailWidth",
  "ThumbnailHeight",
  "ImageWidth",
  "ImageHeight",
  "BitDepth",
  "ColorType",
  "Compression",
  "Filter",
  "Interlace",
  "BitsPerSample",
  "ColorComponents",
  "SubSampling",
]);

const GPS_KEYS = new Set([
  "latitude",
  "longitude",
  "GPSLatitude",
  "GPSLongitude",
  "GPSLatitudeRef",
  "GPSLongitudeRef",
  "GPSAltitude",
]);

const MAX_DISPLAY_TAGS = 80;

interface ParsedBinaryAnalysis {
  c2paDetected: boolean;
  detectedSignatures: string[];
  filteredEntries: Array<[string, unknown]>;
  filteredRecord: Record<string, unknown>;
  containerFindings: ReturnType<
    typeof scanContainerAncillaryMetadata
  >["findings"];
  softwareTag?: string;
  digitalSourceType?: string;
  hasGpsData: boolean;
}

async function analyzeBinaryMetadata(
  file: Blob,
): Promise<ParsedBinaryAnalysis> {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  const textDecoder = new TextDecoder("latin1");
  const fileHeaderString =
    bytes.length <= 524_288
      ? textDecoder.decode(bytes)
      : `${textDecoder.decode(bytes.slice(0, 131_072))}\n${textDecoder.decode(
          bytes.slice(Math.max(0, bytes.length - 65_536)),
        )}`;

  const detectedSignatures: string[] = [];
  const pushSignature = (sig: string) => {
    if (!detectedSignatures.includes(sig)) {
      detectedSignatures.push(sig);
    }
  };

  const lowerHeader = fileHeaderString.toLowerCase();
  const c2paDetected =
    lowerHeader.includes("jumb") ||
    lowerHeader.includes("c2pa") ||
    lowerHeader.includes("c2pa.claim") ||
    lowerHeader.includes("c2pa.assertions") ||
    lowerHeader.includes("urn:uuid:c2pa");

  if (c2paDetected) {
    pushSignature("C2PA Content Credentials");
  }

  for (const keyword of AI_KEYWORDS) {
    if (lowerHeader.includes(keyword.toLowerCase())) {
      pushSignature(`Signature: ${keyword}`);
    }
  }

  if (
    fileHeaderString.includes("parameters\0") ||
    /Negative prompt:/i.test(fileHeaderString)
  ) {
    pushSignature("Signature: Stable Diffusion Prompt Chunk");
  }

  if (/Made with Google AI|Google LLC/i.test(fileHeaderString)) {
    pushSignature("Signature: Google AI");
  }

  const containerScan = scanContainerAncillaryMetadata(bytes);

  let rawTags: Record<string, unknown> = {};
  try {
    rawTags =
      (await exifr.parse(bytes, {
        xmp: true,
        icc: true,
        iptc: true,
        jfif: true,
        gps: true,
      })) || {};
  } catch {
    rawTags = {};
  }

  const filteredEntries = Object.entries(rawTags).filter(
    ([key]) => !STRUCTURAL_CONTAINER_KEYS.has(key),
  );
  const filteredRecord = Object.fromEntries(filteredEntries);

  const softwareTag = pickFirstString(filteredRecord, [
    "Software",
    "CreatorTool",
    "creator",
    "ProcessingSoftware",
  ]);
  const digitalSourceType = pickFirstString(filteredRecord, [
    "DigitalSourceType",
    "digitalSourceType",
  ]);

  if (
    softwareTag &&
    !detectedSignatures.some((s) =>
      s.toLowerCase().includes(softwareTag.toLowerCase()),
    )
  ) {
    pushSignature(`Software: ${softwareTag}`);
  }

  if (digitalSourceType) {
    pushSignature(`Source: ${digitalSourceType}`);
  }

  for (const [, val] of filteredEntries) {
    const str = stringifyTagValue(val);
    if (!str) continue;
    const lowerStr = str.toLowerCase();
    for (const keyword of AI_KEYWORDS) {
      if (lowerStr.includes(keyword.toLowerCase())) {
        pushSignature(`Signature: ${keyword}`);
      }
    }
  }

  const hasGpsData = filteredEntries.some(([key]) => GPS_KEYS.has(key));
  if (hasGpsData) {
    pushSignature("GPS Location Data");
  }

  return {
    c2paDetected,
    detectedSignatures,
    filteredEntries,
    filteredRecord,
    containerFindings: containerScan.findings,
    softwareTag,
    digitalSourceType,
    hasGpsData,
  };
}

/**
 * Pure validation helper: returns `true` if any prohibited ancillary chunk,
 * EXIF/XMP/IPTC/ICC/GPS field, or C2PA/AI header signature remains.
 */
export async function hasForbiddenMetadata(
  file: File | Blob,
  _type?: OutputFormat,
): Promise<boolean> {
  const analysis = await analyzeBinaryMetadata(file);
  return (
    analysis.c2paDetected ||
    analysis.detectedSignatures.length > 0 ||
    analysis.filteredEntries.length > 0 ||
    analysis.containerFindings.length > 0
  );
}

export async function inspectImage(
  file: File | Blob,
  _fileName?: string,
): Promise<MetadataReport> {
  const analysis = await analyzeBinaryMetadata(file);
  const {
    c2paDetected,
    detectedSignatures,
    filteredEntries,
    containerFindings,
    softwareTag,
    digitalSourceType,
    hasGpsData,
  } = analysis;

  const tags: MetadataTagEntry[] = [];
  if (c2paDetected) {
    tags.push({
      key: "C2PA Manifest",
      value: "JUMBF / C2PA claim payload detected in container",
      category: "c2pa",
    });
  }

  for (const [key, value] of filteredEntries) {
    if (tags.length >= MAX_DISPLAY_TAGS) break;
    const formatted = stringifyTagValue(value);
    if (!formatted) continue;
    tags.push({
      key,
      value: formatted,
      category: categorizeTag(key, formatted),
    });
  }

  for (const chunkFinding of containerFindings) {
    if (tags.length >= MAX_DISPLAY_TAGS) break;
    if (!tags.some((t) => t.key === chunkFinding.key)) {
      tags.push(chunkFinding);
    }
  }

  for (const sig of detectedSignatures) {
    if (tags.length >= MAX_DISPLAY_TAGS) break;
    if (sig.startsWith("Signature:") && !tags.some((t) => t.value === sig)) {
      tags.push({
        key: "Binary Signature",
        value: sig,
        category: "ai",
      });
    }
  }

  const dimensions = await getImageDimensions(file);
  const exifDetected =
    filteredEntries.length > 0 || containerFindings.length > 0;
  const hasAiProvenance =
    c2paDetected ||
    detectedSignatures.some(
      (s) =>
        s.startsWith("Signature:") ||
        s.startsWith("C2PA") ||
        s.startsWith("Source:"),
    );

  const rawTagCount = Math.max(
    tags.length,
    filteredEntries.length + containerFindings.length + (c2paDetected ? 1 : 0),
  );

  return {
    hasAiProvenance,
    c2paDetected,
    exifDetected,
    hasGpsData,
    softwareTag,
    digitalSourceType,
    detectedSignatures,
    fileSizeFormatted: formatBytes(file.size),
    fileSizeBytes: file.size,
    dimensions,
    rawTagCount,
    tags,
  };
}

function pickFirstString(
  record: Record<string, unknown>,
  keys: string[],
): string | undefined {
  for (const key of keys) {
    const val = record[key];
    if (typeof val === "string" && val.trim().length > 0) {
      return val.trim();
    }
  }
  return undefined;
}

function stringifyTagValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") {
    return value.replace(/\0/g, "").trim().slice(0, 240);
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? "" : value.toISOString();
  }
  if (value instanceof Uint8Array || ArrayBuffer.isView(value)) {
    return `[Binary ${value.byteLength} bytes]`;
  }
  if (Array.isArray(value)) {
    return value
      .slice(0, 8)
      .map((item) => stringifyTagValue(item))
      .filter(Boolean)
      .join(", ")
      .slice(0, 240);
  }
  if (typeof value === "object") {
    try {
      return JSON.stringify(value).slice(0, 240);
    } catch {
      return "[Object]";
    }
  }
  return String(value).slice(0, 240);
}

function categorizeTag(key: string, value: string): MetadataCategory {
  const lowerKey = key.toLowerCase();
  const lowerVal = value.toLowerCase();
  if (lowerKey.includes("c2pa") || lowerKey.includes("jumb")) return "c2pa";
  if (
    lowerKey.includes("digitalsourcetype") ||
    lowerKey.includes("prompt") ||
    AI_KEYWORDS.some((kw) => lowerVal.includes(kw.toLowerCase()))
  ) {
    return "ai";
  }
  if (lowerKey.includes("xmp") || lowerKey.includes("creator")) return "xmp";
  if (lowerKey.includes("iptc") || lowerKey.includes("credit")) return "iptc";
  if (lowerKey.includes("profile") || lowerKey.includes("icc")) return "icc";
  return "exif";
}

function getImageDimensions(
  file: Blob,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(objectUrl);
    };

    img.onerror = () => {
      resolve({ width: 0, height: 0 });
      URL.revokeObjectURL(objectUrl);
    };

    img.src = objectUrl;
  });
}
