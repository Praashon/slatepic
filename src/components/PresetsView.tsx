"use client";

import { ArrowUpRight, Copy, Pencil, Plus, Star, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useLocalPresets } from "@/hooks/useLocalPresets";
import { getOptionsForRefreshLevel, resolveRefreshLevel } from "@/lib/scrubber";
import { cn } from "@/lib/utils";
import type { OutputFormat, PixelRefreshLevel, UserPreset } from "@/types";

const EMPTY_FORM: Omit<UserPreset, "id"> = {
  name: "",
  outputFormat: "image/jpeg",
  quality: 0.92,
  pixelRefreshLevel: "off",
  applyMicroCrop: false,
  applySubtleNoise: false,
  applyColorRebalance: false,
  applyDctCycle: false,
  applyEdgeDenoise: false,
  randomizeFilename: false,
  isDefault: false,
};

const FORMAT_LABELS: Record<OutputFormat, string> = {
  "image/jpeg": "JPEG",
  "image/png": "PNG",
  "image/webp": "WebP",
};

const REFRESH_LEVEL_OPTIONS: Array<{
  value: PixelRefreshLevel;
  label: string;
}> = [
  { value: "off", label: "Off" },
  { value: "light", label: "Light" },
  { value: "balanced", label: "Balanced" },
  { value: "strong", label: "Strong" },
];

export function PresetsView() {
  const {
    presets,
    isLoaded,
    addPreset,
    updatePreset,
    deletePreset,
    setDefaultPreset,
  } = useLocalPresets();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<Omit<UserPreset, "id">>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEdit = (preset: UserPreset) => {
    const resolvedLevel = resolveRefreshLevel(preset);
    setEditingId(preset.id ?? null);
    setForm({
      name: preset.name,
      outputFormat: preset.outputFormat,
      quality: preset.quality,
      pixelRefreshLevel: resolvedLevel,
      applyMicroCrop: preset.applyMicroCrop,
      applySubtleNoise: preset.applySubtleNoise,
      applyColorRebalance: Boolean(preset.applyColorRebalance),
      applyDctCycle: Boolean(preset.applyDctCycle),
      applyEdgeDenoise: Boolean(preset.applyEdgeDenoise),
      randomizeFilename: preset.randomizeFilename,
      isDefault: Boolean(preset.isDefault),
    });
    setFormOpen(true);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() || saving) return;

    setSaving(true);
    try {
      const payload: Omit<UserPreset, "id"> = {
        ...form,
        name: form.name.trim(),
        quality: form.outputFormat === "image/png" ? 1 : form.quality,
        pixelRefreshLevel: resolveRefreshLevel(form),
      };
      if (editingId !== null) {
        await updatePreset(editingId, payload);
      } else {
        await addPreset(payload);
      }
      setFormOpen(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicate = async (preset: UserPreset) => {
    await addPreset({
      name: `${preset.name} (Copy)`,
      outputFormat: preset.outputFormat,
      quality: preset.quality,
      pixelRefreshLevel: resolveRefreshLevel(preset),
      applyMicroCrop: preset.applyMicroCrop,
      applySubtleNoise: preset.applySubtleNoise,
      applyColorRebalance: Boolean(preset.applyColorRebalance),
      applyDctCycle: Boolean(preset.applyDctCycle),
      applyEdgeDenoise: Boolean(preset.applyEdgeDenoise),
      randomizeFilename: preset.randomizeFilename,
      isDefault: false,
    });
  };

  const handleFormStageToggle = (
    key:
      | "applyMicroCrop"
      | "applySubtleNoise"
      | "applyColorRebalance"
      | "applyDctCycle"
      | "applyEdgeDenoise",
    checked: boolean,
  ) => {
    const nextDraft = {
      ...form,
      [key]: checked,
    };
    const nextLevel = resolveRefreshLevel({
      ...nextDraft,
      pixelRefreshLevel:
        nextDraft.pixelRefreshLevel === "off" && checked
          ? "light"
          : nextDraft.pixelRefreshLevel,
    });
    setForm({
      ...nextDraft,
      pixelRefreshLevel: nextLevel,
    });
  };

  const activeFormLevel = resolveRefreshLevel(form);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm backdrop-blur-sm">
        <p className="text-sm text-muted-foreground">
          Stored locally in{" "}
          <strong className="font-semibold text-foreground">SlatePicDB</strong>{" "}
          (IndexedDB). Changes sync immediately with Studio controls.
        </p>
        <Button variant="primary" size="md" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          <span>New Preset</span>
        </Button>
      </div>

      {formOpen && (
        <form
          onSubmit={(e) => void handleSave(e)}
          className="space-y-4 rounded-2xl border border-primary/40 bg-card p-5 sm:p-6 shadow-md backdrop-blur-sm animate-word-drop"
        >
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-base font-semibold text-foreground">
              {editingId !== null ? "Edit Export Preset" : "Create New Preset"}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFormOpen(false)}
            >
              Cancel
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label
                htmlFor="preset-name"
                className="block text-xs font-semibold text-muted-foreground"
              >
                Preset Name
              </label>
              <input
                id="preset-name"
                type="text"
                required
                maxLength={48}
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
                placeholder="e.g. Instagram Clean Export"
                className="h-9 w-full rounded-lg border border-border bg-card-solid px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="preset-format"
                className="block text-xs font-semibold text-muted-foreground"
              >
                Output Format
              </label>
              <select
                id="preset-format"
                value={form.outputFormat}
                onChange={(event) =>
                  setForm({
                    ...form,
                    outputFormat: event.target.value as OutputFormat,
                  })
                }
                className="h-9 w-full rounded-lg border border-border bg-card-solid px-3 text-sm font-medium text-foreground focus:border-primary focus:outline-none"
              >
                <option value="image/jpeg">JPEG (.jpg)</option>
                <option value="image/png">PNG (.png Lossless)</option>
                <option value="image/webp">WebP (.webp)</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-muted-foreground">
                Encoder Quality
              </span>
              <span className="font-semibold tabular-nums text-foreground">
                {form.outputFormat === "image/png"
                  ? "100% (Lossless)"
                  : `${Math.round(form.quality * 100)}%`}
              </span>
            </div>
            <input
              type="range"
              min={0.5}
              max={1}
              step={0.02}
              disabled={form.outputFormat === "image/png"}
              value={form.outputFormat === "image/png" ? 1 : form.quality}
              onChange={(event) =>
                setForm({ ...form, quality: Number(event.target.value) })
              }
              className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-primary disabled:opacity-45"
            />
          </div>

          <div className="space-y-2">
            <span className="block text-xs font-semibold text-muted-foreground">
              Pixel Refresh Intensity (SynthID Mitigation)
            </span>
            <div className="grid grid-cols-4 gap-1 rounded-xl border border-border bg-muted/60 p-1">
              {REFRESH_LEVEL_OPTIONS.map((lvl) => {
                const active = activeFormLevel === lvl.value;
                return (
                  <button
                    key={lvl.value}
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        ...getOptionsForRefreshLevel(lvl.value),
                      })
                    }
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
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <SwitchOption
              id="preset-crop"
              label="Micro-Rotation & Resample"
              checked={form.applyMicroCrop}
              onChange={(checked) =>
                handleFormStageToggle("applyMicroCrop", checked)
              }
            />
            <SwitchOption
              id="preset-dct"
              label="JPEG DCT Re-Quantization"
              checked={Boolean(form.applyDctCycle)}
              onChange={(checked) =>
                handleFormStageToggle("applyDctCycle", checked)
              }
            />
            <SwitchOption
              id="preset-denoise"
              label="Edge-Aware Denoise & Sharpen"
              checked={Boolean(form.applyEdgeDenoise)}
              onChange={(checked) =>
                handleFormStageToggle("applyEdgeDenoise", checked)
              }
            />
            <SwitchOption
              id="preset-noise"
              label="Gaussian Film Grain"
              checked={form.applySubtleNoise}
              onChange={(checked) =>
                handleFormStageToggle("applySubtleNoise", checked)
              }
            />
            <SwitchOption
              id="preset-color"
              label="Color & Gamma Re-balance"
              checked={Boolean(form.applyColorRebalance)}
              onChange={(checked) =>
                handleFormStageToggle("applyColorRebalance", checked)
              }
            />
            <SwitchOption
              id="preset-random-name"
              label="Randomize Output Filename"
              checked={form.randomizeFilename}
              onChange={(checked) =>
                setForm({ ...form, randomizeFilename: checked })
              }
            />
            <SwitchOption
              id="preset-default"
              label="Set as Default Studio Preset"
              checked={Boolean(form.isDefault)}
              onChange={(checked) => setForm({ ...form, isDefault: checked })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={saving || !form.name.trim()}
            >
              <span>
                {saving
                  ? "Saving..."
                  : editingId !== null
                    ? "Update Preset"
                    : "Save Preset"}
              </span>
            </Button>
          </div>
        </form>
      )}

      {!isLoaded ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground backdrop-blur-sm">
          Loading presets from IndexedDB...
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {presets.map((preset) => {
            const presetLevel = resolveRefreshLevel(preset);
            return (
              <div
                key={preset.id ?? preset.name}
                className={cn(
                  "flex flex-col justify-between gap-4 rounded-2xl border bg-card p-5 sm:p-6 shadow-sm backdrop-blur-sm transition-all",
                  preset.isDefault
                    ? "border-primary/50 ring-1 ring-primary/15"
                    : "border-border hover:border-primary/40",
                )}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1.5">
                      <h3 className="text-base font-semibold text-foreground">
                        {preset.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant="teal" className="text-xs">
                          {FORMAT_LABELS[preset.outputFormat]}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {preset.outputFormat === "image/png"
                            ? "Lossless"
                            : `${Math.round(preset.quality * 100)}%`}
                        </Badge>
                        <Badge
                          variant={presetLevel === "off" ? "outline" : "amber"}
                          className="text-xs capitalize"
                        >
                          Pixel Refresh: {presetLevel}
                        </Badge>
                      </div>
                    </div>

                    {preset.isDefault && (
                      <Badge variant="emerald" className="text-[11px]">
                        <Star className="h-3 w-3 fill-current" />
                        Default
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5 text-[11px]">
                    <FlagPill
                      label="Rotate & Resample"
                      active={preset.applyMicroCrop}
                    />
                    <FlagPill
                      label="DCT Cycle"
                      active={Boolean(preset.applyDctCycle)}
                    />
                    <FlagPill
                      label="Edge Denoise"
                      active={Boolean(preset.applyEdgeDenoise)}
                    />
                    <FlagPill
                      label="Film Grain"
                      active={preset.applySubtleNoise}
                    />
                    <FlagPill
                      label="Color Balance"
                      active={Boolean(preset.applyColorRebalance)}
                    />
                    <FlagPill
                      label="Randomize Name"
                      active={preset.randomizeFilename}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                  <div className="flex items-center gap-1">
                    {!preset.isDefault && preset.id !== undefined && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (preset.id !== undefined) {
                            void setDefaultPreset(preset.id);
                          }
                        }}
                        title="Set as default"
                        aria-label={`Set ${preset.name} as default`}
                        className="h-8 w-8 border border-border bg-card-solid"
                      >
                        <Star className="h-3.5 w-3.5 text-amber-500" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(preset)}
                      title="Edit preset"
                      aria-label={`Edit ${preset.name}`}
                      className="h-8 w-8 border border-border bg-card-solid"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => void handleDuplicate(preset)}
                      title="Duplicate preset"
                      aria-label={`Duplicate ${preset.name}`}
                      className="h-8 w-8 border border-border bg-card-solid"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    {presets.length > 1 && preset.id !== undefined && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (preset.id !== undefined) {
                            void deletePreset(preset.id);
                          }
                        }}
                        title="Delete preset"
                        aria-label={`Delete ${preset.name}`}
                        className="h-8 w-8 border border-border bg-card-solid hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>

                  {preset.id !== undefined && (
                    <Link
                      href={`/?preset=${preset.id}`}
                      className="inline-flex h-8 items-center gap-1 rounded-lg border border-primary/30 bg-primary/10 px-3 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                    >
                      <span>Use in Studio</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SwitchOption({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/50 px-3.5 py-2.5">
      <label
        htmlFor={id}
        className="cursor-pointer text-xs font-semibold text-foreground"
      >
        {label}
      </label>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        aria-label={label}
      />
    </div>
  );
}

function FlagPill({ label, active }: { label: string; active: boolean }) {
  return (
    <Badge
      variant={active ? "amber" : "outline"}
      className="px-2 py-0.5 text-[11px]"
    >
      {label}: {active ? "On" : "Off"}
    </Badge>
  );
}
