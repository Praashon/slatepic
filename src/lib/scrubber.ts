import JSZip from "jszip";
import { sanitizeImageBlob } from "@/lib/sanitizer";
import type {
  OutputFormat,
  PixelPerturbationMetrics,
  PixelRefreshLevel,
  ScrubOptions,
} from "@/types";

const EXTENSION_BY_FORMAT: Record<OutputFormat, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

interface DspProfile {
  targetDeg: number;
  maxCropBudget: number;
  resampleScale: number;
  aspectJitter: number;
  dctQuality: number;
  smoothMix: number;
  edgeSigma: number;
  unsharpAmount: number;
  noiseSigma: number;
  chromaJitter: number;
  contrast: number;
  gamma: number;
}

const DSP_PROFILES: Record<Exclude<PixelRefreshLevel, "off">, DspProfile> = {
  light: {
    targetDeg: 0.3,
    maxCropBudget: 0.015,
    resampleScale: 0.985,
    aspectJitter: 0.002,
    dctQuality: 0.88,
    smoothMix: 0.14,
    edgeSigma: 18,
    unsharpAmount: 0.1,
    noiseSigma: 2.0,
    chromaJitter: 0.6,
    contrast: 1.008,
    gamma: 1.005,
  },
  balanced: {
    targetDeg: 0.65,
    maxCropBudget: 0.028,
    resampleScale: 0.945,
    aspectJitter: 0.005,
    dctQuality: 0.8,
    smoothMix: 0.24,
    edgeSigma: 22,
    unsharpAmount: 0.16,
    noiseSigma: 3.1,
    chromaJitter: 1.0,
    contrast: 1.016,
    gamma: 1.012,
  },
  strong: {
    targetDeg: 1.05,
    maxCropBudget: 0.042,
    resampleScale: 0.89,
    aspectJitter: 0.009,
    dctQuality: 0.68,
    smoothMix: 0.4,
    edgeSigma: 28,
    unsharpAmount: 0.22,
    noiseSigma: 4.6,
    chromaJitter: 1.4,
    contrast: 1.024,
    gamma: 1.02,
  },
};

export function getOptionsForRefreshLevel(
  level: PixelRefreshLevel,
): Pick<
  ScrubOptions,
  | "pixelRefreshLevel"
  | "applyMicroCrop"
  | "applySubtleNoise"
  | "applyColorRebalance"
  | "applyDctCycle"
  | "applyEdgeDenoise"
> {
  if (level === "off") {
    return {
      pixelRefreshLevel: "off",
      applyMicroCrop: false,
      applySubtleNoise: false,
      applyColorRebalance: false,
      applyDctCycle: false,
      applyEdgeDenoise: false,
    };
  }

  if (level === "light") {
    return {
      pixelRefreshLevel: "light",
      applyMicroCrop: true,
      applySubtleNoise: true,
      applyColorRebalance: false,
      applyDctCycle: false,
      applyEdgeDenoise: false,
    };
  }

  return {
    pixelRefreshLevel: level,
    applyMicroCrop: true,
    applySubtleNoise: true,
    applyColorRebalance: true,
    applyDctCycle: true,
    applyEdgeDenoise: true,
  };
}

export function resolveRefreshLevel(
  options: Pick<
    ScrubOptions,
    | "pixelRefreshLevel"
    | "applyMicroCrop"
    | "applySubtleNoise"
    | "applyColorRebalance"
    | "applyDctCycle"
    | "applyEdgeDenoise"
  >,
): PixelRefreshLevel {
  const anyEnabled = Boolean(
    options.applyMicroCrop ||
      options.applySubtleNoise ||
      options.applyColorRebalance ||
      options.applyDctCycle ||
      options.applyEdgeDenoise,
  );

  if (!anyEnabled) {
    return "off";
  }

  if (options.pixelRefreshLevel && options.pixelRefreshLevel !== "off") {
    return options.pixelRefreshLevel;
  }

  if (options.applyDctCycle || options.applyEdgeDenoise) {
    return "balanced";
  }

  return "light";
}

export async function scrubImage(
  file: File,
  options: ScrubOptions,
): Promise<{
  blob: Blob;
  cleanFileName: string;
  cleanedSizeBytes: number;
  pixelRefreshLevel: PixelRefreshLevel;
  perturbationMetrics: PixelPerturbationMetrics;
}> {
  const pixelRefreshLevel = resolveRefreshLevel(options);
  const { blob: rawBlob, stagesApplied } = await renderToCleanCanvas(
    file,
    options,
    pixelRefreshLevel,
  );
  const sanitizedBlob = await sanitizeImageBlob(rawBlob);
  const finalStages = ["Binary Container Strip", ...stagesApplied];

  const fidelity = await computeVisualFidelityMetrics(file, sanitizedBlob);

  const ext = EXTENSION_BY_FORMAT[options.outputFormat];
  const cleanFileName = options.randomizeFilename
    ? `IMG_${Math.floor(1000 + Math.random() * 9000)}_${Date.now().toString().slice(-4)}.${ext}`
    : `slatepic_${file.name.replace(/\.[^/.]+$/, "")}.${ext}`;

  return {
    blob: sanitizedBlob,
    cleanFileName,
    cleanedSizeBytes: sanitizedBlob.size,
    pixelRefreshLevel,
    perturbationMetrics: {
      psnrDb: fidelity.psnrDb,
      meanPixelDelta: fidelity.meanPixelDelta,
      stagesApplied: finalStages,
    },
  };
}

function loadBlobAsImage(blob: Blob): Promise<{
  img: HTMLImageElement;
  revoke: () => void;
}> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(blob);
    const img = new Image();
    let cleanedUp = false;

    const revoke = () => {
      if (!cleanedUp) {
        cleanedUp = true;
        URL.revokeObjectURL(objectUrl);
      }
    };

    img.onload = () => {
      resolve({ img, revoke });
    };

    img.onerror = () => {
      revoke();
      reject(new Error("Failed to decode image into HTML5 Canvas."));
    };

    img.src = objectUrl;
  });
}

function encodeCanvasToBlob(
  canvas: HTMLCanvasElement,
  format: OutputFormat,
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Canvas blob encoding failed."));
          return;
        }
        resolve(blob);
      },
      format,
      format === "image/png" ? undefined : quality,
    );
  });
}

async function renderToCleanCanvas(
  file: File,
  options: ScrubOptions,
  level: PixelRefreshLevel,
): Promise<{ blob: Blob; stagesApplied: string[] }> {
  const { img, revoke } = await loadBlobAsImage(file);
  const stagesApplied: string[] = ["Canvas RGB Redraw"];

  try {
    const width = img.naturalWidth;
    const height = img.naturalHeight;

    if (width <= 0 || height <= 0) {
      throw new Error(`Invalid image dimensions in "${file.name}".`);
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Canvas 2D context is unavailable in this browser.");
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    const fillOpaqueWhite = options.outputFormat === "image/jpeg";
    if (fillOpaqueWhite) {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, width, height);
    }

    const profile =
      level === "off" ? DSP_PROFILES.light : DSP_PROFILES[level];

    // Stage A: Sub-degree micro-rotation, inscribed border trim, and two-step resample
    if (options.applyMicroCrop && width > 32 && height > 32) {
      const aspect = Math.max(width / height, height / width);
      const absRad = Math.min(
        (profile.targetDeg * Math.PI) / 180,
        profile.maxCropBudget / aspect,
      );
      const angleRad = (Math.random() < 0.5 ? -1 : 1) * absRad;
      const inscribedScale = Math.max(
        1.02,
        (Math.cos(absRad) + aspect * Math.sin(absRad)) * 1.015,
      );

      const jitterSign = Math.random() < 0.5 ? -1 : 1;
      const interWidth = Math.max(
        16,
        Math.round(
          width * profile.resampleScale * (1 + jitterSign * profile.aspectJitter),
        ),
      );
      const interHeight = Math.max(
        16,
        Math.round(
          height *
            profile.resampleScale *
            (1 - jitterSign * profile.aspectJitter),
        ),
      );

      const interCanvas = document.createElement("canvas");
      interCanvas.width = interWidth;
      interCanvas.height = interHeight;
      const interCtx = interCanvas.getContext("2d");

      if (interCtx) {
        interCtx.imageSmoothingEnabled = true;
        interCtx.imageSmoothingQuality = "high";
        if (fillOpaqueWhite) {
          interCtx.fillStyle = "#FFFFFF";
          interCtx.fillRect(0, 0, interWidth, interHeight);
        }

        interCtx.save();
        interCtx.translate(interWidth / 2, interHeight / 2);
        interCtx.rotate(angleRad);
        interCtx.scale(inscribedScale, inscribedScale);
        interCtx.drawImage(
          img,
          -interWidth / 2,
          -interHeight / 2,
          interWidth,
          interHeight,
        );
        interCtx.restore();

        ctx.drawImage(interCanvas, -0.25, -0.25, width + 0.5, height + 0.5);
        const degText = ((absRad * 180) / Math.PI).toFixed(2);
        stagesApplied.push(
          `Micro-Rotation (${degText}deg) & ${Math.round(profile.resampleScale * 100)}% Resample`,
        );
      } else {
        ctx.drawImage(img, 0, 0, width, height);
      }
    } else {
      ctx.drawImage(img, 0, 0, width, height);
    }

    // Preserve existing transparency if non-JPEG output passes through DCT cycle
    let preservedAlpha: Uint8Array | null = null;
    if (options.applyDctCycle && width > 16 && height > 16) {
      if (!fillOpaqueWhite) {
        preservedAlpha = extractAlphaIfTransparent(ctx, width, height);
      }
      await runDctQuantizationPass(canvas, ctx, width, height, profile.dctQuality);
      if (preservedAlpha) {
        restoreAlphaChannel(ctx, width, height, preservedAlpha);
      }
      stagesApplied.push(
        `JPEG DCT Re-Quantization (${Math.round(profile.dctQuality * 100)}%)`,
      );
    }

    // Stage C: Edge-aware bilateral denoise, tonal rebalance, and Gaussian film grain
    const runEdgeDenoise = Boolean(options.applyEdgeDenoise);
    const runColor = Boolean(options.applyColorRebalance);
    const runNoise = Boolean(options.applySubtleNoise);

    if (runEdgeDenoise || runColor || runNoise) {
      applyDspPixelPass(ctx, width, height, profile, {
        edgeDenoise: runEdgeDenoise,
        colorRebalance: runColor,
        noise: runNoise,
      });

      if (runEdgeDenoise) stagesApplied.push("Edge-Aware Denoise & Sharpen");
      if (runColor) stagesApplied.push("Color & Gamma Re-balance");
      if (runNoise) stagesApplied.push("Gaussian Film Grain");
    }

    const blob = await encodeCanvasToBlob(
      canvas,
      options.outputFormat,
      options.quality,
    );

    return { blob, stagesApplied };
  } finally {
    revoke();
  }
}

function extractAlphaIfTransparent(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): Uint8Array | null {
  const { data } = ctx.getImageData(0, 0, width, height);
  let hasTransparency = false;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 255) {
      hasTransparency = true;
      break;
    }
  }
  if (!hasTransparency) return null;

  const alpha = new Uint8Array(width * height);
  for (let p = 0; p < alpha.length; p++) {
    alpha[p] = data[p * 4 + 3];
  }
  return alpha;
}

function restoreAlphaChannel(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  alpha: Uint8Array,
): void {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  for (let p = 0; p < alpha.length; p++) {
    data[p * 4 + 3] = alpha[p];
  }
  ctx.putImageData(imgData, 0, 0);
}

async function runDctQuantizationPass(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  dctQuality: number,
): Promise<void> {
  const jpegBlob = await encodeCanvasToBlob(canvas, "image/jpeg", dctQuality);
  const { img, revoke } = await loadBlobAsImage(jpegBlob);
  try {
    ctx.drawImage(img, -0.25, -0.25, width + 0.5, height + 0.5);
  } finally {
    revoke();
  }
}

function nextGaussian(): number {
  const u1 = Math.max(1e-7, Math.random());
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function clampByte(value: number): number {
  if (value <= 0) return 0;
  if (value >= 255) return 255;
  return Math.round(value);
}

function buildGammaLut(gamma: number): Uint8Array {
  const lut = new Uint8Array(256);
  for (let i = 0; i < 256; i++) {
    lut[i] = clampByte(255 * (i / 255) ** gamma);
  }
  return lut;
}

function applyDspPixelPass(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  profile: DspProfile,
  effects: { edgeDenoise: boolean; colorRebalance: boolean; noise: boolean },
): void {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const src = effects.edgeDenoise ? new Uint8ClampedArray(data) : data;
  const gammaLut = effects.colorRebalance ? buildGammaLut(profile.gamma) : null;
  const twoSigmaSq = 2 * profile.edgeSigma * profile.edgeSigma;
  const rowStride = width * 4;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * rowStride + x * 4;
      let r = src[idx];
      let g = src[idx + 1];
      let b = src[idx + 2];

      if (
        effects.edgeDenoise &&
        x > 0 &&
        x < width - 1 &&
        y > 0 &&
        y < height - 1
      ) {
        const left = idx - 4;
        const right = idx + 4;
        const up = idx - rowStride;
        const down = idx + rowStride;

        const avgR = (src[left] + src[right] + src[up] + src[down]) * 0.25;
        const avgG =
          (src[left + 1] + src[right + 1] + src[up + 1] + src[down + 1]) * 0.25;
        const avgB =
          (src[left + 2] + src[right + 2] + src[up + 2] + src[down + 2]) * 0.25;

        const centerLum = 0.299 * r + 0.587 * g + 0.114 * b;
        const avgLum = 0.299 * avgR + 0.587 * avgG + 0.114 * avgB;
        const lumDiff = Math.abs(centerLum - avgLum);

        const edgeStopping = Math.exp(-(lumDiff * lumDiff) / twoSigmaSq);
        const smoothWeight = profile.smoothMix * edgeStopping;
        const sharpenWeight = profile.unsharpAmount * (1 - edgeStopping);

        r = r + (avgR - r) * smoothWeight + (r - avgR) * sharpenWeight;
        g = g + (avgG - g) * smoothWeight + (g - avgG) * sharpenWeight;
        b = b + (avgB - b) * smoothWeight + (b - avgB) * sharpenWeight;
      }

      if (gammaLut) {
        r = gammaLut[clampByte(r)];
        g = gammaLut[clampByte(g)];
        b = gammaLut[clampByte(b)];

        r = (r - 127.5) * profile.contrast + 127.5;
        g = (g - 127.5) * profile.contrast + 127.5;
        b = (b - 127.5) * profile.contrast + 127.5;

        r = r * 1.007 + 0.5;
        g = g * 0.996 - 0.3;
        b = b * 1.005 + 0.4;
      }

      if (effects.noise) {
        const lumaGrain = nextGaussian() * profile.noiseSigma;
        r += lumaGrain + nextGaussian() * profile.chromaJitter;
        g += lumaGrain + nextGaussian() * profile.chromaJitter;
        b += lumaGrain + nextGaussian() * profile.chromaJitter;
      }

      data[idx] = clampByte(r);
      data[idx + 1] = clampByte(g);
      data[idx + 2] = clampByte(b);
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

async function computeVisualFidelityMetrics(
  originalFile: File,
  cleanedBlob: Blob,
): Promise<{ psnrDb: number; meanPixelDelta: number }> {
  let origHandle: Awaited<ReturnType<typeof loadBlobAsImage>> | null = null;
  let cleanHandle: Awaited<ReturnType<typeof loadBlobAsImage>> | null = null;

  try {
    [origHandle, cleanHandle] = await Promise.all([
      loadBlobAsImage(originalFile),
      loadBlobAsImage(cleanedBlob),
    ]);

    const maxSampleDim = 256;
    const scale = Math.min(
      1,
      maxSampleDim /
        Math.max(origHandle.img.naturalWidth, origHandle.img.naturalHeight, 1),
    );
    const sampleW = Math.max(
      16,
      Math.round(origHandle.img.naturalWidth * scale),
    );
    const sampleH = Math.max(
      16,
      Math.round(origHandle.img.naturalHeight * scale),
    );

    const canvasA = document.createElement("canvas");
    const canvasB = document.createElement("canvas");
    canvasA.width = sampleW;
    canvasA.height = sampleH;
    canvasB.width = sampleW;
    canvasB.height = sampleH;

    const ctxA = canvasA.getContext("2d");
    const ctxB = canvasB.getContext("2d");
    if (!ctxA || !ctxB) {
      return { psnrDb: 99.9, meanPixelDelta: 0 };
    }

    ctxA.drawImage(origHandle.img, 0, 0, sampleW, sampleH);
    ctxB.drawImage(cleanHandle.img, 0, 0, sampleW, sampleH);

    const dataA = ctxA.getImageData(0, 0, sampleW, sampleH).data;
    const dataB = ctxB.getImageData(0, 0, sampleW, sampleH).data;

    let sumSqErr = 0;
    let sumAbsErr = 0;
    const channelSamples = sampleW * sampleH * 3;

    for (let i = 0; i < dataA.length; i += 4) {
      const dr = dataA[i] - dataB[i];
      const dg = dataA[i + 1] - dataB[i + 1];
      const db = dataA[i + 2] - dataB[i + 2];
      sumSqErr += dr * dr + dg * dg + db * db;
      sumAbsErr += Math.abs(dr) + Math.abs(dg) + Math.abs(db);
    }

    const mse = sumSqErr / Math.max(1, channelSamples);
    const mae = sumAbsErr / Math.max(1, channelSamples);

    const psnrDb =
      mse < 1e-6
        ? 99.9
        : Math.round(10 * Math.log10((255 * 255) / mse) * 10) / 10;

    return {
      psnrDb: Math.min(99.9, Math.max(10, psnrDb)),
      meanPixelDelta: Math.round(mae * 100) / 100,
    };
  } catch {
    return { psnrDb: 99.9, meanPixelDelta: 0 };
  } finally {
    origHandle?.revoke();
    cleanHandle?.revoke();
  }
}

export async function convertBlobToPngForClipboard(blob: Blob): Promise<Blob> {
  if (blob.type === "image/png") {
    return blob;
  }

  const { img, revoke } = await loadBlobAsImage(blob);
  try {
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Canvas context unavailable");
    }
    ctx.drawImage(img, 0, 0);
    return await encodeCanvasToBlob(canvas, "image/png");
  } finally {
    revoke();
  }
}

export async function buildBatchZip(
  items: Array<{ blob: Blob; cleanFileName: string }>,
): Promise<Blob> {
  const zip = new JSZip();
  const seenNames = new Map<string, number>();

  for (const item of items) {
    const count = seenNames.get(item.cleanFileName) ?? 0;
    seenNames.set(item.cleanFileName, count + 1);

    let archiveName = item.cleanFileName;
    if (count > 0) {
      const dotIdx = item.cleanFileName.lastIndexOf(".");
      if (dotIdx > 0) {
        const stem = item.cleanFileName.slice(0, dotIdx);
        const ext = item.cleanFileName.slice(dotIdx);
        archiveName = `${stem} (${count})${ext}`;
      } else {
        archiveName = `${item.cleanFileName} (${count})`;
      }
    }

    zip.file(archiveName, item.blob);
  }

  return zip.generateAsync({ type: "blob" });
}
