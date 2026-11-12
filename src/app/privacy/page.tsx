import {
  Activity,
  ArrowLeft,
  Database,
  Eye,
  ServerOff,
  ShieldCheck,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PrivacyWipeButton } from "@/components/PrivacyWipeButton";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Privacy Architecture | SlatePic",
  description:
    "How SlatePic guarantees 100% client-side image processing with zero binary uploads.",
};

export default function PrivacyPage() {
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
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Privacy Architecture</span>
        </Badge>

        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
          Zero Uploads. Zero Accounts. Local by Design.
        </h1>

        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          SlatePic runs decoding, inspection, Canvas redraw, container chunk
          sanitization, and ZIP packaging completely inside your browser tab.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <section className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-sm backdrop-blur-sm sm:p-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600/12 text-emerald-600 dark:text-emerald-300">
              <Database className="h-4 w-4" />
            </span>
            <h2 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
              Stays on Your Device
            </h2>
          </div>

          <ul className="space-y-2.5 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>
                Raw image files, pixel buffers, and re-encoded outputs stay in
                ephemeral browser RAM via{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-foreground">
                  URL.createObjectURL
                </code>{" "}
                and are revoked immediately on removal or unload.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>
                EXIF GPS coordinates, camera serials, prompts, and C2PA
                manifests are parsed locally with{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-foreground">
                  exifr
                </code>{" "}
                and never leave the tab.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>
                Scrub History and Export Presets persist strictly in your
                browser IndexedDB database (
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-foreground">
                  SlatePicDB
                </code>
                ).
              </span>
            </li>
          </ul>
        </section>

        <section className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-sm backdrop-blur-sm sm:p-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
              <Activity className="h-4 w-4" />
            </span>
            <h2 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
              Anonymous Telemetry Sent to /api/stats
            </h2>
          </div>

          <p className="text-sm leading-relaxed text-muted-foreground">
            The only network call after scrubbing is a lightweight integer
            increment sent to Upstash Redis for the live global counter:
          </p>

          <pre className="overflow-x-auto rounded-xl border border-border bg-muted/70 p-3 text-xs font-medium text-primary">
            {`POST /api/stats
{
  "count": 1,
  "tagsCount": 6,
  "bytesSavedCount": 18420
}`}
          </pre>

          <p className="text-xs text-muted-foreground">
            No filenames, IP tracking, cookies, image hashes, or metadata tags
            are ever sent.
          </p>
        </section>
      </div>

      <section className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm backdrop-blur-sm sm:p-6">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
            <Eye className="h-4 w-4" />
          </span>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Verify It Yourself in 10 Seconds
          </h2>
        </div>

        <ol className="list-inside list-decimal space-y-2 text-sm text-muted-foreground">
          <li>
            Open browser DevTools (
            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-xs text-foreground">
              F12
            </kbd>{" "}
            or{" "}
            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-xs text-foreground">
              Ctrl+Shift+I
            </kbd>
            ) and switch to the{" "}
            <strong className="text-foreground">Network</strong> tab.
          </li>
          <li>
            Drop a private photo or AI-generated image into SlatePic and click{" "}
            <strong className="text-foreground">Scrub Active Image</strong>.
          </li>
          <li>
            Confirm zero image payloads or{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-foreground">
              multipart/form-data
            </code>{" "}
            uploads occur, or switch on{" "}
            <strong className="text-foreground">Offline Mode</strong> in
            DevTools to see scrubbing continue working locally.
          </li>
        </ol>

        <div className="flex items-center gap-2.5 rounded-xl border border-border bg-muted/60 px-4 py-3 text-xs font-medium text-muted-foreground">
          <ServerOff className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>
            Works offline once loaded: Canvas 2D, exifr, JSZip, and Dexie run
            without server image processing.
          </span>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-sm backdrop-blur-sm sm:p-6">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Manage Local Storage
        </h2>
        <p className="text-sm text-muted-foreground">
          Clear your local scrub audit log and reset presets stored in this
          browser IndexedDB database at any time.
        </p>
        <PrivacyWipeButton />
      </section>
    </div>
  );
}
