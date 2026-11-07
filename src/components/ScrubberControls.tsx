"use client";

import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Layers,
  Sliders,
  Sparkles,
  Wand2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useLocalPresets } from "@/hooks/useLocalPresets";
import { getOptionsForRefreshLevel, resolveRefreshLevel } from "@/lib/scrubber";
import { cn } from "@/lib/utils";
import type { OutputFormat, PixelRefreshLevel, ScrubOptions } from "@/types";

interface ScrubberControlsProps {
  options: ScrubOptions;
  onChange: (next: ScrubOptions) => void;
  selectedPresetId: number | "custom";
  onSelectPreset: (presetId: number) => void;
  onScrubActive: () => void;
  onScrubAll: () => void;
  hasActiveItem: boolean;
  isActiveScrubbing: boolean;
  pendingCount: number;
  isBatchScrubbing: boolean;
  highlighted?: boolean;
}

const FORMAT_OPTIONS: Array<{ value: OutputFormat; label: string }> = [
  { value: "image/jpeg", label: "JPEG" },
  { value: "image/png", label: "PNG" },
  { value: "image/webp", label: "WebP" },
];

const REFRESH_LEVELS: Array<{
  value: PixelRefreshLevel;
  label: string;
  summary: string;
}> = [
  {
    value: "off",
    label: "Off",
    summary:
      "Header strip only: redraws exact 1:1 RGB pixels and drops 100% of container metadata.",
  },
  {
    value: "light",
    label: "Light",
    summary:
      "Subtle 0.30deg rotation, 99% resample, and mild film grain with near-lossless fidelity.",
  },
  {
    value: "balanced",
    label: "Balanced",
    summary:
      "Recommended for AI images: 0.65deg rotation, 95% resample, DCT re-quantization, edge-aware denoise, and natural grain.",
  },
  {
    value: "strong",
    label: "Strong",
    summary:
      "Maximum local disruption: 1.05deg rotation, 89% resample, strong DCT cycle, bilateral denoise, and tonal grain.",
  },
];

export function ScrubberControls({
  options,
  onChange,
  selectedPresetId,
  onSelectPreset,
  onScrubActive,
  onScrubAll,
  hasActiveItem,
  isActiveScrubbing,
  pendingCount,
  isBatchScrubbing,
  highlighted = false,
}: ScrubberControlsProps) {
  const { presets } = useLocalPresets();
  const [stagesOpen, setStagesOpen] = useState(false);

  const isLossless = options.outputFormat === "image/png";
  const activeRefreshLevel = resolveRefreshLevel(options);
  const activeLevelMeta =
    REFRESH_LEVELS.find((lvl) => lvl.value === activeRefreshLevel) ??
    REFRESH_LEVELS[0];

  const handleSelectRefreshLevel = (level: PixelRefreshLevel) => {
    onChange({
      ...options,
      ...getOptionsForRefreshLevel(level),
    });
  };

  const handleToggleStage = (
    key:
      | "applyMicroCrop"
      | "applyDctCycle"
      | "applyEdgeDenoise"
      | "applySubtleNoise"
      | "applyColorRebalance",
    checked: boolean,
  ) => {
    const draft: ScrubOptions = {
      ...options,
      [key]: checked,
    };
    const nextLevel = resolveRefreshLevel({
      ...draft,
      pixelRefreshLevel:
        draft.pixelRefreshLevel === "off" && checked
          ? "light"
          : draft.pixelRefreshLevel,
    });
    onChange({
      ...draft,
      pixelRefreshLevel: nextLevel,
    });
  };

  return (
    <aside
      className={cn(
        "flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-sm backdrop-blur-sm transition-all duration-300 sm:p-6",
        highlighted
          ? "border-primary ring-2 ring-primary ring-offset-4 ring-offset-background shadow-[0_0_0_6px_color-mix(in_srgb,var(--primary)_12%,transparent)]"
          : "border-border",
      )}
    >
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/12 text-primary">
            <Sliders className="h-3.5 w-3.5" />
          </span>
          <h2 className="text-sm font-semibold tracking-tight text-foreground">
            Export Settings
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {highlighted && (
            <Badge variant="primary" className="text-[11px] font-semibold">
              Step 3: Configure
            </Badge>
          )}
          <Link
            href="/presets"
            className="text-xs font-semibold text-primary transition-colors hover:underline"
          >
            Manage Presets
          </Link>
        </div>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="preset-select"
          className="block text-xs font-semibold text-muted-foreground"
        >
          Export Preset
        </label>
        <select
          id="preset-select"
          value={
            selectedPresetId === "custom" ? "custom" : String(selectedPresetId)
          }
          onChange={(event) => {
            const val = event.target.value;
            if (val !== "custom") {
              onSelectPreset(Number(val));
            }
          }}
          className="h-9 w-full rounded-lg border border-border bg-card-solid px-3 text-xs font-medium text-foreground focus:border-primary focus:outline-none"
        >
          {presets.map((preset) => (
            <option key={preset.id ?? preset.name} value={String(preset.id)}>
              {preset.name}
              {preset.isDefault ? " (Default)" : ""}
            </option>
          ))}
          {selectedPresetId === "custom" && (
            <option value="custom">Custom Configuration</option>
          )}
        </select>
      </div>

      <div className="space-y-1.5">
        <span className="block text-xs font-semibold text-muted-foreground">
          Output Format
        </span>
        <div className="grid grid-cols-3 gap-1 rounded-xl border border-border bg-muted/70 p-1">
          {FORMAT_OPTIONS.map((fmt) => {
            const active = options.outputFormat === fmt.value;
            return (
              <button
                key={fmt.value}
                type="button"
                onClick={() =>
                  onChange({
                    ...options,
                    outputFormat: fmt.value,
                  })
                }
                className={cn(
                  "cursor-pointer rounded-lg py-1.5 text-xs font-semibold transition-colors",
                  active
                    ? "bg-card-solid text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {fmt.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-muted-foreground">
            Encoder Quality
          </span>
          <span className="font-semibold tabular-nums text-foreground">
            {isLossless
              ? "100% (Lossless)"
              : `${Math.round(options.quality * 100)}%`}
          </span>
        </div>
        <input
          type="range"
          min={0.5}
          max={1}
          step={0.02}
          disabled={isLossless}
          value={isLossless ? 1 : options.quality}
          onChange={(event) =>
            onChange({
              ...options,
              quality: Number(event.target.value),
            })
          }
          className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-primary disabled:cursor-not-allowed disabled:opacity-45"
        />
      </div>

      <div className="space-y-3 rounded-xl border border-border bg-muted/45 p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold text-foreground">
              Pixel Refresh (SynthID Mitigation)
            </span>
          </div>
          {activeRefreshLevel !== "off" && (
            <Badge variant="teal" className="text-[11px] capitalize">
              {activeRefreshLevel}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-4 gap-1 rounded-xl border border-border bg-card-solid p-1">
          {REFRESH_LEVELS.map((lvl) => {
            const active = activeRefreshLevel === lvl.value;
            return (
              <button
                key={lvl.value}
                type="button"
                onClick={() => handleSelectRefreshLevel(lvl.value)}
                className={cn(
                  "cursor-pointer rounded-lg py-1.5 text-xs font-semibold transition-colors",
                  active
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {lvl.label}
              </button>
            );
          })}
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground">
          {activeLevelMeta.summary}
        </p>

        <div className="overflow-hidden rounded-lg border border-border bg-card-solid">
          <button
            type="button"
            onClick={() => setStagesOpen((prev) => !prev)}
            className="flex w-full cursor-pointer items-center justify-between px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            <span>Advanced Pixel Refresh Options</span>
            {stagesOpen ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>

          {stagesOpen && (
            <div className="space-y-3 border-t border-border p-3">
              <ToggleRow
                id="toggle-micro-crop"
                label="Micro-Rotation & Resample"
                description="Rotates by a sub-degree angle and trims borders to break pixel grid alignment"
                checked={options.applyMicroCrop}
                onToggle={(checked) =>
                  handleToggleStage("applyMicroCrop", checked)
                }
              />

              <ToggleRow
                id="toggle-dct-cycle"
                label="JPEG DCT Re-Quantization Cycle"
                description="Passes RGB blocks through an intermediate 8x8 DCT quantization cycle"
                checked={Boolean(options.applyDctCycle)}
                onToggle={(checked) =>
                  handleToggleStage("applyDctCycle", checked)
                }
              />

              <ToggleRow
                id="toggle-edge-denoise"
                label="Edge-Aware Denoise & Sharpen"
                description="Smooths hidden high-frequency residuals while restoring crisp edges"
                checked={Boolean(options.applyEdgeDenoise)}
                onToggle={(checked) =>
                  handleToggleStage("applyEdgeDenoise", checked)
                }
              />

              <ToggleRow
                id="toggle-subtle-noise"
                label="Gaussian Film Grain"
                description="Injects coupled broadband luminance grain and subtle chroma jitter"
                checked={options.applySubtleNoise}
                onToggle={(checked) =>
                  handleToggleStage("applySubtleNoise", checked)
                }
              />

              <ToggleRow
                id="toggle-color-rebalance"
                label="Color & Gamma Re-balance"
                description="Applies mild tonal gamma curve and RGB channel balancing"
                checked={Boolean(options.applyColorRebalance)}
                onToggle={(checked) =>
                  handleToggleStage("applyColorRebalance", checked)
                }
              />
            </div>
          )}
        </div>

        <div className="flex items-start gap-2 rounded-lg border border-amber-600/25 bg-amber-500/8 p-2.5 text-xs leading-relaxed text-amber-800 dark:text-amber-300">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <p>
            <strong className="font-semibold">SynthID Honesty Note:</strong>{" "}
            SlatePic removes 100% of header tags (C2PA, EXIF, IPTC, XMP). Public
            third-party sites cannot run Google&apos;s private SynthID detector
            and often label any non-C2PA file as having SynthID. Choose Balanced
            or Strong Pixel Refresh to disrupt spatial and DCT pixel watermarks
            locally for free, though deep neural signals are degraded rather than
            100% guaranteed erased without heavy distortion.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-muted/45 p-4">
        <ToggleRow
          id="toggle-randomize-name"
          label="Randomize Output Filename"
          description="Saves output as IMG_XXXX_XXXX instead of original name"
          checked={options.randomizeFilename}
          onToggle={(checked) =>
            onChange({
              ...options,
              randomizeFilename: checked,
            })
          }
        />
      </div>

      <div className="space-y-2 pt-1">
        <Button
          variant="primary"
          size="lg"
          onClick={onScrubActive}
          disabled={!hasActiveItem || isActiveScrubbing || isBatchScrubbing}
          className={cn(
            "w-full",
            highlighted &&
              "ring-2 ring-primary/60 ring-offset-2 ring-offset-card",
          )}
        >
          <Wand2 className="h-4 w-4" />
          <span>
            {isActiveScrubbing ? "Scrubbing Canvas..." : "Scrub Active Image"}
          </span>
        </Button>

        {pendingCount > 1 && (
          <Button
            variant="outline"
            size="md"
            onClick={onScrubAll}
            disabled={isBatchScrubbing || isActiveScrubbing}
            className="w-full"
          >
            <Layers className="h-3.5 w-3.5 text-primary" />
            <span>
              {isBatchScrubbing
                ? "Processing Batch..."
                : `Scrub All Pending (${pendingCount})`}
            </span>
          </Button>
        )}
      </div>
    </aside>
  );
}

function ToggleRow({
  id,
  label,
  description,
  checked,
  onToggle,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onToggle: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <label htmlFor={id} className="cursor-pointer space-y-0.5">
        <p className="text-xs font-semibold text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </label>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onToggle}
        aria-label={label}
      />
    </div>
  );
}
