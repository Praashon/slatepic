export type OutputFormat = "image/jpeg" | "image/png" | "image/webp";

export type MetadataCategory = "c2pa" | "ai" | "exif" | "iptc" | "xmp" | "icc";

export interface MetadataTagEntry {
  key: string;
  value: string;
  category: MetadataCategory;
}

export interface MetadataReport {
  hasAiProvenance: boolean;
  c2paDetected: boolean;
  exifDetected: boolean;
  hasGpsData: boolean;
  softwareTag?: string;
  digitalSourceType?: string;
  detectedSignatures: string[];
  fileSizeFormatted: string;
  fileSizeBytes: number;
  dimensions: { width: number; height: number };
  rawTagCount: number;
  tags: MetadataTagEntry[];
}

export type PixelRefreshLevel = "off" | "light" | "balanced" | "strong";

export interface PixelPerturbationMetrics {
  psnrDb: number;
  meanPixelDelta: number;
  stagesApplied: string[];
}

export interface ScrubOptions {
  outputFormat: OutputFormat;
  quality: number;
  pixelRefreshLevel?: PixelRefreshLevel;
  applyMicroCrop: boolean;
  applySubtleNoise: boolean;
  applyColorRebalance?: boolean;
  applyDctCycle?: boolean;
  applyEdgeDenoise?: boolean;
  randomizeFilename: boolean;
}

export interface ScrubResult {
  blob: Blob;
  cleanFileName: string;
  cleanedSizeBytes: number;
  cleanedPreviewUrl: string;
  verificationReport: MetadataReport;
  bytesSaved: number;
  scrubbedAt: number;
  sha256: string;
  pixelRefreshApplied: boolean;
  pixelRefreshLevel: PixelRefreshLevel;
  perturbationMetrics?: PixelPerturbationMetrics;
}

export type ImageItemStatus =
  | "scanning"
  | "inspected"
  | "scrubbing"
  | "cleaned"
  | "error";

export interface QueuedImageItem {
  id: string;
  file: File;
  previewUrl: string;
  status: ImageItemStatus;
  report?: MetadataReport;
  result?: ScrubResult;
  error?: string;
}

export interface GlobalStats {
  imagesCleaned: number;
  tagsNuked: number;
  bytesSaved: number;
  source?: "redis" | "fallback";
  updatedAt?: number;
}

export interface UserPreset {
  id?: number;
  name: string;
  outputFormat: OutputFormat;
  quality: number;
  pixelRefreshLevel?: PixelRefreshLevel;
  applyMicroCrop: boolean;
  applySubtleNoise: boolean;
  applyColorRebalance?: boolean;
  applyDctCycle?: boolean;
  applyEdgeDenoise?: boolean;
  randomizeFilename: boolean;
  isDefault?: boolean;
}

export interface ScrubLogEntry {
  id?: number;
  timestamp: number;
  originalFileName: string;
  cleanedFileName: string;
  originalSizeBytes: number;
  cleanedSizeBytes: number;
  tagsNukedCount: number;
  detectedSignatures: string[];
}

