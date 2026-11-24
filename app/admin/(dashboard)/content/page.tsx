"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Edit2, ExternalLink, Plus, Trash2 } from "lucide-react";
import { adminFetch, ClientApiError } from "@/components/admin/api-client";
import {
  AdminEmptyState,
  AdminModal,
  AdminPageHeader,
  StatusBadge,
} from "@/components/admin/ui";
import { useUiStore } from "@/store/ui";

interface JournalRow {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  publishedDate: string;
  imageUrl: string;
  featured: boolean;
  status: string;
  body: { type: "paragraph" | "heading" | "quote"; text: string }[];
}

interface TestimonialRow {
  id: string;
  quote: string;
  author: string;
  location: string;
  pieceName: string;
  rating: number;
  isPublished: boolean;
}

interface FaqRow {
  id: string;
  category: string;
  question: string;
  answer: string;
  isPublished: boolean;
}

export default function AdminContentPage() {
  const pushToast = useUiStore((s) => s.pushToast);
  const [tab, setTab] = useState<"journal" | "testimonials" | "faqs">("journal");
  const [journal, setJournal] = useState<JournalRow[]>([]);
  const [testimonials, setTestimonials] = useState<TestimonialRow[]>([]);
  const [faqs, setFaqs] = useState<FaqRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Journal Modal
  const [journalModal, setJournalModal] = useState(false);
  const [editId, setEditId] = useState<string | undefined>();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Atelier Notes");
  const [readTime, setReadTime] = useState("5 min read");
  const [imageUrl, setImageUrl] = useState("/images/rooms/living-room.jpg");
  const [excerpt, setExcerpt] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [featured, setFeatured] = useState(false);
  const [status, setStatus] = useState<"published" | "draft">("published");
  const [saving, setSaving] = useState(false);

  // Testimonial Modal
  const [testModal, setTestModal] = useState(false);
  const [quote, setQuote] = useState("");
  const [author, setAuthor] = useState("");
  const [location, setLocation] = useState("Kigali");
  const [pieceName, setPieceName] = useState("");

  // FAQ Modal
  const [faqModal, setFaqModal] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch<{
        journalPosts: JournalRow[];
        testimonials: TestimonialRow[];
        faqs: FaqRow[];
      }>("/api/admin/content");
      setJournal(res.journalPosts);
      setTestimonials(res.testimonials);
      setFaqs(res.faqs);
    } catch (err) {
      pushToast({
        title: "Failed to load CMS content",
        description:
          err instanceof ClientApiError ? err.message : "Network error",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [pushToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const openNewJournal = () => {
    setEditId(undefined);
    setTitle("");
    setCategory("Atelier Notes");
    setReadTime("5 min read");
    setImageUrl("/images/rooms/living-room.jpg");
    setExcerpt("");
    setBodyText("");
    setFeatured(false);
    setStatus("published");
    setJournalModal(true);
  };

  const openEditJournal = (row: JournalRow) => {
    setEditId(row.id);
    setTitle(row.title);
    setCategory(row.category);
    setReadTime(row.readTime);
    setImageUrl(row.imageUrl);
    setExcerpt(row.excerpt);
    setBodyText(
      row.body
        .map((b) =>
          b.type === "heading"
            ? `## ${b.text}`
            : b.type === "quote"
              ? `> ${b.text}`
              : b.text,
        )
        .join("\n\n"),
    );
    setFeatured(row.featured);
    setStatus(row.status === "draft" ? "draft" : "published");
    setJournalModal(true);
  };

  const handleSaveJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminFetch("/api/admin/content", {
        method: "POST",
        body: JSON.stringify({
          entity: "journal",
          id: editId,
          title,
          category,
          readTime,
          imageUrl,
          excerpt,
          bodyText,
          featured,
          status,
        }),
      });
      pushToast({
        title: editId ? "Article updated" : "Article published",
        description: title,
        variant: "success",
      });
      setJournalModal(false);
      await load();
    } catch (err) {
      pushToast({
        title: "Save failed",
        description:
          err instanceof ClientApiError ? err.message : "Check article fields",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminFetch("/api/admin/content", {
        method: "POST",
        body: JSON.stringify({
          entity: "testimonial",
          quote,
          author,
          location,
          pieceName,
          isPublished: true,
        }),
      });
      pushToast({ title: "Collector story added", variant: "success" });
      setTestModal(false);
      setQuote("");
      setAuthor("");
      setPieceName("");
      await load();
    } catch (err) {
      pushToast({
        title: "Could not save testimonial",
        description: err instanceof ClientApiError ? err.message : "Error",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminFetch("/api/admin/content", {
        method: "POST",
        body: JSON.stringify({
          entity: "faq",
          question,
          answer,
          isPublished: true,
        }),
      });
      pushToast({ title: "FAQ published", variant: "success" });
      setFaqModal(false);
      setQuestion("");
      setAnswer("");
      await load();
    } catch (err) {
      pushToast({
        title: "Could not save FAQ",
        description: err instanceof ClientApiError ? err.message : "Error",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (entity: string, id: string) => {
    await adminFetch(`/api/admin/content?entity=${entity}&id=${id}`, {
      method: "DELETE",
    });
    pushToast({ title: "Item removed", variant: "info" });
    await load();
  };

  return (
    <div>
      <AdminPageHeader
        eyebrow="Module 11 · Editorial & Storefront CMS"
        title="Journal & Site Content"
        description="Publish DODOX Journal stories, collector testimonials, and showroom FAQs hydrated live on the storefront."
        actions={
          tab === "journal" ? (
            <button
              type="button"
              onClick={openNewJournal}
              className="inline-flex h-9 items-center gap-1.5 bg-ink px-4 text-[10.5px] font-medium uppercase tracking-[0.14em] text-canvas hover:bg-bronze"
            >
              <Plus size={13} /> New Journal Story
            </button>
          ) : tab === "testimonials" ? (
            <button
              type="button"
              onClick={() => setTestModal(true)}
              className="inline-flex h-9 items-center gap-1.5 bg-ink px-4 text-[10.5px] font-medium uppercase tracking-[0.14em] text-canvas hover:bg-bronze"
            >
              <Plus size={13} /> Add Testimonial
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setFaqModal(true)}
              className="inline-flex h-9 items-center gap-1.5 bg-ink px-4 text-[10.5px] font-medium uppercase tracking-[0.14em] text-canvas hover:bg-bronze"
            >
              <Plus size={13} /> Add FAQ
            </button>
          )
        }
      />

      <div className="mb-5 flex gap-1.5 border-b border-line pb-3">
        {(
          [
            ["journal", `Journal Articles (${journal.length})`],
            ["testimonials", `Collector Stories (${testimonials.length})`],
            ["faqs", `FAQs (${faqs.length})`],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={`h-8 px-3.5 text-[10.5px] uppercase tracking-[0.14em] ${
              tab === k
                ? "bg-ink text-canvas"
                : "border border-line bg-parchment text-ink-soft"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-12 text-center text-[13px] text-muted">
          Loading editorial archive...
        </div>
      ) : null}

      {!loading && tab === "journal" ? (
        <div className="overflow-x-auto border border-line bg-parchment">
          <table className="w-full border-collapse text-left text-[12px]">
            <thead>
              <tr className="border-b border-line bg-shell/60 text-[9.5px] uppercase tracking-[0.16em] text-muted">
                <th className="px-4 py-3">Story</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/70">
              {journal.map((post) => (
                <tr key={post.id} className="hover:bg-shell/35">
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{post.title}</p>
                    <p className="line-clamp-1 max-w-md text-[11px] text-muted">
                      {post.excerpt}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-[11.5px] text-bronze">
                    {post.category}
                  </td>
                  <td className="px-4 py-3 text-[11.5px] text-muted">
                    {post.publishedDate}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={post.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <Link
                        href={`/journal/${post.slug}`}
                        target="_blank"
                        className="inline-flex h-7 items-center border border-line bg-canvas px-2 text-muted hover:text-ink"
                      >
                        <ExternalLink size={11} />
                      </Link>
                      <button
                        type="button"
                        onClick={() => openEditJournal(post)}
                        className="inline-flex h-7 items-center gap-1 border border-line bg-canvas px-2.5 text-[10px] uppercase tracking-[0.13em] text-ink hover:border-ink"
                      >
                        <Edit2 size={11} /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete("journal", post.id)}
                        className="inline-flex h-7 items-center border border-line bg-canvas px-2 text-muted hover:text-[#8b3528]"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {!loading && tab === "testimonials" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t) => (
            <div key={t.id} className="border border-line bg-parchment p-5">
              <p className="font-display text-lg leading-snug text-ink">
                “{t.quote}”
              </p>
              <div className="mt-4 flex items-center justify-between border-t border-line/70 pt-3 text-[11px] text-muted">
                <span>
                  <strong className="text-ink">{t.author}</strong> ·{" "}
                  {t.location} ({t.pieceName})
                </span>
                <button
                  type="button"
                  onClick={() => void handleDelete("testimonial", t.id)}
                  className="text-muted hover:text-[#8b3528]"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {!loading && tab === "faqs" ? (
        <div className="space-y-3">
          {!faqs.length ? (
            <AdminEmptyState
              title="No FAQs published yet"
              description="Add showroom delivery, timber care, and commission FAQs."
            />
          ) : (
            faqs.map((f) => (
              <div
                key={f.id}
                className="flex items-start justify-between gap-4 border border-line bg-parchment p-4"
              >
                <div>
                  <p className="font-medium text-ink">{f.question}</p>
                  <p className="mt-1 text-[12px] text-muted">{f.answer}</p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleDelete("faq", f.id)}
                  className="text-muted hover:text-[#8b3528]"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))
          )}
        </div>
      ) : null}

      {/* Journal Modal */}
      <AdminModal
        open={journalModal}
        title={editId ? "Edit Journal Entry" : "Publish Journal Entry"}
        subtitle="Use blank lines between paragraphs, '## ' for headings, and '> ' for pull quotes."
        onClose={() => setJournalModal(false)}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSaveJournal} className="space-y-3.5">
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.14em] text-muted">
              Headline *
            </span>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 h-9 w-full border border-line bg-canvas px-3 text-[12.5px] text-ink"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.14em] text-muted">
                Category
              </span>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 h-9 w-full border border-line bg-canvas px-3 text-[12px] text-ink"
              />
            </label>
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.14em] text-muted">
                Read Time
              </span>
              <input
                type="text"
                value={readTime}
                onChange={(e) => setReadTime(e.target.value)}
                className="mt-1 h-9 w-full border border-line bg-canvas px-3 text-[12px] text-ink"
              />
            </label>
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.14em] text-muted">
                Status
              </span>
              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as "published" | "draft")
                }
                className="mt-1 h-9 w-full border border-line bg-canvas px-3 text-[12px] text-ink"
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </label>
          </div>
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.14em] text-muted">
              Cover Image URL (R2 Media Library or /images/...)
            </span>
            <input
              type="text"
              required
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="mt-1 h-9 w-full border border-line bg-canvas px-3 text-[12px] text-ink"
            />
          </label>
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.14em] text-muted">
              Editorial Excerpt *
            </span>
            <textarea
              rows={2}
              required
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              className="mt-1 w-full border border-line bg-canvas p-3 text-[12px] text-ink"
            />
          </label>
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.14em] text-muted">
              Article Body
            </span>
            <textarea
              rows={7}
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              className="mt-1 w-full border border-line bg-canvas p-3 text-[12px] leading-relaxed text-ink"
            />
          </label>
          <label className="flex items-center gap-2 text-[12px] text-ink">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
            />
            Feature at top of /journal
          </label>
          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <button
              type="button"
              onClick={() => setJournalModal(false)}
              className="h-9 border border-line px-4 text-[10.5px] uppercase tracking-[0.14em] text-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="h-9 bg-ink px-5 text-[10.5px] uppercase tracking-[0.14em] text-canvas hover:bg-bronze"
            >
              {saving ? "Saving..." : "Save Entry"}
            </button>
          </div>
        </form>
      </AdminModal>

      {/* Testimonial Modal */}
      <AdminModal
        open={testModal}
        title="Add Collector Story"
        onClose={() => setTestModal(false)}
      >
        <form onSubmit={handleSaveTestimonial} className="space-y-3.5">
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.14em] text-muted">
              Quote *
            </span>
            <textarea
              rows={3}
              required
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              className="mt-1 w-full border border-line bg-canvas p-3 text-[12px] text-ink"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.14em] text-muted">
                Collector Name *
              </span>
              <input
                type="text"
                required
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="mt-1 h-9 w-full border border-line bg-canvas px-3 text-[12px] text-ink"
              />
            </label>
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.14em] text-muted">
                Neighbourhood / City *
              </span>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="mt-1 h-9 w-full border border-line bg-canvas px-3 text-[12px] text-ink"
              />
            </label>
          </div>
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.14em] text-muted">
              Piece Collected *
            </span>
            <input
              type="text"
              required
              value={pieceName}
              onChange={(e) => setPieceName(e.target.value)}
              placeholder="Imanzi Bouclé Sofa"
              className="mt-1 h-9 w-full border border-line bg-canvas px-3 text-[12px] text-ink"
            />
          </label>
          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <button
              type="button"
              onClick={() => setTestModal(false)}
              className="h-9 border border-line px-4 text-[10.5px] uppercase tracking-[0.14em] text-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="h-9 bg-ink px-5 text-[10.5px] uppercase tracking-[0.14em] text-canvas hover:bg-bronze"
            >
              Publish Story
            </button>
          </div>
        </form>
      </AdminModal>

      {/* FAQ Modal */}
      <AdminModal
        open={faqModal}
        title="Add Showroom FAQ"
        onClose={() => setFaqModal(false)}
      >
        <form onSubmit={handleSaveFaq} className="space-y-3.5">
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.14em] text-muted">
              Question *
            </span>
            <input
              type="text"
              required
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="mt-1 h-9 w-full border border-line bg-canvas px-3 text-[12px] text-ink"
            />
          </label>
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.14em] text-muted">
              Answer *
            </span>
            <textarea
              rows={4}
              required
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="mt-1 w-full border border-line bg-canvas p-3 text-[12px] text-ink"
            />
          </label>
          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <button
              type="button"
              onClick={() => setFaqModal(false)}
              className="h-9 border border-line px-4 text-[10.5px] uppercase tracking-[0.14em] text-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="h-9 bg-ink px-5 text-[10.5px] uppercase tracking-[0.14em] text-canvas hover:bg-bronze"
            >
              Publish FAQ
            </button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
