"use client";

import { Heart } from "lucide-react";
import { useWishlistStore } from "@/store/wishlist";
import { useUiStore } from "@/store/ui";
import { useMounted } from "@/hooks/use-mounted";
import { cn } from "@/lib/utils";
import type { WishlistItem } from "@/types";

export function WishlistButton({
  item,
  className,
  size = 16,
  variant = "icon",
  label = "Save to wishlist",
}: {
  item: WishlistItem;
  className?: string;
  size?: number;
  variant?: "icon" | "inline";
  label?: string;
}) {
  const mounted = useMounted();
  const toggle = useWishlistStore((state) => state.toggle);
  const items = useWishlistStore((state) => state.items);
  const pushToast = useUiStore((state) => state.pushToast);

  const saved = mounted && items.some((entry) => entry.productId === item.productId);

  const handleClick = () => {
    const added = toggle(item);
    pushToast({
      title: added ? "Saved to your wishlist" : "Removed from your wishlist",
      description: added ? item.name : undefined,
      variant: "success",
    });
  };

  if (variant === "inline") {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          "inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-ink-soft transition-colors hover:text-bronze",
          className,
        )}
        aria-pressed={saved}
      >
        <Heart
          size={size}
          strokeWidth={1.4}
          className={saved ? "fill-bronze text-bronze" : ""}
        />
        {saved ? "Saved to Wishlist" : label}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${item.name} from wishlist` : `${label}: ${item.name}`}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-full border border-line/80 bg-parchment/90 text-ink backdrop-blur-sm transition-all hover:border-bronze hover:text-bronze",
        className,
      )}
    >
      <Heart
        size={size}
        strokeWidth={1.4}
        className={saved ? "fill-bronze text-bronze" : ""}
      />
    </button>
  );
}
