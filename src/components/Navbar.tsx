"use client";

import { useLiveQuery } from "dexie-react-hooks";
import {
  HelpCircle,
  History,
  Image as ImageIcon,
  Lock,
  Moon,
  ShieldCheck,
  Sliders,
  Sun,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { useTheme } from "@/components/QueryProvider";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const historyCount = useLiveQuery(() => db.scrubHistory.count(), [], 0);
  const presetCount = useLiveQuery(() => db.presets.count(), [], 0);

  useEffect(() => {
    router.prefetch("/");
    router.prefetch("/history");
    router.prefetch("/presets");
    router.prefetch("/privacy");
    router.prefetch("/faq");
  }, [router]);

  const navItems = [
    {
      href: "/",
      label: "Studio",
      icon: ImageIcon,
      active: pathname === "/",
      count: undefined,
    },
    {
      href: "/history",
      label: "History",
      icon: History,
      active: pathname.startsWith("/history"),
      count: historyCount > 0 ? historyCount : undefined,
    },
    {
      href: "/presets",
      label: "Presets",
      icon: Sliders,
      active: pathname.startsWith("/presets"),
      count: presetCount > 0 ? presetCount : undefined,
    },
    {
      href: "/privacy",
      label: "Privacy",
      icon: ShieldCheck,
      active: pathname.startsWith("/privacy"),
      count: undefined,
    },
    {
      href: "/faq",
      label: "FAQ",
      icon: HelpCircle,
      active: pathname.startsWith("/faq"),
      count: undefined,
    },
  ] as const;

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-lg transition-colors">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-6 lg:gap-8">
          <Link
            href="/"
            prefetch={true}
            className="flex shrink-0 items-center transition-opacity hover:opacity-85"
          >
            <BrandLogo />
          </Link>

          <nav
            aria-label="Primary navigation"
            className="hidden h-16 items-center gap-1 sm:flex"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={true}
                  className={cn(
                    "relative inline-flex h-full items-center gap-1.5 px-3 text-sm font-medium transition-colors",
                    item.active
                      ? "text-foreground after:absolute after:right-2 after:bottom-0 after:left-2 after:h-0.5 after:rounded-full after:bg-primary"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-3.5 w-3.5",
                      item.active ? "text-primary" : "text-muted-foreground",
                    )}
                  />
                  <span>{item.label}</span>
                  {item.count !== undefined ? (
                    <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-foreground">
                      {item.count}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-2.5">
          <span className="hidden items-center gap-1.5 rounded-lg border border-primary/25 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary lg:inline-flex">
            <Lock className="h-3 w-3" />
            <span>100% Local</span>
          </span>

          <fieldset
            aria-label="Color theme"
            className="m-0 inline-flex items-center rounded-lg border border-border bg-muted/70 p-0.5"
          >
            <button
              type="button"
              onClick={() => setTheme("light")}
              aria-label="Light theme"
              aria-pressed={theme === "light"}
              className={cn(
                "inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md transition-colors",
                theme === "light"
                  ? "bg-card-solid text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Sun className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setTheme("dark")}
              aria-label="Dark theme"
              aria-pressed={theme === "dark"}
              className={cn(
                "inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md transition-colors",
                theme === "dark"
                  ? "bg-card-solid text-primary shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Moon className="h-3.5 w-3.5" />
            </button>
          </fieldset>
        </div>
      </div>

      {/* Mobile horizontal scrollable tab strip */}
      <nav
        aria-label="Mobile navigation"
        className="flex items-center gap-1 overflow-x-auto border-t border-border/70 px-4 py-2 sm:hidden"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                item.active
                  ? "bg-primary/12 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{item.label}</span>
              {item.count !== undefined ? (
                <span className="rounded bg-card-solid px-1.5 py-0.5 text-[10px] tabular-nums text-foreground">
                  {item.count}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
