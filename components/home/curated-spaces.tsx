import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { curatedSpaces } from "@/data/categories";

export function CuratedSpaces() {
  return (
    <section className="container-shell py-16 sm:py-20 lg:py-24">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between sm:gap-10">
        <div>
          <p className="eyebrow mb-3">Shop by curated space</p>
          <h2 className="display-title">Rooms composed with intention</h2>
        </div>
        <div className="sm:max-w-[300px] sm:text-right">
          <p className="text-[12px] leading-relaxed text-muted">
            Each environment is imagined with proportion, tactile materials and the
            way you actually live — browse by room to begin.
          </p>
          <Link
            href="/shop"
            className="link-underline mt-3 hidden text-[10px] sm:inline-flex"
          >
            View the full collection
            <ArrowRight size={12} strokeWidth={1.5} />
          </Link>
        </div>
      </div>

      <div className="mt-9 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {curatedSpaces.map((space) => (
          <Link
            key={space.slug}
            href={space.href}
            className="group relative isolate overflow-hidden bg-shell"
          >
            <div className="relative aspect-[4/5] w-full sm:aspect-[4/4.4]">
              <Image
                src={space.image}
                alt={space.alt}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/25 to-transparent opacity-90 transition-opacity duration-500 group-hover:opacity-100" />
            <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 lg:p-6">
              <p className="text-[8px] uppercase tracking-[0.22em] text-ivory/60 sm:text-[9px]">
                {space.eyebrow}
              </p>
              <h3 className="mt-1.5 font-display text-[22px] leading-tight text-ivory sm:text-[26px]">
                {space.title}
              </h3>
              <div className="mt-1 flex items-end justify-between gap-3">
                <p className="max-w-[85%] text-[10px] leading-relaxed text-ivory/65 line-clamp-2 sm:text-[11px]">
                  {space.blurb}
                </p>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-ivory/35 text-ivory transition-all duration-500 group-hover:border-ivory group-hover:bg-ivory group-hover:text-ink">
                  <ArrowRight size={13} strokeWidth={1.5} className="-rotate-45" />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <Link
        href="/shop"
        className="link-underline mt-8 inline-flex text-[10px] sm:hidden"
      >
        View the full collection
        <ArrowRight size={12} strokeWidth={1.5} />
      </Link>
    </section>
  );
}
