import { cn, formatRwf } from "@/lib/utils";

export function Price({
  value,
  compareAt,
  size = "md",
  className,
  showBadge = false,
}: {
  value: number;
  compareAt?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
  showBadge?: boolean;
}) {
  const discount =
    compareAt && compareAt > value
      ? Math.round(((compareAt - value) / compareAt) * 100)
      : 0;

  const valueClass = {
    sm: "text-[13px]",
    md: "text-[15px]",
    lg: "font-display text-[30px] leading-none sm:text-[36px]",
  }[size];

  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-3 gap-y-1", className)}>
      <span
        className={cn(
          "text-ink",
          size === "lg" ? "font-display" : "font-medium tracking-[0.01em]",
          valueClass,
        )}
      >
        {formatRwf(value)}
      </span>
      {compareAt && compareAt > value ? (
        <span className="text-[12px] text-muted line-through">
          {formatRwf(compareAt)}
        </span>
      ) : null}
      {showBadge && discount > 0 ? (
        <span className="bg-peach px-2 py-1 text-[9px] font-medium uppercase tracking-[0.12em] text-peach-ink">
          Save {discount}%
        </span>
      ) : null}
    </div>
  );
}
