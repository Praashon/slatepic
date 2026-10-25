import { cn } from "@/lib/utils";

interface RadialBackgroundProps {
  className?: string;
}

export const RadialBackground = ({ className }: RadialBackgroundProps) => {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background transition-colors duration-300",
        className,
      )}
    >
      <div className="bg-studio-dots absolute inset-0 opacity-75 dark:opacity-55" />
      <div
        className="absolute -top-44 right-[-12%] h-[460px] w-[460px] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--primary) 14%, transparent) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute -bottom-48 left-[-10%] h-[420px] w-[420px] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--secondary) 75%, transparent) 0%, transparent 72%)",
        }}
      />
    </div>
  );
};
