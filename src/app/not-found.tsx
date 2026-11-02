import { ArrowLeft, FileQuestion } from "lucide-react";
import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center px-4 py-20 text-center sm:px-6">
      <div className="w-full space-y-5 rounded-2xl border border-border bg-card p-8 shadow-sm backdrop-blur-sm">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/12 text-primary">
          <FileQuestion className="h-6 w-6" />
        </span>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Page not found
          </h1>
          <p className="text-sm text-muted-foreground">
            The requested route does not exist in SlatePic. Return to the Studio
            to inspect or scrub images locally.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-92"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Studio</span>
        </Link>
      </div>
    </div>
  );
}
