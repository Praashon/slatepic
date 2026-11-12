"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface FaqEntry {
  id: string;
  tag: string;
  question: string;
  answer: string;
}

export function FaqAccordion({ items }: { items: FaqEntry[] }) {
  const [openId, setOpenId] = useState<string>(items[0]?.id ?? "");

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm backdrop-blur-sm divide-y divide-border">
      {items.map((item) => {
        const isOpen = openId === item.id;
        return (
          <div key={item.id}>
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpenId(isOpen ? "" : item.id)}
              className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/40"
            >
              <div className="space-y-1.5">
                <Badge
                  variant="teal"
                  className="text-[10px] uppercase tracking-wider"
                >
                  {item.tag}
                </Badge>
                <h3 className="text-base font-bold tracking-tight text-foreground">
                  {item.question}
                </h3>
              </div>
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
                  isOpen && "rotate-180 text-primary",
                )}
              />
            </button>

            {isOpen && (
              <div className="border-t border-border bg-muted/40 px-5 py-4 text-sm leading-relaxed text-muted-foreground">
                {item.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
