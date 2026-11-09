import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { NewsletterSection } from "@/components/home/newsletter-section";
import { getRelatedPosts, journalMap, journalPosts } from "@/data/journal";
import { buildMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/utils";

export function generateStaticParams() {
  return journalPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = journalMap[slug];
  if (!post) {
    return buildMetadata({
      title: "Journal entry not found",
      description: "This journal entry is no longer available.",
      path: `/journal/${slug}`,
      noIndex: true,
    });
  }
  return buildMetadata({
    title: post.title,
    description: post.excerpt,
    path: `/journal/${post.slug}`,
    image: post.image,
    type: "article",
  });
}

export default async function JournalEntryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = journalMap[slug];
  if (!post) notFound();

  const related = getRelatedPosts(slug, 3);

  return (
    <>
      <div className="container-shell pt-5">
        <Breadcrumbs
          items={[{ label: "Journal", href: "/journal" }, { label: post.title }]}
        />
      </div>

      <article className="container-shell pb-12 pt-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="eyebrow">
            {post.category} · {post.readTime}
          </p>
          <h1 className="mt-3 font-display text-[34px] leading-[1.08] text-ink sm:text-[48px]">
            {post.title}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-[14px] leading-relaxed text-ink-soft/80">
            {post.excerpt}
          </p>
          <p className="mt-4 text-[9px] uppercase tracking-[0.16em] text-muted">
            {formatDate(post.date)} · DODOX Atelier Editorial
          </p>
        </div>

        <div className="relative mx-auto mt-8 aspect-[16/9] w-full max-w-4xl overflow-hidden bg-shell">
          <Image
            src={post.image}
            alt={post.alt}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 900px"
            className="object-cover"
          />
        </div>

        <div className="mx-auto mt-9 max-w-2xl">
          <div className="prose-editorial">
            {post.body.map((block, index) => {
              if (block.type === "heading") {
                return <h2 key={index}>{block.text}</h2>;
              }
              if (block.type === "quote") {
                return <blockquote key={index}>{block.text}</blockquote>;
              }
              return <p key={index}>{block.text}</p>;
            })}
          </div>

          <div className="mt-8 border border-line/60 bg-shell/40 p-4 text-[10.5px] leading-relaxed text-muted">
            <strong className="font-medium text-ink">Sample editorial:</strong>{" "}
            this article was written as demonstration content for the storefront
            build and is not approved brand copy.
          </div>

          <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-line/70 pt-5">
            <Link
              href="/journal"
              className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-ink transition-colors hover:text-bronze"
            >
              <ArrowLeft size={12} strokeWidth={1.5} />
              All journal entries
            </Link>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-bronze"
            >
              Explore the collection
              <ArrowRight size={12} strokeWidth={1.5} />
            </Link>
          </div>
        </div>
      </article>

      <section className="border-y border-line/60 bg-parchment py-12">
        <div className="container-shell">
          <h2 className="font-display text-2xl text-ink">Continue reading</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-3">
            {related.map((entry) => (
              <Link key={entry.slug} href={`/journal/${entry.slug}`} className="group">
                <div className="relative aspect-[4/3] overflow-hidden bg-shell">
                  <Image
                    src={entry.image}
                    alt={entry.alt}
                    fill
                    sizes="33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                </div>
                <p className="mt-3 text-[9px] uppercase tracking-[0.14em] text-bronze">
                  {entry.category}
                </p>
                <h3 className="mt-1.5 font-display text-xl leading-snug text-ink group-hover:text-bronze">
                  {entry.title}
                </h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <NewsletterSection />
    </>
  );
}
