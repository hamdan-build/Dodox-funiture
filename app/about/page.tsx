import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Leaf, Ruler, ShieldCheck, Sparkles } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ServiceStrip } from "@/components/layout/service-strip";
import { buttonStyles } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { siteConfig, timberSwatches } from "@/data/site";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "About the house",
  description:
    "DODOX is a Kigali-based furniture house working with solid timber, considered proportion and a measured approach to furnishing a home. Brand story and demonstration notes.",
  path: "/about",
  image: "/images/rooms/living-room.jpg",
});

const principles = [
  {
    icon: Ruler,
    title: "Proportion before ornament",
    description:
      "Pieces are drawn to architectural scale, with restrained detail and silhouettes that leave room for the life around them.",
  },
  {
    icon: Leaf,
    title: "Honest materiality",
    description:
      "Solid timber, stone, cane and natural textiles — materials that age visibly and honestly rather than imitating something else.",
  },
  {
    icon: ShieldCheck,
    title: "Built to be kept",
    description:
      "Joinery and finishing are approached as long-term decisions, with maintenance and repair considered from the first drawing.",
  },
  {
    icon: Sparkles,
    title: "Service as part of the object",
    description:
      "Measurement, sampling, delivery and assembly are treated as part of the furniture itself, not as an afterthought.",
  },
];

export default function AboutPage() {
  return (
    <>
      <div className="container-shell pt-5">
        <Breadcrumbs items={[{ label: "About" }]} />
      </div>

      <section className="container-shell pb-10 pt-6 sm:pt-10">
        <div className="grid items-end gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <div>
            <p className="eyebrow">The house of DODOX</p>
            <h1 className="mt-3 display-title-lg max-w-2xl">
              A considered house of furniture, based in Kigali.
            </h1>
            <p className="mt-5 max-w-xl text-[14px] leading-[1.85] text-ink-soft/85">
              DODOX designs and presents furniture for modern Rwandan homes:
              sculptural seating, solid timber tables, quiet storage and the
              objects that finish a room. The collection is underpinned by a simple
              belief — that furniture should be drawn carefully, made honestly and
              delivered with attention.
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <Link href="/shop" className={buttonStyles()}>
                Explore the collection
                <ArrowRight size={12} strokeWidth={1.5} />
              </Link>
              <Link href="/contact" className={buttonStyles({ variant: "light" })}>
                Visit the showroom
              </Link>
            </div>
          </div>
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-shell">
            <Image
              src="/images/rooms/living-room.jpg"
              alt="A warm living room composed with sculptural seating and natural materials"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 45vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <section className="border-y border-line/60 bg-shell/35 py-14 sm:py-16 lg:py-20">
        <div className="container-shell grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <div>
            <p className="eyebrow">Our story</p>
            <h2 className="mt-2 display-title">
              Written slowly, in timber and linen.
            </h2>
            <div className="prose-editorial mt-5">
              <p>
                DODOX began with a straightforward observation: furnishing a home in
                Kigali often meant choosing between imported pieces designed
                elsewhere and locally made furniture with little design guidance. We
                wanted a third option — a house that designs for this climate, this
                light and the way rooms are actually used here.
              </p>
              <p>
                The name is drawn from Rwandan place and language, and the collection
                follows suit: Imanzi, Kigali, Virunga, Akagera, Gishwati, Muhabura.
                Each piece is imagined as part of a room rather than a catalogue
                entry — proportioned generously, finished quietly, and built to be
                repaired rather than replaced.
              </p>
              <p>
                We work with solid timber, stone, hand-woven cane and natural
                upholstery. Where a finish will change with time — oak warming,
                teak silvering, linen softening — we consider that part of the
                design.
              </p>
            </div>
            <p className="mt-6 border-l border-bronze/40 pl-4 text-[11.5px] leading-relaxed text-muted">
              <strong className="font-medium text-ink">Demonstration note:</strong>{" "}
              this brand story is written for the storefront build. Founding dates,
              certifications, manufacturing claims and team biographies have
              deliberately been left out and must be supplied and verified by DODOX
              before publication.
            </p>
          </div>

          <div className="space-y-4">
            <div className="relative aspect-[4/3] overflow-hidden bg-shell">
              <Image
                src="/images/atelier/drafting.jpg"
                alt="Furniture drawings and timber samples on the atelier workbench"
                fill
                sizes="(max-width: 1024px) 100vw, 45vw"
                className="object-cover"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="relative aspect-square overflow-hidden bg-shell">
                <Image
                  src="/images/products/imanzi-fabric.jpg"
                  alt="Close detail of sand bouclé upholstery"
                  fill
                  sizes="(max-width: 1024px) 45vw, 22vw"
                  className="object-cover"
                />
              </div>
              <div className="border border-line/70 bg-parchment p-4">
                <p className="text-[9px] uppercase tracking-[0.14em] text-muted">
                  Material library
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {timberSwatches.map((swatch) => (
                    <div key={swatch.name}>
                      <span
                        className="block h-6 w-full border border-ink/10"
                        style={{ backgroundColor: swatch.hex }}
                      />
                      <p className="mt-1 text-[8px] uppercase tracking-[0.06em] text-ink-soft">
                        {swatch.name}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container-shell py-14 sm:py-16 lg:py-20">
        <SectionHeading
          eyebrow="Design principles"
          title="Four things we do not compromise"
          align="center"
        />
        <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {principles.map((principle) => (
            <div key={principle.title} className="border border-line/60 bg-parchment p-5">
              <span className="flex h-9 w-9 items-center justify-center border border-line text-bronze">
                <principle.icon size={15} strokeWidth={1.4} />
              </span>
              <h3 className="mt-4 font-display text-xl leading-tight text-ink">
                {principle.title}
              </h3>
              <p className="mt-2 text-[11.5px] leading-relaxed text-muted">
                {principle.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section id="white-glove" className="scroll-mt-24 border-y border-line/60 bg-olive py-14 text-ivory sm:py-16">
        <div className="container-shell grid gap-8 lg:grid-cols-[1fr_1fr] lg:gap-14">
          <div>
            <p className="text-[9px] uppercase tracking-[0.22em] text-ivory/60">
              White-glove service
            </p>
            <h2 className="mt-3 font-display text-[32px] leading-tight text-ivory sm:text-[40px]">
              Delivery is part of the design.
            </h2>
            <p className="mt-4 max-w-lg text-[13px] leading-relaxed text-ivory/65">
              In Kigali, delivery, placement, assembly and packaging removal are
              coordinated by the DODOX team. Pieces are unwrapped in the room,
              levelled, inspected with you and left ready to use.
            </p>
            <p className="mt-3 max-w-lg text-[10px] leading-relaxed text-ivory/40">
              Service scope and regional shipping terms shown on this site are
              demonstration placeholders pending verification.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Room-of-choice placement", "Positioned, then adjusted to the light and the plan of the room."],
              ["Assembly & levelling", "Joinery checked, fixings tightened and feet levelled on site."],
              ["Packaging removal", "All wrapping and transit material leaves with our team."],
              ["Care handover", "A short briefing on cleaning and maintenance for each material."],
            ].map(([title, copy]) => (
              <div
                key={title}
                className="border border-ivory/15 bg-ivory/5 p-4 backdrop-blur-sm"
              >
                <p className="text-[11.5px] font-medium text-ivory">{title}</p>
                <p className="mt-1.5 text-[10.5px] leading-relaxed text-ivory/55">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="warranty" className="scroll-mt-24 container-shell py-14 sm:py-16">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
          <div>
            <p className="eyebrow">Care & longevity</p>
            <h2 className="mt-2 display-title">A warranty we can explain.</h2>
            <p className="mt-4 max-w-md text-[13px] leading-relaxed text-ink-soft/85">
              Furniture should be maintainable. The atelier keeps records of every
              commission — timber batch, finish and upholstery — so that care and
              repair are possible years later.
            </p>
          </div>
          <div className="border border-line/70 bg-parchment p-5">
            <p className="text-[10px] uppercase tracking-[0.16em] text-muted">
              Sample service commitments
            </p>
            <ul className="mt-3 space-y-3 text-[12px] leading-relaxed text-ink-soft/85">
              <li className="border-b border-line/60 pb-3">
                <span className="font-medium text-ink">Structural joinery</span> —
                covered under the atelier guarantee; exact terms must be confirmed in
                writing.
              </li>
              <li className="border-b border-line/60 pb-3">
                <span className="font-medium text-ink">Timber movement</span> —
                natural seasonal movement is expected; advice and remediation are
                provided by the atelier.
              </li>
              <li>
                <span className="font-medium text-ink">Upholstery care</span> —
                cleaning guidance is supplied with each piece; fibre repairs are
                assessed individually.
              </li>
            </ul>
            <p className="mt-4 text-[10px] leading-relaxed text-muted">
              Demonstration text. No certification, warranty period or accreditation
              should be published until verified by DODOX.
            </p>
          </div>
        </div>
      </section>

      <section className="container-shell pb-16">
        <div className="flex flex-col items-center gap-4 border border-line/60 bg-sand/45 px-6 py-10 text-center">
          <p className="eyebrow">Meet the atelier</p>
          <h2 className="display-title max-w-xl">
            The best introduction is a conversation in the showroom.
          </h2>
          <p className="max-w-lg text-[12.5px] leading-relaxed text-muted">
            Visit {siteConfig.contact.showroomAddress}, or ask us to arrange timber
            and textile samples for your home.
          </p>
          <div className="flex flex-wrap justify-center gap-2.5">
            <Link href="/contact" className={buttonStyles()}>
              Arrange a visit
            </Link>
            <Link href="/custom-atelier" className={buttonStyles({ variant: "light" })}>
              Begin a commission
            </Link>
          </div>
        </div>
      </section>

      <ServiceStrip />
    </>
  );
}
