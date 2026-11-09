import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Video } from "lucide-react";
import { buttonStyles } from "@/components/ui/button";

export function AtelierPromo() {
  return (
    <section className="container-shell py-14 sm:py-16 lg:py-20">
      <div className="relative grid overflow-hidden bg-olive lg:grid-cols-2">
        <div className="relative z-10 px-6 py-10 sm:px-10 sm:py-12 lg:px-12 lg:py-14">
          <p className="inline-flex items-center gap-2 border border-ivory/20 bg-ivory/5 px-3 py-1.5 text-[9px] uppercase tracking-[0.2em] text-ivory/70">
            Bespoke atelier exclusive
          </p>
          <h2 className="mt-5 max-w-md font-display text-[34px] leading-[1.05] text-ivory sm:text-[42px] lg:text-[46px]">
            Redefine Your Living Space.
          </h2>
          <p className="mt-4 max-w-sm text-[13px] leading-relaxed text-ivory/65">
            Work with our atelier on a bespoke commission — from a single sculpted
            chair to a complete room. Dimensions, timber and upholstery are drawn
            around your architecture, then built to order.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href="/custom-atelier" className={buttonStyles({ size: "md" })}>
              Begin a Commission
              <ArrowRight size={13} strokeWidth={1.5} />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-1 py-2 text-[10px] uppercase tracking-[0.16em] text-ivory/75 transition-colors hover:text-ivory"
            >
              <Video size={13} strokeWidth={1.4} />
              Schedule a private viewing
            </Link>
          </div>
          <div className="mt-8 grid gap-2 border-t border-ivory/12 pt-5 text-[10px] uppercase tracking-[0.12em] text-ivory/55 sm:grid-cols-3">
            {["Measured drawings", "Timber & swatch approval", "White-glove install"].map(
              (item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <Check size={11} strokeWidth={1.6} className="text-taupe" />
                  {item}
                </span>
              ),
            )}
          </div>
        </div>
        <div className="relative min-h-[260px] lg:min-h-[460px]">
          <Image
            src="/images/editorial/atelier-promo.jpg"
            alt="Warm living room at dusk with sculptural seating and terrace views"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-olive/60 via-transparent to-transparent lg:from-olive/40" />
        </div>
      </div>
    </section>
  );
}
