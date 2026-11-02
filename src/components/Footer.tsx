import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { Badge } from "@/components/ui/badge";

const footerLinks = [
  { label: "Studio", href: "/" },
  { label: "History", href: "/history" },
  { label: "Presets", href: "/presets" },
  { label: "Privacy", href: "/privacy" },
  { label: "FAQ", href: "/faq" },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-border/80 bg-card/60 backdrop-blur-sm">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-8 sm:px-6 md:grid-cols-2 md:items-center lg:px-8">
        <div className="space-y-2">
          <Link
            href="/"
            className="inline-flex items-center transition-opacity hover:opacity-85"
          >
            <BrandLogo />
          </Link>
          <p className="max-w-md text-xs leading-relaxed text-muted-foreground">
            A Fresh Canvas for Every Pixel. Client-side Canvas and Dexie
            processing so your image files never leave your browser.
          </p>
          <p className="text-xs font-medium text-muted-foreground">
            &copy; 2026 SlatePic. Local-first image privacy.
          </p>
        </div>

        <div className="flex flex-col gap-3 md:items-end">
          <nav
            aria-label="Footer navigation"
            className="flex flex-wrap items-center gap-x-5 gap-y-2"
          >
            {footerLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-xs font-semibold text-muted-foreground transition-colors hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className="text-xs">
              HTML5 Canvas
            </Badge>
            <Badge variant="outline" className="text-xs">
              Dexie LocalDB
            </Badge>
            <Badge variant="teal" className="text-xs">
              Zero Uploads
            </Badge>
          </div>
        </div>
      </div>
    </footer>
  );
}
