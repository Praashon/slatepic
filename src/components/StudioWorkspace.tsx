"use client";

import { CheckCircle2, Loader2, Trash2, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DownloadAllButton } from "@/components/DownloadAllButton";
import { Dropzone } from "@/components/Dropzone";
import { ImageInspector } from "@/components/ImageInspector";
import { type DemoStage, LiveDemoBar } from "@/components/LiveDemoBar";
import { ScrubberControls } from "@/components/ScrubberControls";
import { Button } from "@/components/ui/button";
import { useImageScrubber } from "@/hooks/useImageScrubber";
import { useLocalPresets } from "@/hooks/useLocalPresets";
import { buildDemoAiTaggedPng } from "@/lib/demoSample";
import { inspectImage } from "@/lib/inspector";
import { cn } from "@/lib/utils";
import type { QueuedImageItem, ScrubOptions } from "@/types";

const DEMO_STORAGE_KEY = "slatepic-live-demo-v1";
const DEMO_DISMISSED_KEY = "liveDemoDismissed";

const FALLBACK_OPTIONS: ScrubOptions = {
  outputFormat: "image/jpeg",
  quality: 0.92,
  pixelRefreshLevel: "off",
  applyMicroCrop: false,
  applySubtleNoise: false,
  applyColorRebalance: false,
  applyDctCycle: false,
  applyEdgeDenoise: false,
  randomizeFilename: false,
};

function scrollElementIntoView(el: HTMLElement | null): void {
  if (!el || typeof window === "undefined") return;
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  el.scrollIntoView({
    behavior: reducedMotion ? "auto" : "smooth",
    block: "nearest",
  });
}

function isDemoAlreadySeen(): boolean {
  try {
    return (
      localStorage.getItem(DEMO_STORAGE_KEY) === "seen" ||
      localStorage.getItem(DEMO_DISMISSED_KEY) === "true"
    );
  } catch {
    return true;
  }
}

function markDemoSeen(): void {
  try {
    localStorage.setItem(DEMO_STORAGE_KEY, "seen");
    localStorage.setItem(DEMO_DISMISSED_KEY, "true");
  } catch {
    // Ignore storage restrictions
  }
}

export function StudioWorkspace() {
  const searchParams = useSearchParams();
  const requestedPresetId = searchParams.get("preset");

  const { presets, defaultPreset, isLoaded } = useLocalPresets();
  const scrubMutation = useImageScrubber();

  const [items, setItems] = useState<QueuedImageItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [options, setOptions] = useState<ScrubOptions>(FALLBACK_OPTIONS);
  const [selectedPresetId, setSelectedPresetId] = useState<number | "custom">(
    "custom",
  );
  const [presetInitialized, setPresetInitialized] = useState(false);
  const [isBatchScrubbing, setIsBatchScrubbing] = useState(false);

  const [demoStage, setDemoStage] = useState<DemoStage>("idle");
  const [isDemoPaused, setIsDemoPaused] = useState(false);

  const objectUrlsRef = useRef<Set<string>>(new Set());
  const optionsRef = useRef<ScrubOptions>(options);
  const scrubMutateRef = useRef(scrubMutation.mutateAsync);

  const demoRunIdRef = useRef(0);
  const demoItemIdRef = useRef<string | null>(null);
  const userInteractedRef = useRef(false);
  const isPausedRef = useRef(false);
  const resumeWakeRef = useRef<(() => void) | null>(null);
  const stepSkipRef = useRef<(() => void) | null>(null);

  const dropzoneWrapRef = useRef<HTMLDivElement>(null);
  const inspectorWrapRef = useRef<HTMLDivElement>(null);
  const controlsWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  useEffect(() => {
    scrubMutateRef.current = scrubMutation.mutateAsync;
  }, [scrubMutation.mutateAsync]);

  const trackUrl = useCallback((url: string) => {
    objectUrlsRef.current.add(url);
    return url;
  }, []);

  const revokeUrl = useCallback((url?: string) => {
    if (!url) return;
    if (objectUrlsRef.current.has(url)) {
      URL.revokeObjectURL(url);
      objectUrlsRef.current.delete(url);
    }
  }, []);

  const cancelDemoFlow = useCallback((nextStage: DemoStage = "idle") => {
    demoRunIdRef.current += 1;
    isPausedRef.current = false;
    setIsDemoPaused(false);
    setDemoStage(nextStage);
    const wake = resumeWakeRef.current;
    resumeWakeRef.current = null;
    wake?.();
    const skip = stepSkipRef.current;
    stepSkipRef.current = null;
    skip?.();
  }, []);

  useEffect(() => {
    const urls = objectUrlsRef.current;
    return () => {
      demoRunIdRef.current += 1;
      for (const url of urls) {
        URL.revokeObjectURL(url);
      }
      urls.clear();
    };
  }, []);

  useEffect(() => {
    if (!isLoaded || presetInitialized) return;
    const requestedNumeric = requestedPresetId
      ? Number(requestedPresetId)
      : Number.NaN;
    const targetPreset =
      (!Number.isNaN(requestedNumeric)
        ? presets.find((p) => p.id === requestedNumeric)
        : undefined) ?? defaultPreset;

    if (targetPreset) {
      setOptions({
        outputFormat: targetPreset.outputFormat,
        quality: targetPreset.quality,
        pixelRefreshLevel: targetPreset.pixelRefreshLevel,
        applyMicroCrop: targetPreset.applyMicroCrop,
        applySubtleNoise: targetPreset.applySubtleNoise,
        applyColorRebalance: Boolean(targetPreset.applyColorRebalance),
        applyDctCycle: Boolean(targetPreset.applyDctCycle),
        applyEdgeDenoise: Boolean(targetPreset.applyEdgeDenoise),
        randomizeFilename: targetPreset.randomizeFilename,
      });
      if (targetPreset.id !== undefined) {
        setSelectedPresetId(targetPreset.id);
      }
    }
    setPresetInitialized(true);
  }, [isLoaded, presetInitialized, presets, defaultPreset, requestedPresetId]);

  const waitDemoStep = useCallback(
    async (durationMs: number, runId: number): Promise<boolean> => {
      let remaining = durationMs;
      let skipped = false;

      stepSkipRef.current = () => {
        skipped = true;
      };

      try {
        while (remaining > 0 && !skipped) {
          if (demoRunIdRef.current !== runId) {
            return false;
          }

          if (isPausedRef.current) {
            await new Promise<void>((resolve) => {
              resumeWakeRef.current = resolve;
            });
            resumeWakeRef.current = null;
            continue;
          }

          const slice = Math.min(80, remaining);
          await new Promise<void>((resolve) => {
            window.setTimeout(resolve, slice);
          });
          remaining -= slice;
        }
      } finally {
        stepSkipRef.current = null;
      }

      return demoRunIdRef.current === runId;
    },
    [],
  );

  const removePreviousDemoItem = useCallback(() => {
    const prevDemoId = demoItemIdRef.current;
    if (!prevDemoId) return;
    demoItemIdRef.current = null;
    setItems((prev) => {
      const target = prev.find((item) => item.id === prevDemoId);
      if (target) {
        revokeUrl(target.previewUrl);
        revokeUrl(target.result?.cleanedPreviewUrl);
      }
      const next = prev.filter((item) => item.id !== prevDemoId);
      setActiveId((curr) =>
        curr === prevDemoId ? (next[0]?.id ?? null) : curr,
      );
      return next;
    });
  }, [revokeUrl]);

  const runLiveDemo = useCallback(
    async (startStep = 0) => {
      const runId = ++demoRunIdRef.current;
      isPausedRef.current = false;
      setIsDemoPaused(false);
      removePreviousDemoItem();

      let demoFile: File;
      try {
        demoFile = await buildDemoAiTaggedPng();
      } catch {
        cancelDemoFlow("idle");
        return;
      }

      const mountDemoFile = async () => {
        const demoId = crypto.randomUUID();
        demoItemIdRef.current = demoId;
        const previewUrl = trackUrl(URL.createObjectURL(demoFile));

        setItems((prev) => [
          ...prev,
          {
            id: demoId,
            file: demoFile,
            previewUrl,
            status: "scanning",
          },
        ]);
        setActiveId(demoId);

        const report = await inspectImage(demoFile, demoFile.name);
        if (demoRunIdRef.current !== runId) return null;

        setItems((prev) =>
          prev.map((item) =>
            item.id === demoId
              ? { ...item, status: "inspected", report }
              : item,
          ),
        );
        return { demoId, report };
      };

      // Step 1: Dropzone
      if (startStep <= 0) {
        setDemoStage("dropzone");
        scrollElementIntoView(dropzoneWrapRef.current);
        if (!(await waitDemoStep(1400, runId))) return;
      }

      // Step 2: Inspect Metadata
      setDemoStage("inspecting");
      window.setTimeout(() => {
        scrollElementIntoView(inspectorWrapRef.current);
      }, 60);

      let mounted: Awaited<ReturnType<typeof mountDemoFile>>;
      try {
        mounted = await mountDemoFile();
      } catch {
        cancelDemoFlow("idle");
        return;
      }
      if (!mounted || demoRunIdRef.current !== runId) return;

      if (startStep <= 1) {
        if (!(await waitDemoStep(2800, runId))) return;
      }

      // Step 3: Controls
      setDemoStage("controls");
      scrollElementIntoView(controlsWrapRef.current);
      if (!(await waitDemoStep(2200, runId))) return;

      // Step 4: Live Canvas scrub + container sanitization + validation
      setDemoStage("scrubbing");
      scrollElementIntoView(inspectorWrapRef.current);

      setItems((prev) =>
        prev.map((item) =>
          item.id === mounted.demoId
            ? { ...item, status: "scrubbing", error: undefined }
            : item,
        ),
      );

      try {
        const result = await scrubMutateRef.current({
          file: demoFile,
          report: mounted.report,
          options: optionsRef.current,
          isDemo: true,
        });

        if (demoRunIdRef.current !== runId) {
          URL.revokeObjectURL(result.cleanedPreviewUrl);
          return;
        }

        trackUrl(result.cleanedPreviewUrl);

        setItems((prev) =>
          prev.map((item) =>
            item.id === mounted.demoId
              ? { ...item, status: "cleaned", result }
              : item,
          ),
        );
        setDemoStage("verified");
        markDemoSeen();
      } catch {
        cancelDemoFlow("idle");
      }
    },
    [cancelDemoFlow, removePreviousDemoItem, trackUrl, waitDemoStep],
  );

  // Automatically start the inline walkthrough for first-time visitors
  useEffect(() => {
    if (typeof window === "undefined" || isDemoAlreadySeen()) {
      return;
    }

    const timer = window.setTimeout(() => {
      if (!userInteractedRef.current && demoRunIdRef.current === 0) {
        void runLiveDemo(0);
      }
    }, 650);

    return () => {
      window.clearTimeout(timer);
    };
  }, [runLiveDemo]);

  const handleToggleDemoPause = () => {
    const nextPaused = !isPausedRef.current;
    isPausedRef.current = nextPaused;
    setIsDemoPaused(nextPaused);
    if (!nextPaused) {
      const wake = resumeWakeRef.current;
      resumeWakeRef.current = null;
      wake?.();
    }
  };

  const handleDemoPrevStep = () => {
    if (demoStage === "inspecting") {
      void runLiveDemo(0);
    } else if (demoStage === "controls") {
      void runLiveDemo(1);
    }
  };

  const handleDemoNextStep = () => {
    if (isPausedRef.current) {
      isPausedRef.current = false;
      setIsDemoPaused(false);
      const wake = resumeWakeRef.current;
      resumeWakeRef.current = null;
      wake?.();
    }
    const skip = stepSkipRef.current;
    stepSkipRef.current = null;
    skip?.();
  };

  const handleDismissDemo = () => {
    markDemoSeen();
    cancelDemoFlow("idle");
  };

  const handleClearAndExitDemo = () => {
    markDemoSeen();
    cancelDemoFlow("idle");
    removePreviousDemoItem();
  };

  const handleSelectPreset = useCallback(
    (presetId: number) => {
      const found = presets.find((p) => p.id === presetId);
      if (!found) return;
      setSelectedPresetId(presetId);
      setOptions({
        outputFormat: found.outputFormat,
        quality: found.quality,
        pixelRefreshLevel: found.pixelRefreshLevel,
        applyMicroCrop: found.applyMicroCrop,
        applySubtleNoise: found.applySubtleNoise,
        applyColorRebalance: Boolean(found.applyColorRebalance),
        applyDctCycle: Boolean(found.applyDctCycle),
        applyEdgeDenoise: Boolean(found.applyEdgeDenoise),
        randomizeFilename: found.randomizeFilename,
      });
    },
    [presets],
  );

  const handleOptionsChange = useCallback((next: ScrubOptions) => {
    setSelectedPresetId("custom");
    setOptions(next);
  }, []);

  const handleFilesAdded = useCallback(
    (files: File[]) => {
      userInteractedRef.current = true;
      if (demoStage !== "idle") {
        markDemoSeen();
        cancelDemoFlow("idle");
        removePreviousDemoItem();
      }

      const queued: QueuedImageItem[] = files.map((file) => ({
        id: crypto.randomUUID(),
        file,
        previewUrl: trackUrl(URL.createObjectURL(file)),
        status: "scanning",
      }));

      setItems((prev) => [...prev, ...queued]);
      setActiveId((current) =>
        current && current !== demoItemIdRef.current
          ? current
          : (queued[0]?.id ?? null),
      );

      for (const entry of queued) {
        void inspectImage(entry.file, entry.file.name)
          .then((report) => {
            setItems((prev) =>
              prev.map((item) =>
                item.id === entry.id
                  ? { ...item, status: "inspected", report }
                  : item,
              ),
            );
          })
          .catch((err) => {
            setItems((prev) =>
              prev.map((item) =>
                item.id === entry.id
                  ? {
                      ...item,
                      status: "error",
                      error:
                        err instanceof Error
                          ? err.message
                          : "Failed to inspect image metadata.",
                    }
                  : item,
              ),
            );
          });
      }
    },
    [cancelDemoFlow, demoStage, removePreviousDemoItem, trackUrl],
  );

  const scrubSingleItem = useCallback(
    async (targetItem: QueuedImageItem) => {
      if (
        targetItem.status === "scanning" ||
        targetItem.status === "scrubbing"
      ) {
        return;
      }

      setItems((prev) =>
        prev.map((item) =>
          item.id === targetItem.id
            ? { ...item, status: "scrubbing", error: undefined }
            : item,
        ),
      );

      try {
        const result = await scrubMutation.mutateAsync({
          file: targetItem.file,
          report: targetItem.report,
          options,
          isDemo: targetItem.id === demoItemIdRef.current,
        });

        trackUrl(result.cleanedPreviewUrl);

        setItems((prev) =>
          prev.map((item) => {
            if (item.id !== targetItem.id) return item;
            if (item.result?.cleanedPreviewUrl) {
              revokeUrl(item.result.cleanedPreviewUrl);
            }
            return {
              ...item,
              status: "cleaned",
              result,
            };
          }),
        );
      } catch (err) {
        setItems((prev) =>
          prev.map((item) =>
            item.id === targetItem.id
              ? {
                  ...item,
                  status: "error",
                  error:
                    err instanceof Error
                      ? err.message
                      : "Canvas scrubbing failed.",
                }
              : item,
          ),
        );
      }
    },
    [options, revokeUrl, scrubMutation, trackUrl],
  );

  const activeItem = useMemo(
    () => items.find((item) => item.id === activeId) ?? items[0] ?? null,
    [items, activeId],
  );

  const pendingItems = useMemo(
    () =>
      items.filter(
        (item) => item.status === "inspected" || item.status === "error",
      ),
    [items],
  );

  const cleanedArchives = useMemo(
    () =>
      items
        .filter((item) => item.status === "cleaned" && item.result)
        .map((item) => ({
          blob: item.result?.blob as Blob,
          cleanFileName: item.result?.cleanFileName as string,
        })),
    [items],
  );

  const handleScrubAll = async () => {
    if (isBatchScrubbing || pendingItems.length === 0) return;
    setIsBatchScrubbing(true);
    try {
      for (const item of pendingItems) {
        await scrubSingleItem(item);
      }
    } finally {
      setIsBatchScrubbing(false);
    }
  };

  const handleRemoveItem = (id: string) => {
    if (id === demoItemIdRef.current) {
      demoItemIdRef.current = null;
      if (demoStage !== "idle") {
        markDemoSeen();
        cancelDemoFlow("idle");
      }
    }
    setItems((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) {
        revokeUrl(target.previewUrl);
        revokeUrl(target.result?.cleanedPreviewUrl);
      }
      const next = prev.filter((item) => item.id !== id);
      if (activeId === id) {
        setActiveId(next[0]?.id ?? null);
      }
      return next;
    });
  };

  const handleClearQueue = () => {
    demoItemIdRef.current = null;
    if (demoStage !== "idle") {
      markDemoSeen();
      cancelDemoFlow("idle");
    }
    for (const item of items) {
      revokeUrl(item.previewUrl);
      revokeUrl(item.result?.cleanedPreviewUrl);
    }
    setItems([]);
    setActiveId(null);
  };

  const inspectorHighlightMode =
    demoStage === "inspecting"
      ? "inspect"
      : demoStage === "verified"
        ? "verify"
        : "none";

  return (
    <section aria-label="SlatePic Scrubber Studio" className="w-full space-y-6">
      <LiveDemoBar
        stage={demoStage}
        isPaused={isDemoPaused}
        onTogglePause={handleToggleDemoPause}
        onPrevStep={handleDemoPrevStep}
        onNextStep={handleDemoNextStep}
        onReplay={() => void runLiveDemo(0)}
        onClearAndExit={handleClearAndExitDemo}
        onDismiss={handleDismissDemo}
      />

      <div ref={dropzoneWrapRef}>
        <Dropzone
          onFilesAdded={handleFilesAdded}
          disabled={isBatchScrubbing}
          compact={items.length > 0}
          highlighted={demoStage === "dropzone"}
          highlightLabel="Step 1: Load Sample"
          onStartLiveDemo={() => void runLiveDemo(0)}
          isDemoActive={demoStage !== "idle"}
        />
      </div>

      {items.length > 0 && (
        <>
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-sm backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2 overflow-x-auto">
              {items.map((item) => {
                const selected = item.id === activeItem?.id;
                return (
                  <div
                    key={item.id}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
                      selected
                        ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary/25"
                        : "border-border bg-muted/60 text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => setActiveId(item.id)}
                      className="inline-flex cursor-pointer items-center gap-2"
                    >
                      {item.status === "scanning" ||
                      item.status === "scrubbing" ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                      ) : item.status === "cleaned" ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <span
                          className={cn(
                            "h-2 w-2 rounded-full",
                            item.report?.hasAiProvenance
                              ? "bg-destructive"
                              : "bg-amber-500",
                          )}
                        />
                      )}
                      <span className="max-w-36 truncate">
                        {item.file.name}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      aria-label={`Remove ${item.file.name}`}
                      className="cursor-pointer rounded p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {cleanedArchives.length > 0 && (
                <DownloadAllButton items={cleanedArchives} />
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearQueue}
                className="hover:border-destructive/40 hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Clear</span>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div ref={inspectorWrapRef} className="lg:col-span-7">
              {activeItem && (
                <ImageInspector
                  item={activeItem}
                  onRescrub={() => void scrubSingleItem(activeItem)}
                  highlightMode={inspectorHighlightMode}
                  forceExpandRawTags={demoStage === "inspecting"}
                />
              )}
            </div>

            <div ref={controlsWrapRef} className="lg:col-span-5">
              <ScrubberControls
                options={options}
                onChange={handleOptionsChange}
                selectedPresetId={selectedPresetId}
                onSelectPreset={handleSelectPreset}
                onScrubActive={() => {
                  if (activeItem) void scrubSingleItem(activeItem);
                }}
                onScrubAll={() => void handleScrubAll()}
                hasActiveItem={Boolean(activeItem)}
                isActiveScrubbing={activeItem?.status === "scrubbing"}
                pendingCount={pendingItems.length}
                isBatchScrubbing={isBatchScrubbing}
                highlighted={demoStage === "controls"}
              />
            </div>
          </div>
        </>
      )}
    </section>
  );
}

