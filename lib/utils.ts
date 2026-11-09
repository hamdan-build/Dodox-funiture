import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRwf(value: number, withSuffix = true): string {
  const formatted = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(Math.round(value));
  return withSuffix ? `${formatted} RWF` : formatted;
}

export function formatRwfShort(value: number): string {
  if (value >= 1000000) {
    const millions = value / 1000000;
    return `${Number.isInteger(millions) ? millions : millions.toFixed(1)}M RWF`;
  }
  if (value >= 1000) return `${Math.round(value / 1000)}K RWF`;
  return formatRwf(value);
}

export function formatDate(value: string, options?: Intl.DateTimeFormatOptions) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    ...options,
  }).format(date);
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function truncate(value: string, length = 120) {
  return value.length > length ? `${value.slice(0, length).trimEnd()}…` : value;
}

export function absoluteUrl(path = "") {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://dodox-furniture.netlify.app").replace(
    /\/$/,
    "",
  );
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function toNumber(value: string | null | undefined, fallback: number) {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
