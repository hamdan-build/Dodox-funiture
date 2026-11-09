import { BadgeCheck, Star } from "lucide-react";
import { StarRating } from "@/components/ui/star-rating";
import { getReviewsForProduct, reviewHistogram } from "@/data/reviews";
import type { Product } from "@/types";

export function ProductReviews({ product }: { product: Product }) {
  const reviews = getReviewsForProduct(product.slug);
  const histogram = reviewHistogram(reviews);
  const average = reviews.length
    ? reviews.reduce((total, review) => total + review.rating, 0) / reviews.length
    : product.rating ?? 0;

  return (
    <section className="container-shell py-14 sm:py-16 lg:py-20">
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12">
        <div>
          <p className="eyebrow">Verified owners · sample data</p>
          <h2 className="mt-2 display-title">Client Impressions</h2>
          {reviews.length ? (
            <div className="mt-4">
              <div className="flex items-center gap-3">
                <span className="font-display text-4xl text-ink">
                  {average.toFixed(1)}
                </span>
                <div>
                  <StarRating rating={average} showValue={false} size={13} />
                  <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-muted">
                    From {reviews.length} sample review
                    {reviews.length === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
              <p className="mt-4 max-w-sm text-[12px] leading-relaxed text-muted">
                The reviews below are illustrative content created for design
                review. Replace with moderated, verified buyer feedback before
                launch.
              </p>
            </div>
          ) : (
            <p className="mt-4 max-w-sm text-[12px] leading-relaxed text-muted">
              No verified reviews have been published for this piece yet. The
              atelier can share references and previous commission details on
              request.
            </p>
          )}
        </div>

        <div className="space-y-5">
          {reviews.length ? (
            <>
              <div className="border border-line/60 bg-parchment p-5">
                <div className="space-y-2.5">
                  {histogram.map((row) => (
                    <div key={row.star} className="flex items-center gap-3">
                      <span className="w-8 text-[10px] text-muted">{row.star} star</span>
                      <div className="h-1.5 flex-1 bg-shell">
                        <div
                          className="h-full bg-bronze"
                          style={{ width: `${row.percentage}%` }}
                        />
                      </div>
                      <span className="w-5 text-right text-[10px] tabular-nums text-muted">
                        {row.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {reviews.slice(0, 2).map((review) => (
                  <figure
                    key={review.id}
                    className="flex flex-col border border-line/60 bg-parchment p-5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex gap-0.5" aria-label={`${review.rating} out of 5`}>
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Star
                            key={index}
                            size={10}
                            strokeWidth={1.3}
                            className={
                              index < review.rating
                                ? "fill-bronze text-bronze"
                                : "fill-transparent text-taupe"
                            }
                          />
                        ))}
                      </span>
                      <span className="text-[9px] text-muted">{review.date}</span>
                    </div>
                    <h3 className="mt-3 font-display text-[18px] leading-snug text-ink">
                      “{review.title}”
                    </h3>
                    <blockquote className="mt-2 flex-1 text-[11.5px] leading-relaxed text-ink-soft/80">
                      {review.body}
                    </blockquote>
                    <figcaption className="mt-4 flex items-center justify-between gap-2 border-t border-line/70 pt-3">
                      <div>
                        <p className="text-[10px] font-medium text-ink">{review.author}</p>
                        <p className="text-[9px] text-muted">
                          Verified buyer · {review.location}
                        </p>
                      </div>
                      {review.tag ? (
                        <span className="inline-flex items-center gap-1 bg-shell px-1.5 py-1 text-[8px] uppercase tracking-[0.08em] text-ink/70">
                          <BadgeCheck size={9} strokeWidth={1.6} className="text-bronze" />
                          {review.tag}
                        </span>
                      ) : null}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </>
          ) : (
            <div className="border border-dashed border-line bg-parchment p-8 text-center">
              <p className="font-display text-xl text-ink">Reviews pending verification</p>
              <p className="mx-auto mt-2 max-w-sm text-[12px] leading-relaxed text-muted">
                This demonstration catalogue does not include verified reviews for
                every piece. The atelier can arrange a showroom viewing or share
                references directly.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
