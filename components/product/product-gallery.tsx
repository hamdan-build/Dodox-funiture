"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Expand, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ImageAsset } from "@/types";

export function ProductGallery({
  images,
  name,
  badges,
}: {
  images: ImageAsset[];
  name: string;
  badges?: string[];
}) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightbox(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [lightbox]);

  const current = images[active] ?? images[0];

  return (
    <div>
      <div className="relative overflow-hidden bg-shell">
        <div className="relative aspect-[4/3] w-full sm:aspect-[5/4]">
          <Image
            key={current.src}
            src={current.src}
            alt={current.alt}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 55vw"
            className="object-cover animate-fade-in"
          />
        </div>

        {badges?.length ? (
          <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5 sm:left-4 sm:top-4">
            {badges.map((badge) => (
              <span
                key={badge}
                className="bg-ivory/90 px-2.5 py-1 text-[8.5px] uppercase tracking-[0.16em] text-ink/75 backdrop-blur-sm"
              >
                {badge}
              </span>
            ))}
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => setLightbox(true)}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center border border-line/80 bg-parchment/90 text-ink backdrop-blur-sm transition-colors hover:bg-ivory sm:right-4 sm:top-4"
          aria-label="View image full screen"
        >
          <Expand size={14} strokeWidth={1.5} />
        </button>

        <div className="absolute bottom-3 left-3 bg-ink/75 px-2.5 py-1 text-[9px] uppercase tracking-[0.14em] text-ivory backdrop-blur-sm">
          {active + 1} / {images.length}
        </div>
      </div>

      <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-5">
        {images.map((image, index) => (
          <button
            key={image.src + index}
            type="button"
            onClick={() => setActive(index)}
            className={cn(
              "relative aspect-square overflow-hidden border bg-shell transition-colors",
              index === active
                ? "border-bronze"
                : "border-transparent hover:border-taupe",
            )}
            aria-label={`View image ${index + 1}: ${image.alt}`}
            aria-pressed={index === active}
          >
            <Image
              src={image.src}
              alt=""
              fill
              sizes="120px"
              className="object-cover"
            />
          </button>
        ))}
        <div className="hidden aspect-square flex-col items-center justify-center gap-1 border border-line/70 bg-parchment text-center sm:flex">
          <span className="text-[8px] uppercase tracking-[0.14em] text-muted">
            Ergonomic
          </span>
          <span className="text-[8px] uppercase tracking-[0.14em] text-muted">
            schematic
          </span>
          <span className="text-[7px] text-muted/70">On request</span>
        </div>
      </div>

      {lightbox ? (
        <div
          className="fixed inset-0 z-[85] flex items-center justify-center bg-ink/92 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`${name} image viewer`}
        >
          <button
            type="button"
            onClick={() => setLightbox(false)}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-ivory/30 text-ivory transition-colors hover:bg-ivory hover:text-ink"
            aria-label="Close image viewer"
          >
            <X size={18} strokeWidth={1.4} />
          </button>
          <div className="relative h-[80vh] w-full max-w-5xl">
            <Image
              src={current.src}
              alt={current.alt}
              fill
              sizes="90vw"
              className="object-contain"
            />
          </div>
          <div className="absolute inset-x-0 bottom-6 flex justify-center gap-2">
            {images.map((image, index) => (
              <button
                key={image.src + index}
                type="button"
                onClick={() => setActive(index)}
                className={cn(
                  "h-1.5 w-8 transition-colors",
                  index === active ? "bg-ivory" : "bg-ivory/30",
                )}
                aria-label={`Show image ${index + 1}`}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
