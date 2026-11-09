import { ServiceIcon } from "@/components/ui/service-icon";

const items = [
  {
    icon: "shield",
    title: "10-Year Craftsmanship Warranty",
    description: "Structural integrity for life",
  },
  {
    icon: "package",
    title: "White-Glove Kigali Assembly",
    description: "Delivered & positioned attentively",
  },
  {
    icon: "tree",
    title: "Solid East African Timber",
    description: "Centre-cut, kiln-dried hardwood",
  },
  {
    icon: "hammer",
    title: "Made in Rwanda",
    description: "Empowering local master artisans",
  },
];

export function ServiceStrip({ className }: { className?: string }) {
  return (
    <section className={`border-y border-line/60 bg-shell/40 ${className ?? ""}`}>
      <div className="container-shell grid grid-cols-2 gap-x-6 gap-y-6 py-8 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.title} className="flex items-start gap-3">
            <ServiceIcon name={item.icon} size={20} className="mt-0.5 shrink-0 text-bronze" />
            <div>
              <p className="text-[11px] font-medium leading-snug text-ink">
                {item.title}
              </p>
              <p className="mt-1 text-[9.5px] uppercase leading-relaxed tracking-[0.08em] text-muted">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
