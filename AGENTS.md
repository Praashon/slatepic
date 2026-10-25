<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md — SlatePic Master System Blueprint & AI Developer Guidelines

This document serves as the master specification and operational prompt guide for any AI coding agent (Cursor, Windsurf, Claude Code, GitHub Copilot, Gemini, etc.) working on **SlatePic**.

---

## 1. Executive Summary & Product Mission

- **Brand Name:** `SlatePic`
- **Tagline:** "A Fresh Canvas for Every Pixel."
- **Core Purpose:** A 100% free, privacy-first, zero-server web application built with **Next.js 16 (App Router)** that inspects hidden image provenance metadata (EXIF, IPTC, XMP, C2PA Content Credentials, AI generator signatures) and strips them clean using client-side HTML5 Canvas rendering.

### Core Architectural Principles

1. **Zero Uploads:** All image decoding, inspection, scrubbing, and pixel perturbation MUST occur 100% client-side in the user's browser. No image binary ever touches a backend server.
2. **Local Persistence (Dexie.js):** Personal scrub history, statistics, and user presets are stored locally in IndexedDB via Dexie.js. No login or account required.
3. **Anonymous Global Pulse (Upstash Redis):** An ultra-light serverless HTTP Redis layer tracks global social proof (e.g., total images scrubbed, AI tags nuked) without recording any personal data.
4. **Zero Compute Costs:** $0$ backend image compute costs, infinite scalability, hosted on Vercel static/edge infrastructure.

---

## 2. Verified Technology Stack & Specific Versions

All AI agents must ensure `package.json` reflects these exact versions and adhere to their architectural specifications:

| Package                               | Verified Version  | Primary Role in SlatePic                                                              |
| :------------------------------------ | :---------------- | :------------------------------------------------------------------------------------ |
| **`next`**                            | `16.4.6`          | App Router, Turbopack, React 19 compilation, Edge route handlers.                     |
| **`react`** / **`react-dom`**         | `19.3.1`          | Native `use(browser())` support, component streaming, view transitions.               |
| **`typescript`**                      | `7.0.2`           | Strict typing, fast native compiler (`tsc`), typed Canvas & Metadata contracts.       |
| **`tailwindcss`**                     | `4.3.5`           | CSS-first configuration using `@theme` directive in `globals.css`.                    |
| **`@tanstack/react-query`**           | `5.108.2`         | Reactive state manager for Canvas scrubbing mutations, Dexie reads, and Redis stats.  |
| **`gsap`** + **`@gsap/react`**        | `3.15.1`          | Inspector scanlines, badge flips, dropzone spring physics, count-up tweens.           |
| **`dexie`** + **`dexie-react-hooks`** | `4.4.7` / `4.4.0` | Local-first IndexedDB wrapper for presets and scrub history.                          |
| **`@upstash/redis`**                  | `1.41.0`          | Serverless HTTP REST client for anonymous global counter (`slatepic:images_cleaned`). |
| **`exifr`**                           | `7.1.3`           | Browser-native EXIF / XMP / IPTC / ICC metadata parser.                               |
| **`jszip`**                           | `3.10.1`          | Client-side ZIP archive builder for batch downloads (`slatepic-cleaned.zip`).         |

---

## 3. Mandatory Version-Specific Rules

AI agents generating or refactoring code MUST enforce these three platform rules:

### Rule 1: No `tailwind.config.ts` (Tailwind v4 `@theme` Rule)

- **DO NOT** create a `tailwind.config.js` or `tailwind.config.ts` file.
- All custom fonts, colors, keyframes, and breakpoints MUST be defined directly inside `src/app/globals.css` using the Tailwind v4 `@theme` directive.

### Rule 2: Browser API Guarding via React 19.3 (`use(browser())`)

- Browser-only APIs (`<canvas>`, `IndexedDB`, `window.FileReader`) MUST NOT rely on verbose `useEffect` hydration hacks.
- Use React 19.3's native client environment resolution or wrap browser-only modules in standard `'use client'` boundaries with fallback Suspense boundaries.

### Rule 3: TypeScript 7 + Compiler Standard

- Code must strictly conform to TypeScript 7 `target: "es2025"`.
- Code linting and formatting MUST use Biome (`@biomejs/biome`) or native Next.js 16 tooling. Do not introduce legacy ESLint plugins incompatible with TS 7.0.

---

## 4. Technical Distinction: Metadata vs. SynthID

When instructing AI agents or generating UI copy, maintain strict technical accuracy:

1. **Metadata & Provenance Stripping (Primary Feature — 100% Effective):**
   - ChatGPT, DALL-E, Midjourney, and Adobe Firefly attach C2PA manifests (`jumb` box), IPTC headers, and EXIF software tags (`DigitalSourceType`, `ChatGPT`, etc.).
   - Meta (Instagram/Facebook) reads these header tags to apply the **"AI Info"** label.
   - **Solution:** Redrawing raw RGB image pixels onto an unlinked HTML5 `<canvas>` discards $100\%$ of C2PA, EXIF, and IPTC header manifests.

2. **Pixel-Level Watermarks (Secondary Feature — Transparently Communicated):**
   - DeepMind **SynthID** or Stable Diffusion frequency-domain watermarks embed subtle statistical patterns directly into pixel RGB data.
   - **Solution:** SlatePic provides an optional **"Light Pixel Refresh"** toggle (applying a $1\%$ micro-crop, subtle Gaussian film grain, and mild color re-balancing).
   - **User Disclaimer:** Clear UI copy informing users that while metadata scrubbing eliminates platform auto-flagging, deep pixel watermarks are degraded but not guaranteed to be erased without destructive image distortion.

---

## 5. Design System Specification (Inspired by `prashon.com.np`)

The UI follows the Swiss-inspired, high-contrast, developer-designer aesthetic of **`prashon.com.np`**. It combines dark paper canvases, precise grid alignment, glowing status indicators, monospaced data tags, and polished GSAP motion graphics.

### 5.1 Typography Stack (`src/app/globals.css`)

Configure fonts via Google Fonts in Next.js (`src/app/layout.tsx`):

- **Display / Headings:** `Space Grotesk` (weights: 500, 600, 700) — technical, geometric, bold.
- **UI / Body:** `Inter` (weights: 400, 500, 600) — hyper-legible interface text.
- **Code / Tags / Hashes:** `JetBrains Mono` (weights: 400, 500) — raw data visualization.

### 5.2 Tailwind v4 Design Tokens (`src/app/globals.css`)

```css
@import "tailwindcss";

@theme {
  --font-sans: "Inter", sans-serif;
  --font-display: "Space Grotesk", sans-serif;
  --font-mono: "JetBrains Mono", monospace;

  --color-slate-obsidian: #09090b;
  --color-slate-card: #18181b;
  --color-slate-border: #27272a;
  --color-slate-hover: #3f3f46;

  --color-accent-emerald: #34d399;
  --color-accent-rose: #f43f5e;
  --color-accent-amber: #fbbf24;
  --color-accent-cyan: #22d3ee;
}

/* Custom Grid Pattern */
.bg-grid-pattern {
  background-image: radial-gradient(#333336 1px, transparent 1px);
  background-size: 16px 16px;
}
```

---

## 6. Local Database & Global Metrics Schema

### 6.1 Dexie.js Schema (`src/lib/db.ts`)

```typescript
import Dexie, { type Table } from "dexie";

export interface UserPreset {
  id?: number;
  name: string;
  outputFormat: "image/jpeg" | "image/png" | "image/webp";
  quality: number;
  applyMicroCrop: boolean;
  applySubtleNoise: boolean;
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
```

### 6.2 Upstash Redis Integration (`src/app/api/stats/route.ts`)

```typescript
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

const redis = Redis.fromEnv();

export async function GET() {
  try {
    const [imagesCleaned, tagsNuked, bytesSaved] = await Promise.all([
      redis.get<number>("slatepic:images_cleaned") || 0,
      redis.get<number>("slatepic:ai_tags_nuked") || 0,
      redis.get<number>("slatepic:bytes_saved") || 0,
    ]);

    return NextResponse.json({ imagesCleaned, tagsNuked, bytesSaved });
  } catch {
    // Graceful fallback for offline mode or unconfigured Redis keys
    return NextResponse.json({
      imagesCleaned: 14250,
      tagsNuked: 42100,
      bytesSaved: 1288490188,
    });
  }
}

export async function POST(request: Request) {
  try {
    const {
      count = 1,
      tagsCount = 0,
      bytesSavedCount = 0,
    } = await request.json();

    await Promise.all([
      redis.incrby("slatepic:images_cleaned", count),
      redis.incrby("slatepic:ai_tags_nuked", tagsCount),
      redis.incrby("slatepic:bytes_saved", bytesSavedCount),
    ]);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
```

---

## 7. GSAP Motion Graphics Specification

AI agents MUST use `@gsap/react` (`useGSAP`) for clean lifecycle management:

1. **Dropzone Spring Hover:** Scale dropzone container to `scale: 1.02` with `ease: "back.out(1.7)"` on drag hover.
2. **Inspector Laser Sweep:** During scanning, an absolute positioned laser line sweeps vertically across the preview (`y: "0%" -> "100%"`, `repeat: -1`, `yoyo: true`, `duration: 1.2s`, `ease: "power2.inOut"`).
3. **Badge Flip Transition:** When scrubbing completes, animate red warning tags out (`y: -10, opacity: 0`) and animate green clean badges in (`y: 10 -> 0, opacity: 1, stagger: 0.08s`).
4. **Counter Roll:** Global counters animate smoothly on load using `gsap.to(targetObj, { val: newValue, duration: 1.5, onUpdate: updateText })`.

---

## 8. Directory Architecture

AI agents must strictly construct code within this structure:

```text
src/
├── app/
│   ├── layout.tsx              # Space Grotesk, Inter, JetBrains Mono + QueryProvider
│   ├── page.tsx                # Hero, Dropzone, Dynamic Dashboard, Counter
│   ├── history/page.tsx        # Local Dexie.js scrub history audit log
│   ├── presets/page.tsx        # User export preset manager
│   ├── privacy/page.tsx        # Zero-Server privacy statement
│   ├── faq/page.tsx            # C2PA vs EXIF vs SynthID deep dive
│   ├── api/stats/route.ts      # Upstash Redis global count proxy
│   └── globals.css             # Tailwind v4 directives & @theme
├── components/
│   ├── Navbar.tsx              # Header with live social pulse badge
│   ├── Footer.tsx              # Prashon-inspired minimal developer footer
│   ├── Dropzone.tsx            # Drag & drop input area with GSAP physics
│   ├── ImageInspector.tsx      # Dual preview with tag breakdown
│   ├── MetadataScanner.tsx     # Animated laser sweep scanner
│   ├── ScrubberControls.tsx   # Output format, quality slider, micro-crop/noise toggles
│   ├── VerificationBadge.tsx   # Re-inspected 0 tags proof element
│   └── GlobalCounter.tsx       # Live GSAP counter for social proof
├── lib/
│   ├── inspector.ts            # exifr + ArrayBuffer binary C2PA/AI scanner
│   ├── scrubber.ts             # Canvas draw engine, 1% crop, noise generator
│   ├── db.ts                   # Dexie.js database instance
│   └── utils.ts                # Byte formatters, cn helper
├── hooks/
│   ├── useImageScrubber.ts     # TanStack Query useMutation for scrub pipeline
│   ├── useGlobalStats.ts       # TanStack Query useQuery for Redis metrics
│   └── useLocalPresets.ts      # Dexie liveQuery wrapper
└── types/
    └── index.ts                # Metadata and Scrubber TypeScript contracts
AGENTS.md                       # Master AI Developer Blueprint
package.json
```

---

## 9. Core Engine Implementation Modules

### 9.1 Metadata Inspector (`src/lib/inspector.ts`)

```typescript
import exifr from "exifr";

export interface MetadataReport {
  hasAiProvenance: boolean;
  c2paDetected: boolean;
  exifDetected: boolean;
  softwareTag?: string;
  digitalSourceType?: string;
  detectedSignatures: string[];
  fileSizeFormatted: string;
  fileSizeBytes: number;
  dimensions: { width: number; height: number };
}

export async function inspectImage(file: File): Promise<MetadataReport> {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  const textDecoder = new TextDecoder("latin1");
  const fileHeaderString = textDecoder.decode(
    bytes.slice(0, Math.min(bytes.length, 120000)),
  );

  const detectedSignatures: string[] = [];

  const c2paDetected =
    fileHeaderString.includes("jumb") ||
    fileHeaderString.includes("c2pa") ||
    fileHeaderString.includes("c2pa.claim");
  if (c2paDetected) detectedSignatures.push("C2PA Content Credentials");

  const aiKeywords = [
    "ChatGPT",
    "DALL-E",
    "Midjourney",
    "Stable Diffusion",
    "ComfyUI",
    "TrainedAlgorithmicMedia",
    "Firefly",
  ];
  for (const keyword of aiKeywords) {
    if (fileHeaderString.toLowerCase().includes(keyword.toLowerCase())) {
      detectedSignatures.push(`Signature: ${keyword}`);
    }
  }

  let rawTags: Record<string, unknown> = {};
  try {
    rawTags =
      (await exifr.parse(file, {
        xmp: true,
        icc: true,
        iptc: true,
        jfif: true,
      })) || {};
  } catch {
    rawTags = {};
  }

  const softwareTag =
    (rawTags.Software as string) || (rawTags.creator as string) || undefined;
  const digitalSourceType = (rawTags.DigitalSourceType as string) || undefined;

  if (softwareTag && !detectedSignatures.some((s) => s.includes(softwareTag))) {
    detectedSignatures.push(`Software: ${softwareTag}`);
  }
  if (digitalSourceType) {
    detectedSignatures.push(`Source: ${digitalSourceType}`);
  }

  const dimensions = await getImageDimensions(file);

  return {
    hasAiProvenance: detectedSignatures.length > 0 || c2paDetected,
    c2paDetected,
    exifDetected: Object.keys(rawTags).length > 0,
    softwareTag,
    digitalSourceType,
    detectedSignatures,
    fileSizeFormatted: formatBytes(file.size),
    fileSizeBytes: file.size,
    dimensions,
  };
}

function getImageDimensions(
  file: File,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(img.src);
    };
  });
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
```

### 9.2 Canvas Scrubber Engine (`src/lib/scrubber.ts`)

```typescript
export interface ScrubOptions {
  outputFormat: "image/jpeg" | "image/png" | "image/webp";
  quality: number;
  applyMicroCrop: boolean;
  applySubtleNoise: boolean;
  randomizeFilename: boolean;
}

export async function scrubImage(
  file: File,
  options: ScrubOptions,
): Promise<{ blob: Blob; cleanFileName: string; cleanedSizeBytes: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);

    img.onload = () => {
      try {
        const width = img.naturalWidth;
        const height = img.naturalHeight;

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Canvas context unavailable"));
          return;
        }

        let sourceX = 0;
        let sourceY = 0;
        let sourceWidth = width;
        let sourceHeight = height;

        if (options.applyMicroCrop) {
          const cropX = Math.floor(width * 0.01);
          const cropY = Math.floor(height * 0.01);
          sourceX = cropX;
          sourceY = cropY;
          sourceWidth = width - cropX * 2;
          sourceHeight = height - cropY * 2;
        }

        canvas.width = sourceWidth;
        canvas.height = sourceHeight;

        if (options.outputFormat === "image/jpeg") {
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.drawImage(
          img,
          sourceX,
          sourceY,
          sourceWidth,
          sourceHeight,
          0,
          0,
          sourceWidth,
          sourceHeight,
        );

        if (options.applySubtleNoise) {
          applySubtleNoise(ctx, sourceWidth, sourceHeight);
        }

        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(img.src);
            if (!blob) {
              reject(new Error("Blob generation failed"));
              return;
            }

            const ext =
              options.outputFormat === "image/jpeg"
                ? "jpg"
                : options.outputFormat === "image/png"
                  ? "png"
                  : "webp";
            const cleanFileName = options.randomizeFilename
              ? `IMG_${Math.floor(1000 + Math.random() * 9000)}_${Date.now().toString().slice(-4)}.${ext}`
              : `slatepic_${file.name.replace(/\.[^/.]+$/, "")}.${ext}`;

            resolve({ blob, cleanFileName, cleanedSizeBytes: blob.size });
          },
          options.outputFormat,
          options.quality,
        );
      } catch (err) {
        URL.revokeObjectURL(img.src);
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error("Failed to render image to canvas"));
    };
  });
}

function applySubtleNoise(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const intensity = 3;

  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * intensity;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }

  ctx.putImageData(imgData, 0, 0);
}
```

---

## 10. AI Agent Verification & Quality Checklist

Before completing any task, AI agents must verify:

- [ ] `package.json` contains exact dependency versions (Next.js 16.4.6, React 19.3.1, TypeScript 7.0.2, Tailwind 4.3.5, TanStack Query 5.108.2, GSAP 3.15.1, Dexie 4.4.7, Upstash Redis 1.41.0).
- [ ] No `tailwind.config.ts` exists; tokens are in `src/app/globals.css` `@theme`.
- [ ] All Canvas URL objects are cleaned up via `URL.revokeObjectURL()`.
- [ ] GSAP context/hooks use `@gsap/react` for unmount safety.
- [ ] Image processing is 100% client-side with zero binary uploads to server routes.
