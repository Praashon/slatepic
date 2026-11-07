import { Cpu, ShieldCheck, Sparkles } from "lucide-react";
import { Suspense } from "react";
import { GlobalCounter } from "@/components/GlobalCounter";
import { StudioWorkspace } from "@/components/StudioWorkspace";
import { Badge } from "@/components/ui/badge";

function StudioFallback() {
  return (
    <div className="w-full rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground shadow-sm backdrop-blur-sm">
      Loading studio workspace...
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 px-4 pt-8 pb-16 sm:px-6 sm:pt-12 sm:pb-20 lg:px-8">
      {/* Editorial Two-Column Studio Hero */}
      <section className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
        <div className="space-y-4 lg:col-span-7">
          <Badge variant="teal" className="px-3 py-1 text-xs font-semibold">
            Client-Side Privacy Studio
          </Badge>

          <h1 className="text-3xl font-bold tracking-tight leading-[1.15] text-foreground sm:text-5xl">
            A Fresh Canvas for Every Pixel.
          </h1>

          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Inspect C2PA Content Credentials, EXIF GPS coordinates, and AI
            generator tags, then redraw clean pixels onto a blank HTML5 Canvas
            inside your browser.
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Badge variant="outline">C2PA Stripping</Badge>
            <Badge variant="outline">EXIF &amp; GPS Removal</Badge>
            <Badge variant="outline">Batch .ZIP Export</Badge>
          </div>
        </div>

        <div className="lg:col-span-5">
          <GlobalCounter />
        </div>
      </section>

      {/* Studio Workbench */}
      <Suspense fallback={<StudioFallback />}>
        <StudioWorkspace />
      </Suspense>

      {/* Feature Architecture Cards */}
      <section className="grid grid-cols-1 gap-4 border-t border-border pt-8 md:grid-cols-3">
        <div className="space-y-2.5 rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm backdrop-blur-sm">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600/12 text-emerald-600 dark:text-emerald-300">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <h2 className="text-sm font-semibold tracking-tight text-foreground">
              Complete Header Removal
            </h2>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
            ChatGPT, DALL-E, Midjourney, and Firefly attach JUMBF{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-foreground">
              c2pa
            </code>{" "}
            manifests and IPTC{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-foreground">
              DigitalSourceType
            </code>{" "}
            tags. Re-encoding on Canvas and sanitizing chunks removes every
            ancillary header.
          </p>
        </div>

        <div className="space-y-2.5 rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm backdrop-blur-sm">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-600/12 text-amber-600 dark:text-amber-300">
              <Sparkles className="h-4 w-4" />
            </span>
            <h2 className="text-sm font-semibold tracking-tight text-foreground">
              Honest SynthID Refresh
            </h2>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
            Frequency-domain pixel watermarks like SynthID live inside pixel
            values rather than headers. Optional{" "}
            <strong className="font-semibold text-foreground">
              Light Pixel Refresh
            </strong>{" "}
            (1% micro-crop and subtle film grain) degrades brittle spatial
            signals without heavy distortion.
          </p>
        </div>

        <div className="space-y-2.5 rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm backdrop-blur-sm">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
              <Cpu className="h-4 w-4" />
            </span>
            <h2 className="text-sm font-semibold tracking-tight text-foreground">
              Zero Server Uploads
            </h2>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
            All decoding, scrubbing, and ZIP packaging stay inside browser RAM
            and IndexedDB. Only anonymous integer counters are posted to{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-foreground">
              /api/stats
            </code>
            .
          </p>
        </div>
      </section>
    </div>
  );
}
