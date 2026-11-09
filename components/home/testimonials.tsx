import Link from "next/link";
import { ArrowRight, Quote } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import { StarRating } from "@/components/ui/star-rating";
import { testimonials } from "@/data/journal";

export function Testimonials() {
  return (
    <section className="container-shell py-16 sm:py-20 lg:py-24">
      <SectionHeading
        eyebrow="Illustrative collector stories"
        title="Collector Stories & Reviews"
        action={
          <Link href="/journal" className="link-underline hidden text-[10px] sm:inline-flex">
            Read the journal
            <ArrowRight size={12} strokeWidth={1.5} />
          </Link>
        }
      />

      <div className="mt-9 grid gap-3 md:grid-cols-3">
        {testimonials.map((testimonial) => (
          <figure
            key={testimonial.id}
            className="flex flex-col border border-line/70 bg-parchment p-5 sm:p-6"
          >
            <div className="flex items-start justify-between">
              <StarRating rating={5} showValue={false} size={11} />
              <Quote size={16} strokeWidth={1.2} className="text-taupe" />
            </div>
            <blockquote className="mt-4 flex-1 font-display text-[18px] leading-[1.45] text-ink sm:text-[20px]">
              “{testimonial.quote}”
            </blockquote>
            <figcaption className="mt-6 flex items-center gap-3 border-t border-line/70 pt-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-peach text-[10px] font-medium text-peach-ink">
                {testimonial.initials}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[11px] font-medium text-ink">
                  {testimonial.author}
                </p>
                <p className="truncate text-[10px] text-muted">
                  {testimonial.location} · {testimonial.piece}
                </p>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>

      <p className="mt-5 text-[10px] leading-relaxed text-muted/80">
        Sample testimonials included to demonstrate the review interface. Replace
        with verified, attributed customer feedback before launch.
      </p>
    </section>
  );
}
