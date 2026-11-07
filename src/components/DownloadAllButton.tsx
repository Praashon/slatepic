"use client";

import { Archive } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { buildBatchZip } from "@/lib/scrubber";
import { downloadBlob } from "@/lib/utils";

interface DownloadAllButtonProps {
  items: Array<{ blob: Blob; cleanFileName: string }>;
  disabled?: boolean;
}

export function DownloadAllButton({
  items,
  disabled = false,
}: DownloadAllButtonProps) {
  const [generating, setGenerating] = useState(false);

  const handleDownloadZip = async () => {
    if (items.length === 0 || generating || disabled) return;
    setGenerating(true);
    try {
      const zipBlob = await buildBatchZip(items);
      downloadBlob(zipBlob, "slatepic-cleaned.zip");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Button
      variant="primary"
      size="sm"
      onClick={() => void handleDownloadZip()}
      disabled={items.length === 0 || generating || disabled}
    >
      <Archive className="h-3.5 w-3.5" />
      <span>
        {generating
          ? "Packaging ZIP..."
          : `Download All .ZIP (${items.length})`}
      </span>
    </Button>
  );
}
