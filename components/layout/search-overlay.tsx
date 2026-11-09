"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Search, X } from "lucide-react";
import { categories } from "@/data/categories";
import { searchProducts } from "@/data/products";
import { formatRwf } from "@/lib/utils";
import { useLockBodyScroll } from "@/hooks/use-lock-body-scroll";
import { useMounted } from "@/hooks/use-mounted";
import { useUiStore } from "@/store/ui";

const suggestions = ["Bouclé sofa", "Oak table", "Rattan", "Platform bed", "Wardrobe"];

export function SearchOverlay() {
  const open = useUiStore((state) => state.searchOpen);
  const setOpen = useUiStore((state) => state.setSearchOpen);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const mounted = useMounted();

  useLockBodyScroll(open);

  const results = useMemo(() => searchProducts(query, 5), [query]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    const timer = window.setTimeout(() => inputRef.current?.focus(), 80);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, setOpen]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;
      if (event.key === "/" && !isTyping) {
        event.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [setOpen]);

  if (!open) return null;

  const submit = (value: string) => {
    const term = value.trim();
    setOpen(false);
    router.push(term ? `/shop?q=${encodeURIComponent(term)}` : "/shop");
  };

  return (
    <div className="fixed inset-0 z-[75]" role="presentation">
      <button
        type="button"
        tabIndex={-1}
        aria-label="Close search"
        onClick={() => setOpen(false)}
        className="absolute inset-0 h-full w-full cursor-default bg-ink/50 backdrop-blur-[3px] animate-fade-in"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search the DODOX collection"
        className="relative mx-auto mt-0 max-h-[92vh] w-full overflow-y-auto bg-ivory shadow-[0_40px_80px_-40px_rgba(0,0,0,0.5)] animate-fade-up sm:mt-6 sm:max-w-3xl"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4 sm:px-7">
          <p className="eyebrow">Search the atelier</p>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-line transition-colors hover:bg-shell"
            aria-label="Close search"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            submit(query);
          }}
          className="px-5 pt-6 sm:px-7"
        >
          <div className="flex items-center gap-3 border-b border-ink/30 pb-3">
            <Search size={20} strokeWidth={1.3} className="text-bronze" />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search sofas, tables, timber, rooms…"
              className="w-full bg-transparent font-display text-xl text-ink placeholder:text-muted/60 focus:outline-none sm:text-2xl"
              aria-label="Search products"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="text-[10px] uppercase tracking-[0.14em] text-muted hover:text-ink"
              >
                Clear
              </button>
            ) : null}
          </div>
        </form>

        <div className="px-5 py-6 sm:px-7">
          {!query ? (
            <div className="grid gap-8 sm:grid-cols-2">
              <div>
                <p className="eyebrow mb-3">Suggested</p>
                <ul className="space-y-1.5">
                  {suggestions.map((suggestion) => (
                    <li key={suggestion}>
                      <button
                        type="button"
                        onClick={() => setQuery(suggestion)}
                        className="text-[13px] text-ink-soft transition-colors hover:text-bronze"
                      >
                        {suggestion}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="eyebrow mb-3">Browse rooms</p>
                <ul className="space-y-1.5">
                  {categories.map((category) => (
                    <li key={category.slug}>
                      <Link
                        href={`/shop?category=${category.slug}`}
                        onClick={() => setOpen(false)}
                        className="text-[13px] text-ink-soft transition-colors hover:text-bronze"
                      >
                        {category.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : results.length > 0 ? (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <p className="eyebrow">
                  {results.length} piece{results.length === 1 ? "" : "s"} found
                </p>
                <button
                  type="button"
                  onClick={() => submit(query)}
                  className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-bronze"
                >
                  View all results
                  <ArrowRight size={11} strokeWidth={1.5} />
                </button>
              </div>
              <ul className="divide-y divide-line/70">
                {results.map((product) => (
                  <li key={product.id}>
                    <Link
                      href={`/shop/${product.slug}`}
                      onClick={() => setOpen(false)}
                      className="group flex items-center gap-4 py-3"
                    >
                      <div className="relative h-16 w-14 shrink-0 overflow-hidden bg-shell">
                        <Image
                          src={product.images[0].src}
                          alt={product.images[0].alt}
                          fill
                          sizes="56px"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-display text-[17px] text-ink transition-colors group-hover:text-bronze">
                          {product.name}
                        </p>
                        <p className="truncate text-[11px] text-muted">
                          {product.subtitle}
                        </p>
                      </div>
                      <span className="shrink-0 text-[12px] text-ink-soft">
                        {formatRwf(product.price)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="py-10 text-center">
              <p className="font-display text-2xl text-ink">
                Nothing in the collection matches “{query}”.
              </p>
              <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-muted">
                Try a broader term, or ask the atelier about a bespoke commission.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="border border-line px-4 py-2.5 text-[10px] uppercase tracking-[0.14em] text-ink transition-colors hover:border-bronze"
                >
                  Clear search
                </button>
                <Link
                  href="/custom-atelier"
                  onClick={() => setOpen(false)}
                  className="bg-bronze px-4 py-2.5 text-[10px] uppercase tracking-[0.14em] text-ivory transition-colors hover:bg-bronze-dark"
                >
                  Request a bespoke piece
                </Link>
              </div>
            </div>
          )}

          {mounted ? (
            <p className="mt-6 border-t border-line pt-4 text-[10px] uppercase tracking-[0.14em] text-muted/70">
              Press Esc to close · Search is demo-filtered across the sample catalogue
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
