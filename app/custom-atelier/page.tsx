import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Ruler, SwatchBook, Truck } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ServiceStrip } from "@/components/layout/service-strip";
import { CustomAtelierForm } from "@/components/forms/custom-atelier-form";
import { Accordion } from "@/components/ui/accordion";
import { buttonStyles } from "@/components/ui/button";
import { atelierWorkflow, siteConfig, timberSwatches, whatsappLink } from "@/data/site";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Custom Atelier — bespoke furniture commissions",
  description:
    "Commission bespoke furniture drawn around your room. Share dimensions, materials and finishes with the DODOX atelier and request a quotation.",
  path: "/custom-atelier",
  image: "/images/atelier/drafting.jpg",
  keywords: [
    "bespoke furniture Kigali",
    "custom sofa Rwanda",
    "custom dining table",
    "furniture commission",
  ],
});

const principles = [
  {
    icon: Ruler,
    title: "Drawn to your room",
    description:
      "Send dimensions, photographs or a hand sketch. We return measured drawings and a proportioned proposal before anything is cut.",
  },
  {
    icon: SwatchBook,
    title: "Materials in hand",
    description:
      "Timber samples and upholstery swatches are sent home with you, so the decision is made in your own light.",
  },
  {
    icon: Truck,
    title: "Installed with care",
    description:
      "Finished pieces are wrapped, delivered, assembled and levelled in place, with all packaging removed.",
  },
];

export default function CustomAtelierPage() {
  return (
    <>
      <section className="relative isolate flex min-h-[420px] items-end overflow-hidden bg-ink sm:min-h-[500px]">
        <Image
          src="/images/atelier/drafting.jpg"
          alt="Furniture drawings, timber samples and hand tools on the atelier bench"
          fill
          priority
          sizes="100vw"
          className="-z-10 object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/90 via-ink/50 to-ink/20" />
        <div className="container-shell w-full pb-10 pt-24 sm:pb-14">
          <Breadcrumbs
            items={[{ label: "Custom Atelier" }]}
            tone="dark"
            className="mb-6"
          />
          <p className="text-[9px] uppercase tracking-[0.24em] text-ivory/65">
            Bespoke commissions · Kigali atelier
          </p>
          <h1 className="mt-3 max-w-2xl font-display text-[38px] leading-[1.02] text-ivory sm:text-[56px]">
            Furniture drawn around <em className="italic">your</em> architecture.
          </h1>
          <p className="mt-4 max-w-xl text-[13px] leading-relaxed text-ivory/70 sm:text-[14px]">
            From a single sculpted chair to a complete room, the atelier works to
            your dimensions, materials and the way you live. Begin with a
            conversation.
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            <Link href="#brief" className={buttonStyles()}>
              Start a commission
              <ArrowRight size={12} strokeWidth={1.5} />
            </Link>
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center border border-ivory/35 px-6 text-[10px] uppercase tracking-[0.16em] text-ivory transition-colors hover:bg-ivory hover:text-ink"
            >
              Discuss on WhatsApp
            </a>
          </div>
        </div>
      </section>

      <section className="container-shell py-14 sm:py-16 lg:py-20">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-14">
          <div>
            <p className="eyebrow">The bespoke atelier</p>
            <h2 className="mt-2 display-title">
              A quiet process, from drawing to installation.
            </h2>
            <p className="mt-4 max-w-lg text-[13.5px] leading-[1.85] text-ink-soft/85">
              Bespoke furniture should feel inevitable in a room — as though the
              architecture asked for it. We begin by listening, then measure twice,
              sample materials and agree a quotation before any timber is prepared.
            </p>
            <p className="mt-3 max-w-lg text-[13.5px] leading-[1.85] text-ink-soft/85">
              Every commission is documented with drawings, a specification and an
              agreed lead time. Sample process and timelines are shown throughout
              this demonstration site.
            </p>

            <div className="mt-7 space-y-4">
              {principles.map((principle) => (
                <div key={principle.title} className="flex gap-3.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-line text-bronze">
                    <principle.icon size={15} strokeWidth={1.4} />
                  </span>
                  <div>
                    <p className="text-[13px] font-medium text-ink">{principle.title}</p>
                    <p className="mt-1 text-[11.5px] leading-relaxed text-muted">
                      {principle.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 border border-line/70 bg-parchment p-4">
              <p className="text-[9px] uppercase tracking-[0.14em] text-muted">
                Timber & finish library
              </p>
              <div className="mt-3 grid grid-cols-4 gap-2">
                {timberSwatches.map((swatch) => (
                  <div key={swatch.name} className="text-center">
                    <span
                      className="mx-auto block h-8 w-8 rounded-full border border-ink/10"
                      style={{ backgroundColor: swatch.hex }}
                    />
                    <p className="mt-2 text-[8.5px] uppercase leading-tight tracking-[0.06em] text-ink">
                      {swatch.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div id="brief" className="scroll-mt-28">
            <CustomAtelierForm />
          </div>
        </div>
      </section>

      <section className="border-y border-line/60 bg-shell/40 py-14 sm:py-16">
        <div className="container-shell grid gap-8 lg:grid-cols-2 lg:gap-14">
          <div>
            <p className="eyebrow">How a commission unfolds</p>
            <h2 className="mt-2 display-title">Three considered stages</h2>
            <div className="mt-6 space-y-4">
              {atelierWorkflow.map((step) => (
                <div
                  key={step.step}
                  className="flex gap-4 border border-line/60 bg-parchment p-4"
                >
                  <span className="font-display text-3xl leading-none text-taupe">
                    {step.step}
                  </span>
                  <div>
                    <p className="text-[12.5px] font-medium text-ink">{step.title}</p>
                    <p className="mt-1 text-[11.5px] leading-relaxed text-muted">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="eyebrow">Practical questions</p>
            <h2 className="mt-2 display-title">Before you begin</h2>
            <Accordion
              className="mt-5"
              items={[
                {
                  title: "How long does a commission take?",
                  defaultOpen: true,
                  content:
                    "Sample lead times range from two weeks for a small object to eight weeks for a full room. The atelier confirms a schedule in writing once the specification is approved. These are demonstration timelines.",
                },
                {
                  title: "Do you work outside Kigali?",
                  content:
                    "Regional delivery can be arranged and is quoted after reviewing the commission. Delivery and any installation logistics are confirmed before production begins.",
                },
                {
                  title: "How is payment handled?",
                  content:
                    "No payment is taken through this website. The atelier concierge confirms local payment arrangements directly after reviewing your request. This demo does not integrate any payment provider.",
                },
                {
                  title: "Can I supply my own fabric?",
                  content:
                    "Often, yes. The atelier reviews fabric suitability for the frame and cushion construction before accepting client-supplied material.",
                },
              ]}
            />
            <div className="mt-5 border border-line/70 bg-parchment p-4 text-[11px] leading-relaxed text-muted">
              Prefer to talk it through? Call{" "}
              <a
                href={siteConfig.contact.phoneHref}
                className="text-ink underline decoration-line underline-offset-4 hover:text-bronze"
              >
                {siteConfig.contact.phone}
              </a>{" "}
              or visit the showroom at {siteConfig.contact.showroomAddress}.
            </div>
          </div>
        </div>
      </section>

      <ServiceStrip />
    </>
  );
}
