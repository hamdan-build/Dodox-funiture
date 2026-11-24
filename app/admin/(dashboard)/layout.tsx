import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { getAuthenticatedAdmin } from "@/lib/server/auth/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Atelier Operations · DODOX Admin",
  robots: { index: false, follow: false },
};

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    redirect("/admin/login");
  }

  return (
    <AdminShell
      admin={{
        id: admin.id,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        roles: admin.roles,
        roleNames: admin.roleNames,
        permissions: admin.permissions,
      }}
    >
      {children}
    </AdminShell>
  );
}
