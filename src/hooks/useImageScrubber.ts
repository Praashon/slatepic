"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/db";
import { hasForbiddenMetadata, inspectImage } from "@/lib/inspector";
import { computeBufferSha256 } from "@/lib/sanitizer";
import { scrubImage } from "@/lib/scrubber";
import type {
  GlobalStats,
  MetadataReport,
  ScrubOptions,
  ScrubResult,
} from "@/types";

export interface ScrubPipelineInput {
  file: File;
  report?: MetadataReport;
  options: ScrubOptions;
  isDemo?: boolean;
}

interface StatsPostResponse {
  ok?: boolean;
  success: boolean;
  source?: "redis" | "fallback";
  imagesCleaned?: number;
  tagsNuked?: number;
  bytesSaved?: number;
  updatedAt?: number;
}

export function useImageScrubber() {
  const queryClient = useQueryClient();

  return useMutation<ScrubResult, Error, ScrubPipelineInput>({
    mutationFn: async ({ file, report, options, isDemo = false }) => {
      const initialReport = report ?? (await inspectImage(file, file.name));
      const {
        blob,
        cleanFileName,
        cleanedSizeBytes,
        pixelRefreshLevel,
        perturbationMetrics,
      } = await scrubImage(file, options);

      const [stillHasMetadata, verificationReport, sha256] = await Promise.all([
        hasForbiddenMetadata(blob, options.outputFormat),
        inspectImage(blob, cleanFileName),
        blob.arrayBuffer().then((buf) => computeBufferSha256(buf)),
      ]);

      if (stillHasMetadata || verificationReport.rawTagCount > 0) {
        throw new Error(
          "Verification failed: prohibited metadata remained after sanitization.",
        );
      }

      const cleanedPreviewUrl = URL.createObjectURL(blob);
      const bytesSaved = Math.max(0, file.size - cleanedSizeBytes);
      const tagsRemovedCount = Math.max(
        initialReport.rawTagCount,
        initialReport.detectedSignatures.length,
      );
      const pixelRefreshApplied = pixelRefreshLevel !== "off";

      if (!isDemo) {
        await db.scrubHistory.add({
          timestamp: Date.now(),
          originalFileName: file.name,
          cleanedFileName: cleanFileName,
          originalSizeBytes: file.size,
          cleanedSizeBytes,
          tagsNukedCount: tagsRemovedCount,
          detectedSignatures: initialReport.detectedSignatures,
        });

        // Anonymous numeric telemetry + cleaned SHA-256 only: zero image bytes leave the browser
        try {
          const res = await fetch("/api/stats", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
            body: JSON.stringify({
              count: 1,
              tagsCount: tagsRemovedCount,
              bytesSavedCount: bytesSaved,
              imageHash: sha256,
            }),
          });

          if (res.ok) {
            const updated = (await res.json()) as StatsPostResponse;
            if (
              typeof updated.imagesCleaned === "number" &&
              typeof updated.tagsNuked === "number" &&
              typeof updated.bytesSaved === "number"
            ) {
              queryClient.setQueryData<GlobalStats>(["global-stats"], {
                imagesCleaned: updated.imagesCleaned,
                tagsNuked: updated.tagsNuked,
                bytesSaved: updated.bytesSaved,
                source: updated.source,
                updatedAt: updated.updatedAt ?? Date.now(),
              });
            }
          }
        } catch {
          // Optimistically update local cache if offline
          queryClient.setQueryData<GlobalStats>(["global-stats"], (prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              imagesCleaned: prev.imagesCleaned + 1,
              tagsNuked: prev.tagsNuked + tagsRemovedCount,
              bytesSaved: prev.bytesSaved + bytesSaved,
              updatedAt: Date.now(),
            };
          });
        } finally {
          void queryClient.invalidateQueries({ queryKey: ["global-stats"] });
        }
      }

      return {
        blob,
        cleanFileName,
        cleanedSizeBytes,
        cleanedPreviewUrl,
        verificationReport,
        bytesSaved,
        scrubbedAt: Date.now(),
        sha256,
        pixelRefreshApplied,
        pixelRefreshLevel,
        perturbationMetrics,
      };
    },
  });
}

