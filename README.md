<div align="center">

# SlatePic

**A privacy-first, 100% client-side image provenance inspector, C2PA and EXIF metadata scrubber, and multi-stage pixel signal refresh studio built with Next.js 16 and HTML5 Canvas.**

[![Next.js](https://img.shields.io/badge/Next.js-16.4.6-000000?style=flat-square&logo=nextdotjs)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.3.1-149ECA?style=flat-square&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-7.0.2-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.3.5-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![IndexedDB](https://img.shields.io/badge/Storage-Dexie%20IndexedDB-0D9488?style=flat-square)](https://dexie.org/)
[![Architecture](https://img.shields.io/badge/Pipeline-100%25%20Client--Side-10B981?style=flat-square)](#privacy-and-zero-server-architecture)

</div>

---

## Overview

SlatePic inspects hidden provenance manifests, camera telemetry, and AI generator signatures inside digital images and strips them clean inside your browser. Every file decode, binary header scan, HTML5 Canvas pixel redraw, multi-stage signal perturbation pass, SHA-256 verification hash, and batch `.ZIP` export runs locally in browser memory without uploading a single image byte to an external server.

## Highlights

- **100% Client-Side & Zero Image Uploads:** Image binaries never touch a backend route or cloud bucket. All inspection and scrubbing operations execute inside the browser's HTML5 Canvas 2D context and Web Crypto API.
- **Deep Provenance & C2PA Inspection:** Scans raw container bytes and structured metadata blocks (`EXIF`, `IPTC`, `XMP`, `ICC`, `JFIF`, PNG text chunks, and C2PA JUMBF `jumb` / `c2pa.claim` manifests) to expose camera coordinates and AI generator tags (`ChatGPT`, `DALL-E`, `Midjourney`, `Stable Diffusion`, `ComfyUI`, `Firefly`, `TrainedAlgorithmicMedia`) while filtering structural layout headers (`IHDR`, `JFIF` pixel dimensions) for zero false positives.
- **Binary Container Sanitizer & Verification Gate:** After redrawing raw RGB/RGBA pixels onto an unlinked Canvas, a dedicated binary parser (`src/lib/sanitizer.ts`) strips residual ancillary chunks across PNG, JPEG, and WebP containers and re-runs the inspector (`hasForbiddenMetadata`) to verify `0` metadata tags remain before allowing download.
- **Multi-Stage Pixel Refresh DSP (SynthID Mitigation):** Configurable 4-tier signal refresh engine (`Off`, `Light`, `Balanced`, `Strong`) with individual stage toggles combining sub-degree micro-rotation (`0.30deg` to `1.05deg`), inscribed border scaling, two-step sub-pixel resampling (`99%` to `89%`), an intermediate 8x8 JPEG DCT re-quantization cycle (with alpha preservation for PNG/WebP), luminance-guided edge-aware bilateral denoising, tonal gamma balancing, and coupled Box-Muller Gaussian film grain.
- **Interactive Split Comparator & PSNR Fidelity Telemetry:** Inspect visual sharpness directly in the Studio using the draggable `Cleaned | Compare | Original` split-curtain slider alongside real-time client-side PSNR (`dB`) fidelity scores, mean per-channel pixel shift (`/255`), and cryptographic SHA-256 output digests.
- **Batch Processing & Client-Side ZIP Archiving:** Queue multiple `JPEG`, `PNG`, `WebP`, `AVIF`, or `GIF` files via drag-and-drop, file picker, or direct clipboard paste (`Ctrl+V`), scrub all pending files sequentially, and package verified outputs into `slatepic-cleaned.zip` via `JSZip`.
- **Inline Interactive Live Walkthrough:** First-time visitors experience a non-modal, step-by-step live tour inside the Studio using an in-memory generated PNG sample carrying real C2PA and EXIF chunks, with full pause, step-back, skip, and replay controls.
- **Local IndexedDB Presets & Audit History:** Custom export presets and scrub audit logs persist locally in `SlatePicDB` (`Dexie.js`), paired with a one-click local storage and IndexedDB purge control on `/privacy`.

---

## Architecture & Directory Layout

```text
src/
├── app/
│   ├── layout.tsx              # Root layout, Poppins typography, theme init & QueryProvider
│   ├── page.tsx                # Studio workspace route (/): hero, live counter & scrubber
│   ├── history/page.tsx        # Local IndexedDB scrub audit log (/history)
│   ├── presets/page.tsx        # Custom export preset manager (/presets)
│   ├── privacy/page.tsx        # Zero-server architecture proof & local data wipe (/privacy)
│   ├── faq/page.tsx            # Technical breakdown of C2PA, EXIF, and SynthID (/faq)
│   ├── api/stats/route.ts      # Anonymous Upstash Redis global telemetry proxy
│   ├── error.tsx               # Client error boundary recovery view
│   ├── not-found.tsx           # Custom 404 route
│   └── globals.css             # Tailwind CSS v4 @theme tokens & custom animations
├── components/
│   ├── StudioWorkspace.tsx     # Orchestrates file queue, live demo, inspection & scrubbing
│   ├── Dropzone.tsx            # Drag-and-drop, clipboard paste (Ctrl+V) & sample loader
│   ├── ImageInspector.tsx      # Cleaned/Compare/Original viewport & metadata tag breakdown
│   ├── MetadataScanner.tsx     # Preview frame with GSAP laser sweep animation
│   ├── ScrubberControls.tsx    # Format, quality slider & 4-tier Pixel Refresh DSP controls
│   ├── VerificationBadge.tsx   # Post-scrub 0-tag proof, SHA-256 digest & PSNR fidelity card
│   ├── LiveDemoBar.tsx         # Non-modal guided walkthrough controller
│   ├── DownloadAllButton.tsx   # Client-side JSZip batch archive builder
│   ├── GlobalCounter.tsx       # GSAP-animated real-time telemetry strip
│   ├── HistoryView.tsx         # Local scrub history table with search & clear actions
│   ├── PresetsView.tsx         # IndexedDB preset CRUD cards & editor form
│   ├── PrivacyWipeButton.tsx   # Instant local IndexedDB & localStorage reset control
│   ├── FaqAccordion.tsx        # Accessible technical FAQ disclosure list
│   ├── Navbar.tsx              # Responsive studio header, route tabs & theme switcher
│   ├── Footer.tsx              # Minimal Aperture Studio footer
│   ├── BrandLogo.tsx           # Vector aperture studio mark
│   ├── QueryProvider.tsx       # TanStack Query v5 client & theme synchronization store
│   └── ui/                     # Reusable UI primitives (badge, button, switch, background)
├── hooks/
│   ├── useImageScrubber.ts     # Scrubbing mutation pipeline, verification gate & stat sync
│   ├── useGlobalStats.ts       # Real-time polling hook for /api/stats
│   └── useLocalPresets.ts      # Reactive Dexie useLiveQuery wrapper for presets
├── lib/
│   ├── inspector.ts            # exifr parser + binary C2PA/AI provenance signature scanner
│   ├── sanitizer.ts            # Pure binary container stripper for PNG, JPEG & WebP
│   ├── scrubber.ts             # HTML5 Canvas redraw engine, multi-stage DSP & PSNR metrics
│   ├── demoSample.ts           # In-memory C2PA/EXIF PNG sample generator for live demo
│   ├── db.ts                   # Dexie.js SlatePicDB schema & default studio presets
│   └── utils.ts                # Byte/time formatters, class merger & blob download helper
└── types/
    └── index.ts                # Strict TypeScript contracts for reports, options & presets
```

---

## Deep Dive: How SlatePic Works

### 1. Binary Provenance Inspection & Container Sanitization (`inspector.ts` & `sanitizer.ts`)

- **Dual-Layer Inspection:** Reads the raw `ArrayBuffer` header to detect binary C2PA JUMBF boxes (`jumb`, `c2pa`, `c2pa.claim`), PNG text chunks (`parameters`, `prompt`, `workflow`, `Comment`), and generator signatures alongside structured `exifr` parsing across `EXIF`, `XMP`, `IPTC`, and `ICC` segments.
- **Zero False-Positive Structural Filtering:** Excludes container pixel-layout keys required to decode an image (`ImageWidth`, `ImageHeight`, `BitDepth`, `ColorType`, `Compression`, `Filter`, `Interlace`, `JFIFVersion`, `ResolutionUnit`, `XResolution`, `YResolution`) so clean images report `0` metadata tags accurately.
- **Deterministic Binary Stripping:** Even after HTML5 `canvas.toBlob()` encoding, browsers may attach default `pHYs`, `sRGB`, `gAMA`, or `APP0` segments. `sanitizeImageBlob()` parses the encoded output binary directly:
  - **PNG:** Retains only critical chunks (`IHDR`, `PLTE`, `tRNS`, `IDAT`, `IEND`) and drops all ancillary chunks (`tEXt`, `zTXt`, `iTXt`, `eXIf`, `iCCP`, `pHYs`, `tIME`, `cHRM`, `gAMA`, `sRGB`, `bKGD`).
  - **JPEG:** Strips all `APP1` through `APP15` (`0xFFE1` to `0xFFEF`) and `COM` (`0xFFFE`) marker segments while preserving visual scan data.
  - **WebP:** Walks the RIFF container, drops `EXIF`, `XMP `, and `ICCP` chunks, clears metadata bitflags in `VP8X`, and recalculates the RIFF payload length header.

### 2. Multi-Stage Pixel Refresh DSP & PSNR Verification (`scrubber.ts`)

While container sanitization eliminates 100% of header provenance (`C2PA`, `EXIF`, `IPTC`, `XMP`), frequency-domain watermarks such as DeepMind SynthID embed statistical patterns directly into pixel RGB values. When **Pixel Refresh** (`Light`, `Balanced`, or `Strong`) is enabled, SlatePic executes a multi-stage signal processing pass in browser RAM:

1. **Sub-Degree Micro-Rotation & Inscribed Resampling:** Rotates the image by a randomized sub-degree angle (`0.30deg` to `1.05deg`), computes the exact trigonometric inscribed scale factor (`cos(theta) + aspect * sin(theta)`) so corner backgrounds never appear, and performs a two-step sub-pixel resample (`99%` to `89%` with slight aspect jitter) to break 8x8 DCT and wavelet block alignment.
2. **Intermediate 8x8 JPEG DCT Re-Quantization Cycle:** Encodes the working canvas through an intermediate JPEG DCT pass (`88%` to `68%`) and re-decodes it with a `0.25px` phase offset to quantize high-frequency spectral watermark carriers while extracting and restoring the original alpha channel for transparent PNG and WebP exports.
3. **Luminance-Guided Edge-Aware Bilateral Denoise & Unsharp Restore:** Smooths low-amplitude watermark carrier residuals across flat and gradient areas while preserving sharp contrast boundaries and text.
4. **Tonal Gamma Curve & Coupled Box-Muller Gaussian Grain:** Applies a precomputed 256-entry gamma LUT, subtle mid-tone contrast, mild per-channel gain, and natural luminance-coupled Gaussian film grain.
5. **End-to-End PSNR & Pixel Shift Telemetry:** Samples the original and scrubbed images across an offscreen comparison canvas to report exact Peak Signal-to-Noise Ratio (`dB PSNR`) and mean per-channel pixel delta (`/255`) inside the Verification Badge.

### 3. Local-First IndexedDB & Anonymous Global Pulse (`db.ts` & `/api/stats`)

- **Local Persistence:** `SlatePicDB` (`Dexie.js`) stores user presets (`Social Clean (JPEG)`, `Lossless Archive (PNG)`, `SynthID Mitigation (Balanced)`, `Deep Pixel Scrub (Strong)`) and scrub history logs locally in IndexedDB.
- **Anonymous Social Proof:** After a real user scrub (skipped automatically during the automated Live Demo), the client posts only aggregate numeric deltas (`count: 1`, `tagsCount`, `bytesSavedCount`, and the output `sha256` hash) to `/api/stats`, backed by Upstash Redis with `Cache-Control: no-store` and graceful offline fallback.

---

## Tech Stack

| Category | Technology |
| :--- | :--- |
| Framework | Next.js `16.4.6` (App Router, Turbopack, Cache Components) |
| UI Runtime | React `19.3.1`, TypeScript `7.0.2` (`target: "es2025"`), Tailwind CSS `4.3.5` |
| State & Mutations | `@tanstack/react-query` `5.108.2` |
| Motion Graphics | `gsap` `3.15.1` + `@gsap/react` `2.1.2` |
| Client Database | `dexie` `4.4.7` + `dexie-react-hooks` `4.4.0` (IndexedDB) |
| Metadata & Archives | `exifr` `7.1.3`, `jszip` `3.10.1`, Native `ArrayBuffer` & HTML5 Canvas 2D |
| Global Telemetry | `@upstash/redis` `1.41.0` |
| Linting & Formatting | `@biomejs/biome` `2.6.8` |

---

## Getting Started

### Prerequisites

- **Node.js** 22+
- **pnpm** 10+

### Local Development

```bash
# Install dependencies
pnpm install

# (Optional) Copy environment template for Upstash Redis global counters
cp .env.example .env.local

# Start the Next.js development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. If `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are omitted, SlatePic operates normally with local in-memory counter fallback.

### Quality Checks & Production Build

```bash
# Run Biome formatter and linter checks
pnpm run lint

# Generate Next.js route types and run strict TypeScript verification
pnpm exec next typegen
pnpm exec tsc --noEmit

# Build production bundle
pnpm run build
```

---

## Deploying to Vercel

1. Import `Praashon/slatepic` into [Vercel](https://vercel.com/new).
2. In **Project Settings > Environment Variables**, add:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
3. Click **Deploy**. Static routes (`/`, `/history`, `/presets`, `/privacy`, `/faq`) are prerendered at the edge while `/api/stats` executes dynamically with `no-store` headers.

---

## Privacy and Zero-Server Architecture

SlatePic contains **no file upload endpoints, no server-side image storage, no user accounts, and no third-party tracking scripts**. Every image you drop or paste is processed exclusively inside your browser tab's memory and revoked via `URL.revokeObjectURL()` on cleanup. Local presets and scrub logs reside in your browser's IndexedDB (`SlatePicDB`) and can be wiped at any time from the `/privacy` page.
