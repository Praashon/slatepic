"use client";

import { useLiveQuery } from "dexie-react-hooks";
import {
  Download,
  HardDrive,
  History,
  Search,
  Tag,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import {
  downloadBlob,
  formatBytes,
  formatNumber,
  formatRelativeTime,
} from "@/lib/utils";

export function HistoryView() {
  const entries = useLiveQuery(
    () => db.scrubHistory.orderBy("timestamp").reverse().toArray(),
    [],
    undefined,
  );

  const [query, setQuery] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);

  const isLoaded = entries !== undefined;
  const list = entries ?? [];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (entry) =>
        entry.originalFileName.toLowerCase().includes(q) ||
        entry.cleanedFileName.toLowerCase().includes(q) ||
        entry.detectedSignatures.some((sig) => sig.toLowerCase().includes(q)),
    );
  }, [list, query]);

  const totals = useMemo(() => {
    return list.reduce(
      (acc, entry) => {
        acc.count += 1;
        acc.tags += entry.tagsNukedCount;
        acc.saved += Math.max(
          0,
          entry.originalSizeBytes - entry.cleanedSizeBytes,
        );
        return acc;
      },
      { count: 0, tags: 0, saved: 0 },
    );
  }, [list]);

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(list, null, 2)], {
      type: "application/json",
    });
    downloadBlob(blob, `slatepic-audit-log-${Date.now()}.json`);
  };

  const handleDeleteEntry = async (id?: number) => {
    if (id === undefined) return;
    await db.scrubHistory.delete(id);
  };

  const handleClearAll = async () => {
    await db.scrubHistory.clear();
    setConfirmClear(false);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-3.5 rounded-2xl border border-border bg-card p-5 shadow-sm backdrop-blur-sm">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
            <History className="h-4 w-4" />
          </span>
          <div>
            <p className="text-xl font-bold tabular-nums text-foreground">
              {formatNumber(totals.count)}
            </p>
            <p className="text-xs text-muted-foreground">
              Local images cleaned
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-2xl border border-border bg-card p-5 shadow-sm backdrop-blur-sm">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/12 text-destructive">
            <Tag className="h-4 w-4" />
          </span>
          <div>
            <p className="text-xl font-bold tabular-nums text-foreground">
              {formatNumber(totals.tags)}
            </p>
            <p className="text-xs text-muted-foreground">Total tags removed</p>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-2xl border border-border bg-card p-5 shadow-sm backdrop-blur-sm">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600/12 text-emerald-600 dark:text-emerald-300">
            <HardDrive className="h-4 w-4" />
          </span>
          <div>
            <p className="text-xl font-bold tabular-nums text-foreground">
              {formatBytes(totals.saved)}
            </p>
            <p className="text-xs text-muted-foreground">Local bytes saved</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter by filename or signature (e.g. C2PA, ChatGPT)..."
            className="h-9 w-full rounded-lg border border-border bg-card-solid pr-3 pl-9 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportJson}
            disabled={list.length === 0}
          >
            <Download className="h-3.5 w-3.5 text-primary" />
            <span>Export JSON</span>
          </Button>

          {confirmClear ? (
            <div className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/35 bg-destructive/10 px-3 py-1 text-xs font-medium">
              <span className="text-destructive">Confirm wipe?</span>
              <button
                type="button"
                onClick={() => void handleClearAll()}
                className="cursor-pointer rounded-md bg-destructive px-2.5 py-0.5 text-destructive-foreground hover:opacity-90"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setConfirmClear(false)}
                className="cursor-pointer rounded-md border border-border bg-card-solid px-2.5 py-0.5 text-foreground hover:bg-muted"
              >
                Cancel
              </button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmClear(true)}
              disabled={list.length === 0}
              className="hover:border-destructive/40 hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear All</span>
            </Button>
          )}
        </div>
      </div>

      {!isLoaded ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground backdrop-blur-sm">
          Loading local history...
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card p-12 text-center backdrop-blur-sm">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <History className="h-5 w-5" />
          </span>
          <div className="space-y-1">
            <p className="text-base font-semibold text-foreground">
              {list.length === 0
                ? "No local scrub history yet"
                : "No matching entries found"}
            </p>
            <p className="text-sm text-muted-foreground">
              {list.length === 0
                ? "Scrubbed image logs are recorded strictly in your browser IndexedDB."
                : "Try clearing your search filter."}
            </p>
          </div>
          {list.length === 0 && (
            <Link
              href="/"
              className="mt-1 inline-flex h-9 items-center rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-92"
            >
              Open Studio
            </Link>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm backdrop-blur-sm divide-y divide-border">
          {filtered.map((entry) => {
            const delta = entry.originalSizeBytes - entry.cleanedSizeBytes;
            return (
              <div
                key={entry.id ?? `${entry.timestamp}-${entry.cleanedFileName}`}
                className="flex flex-col justify-between gap-4 p-4 sm:p-5 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-semibold text-foreground">
                      {entry.originalFileName}
                    </span>
                    <span className="text-xs text-muted-foreground">→</span>
                    <span className="truncate text-xs font-semibold text-emerald-600 dark:text-emerald-300">
                      {entry.cleanedFileName}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatRelativeTime(entry.timestamp)}</span>
                    <span>·</span>
                    <span>
                      {formatBytes(entry.originalSizeBytes)} →{" "}
                      {formatBytes(entry.cleanedSizeBytes)}
                    </span>
                    {delta > 0 && (
                      <>
                        <span>·</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-300">
                          -{formatBytes(delta)}
                        </span>
                      </>
                    )}
                    <span>·</span>
                    <span className="font-semibold text-destructive">
                      {entry.tagsNukedCount} tag
                      {entry.tagsNukedCount === 1 ? "" : "s"} removed
                    </span>
                  </div>

                  {entry.detectedSignatures.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {entry.detectedSignatures.map((sig) => (
                        <Badge
                          key={sig}
                          variant="destructive"
                          className="text-xs"
                        >
                          {sig}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void handleDeleteEntry(entry.id)}
                  aria-label={`Delete log entry for ${entry.originalFileName}`}
                  className="shrink-0 self-start hover:border-destructive/40 hover:text-destructive sm:self-center"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Remove</span>
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
