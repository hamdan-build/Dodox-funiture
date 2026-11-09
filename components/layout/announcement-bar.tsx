import Link from "next/link";
import { Sparkles } from "lucide-react";
import { siteConfig } from "@/data/site";

export function AnnouncementBar() {
  return (
    <div className="bg-ink text-ivory">
      <div className="container-shell flex h-9 items-center justify-center gap-3 text-center sm:h-10">
        <Sparkles
          size={11}
          strokeWidth={1.4}
          className="hidden shrink-0 text-taupe sm:block"
          aria-hidden="true"
        />
        <p className="truncate text-[8.5px] uppercase tracking-[0.2em] text-ivory/90 sm:text-[10px] sm:tracking-[0.24em]">
          <span className="hidden sm:inline">{siteConfig.announcement[0]}</span>
          <span className="sm:hidden">Complimentary Kigali white-glove delivery</span>
        </p>
        <span className="hidden h-3 w-px bg-ivory/25 md:block" aria-hidden="true" />
        <Link
          href="/contact"
          className="hidden shrink-0 text-[10px] uppercase tracking-[0.2em] text-ivory/70 transition-colors hover:text-ivory md:block"
        >
          Visit the Nyarutarama showroom
        </Link>
      </div>
    </div>
  );
}
