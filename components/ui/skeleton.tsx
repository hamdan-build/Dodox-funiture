import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse bg-sand/50", className)}
      aria-hidden="true"
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="border border-line/50 bg-parchment p-3">
      <Skeleton className="aspect-[4/5] w-full" />
      <div className="space-y-2 py-4">
        <Skeleton className="h-2.5 w-16" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

export function PageLoading({ label = "Preparing the collection" }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 px-6 text-center">
      <span className="h-10 w-10 animate-spin rounded-full border border-line border-t-bronze" />
      <p className="eyebrow">{label}</p>
    </div>
  );
}
