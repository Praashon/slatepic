import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
}

export function BrandLogo({ className }: BrandLogoProps) {
  return (
    <span
      className={cn("inline-flex items-center gap-2.5 select-none", className)}
    >
      <svg
        width="30"
        height="30"
        viewBox="0 0 30 30"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="h-7 w-7 shrink-0"
      >
        <rect
          x="1.5"
          y="1.5"
          width="27"
          height="27"
          rx="7"
          className="fill-card-solid stroke-border"
          strokeWidth="1.25"
        />
        {/* Studio aperture viewfinder corner brackets */}
        <path
          d="M7.5 11.5V8.5C7.5 7.95 7.95 7.5 8.5 7.5H11.5"
          className="stroke-primary"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M18.5 7.5H21.5C22.05 7.5 22.5 7.95 22.5 8.5V11.5"
          className="stroke-foreground"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M22.5 18.5V21.5C22.5 22.05 22.05 22.5 21.5 22.5H18.5"
          className="stroke-primary"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M11.5 22.5H8.5C7.95 22.5 7.5 22.05 7.5 21.5V18.5"
          className="stroke-foreground"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Clean diagonal wipe slash */}
        <path
          d="M10.5 19.5L19.5 10.5"
          className="stroke-primary"
          strokeWidth="2.1"
          strokeLinecap="round"
        />
      </svg>

      <span className="text-[17px] font-bold tracking-tight leading-none text-foreground">
        SlatePic<span className="text-primary">.</span>
      </span>
    </span>
  );
}
