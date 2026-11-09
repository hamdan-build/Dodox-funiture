import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Asterisk } from "lucide-react";
import { buttonStyles } from "@/components/ui/button";
import { serviceFeatures } from "@/data/site";

export function Hero() {
  return (
    <section className="relative isolate flex min-h-[600px] flex-col overflow-hidden bg-ink sm:min-h-[680px] lg:min-h-[730px]">
      <Image
        src="/images/hero/hero-living-room.jpg"
        alt="A sculptural bouclé sofa in a warm Kigali living room overlooking green hills at dusk"
        fill
        priority
        sizes="100vw"
        className="-z-10 object-cover object-center"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink/90 via-ink/55 to-ink/10" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/75 via-transparent to-ink/25" />

      <div className="container-shell flex flex-1 items-center py-14 sm:py-16 lg:py-20">
        <div className="max-w-2xl text-ivory animate-fade-up">
          <p className="inline-flex items-center gap-2 border border-ivory/25 bg-ivory/5 px-3 py-1.5 text-[9px] uppercase tracking-[0.22em] text-ivory/85 backdrop-blur-sm">
            <Asterisk size={11} strokeWidth={1.5} className="text-taupe" />
            The atelier collection · Kigali
          </p>
          <h1 className="mt-6 font-display text-[38px] leading-[1.02] tracking-[-0.02em] text-ivory sm:text-[54px] lg:text-[68px]">
            Furniture That Makes
            <br className="hidden sm:block" /> <em className="font-normal italic">Every Space</em> Feel
            Like Home.
          </h1>
          <p className="mt-5 max-w-lg text-[13px] leading-relaxed text-ivory/75 sm:text-[15px]">
            Discover beautifully designed furniture that combines comfort,
            craftsmanship and contemporary living — meticulously hand-finished for
            modern Rwandan homes.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href="/shop" className={buttonStyles({ size: "lg" })}>
              Explore Collection
              <ArrowRight size={14} strokeWidth={1.5} />
            </Link>
            <Link
              href="/custom-atelier"
              className="inline-flex h-[52px] items-center justify-center gap-2 border border-ivory/35 bg-ivory/5 px-7 text-[10px] font-medium uppercase tracking-[0.18em] text-ivory backdrop-blur-sm transition-colors hover:bg-ivory hover:text-ink"
            >
              Discover Custom Atelier
            </Link>
          </div>
        </div>
      </div>

      <div className="relative border-t border-ivory/15 bg-gradient-to-t from-ink/80 to-ink/20">
        <div className="container-shell grid grid-cols-2 gap-x-6 gap-y-5 py-6 sm:py-7 lg:grid-cols-4 lg:gap-8">
          {serviceFeatures.map((feature) => (
            <div key={feature.title} className="border-l border-ivory/20 pl-4">
              <p className="text-[11px] font-medium text-ivory sm:text-[12px]">
                {feature.title}
              </p>
              <p className="mt-1 text-[9.5px] uppercase leading-relaxed tracking-[0.1em] text-ivory/55 sm:text-[10px]">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
