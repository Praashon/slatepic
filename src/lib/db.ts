import Dexie, { type Table } from "dexie";
import type { ScrubLogEntry, UserPreset } from "@/types";

export class SlatePicDatabase extends Dexie {
  presets!: Table<UserPreset>;
  scrubHistory!: Table<ScrubLogEntry>;

  constructor() {
    super("SlatePicDB");
    this.version(1).stores({
      presets: "++id, name, isDefault",
      scrubHistory: "++id, timestamp, originalFileName",
    });
  }
}

export const db = new SlatePicDatabase();

export const DEFAULT_PRESETS: Array<Omit<UserPreset, "id">> = [
  {
    name: "Social Clean (JPEG)",
    outputFormat: "image/jpeg",
    quality: 0.92,
    pixelRefreshLevel: "off",
    applyMicroCrop: false,
    applySubtleNoise: false,
    applyColorRebalance: false,
    applyDctCycle: false,
    applyEdgeDenoise: false,
    randomizeFilename: false,
    isDefault: true,
  },
  {
    name: "Lossless Archive (PNG)",
    outputFormat: "image/png",
    quality: 1,
    pixelRefreshLevel: "off",
    applyMicroCrop: false,
    applySubtleNoise: false,
    applyColorRebalance: false,
    applyDctCycle: false,
    applyEdgeDenoise: false,
    randomizeFilename: false,
    isDefault: false,
  },
  {
    name: "SynthID Mitigation (Balanced)",
    outputFormat: "image/jpeg",
    quality: 0.9,
    pixelRefreshLevel: "balanced",
    applyMicroCrop: true,
    applySubtleNoise: true,
    applyColorRebalance: true,
    applyDctCycle: true,
    applyEdgeDenoise: true,
    randomizeFilename: false,
    isDefault: false,
  },
  {
    name: "Deep Pixel Scrub (Strong)",
    outputFormat: "image/webp",
    quality: 0.88,
    pixelRefreshLevel: "strong",
    applyMicroCrop: true,
    applySubtleNoise: true,
    applyColorRebalance: true,
    applyDctCycle: true,
    applyEdgeDenoise: true,
    randomizeFilename: true,
    isDefault: false,
  },
];

let seedPromise: Promise<void> | null = null;

export async function seedDefaultPresetsIfEmpty(): Promise<void> {
  if (typeof window === "undefined") return;
  if (!seedPromise) {
    seedPromise = (async () => {
      const count = await db.presets.count();
      if (count === 0) {
        await db.presets.bulkAdd(DEFAULT_PRESETS);
      }
    })().catch((err) => {
      seedPromise = null;
      throw err;
    });
  }
  return seedPromise;
}
