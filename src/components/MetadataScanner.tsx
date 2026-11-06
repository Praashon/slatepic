"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScanLine } from "lucide-react";
import { useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

gsap.registerPlugin(useGSAP);

interface MetadataScannerProps {
  src: string;
  alt: string;
  isScanning: boolean;
  scanLabel?: string;
  badgeText?: string;
  badgeTone?: "emerald" | "rose" | "amber" | "cyan";
}

export function MetadataScanner({
  src,
  alt,
  isScanning,
  scanLabel = "Scanning metadata...",
  badgeText,
  badgeTone = "cyan",
}: MetadataScannerProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const laserRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!isScanning || !laserRef.current) return;
      const reducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reducedMotion) return;

      gsap.fromTo(
        laserRef.current,
        { top: "0%" },
        {
          top: "98%",
          duration: 1.2,
          repeat: -1,
          yoyo: true,
          ease: "power2.inOut",
        },
      );
    },
    { scope: frameRef, dependencies: [isScanning] },
  );

  const badgeVariant =
    badgeTone === "emerald"
      ? "emerald"
      : badgeTone === "rose"
        ? "destructive"
        : badgeTone === "amber"
          ? "amber"
          : "teal";

  return (
    <div
      ref={frameRef}
      className="relative flex min-h-64 w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/65 p-3 sm:min-h-80"
    >
      <span className="pointer-events-none absolute top-2.5 left-2.5 h-3 w-3 border-t-2 border-l-2 border-foreground/25" />
      <span className="pointer-events-none absolute top-2.5 right-2.5 h-3 w-3 border-t-2 border-r-2 border-foreground/25" />
      <span className="pointer-events-none absolute bottom-2.5 left-2.5 h-3 w-3 border-b-2 border-l-2 border-foreground/25" />
      <span className="pointer-events-none absolute right-2.5 bottom-2.5 h-3 w-3 border-r-2 border-b-2 border-foreground/25" />

      {/* biome-ignore lint/performance/noImgElement: Renders local ephemeral blob: URLs directly from browser RAM */}
      <img
        src={src}
        alt={alt}
        className={cn(
          "max-h-96 w-auto max-w-full rounded-lg object-contain transition-opacity duration-300",
          isScanning ? "opacity-75" : "opacity-100",
        )}
      />

      {badgeText && !isScanning && (
        <Badge
          variant={badgeVariant}
          className="absolute top-3 left-3 text-xs font-medium backdrop-blur-md"
        >
          {badgeText}
        </Badge>
      )}

      {isScanning && (
        <>
          <div
            ref={laserRef}
            aria-hidden="true"
            className="pointer-events-none absolute right-0 left-0 z-20 h-0.5 bg-primary shadow-[0_0_16px_4px_rgba(13,148,136,0.5)] dark:shadow-[0_0_16px_4px_rgba(45,212,191,0.55)]"
          />
          <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-primary/8 via-transparent to-primary/8" />
          <div className="absolute bottom-3 left-3 z-30 inline-flex items-center gap-2 rounded-lg border border-primary/40 bg-card-solid/95 px-3 py-1.5 text-xs font-semibold text-primary shadow-sm backdrop-blur-md">
            <ScanLine className="h-3.5 w-3.5 animate-pulse" />
            <span>{scanLabel}</span>
          </div>
        </>
      )}
    </div>
  );
}
