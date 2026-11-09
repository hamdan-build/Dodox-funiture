import { SectionHeading } from "@/components/ui/section-heading";
import { ServiceIcon } from "@/components/ui/service-icon";
import { dodoxStandard } from "@/data/site";

export function Standard() {
  return (
    <section className="border-y border-line/60 bg-shell/45 py-16 sm:py-20 lg:py-24">
      <div className="container-shell">
        <SectionHeading
          eyebrow="The atelier standard"
          title="The DODOX Standard"
          description="An uncompromising approach to honest materials, architectural proportion and careful delivery — the same principles behind every commission."
          align="center"
        />

        <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {dodoxStandard.map((item) => (
            <div
              key={item.title}
              className="group border border-line/60 bg-ivory/70 p-6 transition-colors duration-500 hover:border-taupe"
            >
              <span className="flex h-10 w-10 items-center justify-center border border-line text-bronze transition-colors group-hover:border-bronze">
                <ServiceIcon name={item.icon} size={18} />
              </span>
              <h3 className="mt-5 font-display text-[21px] leading-tight text-ink">
                {item.title}
              </h3>
              <p className="mt-2.5 text-[11.5px] leading-relaxed text-muted">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
