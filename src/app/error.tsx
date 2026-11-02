"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function GlobalRouteError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center px-4 py-20 text-center sm:px-6">
      <div className="w-full space-y-5 rounded-2xl border border-border bg-card p-8 shadow-sm backdrop-blur-sm">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/12 text-destructive">
          <AlertTriangle className="h-6 w-6" />
        </span>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Something went wrong
          </h1>
          <p className="text-sm text-muted-foreground">
            An unexpected error occurred in this view. Your local presets and
            history in IndexedDB remain intact.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button variant="primary" size="md" onClick={reset}>
            <RotateCcw className="h-4 w-4" />
            <span>Try Again</span>
          </Button>
          <Link
            href="/"
            className="inline-flex h-9 items-center rounded-lg border border-border bg-card-solid px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            Back to Studio
          </Link>
        </div>
      </div>
    </div>
  );
}
