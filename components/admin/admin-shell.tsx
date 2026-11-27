"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BarChart3,
  Bell,
  Boxes,
  ChevronRight,
  Compass,
  ExternalLink,
  FileText,
  FolderTree,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  MessageSquare,
  Package,
  Search,
  Settings,
  Shield,
  ShoppingBag,
  Tag,
  Users,
  X,
} from "lucide-react";
import { apiRequest } from "@/components/admin/api-client";
import type { PermissionKey } from "@/lib/server/permissions/definitions";
import { cn, formatRwf, initials } from "@/lib/utils";
import { useUiStore } from "@/store/ui";

export interface AdminProfileSummary {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  roleNames: string[];
  permissions: PermissionKey[];
}

interface NavGroup {
  title: string;
  items: {
    label: string;
    href: string;
    icon: typeof LayoutDashboard;
    permission?: PermissionKey;
  }[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
      {
        label: "Reports & Analytics",
        href: "/admin/reports",
        icon: BarChart3,
        permission: "reports.read",
      },
    ],
  },
  {
    title: "Commerce",
    items: [
      {
        label: "Order Requests",
        href: "/admin/orders",
        icon: ShoppingBag,
        permission: "orders.read",
      },
      {
        label: "Products",
        href: "/admin/products",
        icon: Package,
        permission: "products.read",
      },
      {
        label: "Categories & Collections",
        href: "/admin/categories",
        icon: FolderTree,
        permission: "categories.manage",
      },
      {
        label: "Inventory & Stock",
        href: "/admin/inventory",
        icon: Boxes,
        permission: "inventory.manage",
      },
      {
        label: "Customers",
        href: "/admin/customers",
        icon: Users,
        permission: "customers.read",
      },
      {
        label: "Discounts & Coupons",
        href: "/admin/promotions",
        icon: Tag,
        permission: "promotions.manage",
      },
    ],
  },
  {
    title: "Concierge & Marketing",
    items: [
      {
        label: "Atelier Enquiries",
        href: "/admin/enquiries/atelier",
        icon: Compass,
        permission: "enquiries.manage",
      },
      {
        label: "Contact Messages",
        href: "/admin/enquiries/contact",
        icon: MessageSquare,
        permission: "enquiries.manage",
      },
      {
        label: "Newsletter List",
        href: "/admin/newsletter",
        icon: Mail,
        permission: "enquiries.manage",
      },
    ],
  },
  {
    title: "Content & Assets",
    items: [
      {
        label: "Journal & Site Content",
        href: "/admin/content",
        icon: FileText,
        permission: "content.manage",
      },
      {
        label: "Media Library (R2)",
        href: "/admin/media",
        icon: ImageIcon,
        permission: "media.manage",
      },
    ],
  },
  {
    title: "Administration",
    items: [
      {
        label: "Website Settings",
        href: "/admin/settings",
        icon: Settings,
        permission: "settings.manage",
      },
      {
        label: "Staff & Audit Logs",
        href: "/admin/staff",
        icon: Shield,
        permission: "staff.manage",
      },
    ],
  },
];

interface NotificationItem {
  id: string;
  category: string;
  title: string;
  body: string;
  href: string | null;
  isRead: boolean;
  createdAt: string;
}

interface SearchResults {
  orders: {
    id: string;
    reference: string;
    customerFirstName: string;
    customerLastName: string;
    status: string;
    totalAmount: number;
  }[];
  products: {
    id: string;
    name: string;
    slug: string;
    sku: string;
    basePrice: number;
  }[];
  customers: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  }[];
  enquiries: {
    id: string;
    reference: string;
    name: string;
    furnitureType: string;
  }[];
}

export function AdminShell({
  admin,
  children,
}: {
  admin: AdminProfileSummary;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const pushToast = useUiStore((s) => s.pushToast);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const isSuper = admin.roles.includes("super_admin");
  const canAccess = (perm?: PermissionKey) =>
    !perm || isSuper || admin.permissions.includes(perm);

  useEffect(() => {
    setMobileOpen(false);
    setNotifOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    let cancelled = false;
    apiRequest<{ notifications: NotificationItem[]; unreadCount: number }>(
      "/api/admin/notifications",
    )
      .then((res) => {
        if (!cancelled) {
          setNotifications(res.notifications);
          setUnreadCount(res.unreadCount);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  useEffect(() => {
    const q = searchTerm.trim();
    if (q.length < 2) {
      setSearchResults(null);
      return;
    }
    const timer = window.setTimeout(() => {
      apiRequest<SearchResults>(
        `/api/admin/search?q=${encodeURIComponent(q)}`,
      )
        .then((data) => {
          setSearchResults(data);
          setSearchOpen(true);
        })
        .catch(() => undefined);
    }, 220);
    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  const handleMarkAllRead = async () => {
    try {
      await apiRequest("/api/admin/notifications", {
        method: "PATCH",
        body: JSON.stringify({ markAll: true }),
      });
      setNotifications((list) => list.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await apiRequest("/api/admin/auth/logout", { method: "POST" });
      pushToast({
        title: "Signed out",
        description: "Your admin session has been closed.",
        variant: "info",
      });
      router.push("/admin/login");
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  };

  const isActiveLink = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  const segments = pathname.split("/").filter(Boolean);

  const renderSidebarContent = () => (
    <div className="flex h-full flex-col bg-ink text-ivory">
      <div className="flex h-16 items-center justify-between border-b border-ivory/10 px-5">
        <Link href="/admin" className="flex flex-col">
          <span className="font-display text-xl tracking-[0.14em] text-ivory">
            DODOX
          </span>
          <span className="text-[8.5px] uppercase tracking-[0.26em] text-taupe">
            Atelier Operations
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="flex h-8 w-8 items-center justify-center border border-ivory/15 text-ivory/80 transition-colors hover:border-bronze hover:bg-ivory/10 hover:text-ivory active:bg-ivory/15 lg:hidden"
          aria-label="Close sidebar"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-5">
        {NAV_GROUPS.map((group) => {
          const visibleItems = group.items.filter((item) =>
            canAccess(item.permission),
          );
          if (visibleItems.length === 0) return null;
          return (
            <div key={group.title}>
              <p className="mb-1.5 px-2.5 text-[9px] font-medium uppercase tracking-[0.22em] text-ivory/45">
                {group.title}
              </p>
              <ul className="space-y-0.5">
                {visibleItems.map((item) => {
                  const active = isActiveLink(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-2.5 px-2.5 py-2 text-[12px] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bronze",
                          active
                            ? "bg-bronze font-medium text-ivory hover:bg-bronze-dark hover:text-ivory active:bg-bronze-dark"
                            : "text-ivory/80 hover:bg-ivory/10 hover:text-ivory active:bg-ivory/15",
                        )}
                      >
                        <item.icon size={15} strokeWidth={1.5} />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-ivory/10 p-4">
        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-between border border-ivory/15 bg-ivory/5 px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-ivory/80 transition-colors duration-200 hover:border-bronze/70 hover:bg-ivory/10 hover:text-ivory active:bg-ivory/15"
        >
          <span>Public Storefront</span>
          <ExternalLink size={12} />
        </Link>
        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-[12px] font-medium text-ivory">
              {admin.firstName} {admin.lastName}
            </p>
            <p className="truncate text-[10px] text-taupe">
              {admin.roleNames[0] ?? "Staff"}
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex h-8 w-8 shrink-0 items-center justify-center border border-ivory/15 text-ivory/80 transition-colors duration-200 hover:border-bronze hover:bg-ivory/10 hover:text-ivory active:bg-ivory/15 disabled:opacity-50"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f4efe5] text-ink">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">
        {renderSidebarContent()}
      </aside>

      {/* Mobile Sidebar Drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-ink/60"
          />
          <div className="relative h-full w-72 max-w-[85vw]">
            {renderSidebarContent()}
          </div>
        </div>
      ) : null}

      <div className="flex min-h-screen flex-col lg:pl-64">
        {/* Sticky Top Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-line bg-parchment/95 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="flex h-9 w-9 items-center justify-center border border-line bg-ivory text-ink transition-colors duration-200 hover:border-bronze hover:bg-shell hover:text-ink active:bg-sand lg:hidden"
              aria-label="Open navigation"
            >
              <Menu size={17} />
            </button>

            {/* Breadcrumb */}
            <nav
              aria-label="Admin breadcrumb"
              className="hidden items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-muted sm:flex"
            >
              {segments.map((seg, index) => {
                const href = "/" + segments.slice(0, index + 1).join("/");
                const isLast = index === segments.length - 1;
                return (
                  <span key={href} className="flex items-center gap-1.5">
                    {index > 0 ? <ChevronRight size={11} /> : null}
                    {isLast ? (
                      <span className="font-medium text-ink">
                        {seg.replace(/-/g, " ")}
                      </span>
                    ) : (
                      <Link
                        href={href}
                        className="transition-colors hover:text-bronze"
                      >
                        {seg.replace(/-/g, " ")}
                      </Link>
                    )}
                  </span>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Global Quick Search */}
            <div className="relative">
              <div className="flex h-9 w-44 items-center gap-2 border border-line bg-ivory px-2.5 transition-colors focus-within:border-bronze focus-within:bg-parchment sm:w-64">
                <Search size={13} className="shrink-0 text-muted" />
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => {
                    if (searchResults) setSearchOpen(true);
                  }}
                  placeholder="Search orders, pieces, clients…"
                  className="w-full bg-transparent text-[11.5px] text-ink placeholder:text-muted/60 focus:outline-none"
                  aria-label="Global admin search"
                />
                {searchTerm ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm("");
                      setSearchOpen(false);
                    }}
                    className="text-muted transition-colors hover:text-ink"
                    aria-label="Clear search"
                  >
                    <X size={12} />
                  </button>
                ) : null}
              </div>

              {searchOpen && searchResults ? (
                <div className="absolute right-0 top-11 z-50 w-80 border border-line bg-parchment p-3 shadow-xl sm:w-96">
                  <div className="flex items-center justify-between border-b border-line/70 pb-2">
                    <span className="text-[9.5px] uppercase tracking-[0.16em] text-muted">
                      Quick jump results
                    </span>
                    <button
                      type="button"
                      onClick={() => setSearchOpen(false)}
                      className="px-1.5 py-0.5 text-[10px] text-muted transition-colors hover:bg-shell hover:text-ink"
                    >
                      Close
                    </button>
                  </div>

                  <div className="max-h-80 space-y-3 overflow-y-auto pt-2 text-[12px]">
                    {searchResults.orders.length > 0 ? (
                      <div>
                        <p className="text-[9px] uppercase tracking-[0.14em] text-bronze">
                          Orders
                        </p>
                        {searchResults.orders.map((ord) => (
                          <Link
                            key={ord.id}
                            href={`/admin/orders/${ord.id}`}
                            className="mt-1 flex items-center justify-between px-1.5 py-1 text-ink transition-colors hover:bg-shell hover:text-ink"
                          >
                            <span>
                              {ord.reference} · {ord.customerFirstName}{" "}
                              {ord.customerLastName}
                            </span>
                            <span className="text-[11px] text-muted">
                              {formatRwf(ord.totalAmount)}
                            </span>
                          </Link>
                        ))}
                      </div>
                    ) : null}

                    {searchResults.products.length > 0 ? (
                      <div>
                        <p className="text-[9px] uppercase tracking-[0.14em] text-bronze">
                          Products
                        </p>
                        {searchResults.products.map((prod) => (
                          <Link
                            key={prod.id}
                            href={`/admin/products/${prod.id}`}
                            className="mt-1 flex items-center justify-between px-1.5 py-1 text-ink transition-colors hover:bg-shell hover:text-ink"
                          >
                            <span className="truncate">{prod.name}</span>
                            <span className="text-[11px] text-muted">
                              {prod.sku}
                            </span>
                          </Link>
                        ))}
                      </div>
                    ) : null}

                    {searchResults.customers.length > 0 ? (
                      <div>
                        <p className="text-[9px] uppercase tracking-[0.14em] text-bronze">
                          Customers
                        </p>
                        {searchResults.customers.map((c) => (
                          <Link
                            key={c.id}
                            href={`/admin/customers/${c.id}`}
                            className="mt-1 block px-1.5 py-1 text-ink transition-colors hover:bg-shell hover:text-ink"
                          >
                            {c.firstName} {c.lastName} · {c.email}
                          </Link>
                        ))}
                      </div>
                    ) : null}

                    {searchResults.enquiries.length > 0 ? (
                      <div>
                        <p className="text-[9px] uppercase tracking-[0.14em] text-bronze">
                          Atelier Enquiries
                        </p>
                        {searchResults.enquiries.map((e) => (
                          <Link
                            key={e.id}
                            href="/admin/enquiries/atelier"
                            className="mt-1 block px-1.5 py-1 text-ink transition-colors hover:bg-shell hover:text-ink"
                          >
                            {e.reference} · {e.name} ({e.furnitureType})
                          </Link>
                        ))}
                      </div>
                    ) : null}

                    {searchResults.orders.length === 0 &&
                    searchResults.products.length === 0 &&
                    searchResults.customers.length === 0 &&
                    searchResults.enquiries.length === 0 ? (
                      <p className="py-4 text-center text-[11.5px] text-muted">
                        No matching records for “{searchTerm}”.
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen((o) => !o)}
                aria-expanded={notifOpen}
                className="relative flex h-9 w-9 items-center justify-center border border-line bg-ivory text-ink transition-colors duration-200 hover:border-bronze hover:bg-shell hover:text-ink active:bg-sand"
                aria-label="Notifications"
              >
                <Bell size={15} />
                {unreadCount > 0 ? (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-bronze px-1 text-[9px] font-semibold text-ivory">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                ) : null}
              </button>

              {notifOpen ? (
                <div className="absolute right-0 top-11 z-50 w-80 border border-line bg-parchment p-4 shadow-xl sm:w-96">
                  <div className="flex items-center justify-between border-b border-line pb-2.5">
                    <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink">
                      Notifications
                    </p>
                    {unreadCount > 0 ? (
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        className="text-[10px] text-bronze hover:underline"
                      >
                        Mark all read
                      </button>
                    ) : null}
                  </div>
                  <div className="max-h-72 divide-y divide-line/60 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="py-6 text-center text-[11.5px] text-muted">
                        No admin notifications yet.
                      </p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={cn(
                            "py-2.5 text-[11.5px]",
                            !n.isRead && "bg-ivory/70 px-2 -mx-2",
                          )}
                        >
                          {n.href ? (
                            <Link
                              href={n.href}
                              className="font-medium text-ink hover:text-bronze"
                            >
                              {n.title}
                            </Link>
                          ) : (
                            <p className="font-medium text-ink">{n.title}</p>
                          )}
                          <p className="mt-0.5 text-[11px] text-muted">
                            {n.body}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Staff Initials Badge */}
            <div className="hidden items-center gap-2 border border-line bg-ivory px-2.5 py-1.5 md:flex">
              <span className="flex h-6 w-6 items-center justify-center bg-bronze text-[10px] font-medium text-ivory">
                {initials(`${admin.firstName} ${admin.lastName}`)}
              </span>
              <span className="text-[11px] font-medium text-ink">
                {admin.firstName}
              </span>
            </div>
          </div>
        </header>

        {/* Main Workspace Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
