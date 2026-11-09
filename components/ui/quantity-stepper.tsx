"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 20,
  size = "md",
  label = "Quantity",
  className,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md";
  label?: string;
  className?: string;
}) {
  const buttonSize = size === "sm" ? "h-8 w-8" : "h-10 w-10";

  return (
    <div
      className={cn(
        "inline-flex items-center border border-line bg-parchment",
        className,
      )}
      role="group"
      aria-label={label}
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className={cn(
          buttonSize,
          "flex items-center justify-center text-ink transition-colors hover:bg-shell disabled:opacity-40",
        )}
        aria-label={label === "Quantity" ? "Decrease quantity" : `Decrease ${label}`}
      >
        <Minus size={13} strokeWidth={1.6} />
      </button>
      <span
        className={cn(
          "min-w-7 text-center text-[12px] tabular-nums text-ink",
          size === "sm" ? "px-1" : "px-2",
        )}
        aria-live="polite"
      >
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className={cn(
          buttonSize,
          "flex items-center justify-center text-ink transition-colors hover:bg-shell disabled:opacity-40",
        )}
        aria-label={label === "Quantity" ? "Increase quantity" : `Increase ${label}`}
      >
        <Plus size={13} strokeWidth={1.6} />
      </button>
    </div>
  );
}
