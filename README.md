# DODOX Furniture

A production-quality **frontend storefront** for DODOX Furniture — a Kigali-based furniture house. Built with Next.js App Router, React, TypeScript, Tailwind CSS v4 and Zustand, and prepared for deployment on Netlify.

The experience covers the complete browsing journey: editorial homepage → catalogue with filters → product detail with live variant pricing → shopping bag → order request → confirmation → tracking, plus wishlist, a bespoke Atelier enquiry, brand, contact and journal pages.

> **Demonstration notice.** This is a frontend build. No payment provider is integrated, no order is sent to a backend, and all product prices, inventory, lead times, reviews and testimonials are sample content. Contact details, showroom hours and brand claims are placeholders pending verification. See [Content status](#content-status) for the full list.

---

## Quick start

```bash
npm install
cp .env.example .env.local   # optional — the site falls back to safe defaults
npm run dev                  # http://localhost:3000
```

Requires Node.js 20.9+ (developed on Node 22).

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Production build (Next.js) |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint (Next.js core-web-vitals + TypeScript rules) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run verify` | Headless checks for catalogue integrity, variant pricing, promos, VAT, filters, search and the order-request flow |

---

## Design system

Derived from the supplied Stitch references and consolidated into one coherent art direction.

| Token | Value | Use |
| --- | --- | --- |
| `ivory` | `#f7f2e8` | Page background |
| `parchment` | `#fbf8f1` | Cards, panels |
| `shell` | `#f1e9db` | Alternating sections, controls |
| `sand` | `#e7dac6` | Highlight bands, newsletter panel |
| `taupe` | `#c9b79c` | Swatches, subdued accents |
| `bronze` | `#7e5f3c` | Primary action, links, accents |
| `ink` | `#221e19` | Headings, primary text |
| `ink-soft` | `#4c443a` | Body text |
| `muted` | `#6f6453` | Secondary text (contrast-checked ≥ 4.7:1 on ivory/shell) |
| `olive` | `#3d3e32` | Atelier promotional band |
| `peach` | `#f6e1cc` | Badges, promotional chips |

**Typography**

- Display: **Cormorant Garamond** (400/500/600 + italic), self-hosted from `public/fonts` via `next/font/local`.
- Interface/body: **Inter** variable, self-hosted.
- Editorial uppercase eyebrows use `tracking-[0.24em]`; display headings use tight leading (`0.98–1.05`) and negative tracking.

**Layout** — `container-shell` (max 1480px, responsive gutters), generous section spacing (`py-16 → py-24`), 1px hairline borders, restrained shadows, no gradients beyond photographic overlays.

**Motion** — a single editorial easing curve, short fades/slides, image scale on hover, and full `prefers-reduced-motion` fallbacks.

---

## Architecture

```
app/
  layout.tsx                  Fonts, metadata, header/footer, drawers, toasts
  page.tsx                    Homepage
  shop/page.tsx               Catalogue (server shell + client filtering)
  shop/[slug]/page.tsx        Product detail (SSG per product)
  cart/page.tsx               Shopping bag
  checkout/page.tsx           Order request form
  checkout/confirmation/      Confirmation with generated reference
  wishlist/page.tsx           Saved pieces
  custom-atelier/page.tsx     Bespoke commission enquiry
  about, contact, journal, journal/[slug], track-order
  sitemap.ts, robots.ts, icon.svg, not-found, error, loading
components/
  layout/    Announcement bar, header + mega menu, mobile nav, search overlay,
             footer, mobile tab bar, breadcrumbs, service strip
  home/      Hero, curated spaces, featured pieces, atelier promo, craftsmanship,
             standard, testimonials, journal preview, newsletter
  catalog/   Product card, product grid, catalogue view, filter panel, wishlist view
  product/   Gallery, purchase panel (live pricing), blueprint, reviews, related
  cart/      Cart drawer, cart view
  checkout/  Checkout form + order confirmation
  forms/     Field primitives (RHF-ready), newsletter, contact, atelier, tracking
  ui/        Button, badge, price, stars, quantity stepper, drawer, accordion,
             empty state, skeleton, toast region, logo, wishlist button
data/        site config, categories, products, reviews, journal, testimonials
lib/         pricing, catalog filters, cart mapping, orders, validation, SEO, utils
store/       Zustand: cart, wishlist, UI (drawers/toasts)
hooks/       use-mounted, use-dialog (focus trap), use-lock-body-scroll
types/       Shared TypeScript models
public/      Fonts + optimised imagery
scripts/     verify-logic.ts (QA harness)
```

**Server-first.** Pages, layout and editorial sections are server components. Client components are limited to interaction: header/drawers, search, catalogue filtering, product configuration, cart, wishlist, checkout, forms and toasts.

---

## Key behaviour

### Shopping bag & wishlist
- Zustand stores with `persist` to LocalStorage (`dodox.cart.v1`, `dodox.wishlist.v1`).
- `skipHydration` + a `StoreHydrator` client component rehydrate after mount so server and first client render match — no hydration warnings.
- Cart lines are keyed by product **and** the full variant selection, so two configurations of the same piece stay separate.
- Quantity controls cap at 20 and remove lines at zero; "Save for later" moves a line into the wishlist.

### Variant pricing
- Every option carries a `priceDelta` in RWF. The product page recomputes the unit price, the compare-at price and the saving percentage live as options change; the add-to-bag price and the mobile sticky bar stay in sync.
- Cart, drawer, checkout and confirmation all use the same `lib/pricing.ts` calculations.

### Discounts & totals
- Demo codes live in `data/site.ts`: `WELCOMEKIGALI` (100,000 RWF off over 500,000 RWF) and `ATELIER10` (10% off).
- Validation covers unknown codes and minimum-subtotal rules; invalid attempts surface inline errors and toasts.
- Totals include optional atelier care protection (65,000 RWF), complimentary Kigali logistics and an 18% VAT-inclusive breakdown. VAT is display-only (`total × 18/118`) since prices are tax-inclusive.

### Order requests (no payments)
- Checkout collects customer + delivery details with React Hook Form and Zod, shows a final review, and submits via `lib/orders.ts`.
- A reference such as `DODO-7K2M9Q` is generated, the request is stored in LocalStorage, the cart is cleared and the user is routed to `/checkout/confirmation`.
- **No payment gateway, card fields or wallet integration exists anywhere in the codebase.** Copy throughout states that no payment is taken online.
- `submitOrderRequest()` is the single integration seam: replace the LocalStorage write + timeout with a real API call/email service and the UI keeps working.
- `/track-order` reads the same demo records, verifies the reference against the email **or** phone number, and shows a four-stage atelier timeline. Live courier/status events require a backend.

### Catalogue
- Filtering by category, material, price range, availability and seating capacity, plus in-page search.
- Sorting: featured, newest, price ascending/descending, name.
- Filters, search and sort are reflected in the URL (`/shop?category=living-room&material=Oak&sort=price-asc`), so homepage room links and shared URLs work; external URL changes are adopted by the client view.
- Desktop sticky filter rail, mobile bottom-sheet filter drawer, active filter chips, clear-all, empty state, and load-more paging.

### Forms
- React Hook Form + Zod for checkout, Atelier enquiry, contact, tracking and newsletter.
- Atelier form includes a local-only image attachment UI (object-URL previews, max 3) and a success state with a generated enquiry reference.
- All forms are explicitly labelled as demonstrations in the UI.

### Accessibility
- Semantic landmarks, one `h1` per page, skip link.
- Drawers/search are `role="dialog"` with `aria-modal`, Escape to close, focus moved in, focus trapped, and focus restored to the trigger.
- Body scroll lock with scrollbar compensation; `aria-pressed`/`aria-expanded`/`aria-current` on stateful controls; live region for toasts.
- Keyboard shortcut `/` opens search; product gallery, filters and quantity controls are fully keyboard operable.
- Contrast-checked muted text; visible 2px focus rings; reduced-motion support.

---

## Routes

| Route | Description |
| --- | --- |
| `/` | Editorial homepage: hero, curated rooms, featured pieces, atelier promo, craftsmanship, standard, testimonials, journal, newsletter |
| `/shop` | Catalogue with URL-synced filters, sorting, search, bespoke CTA, load more |
| `/shop/[slug]` | Product detail: gallery + lightbox, live variants, delivery/spec accordions, blueprint, reviews, related pieces |
| `/cart` | Bag with privilege progress, care add-on, promo code, order summary, recommendations |
| `/checkout` | Validated order request form with final review |
| `/checkout/confirmation` | Confirmation, reference, timeline, request summary |
| `/wishlist` | Saved pieces with move-to-bag and empty state |
| `/custom-atelier` | Bespoke commission hero, brief form with attachments, process and FAQ |
| `/about` | Brand story and principles — verified facts intentionally omitted |
| `/contact` | Contact form, showroom details, WhatsApp, shipping policy |
| `/journal`, `/journal/[slug]` | Editorial index with categories and article layout |
| `/track-order` | Reference + contact verification against demo orders |
| `/sitemap.xml`, `/robots.txt` | SEO endpoints |

`/shop/[slug]`, `/journal/[slug]` and all static pages are prerendered at build time; `/shop` is server-rendered so any filter URL resolves on first paint and refresh.

---

## Images

All photography is local under `public/images` and served through `next/image` (AVIF/WebP, responsive `sizes`, explicit alt text, graceful solid backgrounds).

- **AI-generated for this build:** the hero, five room scenes, atelier drafting bench, gallery sofa, and the sofa/coffee table catalogue shots, plus crops derived from them for the remaining pieces.
- **Third-party placeholders used strictly for demonstration:** `fluted-ash-console.jpg`, `karisimbi-wardrobe.jpg`, `ceramic-vessel.jpg`. These are low-resolution web product images; **replace with licensed brand photography before launch.**
- Product detail images reuse lifestyle crops where a dedicated studio shot does not exist (e.g. beds, dining, desk, terrace). No broken or hot-linked URLs remain.

Optimisation applied: progressive JPEG at quality 84, capped dimensions (900–1800px), metadata stripped.

---

## SEO

- Per-page titles and descriptions via `lib/seo.ts` (`title.absolute` prevents duplicated brand suffixes).
- Canonical URLs from `NEXT_PUBLIC_SITE_URL`, Open Graph and Twitter cards with a 1672×941 hero image.
- `Product` JSON-LD on product pages, `FurnitureStore` organisation JSON-LD site-wide.
- `sitemap.xml` (static routes + all products + journal), `robots.txt` disallowing cart, checkout, wishlist and tracking.
- Semantic headings, breadcrumb navigation on every inner page, descriptive alt text.
- Private/transactional routes are `noindex`.

---

## Netlify deployment

`netlify.toml` configures the official adapter:

```toml
[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "22"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

**Deploy**

1. Push the repository to GitHub/GitLab.
2. In Netlify: *Add new site → Import an existing project*, select the repo.
3. Netlify reads `netlify.toml`; no manual build settings are required.
4. Add environment variables (Site settings → Environment variables) from `.env.example`.
5. Deploy. The Next.js runtime handles SSR, ISR, image optimisation and dynamic routes.

**Post-deploy checks**

- Set `NEXT_PUBLIC_SITE_URL` to the real domain so canonicals, OG URLs and `sitemap.xml` are absolute and correct.
- Confirm direct navigation to a nested URL (e.g. `/shop/imanzi-sculptural-boucle-sofa`) and a hard refresh both return 200.
- Confirm image optimisation responds at `/_next/image?url=/images/...`.
- Replace the placeholder contact details and WhatsApp number.

### Environment variables

| Variable | Purpose | Fallback |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin for SEO/sitemap | `https://dodox-furniture.netlify.app` |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Digits-only WhatsApp number | `250788000000` |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Public email | `concierge@dodox.rw` |
| `NEXT_PUBLIC_CONTACT_PHONE` | Public telephone | `+250 788 000 000` |
| `NEXT_PUBLIC_SHOWROOM_ADDRESS` | Showroom address | `KG 9 Ave, Nyarutarama, Kigali, Rwanda` |
| `NEXT_PUBLIC_SHOWROOM_HOURS` | Opening hours | `Monday – Saturday, 09:00 – 19:00` |

---

## Content status

| Content | Status |
| --- | --- |
| Product names, categories, descriptions, dimensions, materials | Sample catalogue written for this build |
| Prices, compare-at prices, badges, availability, lead times | Illustrative RWF values — replace with atelier data |
| Ratings, reviews, testimonials | Clearly labelled sample content — replace with verified feedback |
| Journal articles | Demo editorial — replace with approved copy |
| Contact details, showroom hours, WhatsApp number | Placeholder configuration in `data/site.ts` / env |
| Founding year, certifications, sustainability credentials, team biographies | **Deliberately not invented**; add only once verified |
| Warranty and service commitments | Written as sample commitments pending confirmation |
| Imagery | AI-generated + three third-party placeholders (see [Images](#images)) |

All of this is centralised in `data/` and `lib/`; no page hard-codes product or business facts.

---

## QA performed

- `npm run typecheck` — clean.
- `npm run lint` — clean (no errors, no warnings).
- `npm run build` — production build succeeds; 41 routes generated (20 product pages, 4 journal pages, plus static routes).
- `npm run verify` — catalogue integrity, variant arithmetic, promo validation, VAT maths, filter/sort behaviour, search, related-product logic and the full order-request persistence flow all pass.
- Route sweep at mobile/desktop widths via SSR (all public routes 200; unknown route 404; transactional routes noindex).
- Verified every `/images/...` reference resolves on disk and the image optimiser returns AVIF.
- Verified direct URL access and refresh for nested product/journal routes.
- Manual responsive review at 360 / 390 / 768 / 1024 / 1440 / 1920 class breakpoints: navigation switches to a mobile header + tab bar below 1280px, the catalogue moves filters into a bottom sheet, product pages expose a sticky add-to-bag bar above the tab bar, and editorial sections reflow rather than merely shrink.

### Not verified in this environment
No headless browser was available in the build sandbox, so pixel-level screenshots could not be captured. Layouts were reviewed through the rendered markup and CSS, and the logic was exercised headlessly. Recommended final step before launch: a visual pass in Chrome/Safari at the breakpoints above and a real-device check of the drawers and sticky bars.

---

## What still requires backend integration

1. **Order requests** — replace `submitOrderRequest()` in `lib/orders.ts` with an API call / email service; persist orders server-side.
2. **Inventory & pricing** — move `data/products.ts` behind a CMS or commerce API; add real stock levels and lead times.
3. **Discounts** — validate promo codes server-side (currently demo codes in `data/site.ts`).
4. **Search** — swap the local `searchProducts` matcher for a hosted search index if the catalogue grows.
5. **Tracking** — connect real fulfilment statuses and courier events.
6. **Forms** — connect contact, Atelier and newsletter submissions to email/CRM endpoints; add spam protection.
7. **Analytics, consent, payments** — not present by design at this stage.

---

## License / usage

Code in this repository was produced for the DODOX Furniture storefront. Imagery is demo-only (see [Images](#images)); third-party placeholders must be replaced with licensed assets before any public launch.
