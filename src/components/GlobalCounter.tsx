"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Cpu, DatabaseZap, Tag } from "lucide-react";
import { useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { useGlobalStats } from "@/hooks/useGlobalStats";
import { formatBytes, formatNumber } from "@/lib/utils";

gsap.registerPlugin(useGSAP);

export function GlobalCounter() {
  const { data, isLoading } = useGlobalStats();
  const containerRef = useRef<HTMLElement>(null);

  const imagesRef = useRef<HTMLParagraphElement>(null);
  const tagsRef = useRef<HTMLParagraphElement>(null);
  const bytesRef = useRef<HTMLParagraphElement>(null);

  const prevValuesRef = useRef({
    imagesCleaned: 0,
    tagsNuked: 0,
    bytesSaved: 0,
  });

  const hasData = data !== undefined;
  const imagesCleaned = data?.imagesCleaned ?? 0;
  const tagsNuked = data?.tagsNuked ?? 0;
  const bytesSaved = data?.bytesSaved ?? 0;

  useGSAP(
    () => {
      if (!hasData) return;

      const reducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (reducedMotion) {
        if (imagesRef.current) {
          imagesRef.current.textContent = formatNumber(imagesCleaned);
        }
        if (tagsRef.current) {
          tagsRef.current.textContent = formatNumber(tagsNuked);
        }
        if (bytesRef.current) {
          bytesRef.current.textContent = formatBytes(bytesSaved);
        }
        prevValuesRef.current = { imagesCleaned, tagsNuked, bytesSaved };
        return;
      }

      const counterObj = { ...prevValuesRef.current };

      gsap.to(counterObj, {
        imagesCleaned,
        tagsNuked,
        bytesSaved,
        duration: 0.9,
        ease: "power2.out",
        onUpdate: () => {
          if (imagesRef.current) {
            imagesRef.current.textContent = formatNumber(
              counterObj.imagesCleaned,
            );
          }
          if (tagsRef.current) {
            tagsRef.current.textContent = formatNumber(counterObj.tagsNuked);
          }
          if (bytesRef.current) {
            bytesRef.current.textContent = formatBytes(counterObj.bytesSaved);
          }
        },
        onComplete: () => {
          prevValuesRef.current = { imagesCleaned, tagsNuked, bytesSaved };
        },
      });
    },
    {
      scope: containerRef,
      dependencies: [hasData, imagesCleaned, tagsNuked, bytesSaved],
    },
  );

  return (
    <section
      ref={containerRef}
      aria-label="Real-time global statistics"
      className="w-full rounded-2xl border border-border bg-card p-5 shadow-sm backdrop-blur-sm sm:p-6"
    >
      <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
        <span className="text-xs font-semibold text-muted-foreground">
          Global Activity
        </span>
        <Badge variant="teal" className="gap-1.5 text-[11px] font-medium">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          <span>{data?.source === "redis" ? "Live" : "Local"}</span>
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
        <div className="rounded-xl border border-border/80 bg-muted/45 p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Images Scrubbed
            </span>
            <Cpu className="h-3.5 w-3.5 text-primary" />
          </div>
          {isLoading && !hasData ? (
            <div className="mt-2 h-6 w-16 animate-pulse rounded bg-muted" />
          ) : (
            <p
              ref={imagesRef}
              className="mt-1 text-xl font-bold tabular-nums text-foreground"
            >
              {formatNumber(imagesCleaned)}
            </p>
          )}
        </div>

        <div className="rounded-xl border border-border/80 bg-muted/45 p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Tags Removed
            </span>
            <Tag className="h-3.5 w-3.5 text-destructive" />
          </div>
          {isLoading && !hasData ? (
            <div className="mt-2 h-6 w-16 animate-pulse rounded bg-muted" />
          ) : (
            <p
              ref={tagsRef}
              className="mt-1 text-xl font-bold tabular-nums text-foreground"
            >
              {formatNumber(tagsNuked)}
            </p>
          )}
        </div>

        <div className="rounded-xl border border-border/80 bg-muted/45 p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Bytes Saved
            </span>
            <DatabaseZap className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
          </div>
          {isLoading && !hasData ? (
            <div className="mt-2 h-6 w-20 animate-pulse rounded bg-muted" />
          ) : (
            <p
              ref={bytesRef}
              className="mt-1 text-xl font-bold tabular-nums text-foreground"
            >
              {formatBytes(bytesSaved)}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
