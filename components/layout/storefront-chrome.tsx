"use client";

import { usePathname } from "next/navigation";
import { StoreHydrator } from "@/components/store-hydrator";

export function StorefrontChrome({
  announcement,
  header,
  footer,
  overlays,
  jsonLdScript,
  children,
}: {
  announcement: React.ReactNode;
  header: React.ReactNode;
  footer: React.ReactNode;
  overlays: React.ReactNode;
  jsonLdScript: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-ink focus:px-4 focus:py-3 focus:text-[11px] focus:uppercase focus:tracking-[0.16em] focus:text-ivory"
      >
        Skip to content
      </a>
      <StoreHydrator />
      {announcement}
      {header}
      <main id="main-content" className="min-h-[60vh]">
        {children}
      </main>
      {footer}
      {overlays}
      {jsonLdScript}
    </>
  );
}
