import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Breadcrumbs({
  items,
  className,
  tone = "light",
}: {
  items: { label: string; href?: string }[];
  className?: string;
  tone?: "light" | "dark";
}) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex flex-wrap items-center gap-1.5", className)}
    >
      <Link
        href="/"
        className={cn(
          "text-[10px] uppercase tracking-[0.14em] transition-colors",
          tone === "dark"
            ? "text-ivory/60 hover:text-ivory"
            : "text-muted hover:text-bronze",
        )}
      >
        Home
      </Link>
      {items.map((item, index) => {
        const last = index === items.length - 1;
        return (
          <span key={`${item.label}-${index}`} className="flex items-center gap-1.5">
            <ChevronRight
              size={10}
              strokeWidth={1.5}
              className={tone === "dark" ? "text-ivory/35" : "text-line"}
              aria-hidden="true"
            />
            {item.href && !last ? (
              <Link
                href={item.href}
                className={cn(
                  "text-[10px] uppercase tracking-[0.14em] transition-colors",
                  tone === "dark"
                    ? "text-ivory/60 hover:text-ivory"
                    : "text-muted hover:text-bronze",
                )}
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={cn(
                  "text-[10px] uppercase tracking-[0.14em]",
                  tone === "dark" ? "text-ivory/90" : "text-ink/70",
                )}
                aria-current={last ? "page" : undefined}
              >
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
