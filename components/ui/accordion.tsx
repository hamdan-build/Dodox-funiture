import type { ReactNode } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function Accordion({
  items,
  className,
}: {
  items: { title: string; content: ReactNode; defaultOpen?: boolean }[];
  className?: string;
}) {
  return (
    <div className={cn("divide-y divide-line border-y border-line", className)}>
      {items.map((item) => (
        <details key={item.title} className="group" open={item.defaultOpen}>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-left [&::-webkit-details-marker]:hidden">
            <span className="font-display text-lg text-ink sm:text-xl">
              {item.title}
            </span>
            <Plus
              size={16}
              strokeWidth={1.4}
              className="shrink-0 text-bronze transition-transform duration-300 group-open:rotate-45"
              aria-hidden="true"
            />
          </summary>
          <div className="pb-6 pr-8 text-[14px] leading-relaxed text-ink-soft/85">
            {item.content}
          </div>
        </details>
      ))}
    </div>
  );
}
