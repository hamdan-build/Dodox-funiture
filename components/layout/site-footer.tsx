import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { NewsletterForm } from "@/components/forms/newsletter-form";
import { Logo } from "@/components/ui/logo";
import { footerNav, siteConfig, whatsappLink } from "@/data/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-shell/50">
      <div className="container-shell pb-24 pt-14 sm:pt-16 lg:pb-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1.4fr] lg:gap-8">
          <div>
            <Logo />
            <p className="mt-5 max-w-xs text-[12px] leading-[1.85] text-ink-soft/80">
              A considered house of furniture for modern Rwandan homes. Sample
              pieces are drawn for this demonstration storefront and imagined as
              handcrafted in Kigali.
            </p>
            <ul className="mt-6 space-y-2.5 text-[12px] text-ink-soft/80">
              <li className="flex items-start gap-2.5">
                <MapPin size={13} strokeWidth={1.4} className="mt-0.5 shrink-0 text-bronze" />
                {siteConfig.contact.showroomAddress}
              </li>
              <li>
                <a
                  href={siteConfig.contact.phoneHref}
                  className="flex items-center gap-2.5 transition-colors hover:text-bronze"
                >
                  <Phone size={13} strokeWidth={1.4} className="shrink-0 text-bronze" />
                  {siteConfig.contact.phone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${siteConfig.contact.email}`}
                  className="flex items-center gap-2.5 transition-colors hover:text-bronze"
                >
                  <Mail size={13} strokeWidth={1.4} className="shrink-0 text-bronze" />
                  {siteConfig.contact.email}
                </a>
              </li>
            </ul>
          </div>

          {footerNav.map((column) => (
            <nav
              key={column.title}
              aria-label={column.title}
            >
              <h2 className="font-display text-[17px] text-ink">{column.title}</h2>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="text-[11.5px] leading-relaxed text-ink-soft/75 transition-colors hover:text-bronze"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div>
            <h2 className="font-display text-[17px] text-ink">
              Atelier Journal &amp; Releases
            </h2>
            <p className="mt-3 text-[11.5px] leading-relaxed text-ink-soft/75">
              Receive private invitations to seasonal previews and limited
              editions.
            </p>
            <NewsletterForm className="mt-4" />
            <div className="mt-6 border-t border-line pt-4">
              <p className="text-[9px] uppercase tracking-[0.16em] text-muted">
                Concierge
              </p>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1.5 inline-block text-[11.5px] text-ink-soft underline decoration-line underline-offset-4 transition-colors hover:text-bronze"
              >
                Message the atelier on WhatsApp
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-line pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[10px] uppercase tracking-[0.12em] text-muted">
              © {new Date().getFullYear()} DODOX Furniture. All rights reserved.
              Kigali, Rwanda.
            </p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[9px] uppercase tracking-[0.16em] text-muted">
              <Link href="/about" className="transition-colors hover:text-bronze">
                Architectural Journey
              </Link>
              <span className="h-3 w-px bg-line" aria-hidden="true" />
              <Link href="/about" className="transition-colors hover:text-bronze">
                Ethical Forestry
              </Link>
              <span className="h-3 w-px bg-line" aria-hidden="true" />
              <Link href="/contact" className="transition-colors hover:text-bronze">
                Kigali Showroom
              </Link>
            </div>
          </div>
          <p className="mt-4 max-w-3xl text-[10px] leading-relaxed text-muted/80">
            {siteConfig.demoNotice} Business details, imagery and product claims
            shown here are placeholders and require verification before launch.
          </p>
        </div>
      </div>
    </footer>
  );
}
