import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRating({
  rating,
  count,
  size = 12,
  className,
  showValue = true,
}: {
  rating: number;
  count?: number;
  size?: number;
  className?: string;
  showValue?: boolean;
}) {
  return (
    <span
      className={cn("inline-flex items-center gap-1.5", className)}
      aria-label={`Rated ${rating} out of 5${count ? ` from ${count} reviews` : ""}`}
    >
      <span className="flex items-center gap-0.5" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, index) => {
          const filled = index + 1 <= Math.round(rating);
          return (
            <Star
              key={index}
              width={size}
              height={size}
              strokeWidth={1.4}
              className={
                filled ? "fill-bronze text-bronze" : "fill-transparent text-taupe"
              }
            />
          );
        })}
      </span>
      {showValue ? (
        <span className="text-[11px] text-muted">
          {rating.toFixed(1)}
          {typeof count === "number" ? ` (${count})` : ""}
        </span>
      ) : null}
    </span>
  );
}
