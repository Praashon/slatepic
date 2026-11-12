import {
  AlertTriangle,
  ArrowLeft,
  FileCode2,
  HelpCircle,
  Layers,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { FaqAccordion, type FaqEntry } from "@/components/FaqAccordion";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Technical FAQ | SlatePic",
  description:
    "Technical breakdown of C2PA Content Credentials, EXIF/IPTC/XMP metadata, and DeepMind SynthID pixel watermarks.",
};

const FAQ_ITEMS: FaqEntry[] = [
  {
    id: "c2pa-vs-exif",
    tag: "Metadata",
    question: "What is the difference between EXIF, IPTC/XMP, and C2PA?",
    answer:
      "EXIF stores camera hardware, lens settings, timestamps, and GPS coordinates. IPTC and XMP carry creator credits and AI provenance labels such as DigitalSourceType=trainedAlgorithmicMedia. C2PA Content Credentials embed cryptographic JUMBF ('jumb') boxes directly inside JPEG, PNG, and WebP containers linking assets to generators such as ChatGPT, DALL-E, or Adobe Firefly.",
  },
  {
    id: "meta-ai-info",
    tag: "Platforms",
    question:
      "Why do Instagram, Facebook, or LinkedIn auto-tag images with 'AI Info'?",
    answer:
      "Social platforms inspect incoming image headers for C2PA manifests and IPTC DigitalSourceType tags before stripping or re-compressing uploads. Because SlatePic redraws pure decoded RGB pixels onto a fresh HTML5 Canvas and strips all ancillary chunks before you upload, those container manifests are discarded prior to leaving your device.",
  },
  {
    id: "synthid-transparency",
    tag: "SynthID",
    question: "Does SlatePic erase DeepMind SynthID or pixel-level watermarks?",
    answer:
      "No client-side tool can honestly guarantee 100% removal of statistical frequency-domain watermarks (like DeepMind SynthID) without destructive distortion. SlatePic removes 100% of container metadata and C2PA manifests, and provides a multi-stage Pixel Refresh engine (Light, Balanced, Strong) combining sub-degree micro-rotation, sub-pixel resampling, an intermediate 8x8 JPEG DCT re-quantization cycle, edge-aware bilateral denoising, Gaussian film grain, and tonal balancing to strongly disrupt pixel-domain watermarks locally while keeping PSNR visual fidelity transparent.",
  },
  {
    id: "third-party-synthid-checkers",
    tag: "Verification",
    question:
      "Why do third-party websites still say 'SynthID is in the pixels' after scrubbing?",
    answer:
      "Google's SynthID neural detector is proprietary and only available inside Google's official Gemini app and SynthID Detector portal. Third-party websites cannot run Google's real SynthID model, so many display a generic 'SynthID can still be in the pixels' warning on any image that no longer has C2PA metadata in order to sell paid server-side regeneration. To verify real SynthID status accurately, upload your exported image to Google Gemini directly and use SlatePic's Compare slider and PSNR readout to inspect visual quality.",
  },
  {
    id: "canvas-quality",
    tag: "Canvas Engine",
    question: "Does HTML5 Canvas redrawing hurt image resolution or quality?",
    answer:
      "With Pixel Refresh Off, Canvas preserves exact naturalWidth × naturalHeight dimensions, and PNG outputs lossless RGBA pixels while JPEG and WebP let you dial quality up to 100%. When Balanced or Strong Pixel Refresh is enabled, you can use the interactive Compare split slider and real-time PSNR fidelity score in the Inspection Report to verify visual sharpness before downloading.",
  },
  {
    id: "batch-zip",
    tag: "Workflow",
    question:
      "How does batch scrubbing and .ZIP download work without a server?",
    answer:
      "Drop or paste multiple images at once, click Scrub All Pending, and SlatePic processes each file sequentially through your browser Canvas 2D context, strips ancillary chunks, verifies 0 metadata tags on every output, and packages them locally using JSZip into slatepic-cleaned.zip.",
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 pt-8 pb-16 sm:px-6 sm:pt-10 sm:pb-20 lg:px-8">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card-solid px-3 py-1.5 text-xs font-semibold text-foreground shadow-xs transition-colors hover:border-primary/50 hover:text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Studio</span>
        </Link>
      </div>

      <header className="space-y-3 border-b border-border pb-6">
        <Badge variant="teal" className="px-2.5 py-1">
          <HelpCircle className="h-3.5 w-3.5" />
          <span>Provenance Guide</span>
        </Badge>

        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
          C2PA, EXIF, and SynthID Explained
        </h1>

        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Understanding the boundary between container metadata (100% removable)
          and frequency-domain pixel watermarks (disrupted via multi-stage DSP).
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <section className="space-y-3 rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm backdrop-blur-sm">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600/12 text-emerald-600 dark:text-emerald-300">
              <FileCode2 className="h-4 w-4" />
            </span>
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              Container Metadata (100% Stripped)
            </h2>
          </div>

          <ul className="space-y-1.5 text-xs text-foreground/90">
            <li>• C2PA JUMBF boxes (jumb and c2pa.claim)</li>
            <li>• IPTC DigitalSourceType and Credit tags</li>
            <li>• EXIF Make, Model, Software, and GPS coordinates</li>
            <li>• PNG tEXt / iTXt Stable Diffusion prompts</li>
            <li>• XMP, ICC profile, and pHYs container chunks</li>
          </ul>

          <p className="text-xs leading-relaxed text-muted-foreground">
            Eliminated completely when Canvas extracts raw RGBA pixel arrays and
            our container sanitizer drops all ancillary chunks.
          </p>
        </section>

        <section className="space-y-3 rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm backdrop-blur-sm">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-600/12 text-amber-600 dark:text-amber-300">
              <Layers className="h-4 w-4" />
            </span>
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              Pixel Watermarks (Degraded Only)
            </h2>
          </div>

          <ul className="space-y-1.5 text-xs text-foreground/90">
            <li>• DeepMind SynthID spatial and frequency signals</li>
            <li>• Invisible DCT / DWT frequency watermarks</li>
            <li>• Perceptual model fingerprint noise</li>
          </ul>

          <div className="flex items-start gap-2 rounded-xl border border-amber-600/25 bg-amber-500/8 p-3 text-xs text-amber-800 dark:text-amber-300">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              Balanced and Strong Pixel Refresh combine micro-rotation,
              resampling, an intermediate JPEG DCT cycle, edge-aware denoise,
              film grain, and tonal balancing to disrupt spectral signals while
              showing exact PSNR visual fidelity. Deep neural watermarks are
              degraded rather than 100% guaranteed erased.
            </span>
          </div>
        </section>
      </div>

      <FaqAccordion items={FAQ_ITEMS} />
    </div>
  );
}
