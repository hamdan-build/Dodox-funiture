import { Leaf, Layers, Ruler, ShieldCheck } from "lucide-react";
import { siteConfig } from "@/data/site";
import type { Product } from "@/types";

export function TechnicalBlueprint({ product }: { product: Product }) {
  const dimensions = product.dimensions.slice(0, 5);

  const cards = [
    {
      icon: Leaf,
      title: "Solid & Kiln-Stabilised",
      description:
        product.specs[0]?.value ??
        "Centre-cut hardwood, kiln-dried and finished by hand in the atelier.",
      metaLabel: "Moisture",
      metaValue: "Kiln-stabilised",
    },
    {
      icon: Layers,
      title: "Dual-Density Comfort",
      description:
        product.specs[1]?.value ??
        "Supportive foam and natural fibre layers selected for daily use.",
      metaLabel: "Upholstery",
      metaValue: product.materials.join(" · "),
    },
    {
      icon: Ruler,
      title: "Architectural Dimensions",
      description: "Measured drawings and an ergonomic schematic are available on request.",
      metaLabel: "Doorway",
      metaValue: "Fits standard 76cm+ doors",
    },
    {
      icon: ShieldCheck,
      title: "Atelier Guarantee",
      description:
        "Structural joinery and timber are covered by the sample atelier guarantee. Terms are confirmed in writing with your order.",
      metaLabel: "Concierge",
      metaValue: siteConfig.contact.phone,
    },
  ];

  return (
    <section className="border-t border-line/60 bg-shell/40 py-14 sm:py-16 lg:py-20">
      <div className="container-shell">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="eyebrow">Engineering &amp; materiality</p>
            <h2 className="mt-2 display-title">Atelier Technical Blueprint</h2>
          </div>
          <p className="max-w-sm text-[12px] leading-relaxed text-muted lg:text-right">
            Every piece is drawn and built to order with hand-rubbed finishes and
            reinforced joinery. Sample specification shown for this demonstration.
          </p>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <div
              key={card.title}
              className="flex flex-col border border-line/60 bg-ivory/70 p-5"
            >
              <span className="flex h-9 w-9 items-center justify-center border border-line text-bronze">
                <card.icon size={15} strokeWidth={1.4} />
              </span>
              <h3 className="mt-4 font-display text-[20px] leading-tight text-ink">
                {card.title}
              </h3>
              <p className="mt-2 flex-1 text-[11px] leading-relaxed text-muted">
                {card.description}
              </p>
              {card.title === "Architectural Dimensions" ? (
                <dl className="mt-4 space-y-1.5 border-t border-line/70 pt-3">
                  {dimensions.map((row) => (
                    <div key={row.label} className="flex justify-between gap-3 text-[10px]">
                      <dt className="text-muted">{row.label}</dt>
                      <dd className="text-ink">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <div className="mt-4 flex items-center justify-between gap-2 border-t border-line/70 pt-3 text-[9px] uppercase tracking-[0.08em] text-muted">
                  <span>{card.metaLabel}</span>
                  <span className="text-right text-ink">{card.metaValue}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
