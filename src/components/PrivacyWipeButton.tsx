"use client";

import { CheckCircle2, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { db, seedDefaultPresetsIfEmpty } from "@/lib/db";

export function PrivacyWipeButton() {
  const [wiped, setWiped] = useState(false);
  const [wiping, setWiping] = useState(false);

  const handleWipe = async () => {
    if (wiping) return;
    setWiping(true);
    try {
      await db.scrubHistory.clear();
      await db.presets.clear();
      await seedDefaultPresetsIfEmpty();
      setWiped(true);
    } finally {
      setWiping(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        variant="destructive"
        size="md"
        onClick={() => void handleWipe()}
        disabled={wiping}
      >
        <Trash2 className="h-4 w-4" />
        <span>
          {wiping
            ? "Wiping IndexedDB..."
            : "Wipe Local IndexedDB History & Reset Presets"}
        </span>
      </Button>

      {wiped && (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4" />
          <span>Local SlatePicDB wiped and default presets restored.</span>
        </span>
      )}
    </div>
  );
}
