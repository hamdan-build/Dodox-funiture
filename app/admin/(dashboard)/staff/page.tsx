"use client";

import { useCallback, useEffect, useState } from "react";
import { KeyRound, Plus, Shield, UserCheck, UserX } from "lucide-react";
import { adminFetch, ClientApiError } from "@/components/admin/api-client";
import {
  AdminModal,
  AdminPageHeader,
  StatusBadge,
} from "@/components/admin/ui";
import { useUiStore } from "@/store/ui";

interface StaffMember {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  activeSessions: number;
  roles: { id: string; slug: string; name: string }[];
}

interface RoleInfo {
  id: string;
  slug: string;
  name: string;
  description: string;
  permissionCount: number;
}

interface AuditEntry {
  id: string;
  actorEmail: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  summary: string;
  createdAt: string;
}

interface LoginAttemptEntry {
  id: string;
  email: string;
  succeeded: boolean;
  reason: string | null;
  createdAt: string;
}

export default function AdminStaffAndAuditPage() {
  const pushToast = useUiStore((s) => s.pushToast);
  const [tab, setTab] = useState<"staff" | "roles" | "audit" | "logins">(
    "staff",
  );
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [roles, setRoles] = useState<RoleInfo[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [loginAttempts, setLoginAttempts] = useState<LoginAttemptEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Staff Modal
  const [createModal, setCreateModal] = useState(false);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [roleSlug, setRoleSlug] = useState("store_manager");
  const [saving, setSaving] = useState(false);

  // Edit / Password Reset Modal
  const [editTarget, setEditTarget] = useState<StaffMember | null>(null);
  const [editRole, setEditRole] = useState("store_manager");
  const [newPassword, setNewPassword] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch<{
        staff: StaffMember[];
        roles: RoleInfo[];
        auditLogs: AuditEntry[];
        loginAttempts: LoginAttemptEntry[];
      }>("/api/admin/staff");
      setStaff(res.staff);
      setRoles(res.roles);
      setAuditLogs(res.auditLogs);
      setLoginAttempts(res.loginAttempts);
    } catch (err) {
      pushToast({
        title: "Failed to load staff & security logs",
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminFetch("/api/admin/staff", {
        method: "POST",
        body: JSON.stringify({
          email,
          firstName,
          lastName,
          password,
          roleSlug,
        }),
      });
      pushToast({
        title: "Staff account created",
        description: `${email} (${roleSlug})`,
        variant: "success",
      });
      setCreateModal(false);
      setEmail("");
      setFirstName("");
      setLastName("");
      setPassword("");
      await load();
    } catch (err) {
      pushToast({
        title: "Creation failed",
        description:
          err instanceof ClientApiError ? err.message : "Check password rules",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (member: StaffMember) => {
    try {
      await adminFetch("/api/admin/staff", {
        method: "PATCH",
        body: JSON.stringify({
          userId: member.id,
          isActive: !member.isActive,
        }),
      });
      pushToast({
        title: member.isActive ? "Account suspended" : "Account reactivated",
        description: member.email,
        variant: "info",
      });
      await load();
    } catch (err) {
      pushToast({
        title: "Action blocked",
        description:
          err instanceof ClientApiError ? err.message : "Cannot update user",
        variant: "error",
      });
    }
  };

  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setSaving(true);
    try {
      await adminFetch("/api/admin/staff", {
        method: "PATCH",
        body: JSON.stringify({
          userId: editTarget.id,
          roleSlug: editRole,
          ...(newPassword.trim() ? { newPassword: newPassword.trim() } : {}),
        }),
      });
      pushToast({
        title: "Staff permissions updated",
        description: editTarget.email,
        variant: "success",
      });
      setEditTarget(null);
      setNewPassword("");
      await load();
    } catch (err) {
      pushToast({
        title: "Update failed",
        description:
          err instanceof ClientApiError ? err.message : "Could not update",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <AdminPageHeader
        eyebrow="Module 15 · Governance, RBAC & Security"
        title="Staff & Audit Logs"
        description="Provision staff accounts across 8 granular RBAC roles, rotate PBKDF2-SHA256 credentials, and inspect immutable operational audit logs."
        actions={
          <button
            type="button"
            onClick={() => setCreateModal(true)}
            className="inline-flex h-9 items-center gap-1.5 bg-ink px-4 text-[10.5px] font-medium uppercase tracking-[0.14em] text-canvas hover:bg-bronze"
          >
            <Plus size={13} /> Invite Staff Member
          </button>
        }
      />

      <div className="mb-5 flex flex-wrap gap-1.5 border-b border-line pb-3">
        {(
          [
            ["staff", `Staff Accounts (${staff.length})`],
            ["roles", `RBAC Role Matrix (${roles.length})`],
            ["audit", `Activity Audit Log (${auditLogs.length})`],
            ["logins", `Auth Events (${loginAttempts.length})`],
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
          Loading security directory...
        </div>
      ) : null}

      {!loading && tab === "staff" ? (
        <div className="overflow-x-auto border border-line bg-parchment">
          <table className="w-full border-collapse text-left text-[12px]">
            <thead>
              <tr className="border-b border-line bg-shell/60 text-[9.5px] uppercase tracking-[0.16em] text-muted">
                <th className="px-4 py-3">Staff Member</th>
                <th className="px-4 py-3">Assigned Role</th>
                <th className="px-4 py-3">Sessions</th>
                <th className="px-4 py-3">Last Sign-In</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Security</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/70">
              {staff.map((m) => (
                <tr key={m.id} className="hover:bg-shell/35">
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">
                      {m.firstName} {m.lastName}
                    </p>
                    <p className="text-[11px] text-muted">{m.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    {m.roles.map((r) => (
                      <span
                        key={r.id}
                        className="inline-flex items-center gap-1 border border-bronze/35 bg-shell/60 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-ink"
                      >
                        <Shield size={10} className="text-bronze" /> {r.name}
                      </span>
                    ))}
                  </td>
                  <td className="px-4 py-3 font-mono text-[11.5px] text-ink">
                    {m.activeSessions} active
                  </td>
                  <td className="px-4 py-3 text-[11px] text-muted">
                    {m.lastLoginAt
                      ? new Date(m.lastLoginAt).toLocaleString()
                      : "Never"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={m.isActive ? "active" : "inactive"} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setEditTarget(m);
                          setEditRole(m.roles[0]?.slug ?? "store_manager");
                          setNewPassword("");
                        }}
                        className="inline-flex h-7 items-center gap-1 border border-line bg-canvas px-2.5 text-[10px] uppercase tracking-[0.13em] text-ink hover:border-ink"
                      >
                        <KeyRound size={11} /> Role / Key
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleToggleActive(m)}
                        className="inline-flex h-7 items-center gap-1 border border-line bg-canvas px-2 text-[10px] uppercase tracking-[0.13em] text-muted hover:text-ink"
                        title={m.isActive ? "Suspend account" : "Reactivate"}
                      >
                        {m.isActive ? (
                          <UserX size={12} />
                        ) : (
                          <UserCheck size={12} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {!loading && tab === "roles" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {roles.map((r) => (
            <div key={r.id} className="border border-line bg-parchment p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-bronze">
                {r.slug}
              </p>
              <h3 className="mt-1 font-display text-xl text-ink">{r.name}</h3>
              <p className="mt-2 text-[12px] leading-relaxed text-muted">
                {r.description}
              </p>
              <p className="mt-4 border-t border-line/70 pt-3 font-mono text-[11px] text-ink">
                {r.permissionCount} granular permission(s)
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {!loading && tab === "audit" ? (
        <div className="overflow-x-auto border border-line bg-parchment">
          <table className="w-full border-collapse text-left text-[12px]">
            <thead>
              <tr className="border-b border-line bg-shell/60 text-[9.5px] uppercase tracking-[0.16em] text-muted">
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/70">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-shell/35">
                  <td className="px-4 py-2.5 text-[11px] tabular-nums text-muted">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[11px] text-ink">
                    {log.actorEmail ?? "system"}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[11px] text-bronze">
                    {log.action}
                  </td>
                  <td className="px-4 py-2.5 text-ink-soft">{log.summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {!loading && tab === "logins" ? (
        <div className="overflow-x-auto border border-line bg-parchment">
          <table className="w-full border-collapse text-left text-[12px]">
            <thead>
              <tr className="border-b border-line bg-shell/60 text-[9.5px] uppercase tracking-[0.16em] text-muted">
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Result</th>
                <th className="px-4 py-3">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/70">
              {loginAttempts.map((att) => (
                <tr key={att.id} className="hover:bg-shell/35">
                  <td className="px-4 py-2.5 text-[11px] tabular-nums text-muted">
                    {new Date(att.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[11.5px] text-ink">
                    {att.email}
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusBadge
                      status={att.succeeded ? "confirmed" : "rejected"}
                      label={att.succeeded ? "Success" : "Failed"}
                    />
                  </td>
                  <td className="px-4 py-2.5 text-[11.5px] text-muted">
                    {att.reason ?? "Authenticated session issued"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {/* Create Staff Modal */}
      <AdminModal
        open={createModal}
        title="Create Staff Account"
        subtitle="Password requires ≥12 characters with uppercase, lowercase, and a number or symbol."
        onClose={() => setCreateModal(false)}
      >
        <form onSubmit={handleCreate} className="space-y-3.5">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.14em] text-muted">
                First Name *
              </span>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="mt-1 h-9 w-full border border-line bg-canvas px-3 text-[12px] text-ink"
              />
            </label>
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.14em] text-muted">
                Last Name *
              </span>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="mt-1 h-9 w-full border border-line bg-canvas px-3 text-[12px] text-ink"
              />
            </label>
          </div>
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.14em] text-muted">
              Work Email *
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@dodox.rw"
              className="mt-1 h-9 w-full border border-line bg-canvas px-3 text-[12px] text-ink"
            />
          </label>
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.14em] text-muted">
              RBAC Role *
            </span>
            <select
              value={roleSlug}
              onChange={(e) => setRoleSlug(e.target.value)}
              className="mt-1 h-9 w-full border border-line bg-canvas px-3 text-[12px] text-ink"
            >
              {roles.map((r) => (
                <option key={r.slug} value={r.slug}>
                  {r.name} ({r.permissionCount} permissions)
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.14em] text-muted">
              Initial Strong Password *
            </span>
            <input
              type="password"
              required
              minLength={12}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 12 characters"
              className="mt-1 h-9 w-full border border-line bg-canvas px-3 text-[12px] text-ink"
            />
          </label>
          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <button
              type="button"
              onClick={() => setCreateModal(false)}
              className="h-9 border border-line px-4 text-[10.5px] uppercase tracking-[0.14em] text-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="h-9 bg-ink px-5 text-[10.5px] uppercase tracking-[0.14em] text-canvas hover:bg-bronze"
            >
              {saving ? "Provisioning..." : "Create Account"}
            </button>
          </div>
        </form>
      </AdminModal>

      {/* Edit Role / Password Modal */}
      <AdminModal
        open={Boolean(editTarget)}
        title={
          editTarget
            ? `Manage · ${editTarget.firstName} ${editTarget.lastName}`
            : "Manage Staff"
        }
        subtitle={editTarget?.email}
        onClose={() => setEditTarget(null)}
      >
        {editTarget ? (
          <form onSubmit={handleUpdateStaff} className="space-y-4">
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.14em] text-muted">
                Assigned Role
              </span>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
                className="mt-1 h-9 w-full border border-line bg-canvas px-3 text-[12px] text-ink"
              >
                {roles.map((r) => (
                  <option key={r.slug} value={r.slug}>
                    {r.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.14em] text-muted">
                Rotate Password (optional — revokes active sessions)
              </span>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Leave blank to keep current password"
                className="mt-1 h-9 w-full border border-line bg-canvas px-3 text-[12px] text-ink"
              />
            </label>
            <div className="flex justify-end gap-2 border-t border-line pt-4">
              <button
                type="button"
                onClick={() => setEditTarget(null)}
                className="h-9 border border-line px-4 text-[10.5px] uppercase tracking-[0.14em] text-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="h-9 bg-ink px-5 text-[10.5px] uppercase tracking-[0.14em] text-canvas hover:bg-bronze"
              >
                Save Security Changes
              </button>
            </div>
          </form>
        ) : null}
      </AdminModal>
    </div>
  );
}
