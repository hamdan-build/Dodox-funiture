import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonStyles } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { ServiceIcon } from "@/components/ui/service-icon";
import { atelierWorkflow, timberSwatches } from "@/data/site";

export function Craftsmanship() {
  return (
    <section className="border-t border-line/60 bg-ivory py-16 sm:py-20 lg:py-24">
      <div className="container-shell">
        <SectionHeading
          eyebrow="Bespoke architecture & joinery"
          title="Your Vision. Our Craftsmanship."
          description="From a full residential scheme to a single piece drawn around your room, every commission begins with a conversation and a measured drawing."
        />

        <div className="mt-9 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col border border-line/70 bg-parchment p-3 sm:p-4">
            <div className="relative aspect-[16/11] w-full overflow-hidden">
              <Image
                src="/images/atelier/drafting.jpg"
                alt="Furniture drawings, timber samples and hand tools on an atelier workbench"
                fill
                sizes="(max-width: 1024px) 100vw, 55vw"
                className="object-cover"
              />
              <div className="absolute bottom-0 left-0 bg-ink/85 px-4 py-2.5 backdrop-blur-sm">
                <p className="text-[9px] uppercase tracking-[0.18em] text-ivory/80">
                  Drawing, sampling, making
                </p>
              </div>
            </div>

            <div className="px-1 pb-1 pt-6">
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="font-display text-xl text-ink">
                  Selected Timber Species &amp; Finishes
                </h3>
                <span className="hidden text-[9px] uppercase tracking-[0.14em] text-muted sm:block">
                  Swatch library
                </span>
              </div>
              <div className="mt-4 grid grid-cols-4 gap-2">
                {timberSwatches.map((swatch) => (
                  <div
                    key={swatch.name}
                    className="border border-line/70 bg-ivory/60 p-2.5 text-center"
                  >
                    <span
                      className="mx-auto block h-7 w-7 rounded-full border border-ink/10"
                      style={{ backgroundColor: swatch.hex }}
                      aria-hidden="true"
                    />
                    <p className="mt-2 text-[9px] font-medium uppercase leading-tight tracking-[0.08em] text-ink">
                      {swatch.name}
                    </p>
                    <p className="mt-0.5 text-[8px] uppercase tracking-[0.06em] text-muted">
                      {swatch.note}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="border border-line/70 bg-parchment p-5 sm:p-6">
              <h3 className="font-display text-2xl text-ink">The Bespoke Workflow</h3>
              <ol className="mt-5 space-y-4">
                {atelierWorkflow.map((step) => (
                  <li key={step.step} className="flex gap-3.5">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-bronze/40 text-[10px] font-medium text-bronze">
                      {step.step}
                    </span>
                    <div>
                      <p className="text-[13px] font-medium text-ink">{step.title}</p>
                      <p className="mt-1 text-[11.5px] leading-relaxed text-muted">
                        {step.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: "tree", label: "Sustainable", sub: "Timber sourcing" },
                { icon: "hammer", label: "Kiln-Dried", sub: "Joinery stability" },
                { icon: "shield", label: "10-Year", sub: "Structural warranty" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="border border-line/70 bg-parchment px-2 py-4 text-center"
                >
                  <ServiceIcon
                    name={item.icon}
                    size={17}
                    className="mx-auto text-bronze"
                  />
                  <p className="mt-2 text-[10px] font-medium text-ink">{item.label}</p>
                  <p className="mt-0.5 text-[8.5px] uppercase leading-tight tracking-[0.08em] text-muted">
                    {item.sub}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Link href="/custom-atelier" className={buttonStyles({ className: "w-full" })}>
                Request a Custom Piece
                <ArrowRight size={12} strokeWidth={1.5} />
              </Link>
              <Link
                href="/contact"
                className={buttonStyles({ variant: "light", className: "w-full" })}
              >
                Visit the Atelier
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
