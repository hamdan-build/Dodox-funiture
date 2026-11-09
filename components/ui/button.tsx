import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant =
  | "primary"
  | "dark"
  | "outline"
  | "light"
  | "ghost"
  | "link";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 font-medium uppercase tracking-[0.16em] transition-all duration-300 disabled:pointer-events-none disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bronze";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-bronze text-ivory hover:bg-bronze-dark shadow-[0_1px_0_rgba(0,0,0,0.04)]",
  dark: "bg-ink text-ivory hover:bg-olive",
  outline:
    "border border-ink/25 bg-transparent text-ink hover:border-ink hover:bg-ink hover:text-ivory",
  light:
    "border border-line bg-parchment text-ink hover:border-taupe hover:bg-shell",
  ghost: "bg-transparent text-ink hover:bg-shell",
  link: "bg-transparent px-0 text-ink underline decoration-line underline-offset-4 hover:decoration-ink",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-[10px]",
  md: "h-11 px-6 text-[10px] sm:text-[11px]",
  lg: "h-[52px] px-8 text-[11px]",
};

export function buttonStyles({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn(base, variants[variant], variant === "link" ? "" : sizes[size], className);
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonStyles({ variant, size, className })}
      {...props}
    />
  );
}
