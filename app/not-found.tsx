import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="container-shell py-16 sm:py-24">
      <h1 className="sr-only">Page not found</h1>
      <EmptyState
        icon={<Compass size={22} strokeWidth={1.3} />}
        title="This room does not exist"
        description="The page you are looking for may have moved, or the piece may no longer be part of the collection. The atelier can help you find something close."
        action="Explore the collection"
        actionHref="/shop"
        secondary={
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/"
              className="text-[10px] uppercase tracking-[0.14em] text-bronze underline decoration-line underline-offset-4"
            >
              Return home
            </Link>
            <Link
              href="/contact"
              className="text-[10px] uppercase tracking-[0.14em] text-bronze underline decoration-line underline-offset-4"
            >
              Ask the concierge
            </Link>
          </div>
        }
      />
      <div className="mx-auto mt-8 max-w-md text-center">
        <Link href="/custom-atelier" className={buttonStyles({ variant: "light" })}>
          Begin a bespoke commission
        </Link>
      </div>
    </div>
  );
}
