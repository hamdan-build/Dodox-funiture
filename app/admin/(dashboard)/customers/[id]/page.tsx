"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, MapPin, MessageSquarePlus } from "lucide-react";
import { adminFetch, ClientApiError } from "@/components/admin/api-client";
import {
  adminDarkBtn,
  adminInputClass,
  AdminPageHeader,
  StatusBadge,
} from "@/components/admin/ui";
import { formatRwf } from "@/lib/utils";
import { useUiStore } from "@/store/ui";

interface CustomerDetail {
  customer: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    city: string | null;
    district: string | null;
    orderCount: number;
    confirmedOrderCount: number;
    totalRequestedAmount: number;
    confirmedSpendAmount: number;
    acceptsMarketing: boolean;
    isActive: boolean;
    createdAt: string;
  };
  addresses: {
    id: string;
    label: string;
    recipientName: string;
    phone: string;
    city: string;
    district: string;
    addressLine: string;
    landmark: string | null;
    isDefault: boolean;
  }[];
  orders: {
    id: string;
    reference: string;
    status: string;
    itemCount: number;
    totalAmount: number;
    createdAt: string;
  }[];
  atelierEnquiries: {
    id: string;
    reference: string;
    furnitureType: string;
    status: string;
    createdAt: string;
  }[];
  notes: {
    id: string;
    note: string;
    createdAt: string;
    authorEmail: string | null;
  }[];
}

export default function AdminCustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const pushToast = useUiStore((s) => s.pushToast);
  const [data, setData] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [acceptsMarketing, setAcceptsMarketing] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch<CustomerDetail>(
        `/api/admin/customers/${params.id}`,
      );
      setData(res);
      setFirstName(res.customer.firstName);
      setLastName(res.customer.lastName);
      setPhone(res.customer.phone);
      setCity(res.customer.city ?? "");
      setDistrict(res.customer.district ?? "");
      setAcceptsMarketing(res.customer.acceptsMarketing);
    } catch (err) {
      pushToast({
        title: "Could not load client profile",
        description:
          err instanceof ClientApiError ? err.message : "Network error",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [params.id, pushToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await adminFetch<CustomerDetail>(
        `/api/admin/customers/${params.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            firstName,
            lastName,
            phone,
            city: city || null,
            district: district || null,
            acceptsMarketing,
          }),
        },
      );
      setData(updated);
      pushToast({
        title: "Client profile updated",
        variant: "success",
      });
    } catch (err) {
      pushToast({
        title: "Update failed",
        description:
          err instanceof ClientApiError ? err.message : "Could not save",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    setSaving(true);
    try {
      const updated = await adminFetch<CustomerDetail>(
        `/api/admin/customers/${params.id}`,
        {
          method: "POST",
          body: JSON.stringify({ note: noteText }),
        },
      );
      setData(updated);
      setNoteText("");
      pushToast({
        title: "Concierge note saved",
        variant: "success",
      });
    } catch (err) {
      pushToast({
        title: "Could not add note",
        description:
          err instanceof ClientApiError ? err.message : "Check permissions",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="py-12 text-center text-[13px] text-muted">
        Loading client profile...
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/admin/customers"
        className="mb-4 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft size={13} /> Back to Clients
      </Link>

      <AdminPageHeader
        eyebrow={`Client Profile · ${data.customer.email}`}
        title={`${data.customer.firstName} ${data.customer.lastName}`}
        description={`Confirmed Spend: ${formatRwf(data.customer.confirmedSpendAmount)} across ${data.customer.confirmedOrderCount} confirmed order(s) · Total Requested: ${formatRwf(data.customer.totalRequestedAmount)}`}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="border border-line bg-parchment p-5">
            <h2 className="font-display text-2xl text-ink">Order Requests</h2>
            {!data.orders.length ? (
              <p className="mt-3 text-[12px] text-muted">
                No order requests placed yet.
              </p>
            ) : (
              <div className="mt-4 divide-y divide-line/70">
                {data.orders.map((o) => (
                  <div
                    key={o.id}
                    className="flex items-center justify-between py-3 text-[12px]"
                  >
                    <div>
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="font-mono text-[12px] font-medium text-ink hover:text-bronze"
                      >
                        {o.reference}
                      </Link>
                      <p className="text-[11px] text-muted">
                        {new Date(o.createdAt).toLocaleDateString()} ·{" "}
                        {o.itemCount} item(s)
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono tabular-nums text-ink">
                        {formatRwf(o.totalAmount)}
                      </span>
                      <StatusBadge status={o.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border border-line bg-parchment p-5">
            <h2 className="font-display text-2xl text-ink">
              Saved Delivery Addresses
            </h2>
            {!data.addresses.length ? (
              <p className="mt-3 text-[12px] text-muted">
                No delivery addresses on file.
              </p>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {data.addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className="border border-line/80 bg-ivory p-3.5 text-[12px]"
                  >
                    <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-bronze">
                      <MapPin size={12} /> {addr.label}
                    </p>
                    <p className="mt-1 font-medium text-ink">
                      {addr.recipientName}
                    </p>
                    <p className="mt-0.5 text-ink-soft">{addr.addressLine}</p>
                    <p className="text-muted">
                      {addr.district}, {addr.city}
                    </p>
                    {addr.landmark ? (
                      <p className="mt-1 text-[11px] text-muted">
                        Landmark: {addr.landmark}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border border-line bg-parchment p-5">
            <h2 className="font-display text-2xl text-ink">
              Internal Concierge Notes
            </h2>
            <form onSubmit={handleAddNote} className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Record showroom swatch preferences, floor access notes, or VIP instructions..."
                className={`flex-1 ${adminInputClass}`}
              />
              <button
                type="submit"
                disabled={saving}
                className={`${adminDarkBtn} shrink-0`}
              >
                <MessageSquarePlus size={13} /> Add Note
              </button>
            </form>

            <div className="mt-4 space-y-2.5">
              {data.notes.map((n) => (
                <div
                  key={n.id}
                  className="border border-line/70 bg-ivory p-3 text-[12px]"
                >
                  <p className="text-ink">{n.note}</p>
                  <p className="mt-1 text-[10.5px] text-muted">
                    {n.authorEmail ?? "Concierge"} ·{" "}
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border border-line bg-parchment p-5">
          <h2 className="font-display text-2xl text-ink">Edit Client Details</h2>
          <form onSubmit={handleSaveProfile} className="mt-4 space-y-3.5">
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.14em] text-muted">
                First Name
              </span>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={`mt-1 ${adminInputClass}`}
              />
            </label>
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.14em] text-muted">
                Last Name
              </span>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={`mt-1 ${adminInputClass}`}
              />
            </label>
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.14em] text-muted">
                Phone
              </span>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={`mt-1 ${adminInputClass}`}
              />
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <label className="block">
                <span className="text-[10px] uppercase tracking-[0.14em] text-muted">
                  City
                </span>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className={`mt-1 ${adminInputClass}`}
                />
              </label>
              <label className="block">
                <span className="text-[10px] uppercase tracking-[0.14em] text-muted">
                  District
                </span>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className={`mt-1 ${adminInputClass}`}
                />
              </label>
            </div>

            <label className="flex items-center gap-2 pt-1 text-[12px] text-ink">
              <input
                type="checkbox"
                checked={acceptsMarketing}
                onChange={(e) => setAcceptsMarketing(e.target.checked)}
                className="accent-bronze"
              />
              Opted in to Private Viewings & Journal dispatches
            </label>

            <button
              type="submit"
              disabled={saving}
              className={`${adminDarkBtn} mt-2 w-full`}
            >
              Save Profile
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
