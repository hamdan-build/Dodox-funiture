"use client";

import { useCallback, useEffect, useState } from "react";
import { Save } from "lucide-react";
import { adminFetch, ClientApiError } from "@/components/admin/api-client";
import { AdminPageHeader } from "@/components/admin/ui";
import { useUiStore } from "@/store/ui";

interface SettingEntry {
  key: string;
  value: unknown;
  groupName: string;
  label: string;
  isPublic: boolean;
}

export default function AdminSettingsPage() {
  const pushToast = useUiStore((s) => s.pushToast);
  const [items, setItems] = useState<SettingEntry[]>([]);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch<{ items: SettingEntry[] }>(
        "/api/admin/settings",
      );
      setItems(res.items);
      const map: Record<string, string> = {};
      for (const s of res.items) {
        map[s.key] =
          typeof s.value === "string" ? s.value : JSON.stringify(s.value);
      }
      setDraft(map);
    } catch (err) {
      pushToast({
        title: "Failed to load settings",
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updates = items.map((item) => {
        const raw = draft[item.key] ?? "";
        let parsed: unknown = raw;
        if (typeof item.value === "number") {
          const n = Number(raw);
          parsed = Number.isFinite(n) ? Math.round(n) : item.value;
        } else if (typeof item.value === "boolean") {
          parsed = raw === "true";
        }
        return {
          key: item.key,
          value: parsed,
          groupName: item.groupName,
          label: item.label,
          isPublic: item.isPublic,
        };
      });

      await adminFetch("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify({ updates }),
      });

      pushToast({
        title: "Website settings saved",
        description: "Server pricing, VAT, and showroom configuration updated.",
        variant: "success",
      });
      await load();
    } catch (err) {
      pushToast({
        title: "Could not save settings",
        description:
          err instanceof ClientApiError ? err.message : "Check permissions",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const groups = Array.from(new Set(items.map((i) => i.groupName)));

  return (
    <div>
      <AdminPageHeader
        eyebrow="Module 14 · Business & Pricing Rules"
        title="Website Settings"
        description="Configure Kigali showroom details, VAT basis points (1800 = 18%), Care & Protection fee (RWF), and concierge contact endpoints."
      />

      {loading ? (
        <div className="py-12 text-center text-[13px] text-muted">
          Loading configuration...
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {groups.map((grp) => (
            <div key={grp} className="border border-line bg-parchment p-5">
              <h2 className="font-display text-2xl capitalize text-ink">
                {grp.replace(/_/g, " ")}
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {items
                  .filter((i) => i.groupName === grp)
                  .map((setting) => (
                    <label key={setting.key} className="block">
                      <span className="text-[10px] uppercase tracking-[0.14em] text-muted">
                        {setting.label}{" "}
                        <span className="font-mono text-[9.5px] text-bronze">
                          ({setting.key})
                        </span>
                      </span>
                      <input
                        type={typeof setting.value === "number" ? "number" : "text"}
                        value={draft[setting.key] ?? ""}
                        onChange={(e) =>
                          setDraft((prev) => ({
                            ...prev,
                            [setting.key]: e.target.value,
                          }))
                        }
                        className="mt-1.5 h-9 w-full border border-line bg-canvas px-3 text-[12.5px] text-ink"
                      />
                    </label>
                  ))}
              </div>
            </div>
          ))}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-10 items-center gap-2 bg-ink px-6 text-[10.5px] font-medium uppercase tracking-[0.16em] text-canvas hover:bg-bronze disabled:opacity-50"
            >
              <Save size={14} />
              {saving ? "Saving Configuration..." : "Save Website Settings"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
