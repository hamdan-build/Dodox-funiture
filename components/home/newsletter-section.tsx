import { NewsletterForm } from "@/components/forms/newsletter-form";
import { siteConfig } from "@/data/site";

export function NewsletterSection() {
  return (
    <section className="container-shell py-14 sm:py-16 lg:py-20">
      <div className="grid gap-8 border border-line/60 bg-sand/45 px-6 py-10 sm:px-10 sm:py-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-16">
        <div>
          <p className="eyebrow">The atelier private list</p>
          <h2 className="mt-3 display-title max-w-md">
            Stay in the Presence of Fine Design
          </h2>
          <p className="mt-3 max-w-md text-[13px] leading-relaxed text-ink-soft/75">
            Join the private list for seasonal releases, atelier notes and
            invitations to view new collections at the {siteConfig.contact.city}{" "}
            showroom.
          </p>
        </div>
        <NewsletterForm variant="panel" />
      </div>
    </section>
  );
}
