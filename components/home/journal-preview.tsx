import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import { journalPosts } from "@/data/journal";
import { formatDate } from "@/lib/utils";

export function JournalPreview() {
  const posts = journalPosts.slice(0, 3);

  return (
    <section className="border-t border-line/60 bg-parchment py-16 sm:py-20 lg:py-24">
      <div className="container-shell">
        <SectionHeading
          eyebrow="The DODOX journal"
          title="Notes from the Atelier"
          description="Material studies, room-making and the slow work of living with well-made things."
          action={
            <Link href="/journal" className="link-underline text-[10px]">
              All journal entries
              <ArrowRight size={12} strokeWidth={1.5} />
            </Link>
          }
        />

        <div className="mt-9 grid gap-6 md:grid-cols-3">
          {posts.map((post) => (
            <article key={post.slug} className="group">
              <Link href={`/journal/${post.slug}`} className="block">
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-shell">
                  <Image
                    src={post.image}
                    alt={post.alt}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                </div>
                <div className="mt-4">
                  <p className="flex items-center gap-2 text-[9px] uppercase tracking-[0.16em] text-muted">
                    <span className="text-bronze">{post.category}</span>
                    <span className="h-2.5 w-px bg-line" aria-hidden="true" />
                    {formatDate(post.date, { day: "numeric", month: "short" })}
                  </p>
                  <h3 className="mt-2 font-display text-[22px] leading-snug text-ink transition-colors group-hover:text-bronze">
                    {post.title}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-[12px] leading-relaxed text-muted">
                    {post.excerpt}
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-[9px] uppercase tracking-[0.16em] text-ink-soft">
                    {post.readTime}
                    <ArrowRight
                      size={11}
                      strokeWidth={1.5}
                      className="transition-transform duration-300 group-hover:translate-x-1"
                    />
                  </span>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
