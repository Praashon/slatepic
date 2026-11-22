"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import {
  AlertOctagon,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  Eye,
  FileWarning,
  MoveHorizontal,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { useRef, useState } from "react";
import { MetadataScanner } from "@/components/MetadataScanner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VerificationBadge } from "@/components/VerificationBadge";
import { convertBlobToPngForClipboard } from "@/lib/scrubber";
import { cn, downloadBlob } from "@/lib/utils";
import type { QueuedImageItem } from "@/types";

gsap.registerPlugin(useGSAP);

interface ImageInspectorProps {
  item: QueuedImageItem;
  onRescrub: () => void;
  highlightMode?: "none" | "inspect" | "verify";
  forceExpandRawTags?: boolean;
}

export function ImageInspector({
  item,
  onRescrub,
  highlightMode = "none",
  forceExpandRawTags = false,
}: ImageInspectorProps) {
  const [previewMode, setPreviewMode] = useState<
    "cleaned" | "compare" | "original"
  >("cleaned");
  const [splitPercent, setSplitPercent] = useState(50);
  const [showRawTags, setShowRawTags] = useState(false);
  const [copied, setCopied] = useState(false);

  const rightPaneRef = useRef<HTMLDivElement>(null);
  const warningTagsRef = useRef<HTMLDivElement>(null);

  const isCleaned = item.status === "cleaned" && Boolean(item.result);
  const isBusy = item.status === "scanning" || item.status === "scrubbing";
  const effectiveShowRawTags = showRawTags || forceExpandRawTags;

  useGSAP(
    () => {
      if (isCleaned && warningTagsRef.current) {
        gsap.to(warningTagsRef.current, {
          y: -10,
          opacity: 0,
          duration: 0.25,
          ease: "power2.in",
        });
      } else if (warningTagsRef.current) {
        gsap.set(warningTagsRef.current, { y: 0, opacity: 1 });
      }
    },
    { scope: rightPaneRef, dependencies: [isCleaned, item.id] },
  );

  const handleCopyCleanImage = async () => {
    if (!item.result) return;
    if (
      typeof navigator === "undefined" ||
      !navigator.clipboard ||
      typeof ClipboardItem === "undefined"
    ) {
      return;
    }

    try {
      const pngBlob = await convertBlobToPngForClipboard(item.result.blob);
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": pngBlob }),
      ]);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard API may be blocked by browser permissions
    }
  };

  const report = item.report;
  const result = item.result;

  const activePreviewUrl =
    isCleaned && previewMode === "cleaned" && result
      ? result.cleanedPreviewUrl
      : item.previewUrl;

  const activeBadgeTone = isCleaned
    ? previewMode === "cleaned"
      ? "emerald"
      : "amber"
    : report?.hasAiProvenance
      ? "rose"
      : report?.exifDetected
        ? "amber"
        : "emerald";

  const activeBadgeText = isCleaned
    ? previewMode === "cleaned"
      ? "Cleaned output"
      : "Original preview"
    : report?.hasAiProvenance
      ? "AI provenance detected"
      : report?.exifDetected
        ? "Metadata detected"
        : "Clean image";

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-6 rounded-2xl border bg-card p-5 shadow-sm backdrop-blur-sm transition-all duration-300 sm:p-6 lg:grid-cols-12",
        highlightMode === "inspect"
          ? "border-primary ring-2 ring-primary ring-offset-4 ring-offset-background shadow-[0_0_0_6px_color-mix(in_srgb,var(--primary)_12%,transparent)]"
          : highlightMode === "verify"
            ? "border-emerald-500 ring-2 ring-emerald-500 ring-offset-4 ring-offset-background shadow-[0_0_0_6px_rgba(16,185,129,0.14)]"
            : "border-border",
      )}
    >
      {/* Left: Visual Viewport */}
      <div className="flex flex-col gap-3.5 lg:col-span-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold tracking-tight text-foreground">
              {item.file.name}
            </h3>
            <p className="text-xs text-muted-foreground">
              {report
                ? `${report.dimensions.width} × ${report.dimensions.height}px · ${report.fileSizeFormatted}`
                : "Reading file headers..."}
            </p>
          </div>

          {isCleaned && (
            <div className="inline-flex rounded-xl border border-border bg-muted/70 p-1 text-xs font-medium">
              <button
                type="button"
                onClick={() => setPreviewMode("cleaned")}
                className={cn(
                  "cursor-pointer rounded-lg px-2.5 py-1 transition-colors",
                  previewMode === "cleaned"
                    ? "bg-card-solid text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Cleaned
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode("compare")}
                className={cn(
                  "cursor-pointer rounded-lg px-2.5 py-1 transition-colors",
                  previewMode === "compare"
                    ? "bg-card-solid text-primary shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Compare
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode("original")}
                className={cn(
                  "cursor-pointer rounded-lg px-2.5 py-1 transition-colors",
                  previewMode === "original"
                    ? "bg-card-solid text-destructive shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Original
              </button>
            </div>
          )}
        </div>

        {isCleaned && result && previewMode === "compare" && !isBusy ? (
          <div className="relative flex min-h-64 w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/65 p-3 sm:min-h-80">
            <span className="pointer-events-none absolute top-2.5 left-2.5 z-20 h-3 w-3 border-t-2 border-l-2 border-foreground/25" />
            <span className="pointer-events-none absolute top-2.5 right-2.5 z-20 h-3 w-3 border-t-2 border-r-2 border-foreground/25" />
            <span className="pointer-events-none absolute bottom-2.5 left-2.5 z-20 h-3 w-3 border-b-2 border-l-2 border-foreground/25" />
            <span className="pointer-events-none absolute right-2.5 bottom-2.5 z-20 h-3 w-3 border-r-2 border-b-2 border-foreground/25" />

            <div className="relative inline-grid select-none place-items-center overflow-hidden rounded-lg">
              {/* biome-ignore lint/performance/noImgElement: Renders local ephemeral blob: URL directly from browser RAM */}
              <img
                src={result.cleanedPreviewUrl}
                alt={`Cleaned ${item.file.name}`}
                className="col-start-1 row-start-1 max-h-96 w-auto max-w-full rounded-lg object-contain"
              />
              {/* biome-ignore lint/performance/noImgElement: Renders local ephemeral blob: URL directly from browser RAM */}
              <img
                src={item.previewUrl}
                alt={`Original ${item.file.name}`}
                style={{ clipPath: `inset(0 ${100 - splitPercent}% 0 0)` }}
                className="col-start-1 row-start-1 max-h-96 w-auto max-w-full rounded-lg object-contain"
              />

              <div
                aria-hidden="true"
                style={{ left: `${splitPercent}%` }}
                className="pointer-events-none absolute top-0 bottom-0 z-10 w-0.5 -translate-x-1/2 bg-white shadow-[0_0_8px_rgba(0,0,0,0.45)]"
              >
                <div className="absolute top-1/2 left-1/2 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card-solid text-foreground shadow-md">
                  <MoveHorizontal className="h-3.5 w-3.5 text-primary" />
                </div>
              </div>

              <input
                type="range"
                min={0}
                max={100}
                value={splitPercent}
                onChange={(event) =>
                  setSplitPercent(Number(event.target.value))
                }
                aria-label="Drag to compare original and cleaned image"
                className="absolute inset-0 z-20 h-full w-full cursor-ew-resize opacity-0"
              />
            </div>

            <Badge
              variant="amber"
              className="pointer-events-none absolute top-3 left-3 z-20 text-[11px] font-medium backdrop-blur-md"
            >
              Original
            </Badge>
            <Badge
              variant="emerald"
              className="pointer-events-none absolute top-3 right-3 z-20 text-[11px] font-medium backdrop-blur-md"
            >
              Cleaned
            </Badge>
            <div className="pointer-events-none absolute bottom-3 left-1/2 z-20 -translate-x-1/2 rounded-md border border-border bg-card-solid/90 px-2.5 py-1 text-[11px] font-medium text-muted-foreground shadow-xs backdrop-blur-md">
              Drag slider to compare pixels ({splitPercent}%)
            </div>
          </div>
        ) : (
          <MetadataScanner
            src={activePreviewUrl}
            alt={item.file.name}
            isScanning={isBusy}
            scanLabel={
              item.status === "scrubbing"
                ? "Re-encoding clean pixels..."
                : "Scanning file headers..."
            }
            badgeText={activeBadgeText}
            badgeTone={activeBadgeTone}
          />
        )}

        {isCleaned && result && (
          <div
            className={cn(
              "flex flex-wrap items-center gap-2 rounded-xl transition-all",
              highlightMode === "verify" &&
                "bg-emerald-500/8 p-1.5 ring-1 ring-emerald-500/35",
            )}
          >
            <Button
              variant="primary"
              size="md"
              onClick={() => downloadBlob(result.blob, result.cleanFileName)}
              className="flex-1"
            >
              <Download className="h-4 w-4" />
              <span>Download</span>
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={() => void handleCopyCleanImage()}
              title="Copy clean PNG to clipboard"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy</span>
                </>
              )}
            </Button>
            <Button variant="outline" size="md" onClick={onRescrub}>
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Re-scrub</span>
            </Button>
          </div>
        )}
      </div>

      {/* Right: Metadata & Verification Breakdown */}
      <div
        ref={rightPaneRef}
        className={cn(
          "flex flex-col gap-4 rounded-xl transition-all duration-300 lg:col-span-6",
          highlightMode === "inspect" &&
            "border border-primary/35 bg-primary/[0.03] p-3.5",
          highlightMode === "verify" &&
            "border border-emerald-500/35 bg-emerald-500/[0.03] p-3.5",
        )}
      >
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/12 text-primary">
              <Eye className="h-3.5 w-3.5" />
            </span>
            <h3 className="text-sm font-semibold tracking-tight text-foreground">
              Inspection Report
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {highlightMode === "inspect" && (
              <Badge variant="primary" className="text-[11px] font-semibold">
                Step 2: Inspect
              </Badge>
            )}
            {highlightMode === "verify" && (
              <Badge variant="emerald" className="text-[11px] font-semibold">
                Step 4: Verified
              </Badge>
            )}
            {report && (
              <Badge variant="outline" className="text-xs">
                {report.rawTagCount} metadata tag
                {report.rawTagCount === 1 ? "" : "s"}
              </Badge>
            )}
          </div>
        </div>

        {item.error && (
          <div className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs font-medium text-destructive">
            <AlertOctagon className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{item.error}</span>
          </div>
        )}

        {isCleaned && result ? (
          <VerificationBadge
            verificationReport={result.verificationReport}
            originalSizeBytes={item.file.size}
            cleanedSizeBytes={result.cleanedSizeBytes}
            cleanFileName={result.cleanFileName}
            scrubbedAt={result.scrubbedAt}
            sha256={result.sha256}
            pixelRefreshApplied={result.pixelRefreshApplied}
            pixelRefreshLevel={result.pixelRefreshLevel}
            perturbationMetrics={result.perturbationMetrics}
          />
        ) : (
          report && (
            <div ref={warningTagsRef} className="space-y-3">
              {report.hasAiProvenance ||
              report.exifDetected ||
              report.detectedSignatures.length > 0 ? (
                <div
                  className={cn(
                    "flex items-start gap-3 rounded-xl border p-4",
                    report.hasAiProvenance
                      ? "border-destructive/30 bg-destructive/8"
                      : "border-amber-600/30 bg-amber-500/8",
                  )}
                >
                  {report.hasAiProvenance ? (
                    <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                  ) : (
                    <FileWarning className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-300" />
                  )}
                  <div className="space-y-1">
                    <p
                      className={cn(
                        "text-sm font-semibold",
                        report.hasAiProvenance
                          ? "text-destructive"
                          : "text-amber-700 dark:text-amber-300",
                      )}
                    >
                      {report.hasAiProvenance
                        ? "AI provenance detected"
                        : `Metadata found (${report.rawTagCount} ${report.rawTagCount === 1 ? "tag" : "tags"})`}
                    </p>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {report.hasAiProvenance
                        ? "This file carries C2PA or generator provenance tags. Scrubbing discards all container headers."
                        : "Non-pixel header fields are present in this image container."}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 rounded-xl border border-emerald-600/25 bg-emerald-500/8 p-4">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                      Clean image
                    </p>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      No EXIF, GPS, XMP, or C2PA metadata found.
                    </p>
                  </div>
                </div>
              )}

              {report.detectedSignatures.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {report.detectedSignatures.map((sig) => (
                    <Badge
                      key={sig}
                      variant={
                        sig.includes("C2PA") || sig.startsWith("Signature:")
                          ? "destructive"
                          : "amber"
                      }
                      className="text-xs"
                    >
                      {sig}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <StatusCell
                  label="C2PA Manifest"
                  active={report.c2paDetected}
                  yesText="Detected"
                  noText="None"
                />
                <StatusCell
                  label="GPS Coordinates"
                  active={report.hasGpsData}
                  yesText="Detected"
                  noText="None"
                />
                <StatusCell
                  label="Software Tag"
                  active={Boolean(report.softwareTag)}
                  yesText={report.softwareTag ?? "Present"}
                  noText="None"
                />
                <StatusCell
                  label="Digital Source"
                  active={Boolean(report.digitalSourceType)}
                  yesText={
                    report.digitalSourceType?.split("/").pop() ?? "Present"
                  }
                  noText="None"
                />
              </div>

              <div className="rounded-xl border border-border bg-muted/50 px-3.5 py-2.5 text-xs leading-relaxed text-muted-foreground">
                <span className="font-semibold text-foreground">
                  Pixel Watermarks (SynthID):
                </span>{" "}
                Only Google&apos;s official Gemini / SynthID Detector portal can
                run Google&apos;s private detector. Select Balanced or Strong
                Pixel Refresh in Export Settings to disrupt pixel-domain and DCT
                watermarks locally.
              </div>
            </div>
          )
        )}

        {/* Expandable Raw Metadata Table */}
        {report && report.tags.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-border bg-card-solid">
            <button
              type="button"
              onClick={() => setShowRawTags((prev) => !prev)}
              className="flex w-full cursor-pointer items-center justify-between px-3.5 py-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              <span>
                {isCleaned ? "Original Metadata" : "Raw Metadata Details"} (
                {report.tags.length})
              </span>
              {effectiveShowRawTags ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            {effectiveShowRawTags && (
              <div className="max-h-56 divide-y divide-border/70 overflow-y-auto border-t border-border">
                {report.tags.map((tag) => (
                  <div
                    key={`${tag.category}:${tag.key}:${tag.value}`}
                    className="grid grid-cols-12 items-start gap-2 px-3.5 py-2 text-xs"
                  >
                    <span className="col-span-4 truncate font-medium text-muted-foreground">
                      {tag.key}
                    </span>
                    <span className="col-span-2">
                      <Badge
                        variant="outline"
                        className="px-1.5 py-0 text-[10px] uppercase"
                      >
                        {tag.category}
                      </Badge>
                    </span>
                    <span className="col-span-6 break-all text-foreground">
                      {tag.value}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusCell({
  label,
  active,
  yesText,
  noText,
}: {
  label: string;
  active: boolean;
  yesText: string;
  noText: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card-solid px-3 py-2.5">
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <p
        className={cn(
          "truncate font-semibold",
          active ? "text-destructive" : "text-muted-foreground",
        )}
        title={active ? yesText : noText}
      >
        {active ? yesText : noText}
      </p>
    </div>
  );
}
