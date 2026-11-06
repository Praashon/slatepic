"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { FileWarning, ImagePlus, Play, Sparkles, Upload } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { buildDemoAiTaggedPng } from "@/lib/demoSample";
import { cn } from "@/lib/utils";

gsap.registerPlugin(useGSAP);

interface DropzoneProps {
  onFilesAdded: (files: File[]) => void;
  disabled?: boolean;
  compact?: boolean;
  highlighted?: boolean;
  highlightLabel?: string;
  onStartLiveDemo?: () => void;
  isDemoActive?: boolean;
}

const ACCEPTED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
]);

function isSupportedImage(file: File): boolean {
  if (ACCEPTED_MIME_TYPES.has(file.type)) return true;
  return /\.(jpe?g|png|webp|avif|gif)$/i.test(file.name);
}

export function Dropzone({
  onFilesAdded,
  disabled = false,
  compact = false,
  highlighted = false,
  highlightLabel = "Step 1: Dropzone",
  onStartLiveDemo,
  isDemoActive = false,
}: DropzoneProps) {
  const zoneRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepthRef = useRef(0);

  const [isDragging, setIsDragging] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [creatingDemo, setCreatingDemo] = useState(false);

  useGSAP(
    () => {
      if (!zoneRef.current) return;
      const reducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reducedMotion) return;

      gsap.to(zoneRef.current, {
        scale: isDragging ? 1.02 : 1,
        duration: 0.3,
        ease: isDragging ? "back.out(1.7)" : "power2.out",
      });
    },
    { scope: zoneRef, dependencies: [isDragging] },
  );

  const dispatchValidFiles = useCallback(
    (incoming: FileList | File[]) => {
      const list = Array.from(incoming);
      const supported = list.filter(isSupportedImage);
      const rejectedCount = list.length - supported.length;

      if (rejectedCount > 0) {
        setNotice(
          `Skipped ${rejectedCount} unsupported file${rejectedCount > 1 ? "s" : ""}. Please select JPEG, PNG, WebP, AVIF, or GIF files.`,
        );
      } else {
        setNotice(null);
      }

      if (supported.length > 0) {
        onFilesAdded(supported);
      }
    },
    [onFilesAdded],
  );

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      if (disabled) return;
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      const items = event.clipboardData?.items;
      if (!items) return;

      const pastedFiles: File[] = [];
      for (const item of items) {
        if (item.kind === "file" && item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) pastedFiles.push(file);
        }
      }

      if (pastedFiles.length > 0) {
        event.preventDefault();
        dispatchValidFiles(pastedFiles);
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [disabled, dispatchValidFiles]);

  const handleLoadDemo = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (disabled || creatingDemo) return;
    try {
      setCreatingDemo(true);
      setNotice(null);
      const demoFile = await buildDemoAiTaggedPng();
      onFilesAdded([demoFile]);
    } catch {
      setNotice("Could not generate sample image in this browser.");
    } finally {
      setCreatingDemo(false);
    }
  };

  return (
    <div className="w-full space-y-2.5">
      <section
        ref={zoneRef}
        aria-label="Drop images here or select files"
        onDragEnter={(event) => {
          event.preventDefault();
          event.stopPropagation();
          if (disabled) return;
          dragDepthRef.current += 1;
          setIsDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          event.stopPropagation();
          dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
          if (dragDepthRef.current === 0) {
            setIsDragging(false);
          }
        }}
        onDrop={(event) => {
          event.preventDefault();
          event.stopPropagation();
          dragDepthRef.current = 0;
          setIsDragging(false);
          if (!disabled && event.dataTransfer.files.length > 0) {
            dispatchValidFiles(event.dataTransfer.files);
          }
        }}
        className={cn(
          "group relative overflow-hidden rounded-2xl border-2 border-dashed shadow-sm backdrop-blur-sm transition-all duration-300",
          compact ? "px-5 py-4" : "px-6 py-10 sm:py-12",
          highlighted
            ? "border-primary bg-primary/6 ring-2 ring-primary ring-offset-4 ring-offset-background shadow-[0_0_0_6px_color-mix(in_srgb,var(--primary)_12%,transparent)]"
            : isDragging
              ? "border-primary bg-primary/6"
              : "border-border bg-card/90 hover:border-primary/60 hover:bg-card",
          disabled && "cursor-not-allowed opacity-60",
        )}
      >
        <span className="pointer-events-none absolute top-3 left-3 h-3.5 w-3.5 rounded-tl border-t-2 border-l-2 border-primary/45" />
        <span className="pointer-events-none absolute top-3 right-3 h-3.5 w-3.5 rounded-tr border-t-2 border-r-2 border-primary/45" />
        <span className="pointer-events-none absolute bottom-3 left-3 h-3.5 w-3.5 rounded-bl border-b-2 border-l-2 border-primary/45" />
        <span className="pointer-events-none absolute right-3 bottom-3 h-3.5 w-3.5 rounded-br border-r-2 border-b-2 border-primary/45" />

        {highlighted && (
          <Badge
            variant="primary"
            className="pointer-events-none absolute top-3 right-5 z-30 text-[11px] font-semibold shadow-sm"
          >
            {highlightLabel}
          </Badge>
        )}

        <button
          type="button"
          disabled={disabled}
          aria-label="Browse image files"
          onClick={() => inputRef.current?.click()}
          className="absolute inset-0 z-10 cursor-pointer rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed"
        />

        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
          className="hidden"
          onChange={(event) => {
            if (event.target.files && event.target.files.length > 0) {
              dispatchValidFiles(event.target.files);
              event.target.value = "";
            }
          }}
        />

        <div
          className={cn(
            "pointer-events-none relative z-20 flex flex-col items-center justify-between gap-4 text-center",
            compact ? "sm:flex-row sm:text-left" : "md:flex-row md:text-left",
          )}
        >
          <div
            className={cn(
              "flex flex-col items-center gap-3.5",
              compact ? "sm:flex-row sm:gap-4" : "md:flex-row md:gap-4",
            )}
          >
            <div
              className={cn(
                "flex items-center justify-center rounded-xl border transition-colors",
                compact ? "h-11 w-11" : "h-14 w-14",
                isDragging || highlighted
                  ? "border-primary/40 bg-primary/15 text-primary"
                  : "border-border bg-muted/70 text-primary group-hover:border-primary/40 group-hover:bg-primary/10",
              )}
            >
              {isDragging ? (
                <Upload className="h-6 w-6 animate-bounce" />
              ) : (
                <ImagePlus className={compact ? "h-5 w-5" : "h-6 w-6"} />
              )}
            </div>

            <div className="space-y-1">
              <p className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
                {isDragging
                  ? "Release to inspect image metadata"
                  : "Drop images, browse files, or paste (Ctrl+V)"}
              </p>
              <p className="text-xs text-muted-foreground sm:text-sm">
                Supports batch JPEG, PNG, WebP, AVIF, and GIF files locally in
                your browser.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-sm transition-opacity group-hover:opacity-92">
              Select Images
            </span>
            <button
              type="button"
              onClick={handleLoadDemo}
              disabled={disabled || creatingDemo}
              className="pointer-events-auto relative z-30 inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/16 disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {creatingDemo ? "Generating..." : "Try Sample Image"}
            </button>
            {onStartLiveDemo && !isDemoActive && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onStartLiveDemo();
                }}
                disabled={disabled}
                className="pointer-events-auto relative z-30 inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-card-solid px-3.5 text-xs font-semibold text-foreground shadow-xs transition-colors hover:border-primary/50 hover:text-primary disabled:opacity-50"
              >
                <Play className="h-3.5 w-3.5 text-primary" />
                <span>Live Demo</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {notice && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-600/25 bg-amber-500/10 px-3.5 py-2.5 text-xs font-medium text-amber-800 dark:text-amber-300">
          <FileWarning className="h-4 w-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}
    </div>
  );
}
