import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  size = "default",
  onClick,
}: {
  className?: string;
  size?: "default" | "small";
  onClick?: () => void;
}) {
  return (
    <Link
      href="/"
      onClick={onClick}
      className={cn("group inline-flex flex-col items-start leading-none", className)}
      aria-label="DODOX Furniture — home"
    >
      <span
        className={cn(
          "font-display font-medium tracking-[0.22em] text-ink transition-colors group-hover:text-bronze",
          size === "small" ? "text-[19px]" : "text-[24px] sm:text-[28px]",
        )}
      >
        DODOX
      </span>
      <span
        className={cn(
          "mt-1 pl-[2px] font-sans uppercase tracking-[0.34em] text-muted",
          size === "small" ? "text-[6px]" : "text-[7px] sm:text-[8px]",
        )}
      >
        Furniture
      </span>
    </Link>
  );
}
