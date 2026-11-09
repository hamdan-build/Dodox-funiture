"use client";

import { useEffect } from "react";
import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the error in the browser console for support; no error service is
    // connected in this frontend demonstration.
    console.error(error);
  }, [error]);

  return (
    <div className="container-shell py-20 text-center">
      <p className="eyebrow">Something interrupted the atelier</p>
      <h1 className="mx-auto mt-3 max-w-xl display-title">
        We could not finish preparing this page.
      </h1>
      <p className="mx-auto mt-3 max-w-md text-[13px] leading-relaxed text-muted">
        Try again, or return to the collection. If the problem persists, the
        concierge can help directly.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2.5">
        <button type="button" onClick={reset} className={buttonStyles()}>
          Try again
        </button>
        <Link href="/" className={buttonStyles({ variant: "light" })}>
          Return home
        </Link>
      </div>
    </div>
  );
}
