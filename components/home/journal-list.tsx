"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { journalCategories, journalPosts } from "@/data/journal";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function JournalList() {
  const [category, setCategory] = useState<(typeof journalCategories)[number]>("All");
  const featured = journalPosts.find((post) => post.featured) ?? journalPosts[0];

  const posts = useMemo(() => {
    const list =
      category === "All"
        ? journalPosts
        : journalPosts.filter((post) => post.category === category);
    return list;
  }, [category]);

  return (
    <>
      <section className="container-shell pb-10 pt-6 sm:pt-10">
        <div className="grid items-stretch gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Link
            href={`/journal/${featured.slug}`}
            className="group relative isolate min-h-[340px] overflow-hidden bg-shell sm:min-h-[420px] lg:order-1"
          >
            <Image
              src={featured.image}
              alt={featured.alt}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 60vw"
              className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/25 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
              <p className="text-[9px] uppercase tracking-[0.2em] text-ivory/70">
                Featured · {featured.category}
              </p>
              <h2 className="mt-2 max-w-lg font-display text-[28px] leading-tight text-ivory sm:text-[36px]">
                {featured.title}
              </h2>
              <p className="mt-2 max-w-md text-[11.5px] leading-relaxed text-ivory/65">
                {featured.excerpt}
              </p>
              <span className="mt-4 inline-flex items-center gap-2 text-[9px] uppercase tracking-[0.16em] text-ivory">
                Read the story
                <ArrowRight size={11} strokeWidth={1.5} />
              </span>
            </div>
          </Link>

          <div className="flex flex-col justify-center border border-line/60 bg-parchment p-6 sm:p-8 lg:order-2">
            <p className="eyebrow">The DODOX journal</p>
            <h1 className="mt-2 display-title">
              Notes on material, room-making and slow living.
            </h1>
            <p className="mt-3 text-[12.5px] leading-relaxed text-muted">
              Editorial from the atelier: how pieces are drawn, how timber behaves
              and how rooms come together over time.
            </p>
            <p className="mt-4 border-l border-bronze/40 pl-3 text-[10px] leading-relaxed text-muted">
              Articles are sample editorial content written for this demonstration
              storefront. Replace with approved brand copy before publication.
            </p>
          </div>
        </div>
      </section>

      <section className="container-shell pb-6">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar border-y border-line/60 py-3">
          {journalCategories.map((entry) => (
            <button
              key={entry}
              type="button"
              onClick={() => setCategory(entry)}
              className={cn(
                "shrink-0 px-3.5 py-2 text-[10px] uppercase tracking-[0.12em] transition-colors",
                category === entry
                  ? "bg-ink text-ivory"
                  : "bg-shell/70 text-ink-soft hover:bg-sand",
              )}
              aria-pressed={category === entry}
            >
              {entry}
            </button>
          ))}
        </div>
      </section>

      <section className="container-shell pb-16">
        {posts.length === 0 ? (
          <p className="py-12 text-center font-display text-2xl text-ink">
            No entries in this category yet.
          </p>
        ) : (
          <div className="grid gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <article key={post.slug} className="group">
                <Link href={`/journal/${post.slug}`}>
                  <div className="relative aspect-[4/3] overflow-hidden bg-shell">
                    <Image
                      src={post.image}
                      alt={post.alt}
                      fill
                      sizes="(max-width: 640px) 100vw, 33vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    />
                  </div>
                  <p className="mt-3.5 flex items-center gap-2 text-[9px] uppercase tracking-[0.14em] text-muted">
                    <span className="text-bronze">{post.category}</span>
                    <span className="h-2.5 w-px bg-line" />
                    {formatDate(post.date, { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                  <h2 className="mt-2 font-display text-[23px] leading-snug text-ink transition-colors group-hover:text-bronze">
                    {post.title}
                  </h2>
                  <p className="mt-2 line-clamp-3 text-[12px] leading-relaxed text-muted">
                    {post.excerpt}
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-[9px] uppercase tracking-[0.14em] text-ink-soft">
                    {post.readTime}
                    <ArrowRight size={11} strokeWidth={1.5} className="transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
