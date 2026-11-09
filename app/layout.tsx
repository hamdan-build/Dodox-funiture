import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { SearchOverlay } from "@/components/layout/search-overlay";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { StoreHydrator } from "@/components/store-hydrator";
import { ToastRegion } from "@/components/ui/toast-region";
import { siteConfig } from "@/data/site";
import { organizationJsonLd } from "@/lib/seo";

const inter = localFont({
  src: "../public/fonts/inter-var.woff2",
  variable: "--font-inter",
  display: "swap",
  weight: "100 900",
});

const cormorant = localFont({
  src: [
    {
      path: "../public/fonts/cormorant-garamond-latin-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/cormorant-garamond-latin-500-normal.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/cormorant-garamond-latin-600-normal.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../public/fonts/cormorant-garamond-latin-400-italic.woff2",
      weight: "400",
      style: "italic",
    },
    {
      path: "../public/fonts/cormorant-garamond-latin-500-italic.woff2",
      weight: "500",
      style: "italic",
    },
  ],
  variable: "--font-cormorant",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.name }],
  creator: siteConfig.name,
  keywords: [
    "furniture Kigali",
    "Rwanda furniture",
    "handcrafted furniture",
    "luxury furniture Rwanda",
    "DODOX Furniture",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: siteConfig.title,
    description: siteConfig.description,
    images: [
      {
        url: "/images/hero/hero-living-room.jpg",
        width: 1672,
        height: 941,
        alt: "A warm Kigali living room furnished with DODOX pieces",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
    images: ["/images/hero/hero-living-room.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
  category: "shopping",
};

export const viewport: Viewport = {
  themeColor: "#f7f2e8",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-RW" className={`${inter.variable} ${cormorant.variable}`}>
      <body>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-ink focus:px-4 focus:py-3 focus:text-[11px] focus:uppercase focus:tracking-[0.16em] focus:text-ivory"
        >
          Skip to content
        </a>
        <StoreHydrator />
        <AnnouncementBar />
        <SiteHeader />
        <main id="main-content" className="min-h-[60vh]">
          {children}
        </main>
        <SiteFooter />
        <MobileTabBar />
        <CartDrawer />
        <SearchOverlay />
        <MobileNav />
        <ToastRegion />
        <script
          type="application/ld+json"
          // Organization structured data for search engines.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </body>
    </html>
  );
}
