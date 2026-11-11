import { ArrowLeft, Sliders } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PresetsView } from "@/components/PresetsView";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Export Presets | SlatePic",
  description:
    "Configure local Canvas export formats, encoder quality, micro-crop, and subtle grain presets.",
};

export default function PresetsPage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 pt-8 pb-16 sm:px-6 sm:pt-10 sm:pb-20 lg:px-8">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card-solid px-3 py-1.5 text-xs font-semibold text-foreground shadow-xs transition-colors hover:border-primary/50 hover:text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Studio</span>
        </Link>
      </div>

      <header className="space-y-3 border-b border-border pb-6">
        <Badge variant="teal" className="px-2.5 py-1">
          <Sliders className="h-3.5 w-3.5" />
          <span>Local Preset Storage</span>
        </Badge>

        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
          Export Presets
        </h1>

        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Save custom output formats, JPEG and WebP quality settings, Light
          Pixel Refresh flags, and filename rules locally in your browser.
        </p>
      </header>

      <Suspense
        fallback={
          <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground backdrop-blur-sm">
            Loading presets...
          </div>
        }
      >
        <PresetsView />
      </Suspense>
    </div>
  );
}
