import type * as React from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "destructive"
  | "teal"
  | "emerald"
  | "amber";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  primary: "bg-primary text-primary-foreground border-transparent",
  secondary: "bg-secondary text-secondary-foreground border-border",
  outline: "bg-card-solid/70 text-foreground border-border",
  destructive:
    "bg-destructive/10 text-destructive border-destructive/25 dark:bg-destructive/15 dark:text-rose-300 dark:border-destructive/30",
  teal: "bg-primary/10 text-primary border-primary/25 dark:bg-primary/15 dark:border-primary/30",
  emerald:
    "bg-emerald-600/10 text-emerald-700 border-emerald-600/25 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-400/30",
  amber:
    "bg-amber-600/10 text-amber-800 border-amber-600/25 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-400/30",
};

export function Badge({
  className,
  variant = "secondary",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium transition-colors",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
