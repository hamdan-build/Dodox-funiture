import type { Metadata } from "next";
import Image from "next/image";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ServiceStrip } from "@/components/layout/service-strip";
import { ContactForm } from "@/components/forms/contact-form";
import { Accordion } from "@/components/ui/accordion";
import { buttonStyles } from "@/components/ui/button";
import { siteConfig, whatsappLink } from "@/data/site";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Contact & showroom",
  description:
    "Contact the DODOX atelier in Kigali: showroom details, WhatsApp concierge, delivery questions and bespoke enquiries. Contact details are demonstration placeholders.",
  path: "/contact",
  image: "/images/rooms/outdoor-living.jpg",
});

export default function ContactPage() {
  return (
    <>
      <div className="container-shell pt-5">
        <Breadcrumbs items={[{ label: "Contact" }]} />
      </div>

      <section className="container-shell pb-8 pt-6 sm:pt-8">
        <p className="eyebrow">Atelier concierge</p>
        <h1 className="mt-2 max-w-2xl display-title">
          Speak with us, or visit the showroom.
        </h1>
        <p className="mt-4 max-w-xl text-[13.5px] leading-relaxed text-ink-soft/85">
          Questions about a piece, a commission, delivery or an order request — the
          atelier is happy to help. Sample contact details below are placeholders
          and must be verified before launch.
        </p>
      </section>

      <section className="container-shell pb-14">
        <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
          <ContactForm />

          <div className="space-y-3">
            <div className="relative aspect-[16/10] overflow-hidden bg-shell">
              <Image
                src="/images/rooms/outdoor-living.jpg"
                alt="The DODOX showroom-style terrace setting"
                fill
                sizes="(max-width: 1024px) 100vw, 45vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/60 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <p className="text-[9px] uppercase tracking-[0.18em] text-ivory/70">
                  Nyarutarama · Kigali
                </p>
                <p className="mt-1 font-display text-xl text-ivory">
                  The DODOX showroom
                </p>
              </div>
            </div>

            <div className="border border-line/60 bg-parchment p-5">
              <h2 className="font-display text-xl text-ink">Atelier details</h2>
              <ul className="mt-4 space-y-3.5 text-[12px] text-ink-soft/85">
                <li className="flex gap-3">
                  <MapPin size={15} strokeWidth={1.4} className="mt-0.5 shrink-0 text-bronze" />
                  <div>
                    <p className="font-medium text-ink">Showroom</p>
                    <p className="mt-0.5 text-muted">{siteConfig.contact.showroomAddress}</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <Clock size={15} strokeWidth={1.4} className="mt-0.5 shrink-0 text-bronze" />
                  <div>
                    <p className="font-medium text-ink">Opening hours</p>
                    <p className="mt-0.5 text-muted">{siteConfig.contact.showroomHours}</p>
                    <p className="mt-0.5 text-[10px] text-muted/70">
                      Sample hours — confirm before publishing.
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <Phone size={15} strokeWidth={1.4} className="mt-0.5 shrink-0 text-bronze" />
                  <div>
                    <p className="font-medium text-ink">Telephone</p>
                    <a
                      href={siteConfig.contact.phoneHref}
                      className="mt-0.5 block text-muted transition-colors hover:text-bronze"
                    >
                      {siteConfig.contact.phone}
                    </a>
                  </div>
                </li>
                <li className="flex gap-3">
                  <Mail size={15} strokeWidth={1.4} className="mt-0.5 shrink-0 text-bronze" />
                  <div>
                    <p className="font-medium text-ink">Email</p>
                    <a
                      href={`mailto:${siteConfig.contact.email}`}
                      className="mt-0.5 block text-muted transition-colors hover:text-bronze"
                    >
                      {siteConfig.contact.email}
                    </a>
                  </div>
                </li>
              </ul>

              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonStyles({ className: "mt-4 w-full" })}
              >
                <MessageCircle size={13} strokeWidth={1.5} />
                Message on WhatsApp
              </a>
              <p className="mt-2 text-center text-[9px] text-muted">
                Opens WhatsApp with a pre-filled message using the configured
                demonstration number.
              </p>
            </div>

            <div className="border border-line/60 bg-shell/45 p-4">
              <p className="text-[9px] uppercase tracking-[0.14em] text-muted">
                Concierge note
              </p>
              <p className="mt-1.5 text-[11px] leading-relaxed text-ink-soft/80">
                For a faster response about a specific piece, include its name and
                your preferred configuration. For commissions, room dimensions and
                photographs are helpful.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="shipping" className="scroll-mt-24 border-y border-line/60 bg-shell/35 py-14">
        <div className="container-shell grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
          <div>
            <p className="eyebrow">Delivery & shipping</p>
            <h2 className="mt-2 display-title">How pieces reach you</h2>
            <p className="mt-4 max-w-md text-[13px] leading-relaxed text-ink-soft/85">
              In Kigali, white-glove delivery, placement and assembly are
              coordinated directly by the atelier. Outside Kigali, delivery is
              arranged with a specialist partner and quoted after review. All
              delivery terms shown here are demonstration placeholders.
            </p>
          </div>
          <div>
            <Accordion
              items={[
                {
                  title: "Kigali white-glove delivery",
                  defaultOpen: true,
                  content:
                    "Sample service includes room-of-choice placement, assembly, levelling and packaging removal. Timing is confirmed by the concierge after the order request is reviewed.",
                },
                {
                  title: "Regional delivery in Rwanda",
                  content:
                    "Regional delivery is quoted separately. The atelier coordinates a specialist courier and shares tracking details once arrangements are confirmed. No live courier integration exists in this demo.",
                },
                {
                  title: "Lead times",
                  content:
                    "In-stock pieces display a sample dispatch window. Made-to-order pieces show an indicative production lead time; final timing is confirmed in writing by the atelier.",
                },
                {
                  title: "Inspection on arrival",
                  content:
                    "Please inspect pieces with the delivery team present. Any concern can be recorded with the concierge and reviewed by the atelier.",
                },
              ]}
            />
          </div>
        </div>
      </section>

      <ServiceStrip />
    </>
  );
}
