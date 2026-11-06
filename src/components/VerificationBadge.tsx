"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { CheckCircle2, FileCheck2, ShieldCheck } from "lucide-react";
import { useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { formatBytes } from "@/lib/utils";
import type {
  MetadataReport,
  PixelPerturbationMetrics,
  PixelRefreshLevel,
} from "@/types";

gsap.registerPlugin(useGSAP);

interface VerificationBadgeProps {
  verificationReport: MetadataReport;
  originalSizeBytes: number;
  cleanedSizeBytes: number;
  cleanFileName: string;
  scrubbedAt: number;
  sha256?: string;
  pixelRefreshApplied?: boolean;
  pixelRefreshLevel?: PixelRefreshLevel;
  perturbationMetrics?: PixelPerturbationMetrics;
}

const LEVEL_LABELS: Record<PixelRefreshLevel, string> = {
  off: "Off (Headers Only)",
  light: "Light DSP",
  balanced: "Balanced DSP",
  strong: "Strong DSP",
};

export function VerificationBadge({
  verificationReport,
  originalSizeBytes,
  cleanedSizeBytes,
  cleanFileName,
  scrubbedAt,
  sha256,
  pixelRefreshApplied = false,
  pixelRefreshLevel,
  perturbationMetrics,
}: VerificationBadgeProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const reducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reducedMotion) return;

      gsap.fromTo(
        ".verify-pill",
        { y: 10, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.35,
          stagger: 0.08,
          ease: "power2.out",
        },
      );
    },
    { scope: containerRef, dependencies: [scrubbedAt, cleanFileName] },
  );

  const deltaBytes = originalSizeBytes - cleanedSizeBytes;
  const resolvedLevel: PixelRefreshLevel =
    pixelRefreshLevel ?? (pixelRefreshApplied ? "light" : "off");
  const isDspActive = resolvedLevel !== "off";

  const checks = [
    {
      label: "C2PA Manifest",
      value: verificationReport.c2paDetected ? "Present" : "0 found",
    },
    {
      label: "EXIF / XMP / IPTC",
      value: verificationReport.exifDetected ? "Present" : "0 headers",
    },
    {
      label: "AI Provenance",
      value: verificationReport.hasAiProvenance ? "Present" : "0 signatures",
    },
    {
      label: "GPS Coordinates",
      value: verificationReport.hasGpsData ? "Present" : "0 location tags",
    },
  ];

  return (
    <div ref={containerRef} className="space-y-3">
      <div className="verify-pill flex items-start gap-3 rounded-xl border border-emerald-600/25 bg-emerald-500/8 p-4">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
              Verified Clean
            </span>
            <Badge variant="emerald" className="text-xs">
              {verificationReport.rawTagCount} tags
            </Badge>
            {sha256 ? (
              <Badge
                variant="outline"
                title={`SHA-256: ${sha256}`}
                className="text-[11px]"
              >
                SHA-256: {sha256.slice(0, 12)}...
              </Badge>
            ) : null}
          </div>
          <p className="truncate text-xs text-muted-foreground">
            Output:{" "}
            <span className="font-semibold text-foreground">
              {cleanFileName}
            </span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {checks.map((check) => (
          <div
            key={check.label}
            className="verify-pill flex items-center justify-between gap-2 rounded-xl border border-border bg-card-solid px-3 py-2.5 shadow-xs"
          >
            <div className="min-w-0">
              <p className="truncate text-[11px] font-medium text-muted-foreground">
                {check.label}
              </p>
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-300">
                {check.value}
              </p>
            </div>
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          </div>
        ))}
      </div>

      <div className="verify-pill space-y-2 rounded-xl border border-border bg-muted/60 p-3.5 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-medium text-muted-foreground">
            Pixel Refresh (SynthID Mitigation)
          </span>
          <Badge variant={isDspActive ? "emerald" : "amber"} className="text-xs">
            {LEVEL_LABELS[resolvedLevel]}
          </Badge>
        </div>

        {perturbationMetrics && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-2 text-[11px]">
              <span className="text-muted-foreground">
                Visual Fidelity:{" "}
                <strong className="font-semibold text-foreground">
                  {perturbationMetrics.psnrDb >= 99
                    ? "Lossless (99.9 dB)"
                    : `${perturbationMetrics.psnrDb} dB PSNR`}
                </strong>
              </span>
              <span className="text-muted-foreground">
                Avg Shift:{" "}
                <strong className="font-semibold text-foreground">
                  {perturbationMetrics.meanPixelDelta}/255
                </strong>
              </span>
            </div>

            {perturbationMetrics.stagesApplied.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-0.5">
                {perturbationMetrics.stagesApplied.map((stage) => (
                  <Badge
                    key={stage}
                    variant="outline"
                    className="px-2 py-0 text-[10px]"
                  >
                    {stage}
                  </Badge>
                ))}
              </div>
            )}
          </>
        )}

        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Tip: Public third-party sites cannot run Google&apos;s private SynthID
          detector. To check real SynthID status, test the exported file in
          Google Gemini or use the Compare tab to inspect pixel clarity.
        </p>
      </div>

      <div className="verify-pill flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-muted/60 px-3.5 py-2.5 text-xs">
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <FileCheck2 className="h-3.5 w-3.5 text-primary" />
          {formatBytes(originalSizeBytes)} → {formatBytes(cleanedSizeBytes)}
        </span>
        <span
          className={
            deltaBytes >= 0
              ? "font-semibold text-emerald-600 dark:text-emerald-300"
              : "font-semibold text-primary"
          }
        >
          {deltaBytes >= 0
            ? `-${formatBytes(deltaBytes)} stripped`
            : `+${formatBytes(Math.abs(deltaBytes))} re-encoded`}
        </span>
      </div>
    </div>
  );
}

