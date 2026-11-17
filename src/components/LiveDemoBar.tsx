"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import {
  ArrowLeft,
  CheckCircle2,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
  Trash2,
  X,
} from "lucide-react";
import { useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

gsap.registerPlugin(useGSAP);

export type DemoStage =
  | "idle"
  | "dropzone"
  | "inspecting"
  | "controls"
  | "scrubbing"
  | "verified";

interface LiveDemoBarProps {
  stage: DemoStage;
  isPaused: boolean;
  onTogglePause: () => void;
  onPrevStep: () => void;
  onNextStep: () => void;
  onReplay: () => void;
  onClearAndExit: () => void;
  onDismiss: () => void;
}

const DEMO_STEPS = [
  { key: "dropzone", number: 1, label: "Load Sample" },
  { key: "inspecting", number: 2, label: "Inspect Metadata" },
  { key: "controls", number: 3, label: "Configure & Scrub" },
  { key: "verified", number: 4, label: "Verified Clean" },
] as const;

function getStageIndex(stage: DemoStage): number {
  switch (stage) {
    case "dropzone":
      return 0;
    case "inspecting":
      return 1;
    case "controls":
    case "scrubbing":
      return 2;
    case "verified":
      return 3;
    default:
      return -1;
  }
}

function getStageDescription(stage: DemoStage): string {
  switch (stage) {
    case "dropzone":
      return "Loading an in-memory PNG sample with embedded C2PA and AI generator headers into the dropzone.";
    case "inspecting":
      return "Scanning container bytes locally to expose Software, DigitalSourceType, and C2PA provenance tags.";
    case "controls":
      return "Highlighting format, quality, and Light Pixel Refresh controls before redrawing clean pixels.";
    case "scrubbing":
      return "Redrawing pixels onto an HTML5 Canvas and stripping all ancillary binary chunks...";
    case "verified":
      return "Re-inspection complete: 0 metadata tags remain. Download, copy, or drop your own images below.";
    default:
      return "";
  }
}

export function LiveDemoBar({
  stage,
  isPaused,
  onTogglePause,
  onPrevStep,
  onNextStep,
  onReplay,
  onClearAndExit,
  onDismiss,
}: LiveDemoBarProps) {
  const barRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (!barRef.current || stage === "idle") return;
      const reducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reducedMotion) return;

      gsap.fromTo(
        barRef.current,
        { y: -8, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.3, ease: "power2.out" },
      );
    },
    { scope: barRef, dependencies: [stage === "idle"] },
  );

  if (stage === "idle") {
    return null;
  }

  const activeIdx = getStageIndex(stage);
  const isFinished = stage === "verified";
  const isRunning = !isFinished;

  return (
    <section
      ref={barRef}
      aria-label="Live interactive walkthrough"
      className="rounded-2xl border border-primary/35 bg-card p-4 shadow-sm backdrop-blur-sm sm:p-5"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 space-y-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant={isFinished ? "emerald" : "teal"}
              className="gap-1.5 text-xs font-semibold"
            >
              {isRunning && !isPaused ? (
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </span>
              ) : null}
              <span>
                {isFinished
                  ? "Live Demo Complete"
                  : isPaused
                    ? "Live Demo Paused"
                    : "Live Walkthrough"}
              </span>
            </Badge>

            <span className="text-xs font-medium text-muted-foreground">
              Interactive tour running live inside the Studio
            </span>
          </div>

          <ol className="flex flex-wrap items-center gap-2">
            {DEMO_STEPS.map((step, idx) => {
              const isCompleted = isFinished || idx < activeIdx;
              const isCurrent = !isFinished && idx === activeIdx;

              return (
                <li
                  key={step.key}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
                    isCurrent
                      ? "border-primary bg-primary/12 font-semibold text-primary"
                      : isCompleted
                        ? "border-emerald-600/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                        : "border-border bg-muted/50 text-muted-foreground",
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  ) : (
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded bg-card-solid text-[10px] font-bold">
                      {step.number}
                    </span>
                  )}
                  <span>{step.label}</span>
                </li>
              );
            })}
          </ol>

          <p className="text-xs leading-relaxed text-foreground/90 sm:text-sm">
            {getStageDescription(stage)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:shrink-0">
          {isRunning ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={onPrevStep}
                disabled={activeIdx <= 0 || stage === "scrubbing"}
                aria-label="Previous step"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={onTogglePause}
                aria-label={
                  isPaused ? "Resume walkthrough" : "Pause walkthrough"
                }
              >
                {isPaused ? (
                  <>
                    <Play className="h-3.5 w-3.5 text-primary" />
                    <span>Resume</span>
                  </>
                ) : (
                  <>
                    <Pause className="h-3.5 w-3.5 text-primary" />
                    <span>Pause</span>
                  </>
                )}
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={onNextStep}
                disabled={stage === "scrubbing"}
              >
                <SkipForward className="h-3.5 w-3.5" />
                <span>Next Step</span>
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={onReplay}>
                <RotateCcw className="h-3.5 w-3.5 text-primary" />
                <span>Replay Demo</span>
              </Button>
              <Button variant="primary" size="sm" onClick={onClearAndExit}>
                <Trash2 className="h-3.5 w-3.5" />
                <span>Clear &amp; Use Your Own</span>
              </Button>
            </>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={onDismiss}
            aria-label="Dismiss walkthrough bar"
            title="Dismiss walkthrough"
            className="h-8 w-8 border border-border bg-card-solid"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </section>
  );
}
