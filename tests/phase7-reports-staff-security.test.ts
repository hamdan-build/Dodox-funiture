import { beforeEach, describe, expect, it } from "vitest";
import { installTestCloudflareEnv } from "./helpers/sqlite-d1";
import { bootstrapFirstSuperAdmin } from "@/lib/server/auth/bootstrap";
import { getAdminAnalyticsReport } from "@/lib/server/services/reports.service";
import {
  createAdminStaffAccount,
  listAdminStaffAndAudit,
  updateAdminStaffAccount,
} from "@/lib/server/services/staff.service";
import {
  createOrderRequest,
  updateAdminOrderStatus,
} from "@/lib/server/services/order.service";
import {
  submitAtelierEnquiry,
  updateAdminAtelierEnquiry,
} from "@/lib/server/services/enquiry.service";
import { escapeCsvCell, sanitizeText } from "@/lib/server/security/sanitize";

describe("Phase 7 — Reports & Analytics, Staff Governance, RBAC & Security Hardening", () => {
  beforeEach(() => {
    installTestCloudflareEnv({
      ADMIN_BOOTSTRAP_TOKEN: "dodox-bootstrap-token-secret-2026",
    });
  });

  it("computes accurate RWF pipeline, confirmed revenue, top pieces, and Atelier quotations in analytics", async () => {
    const o1 = await createOrderRequest({
      customer: {
        firstName: "Nadia",
        lastName: "Keza",
        email: "nadia@kigali.rw",
        phone: "+250 788 100 200",
        city: "Kigali",
        district: "Gasabo",
        address: "KG 9 Ave",
        deliveryMethod: "kigali-white-glove",
      },
      lines: [
        {
          slug: "imanzi-sculptural-boucle-sofa",
          quantity: 1,
          selections: [],
        },
      ],
      careProtection: false,
    });

    await createOrderRequest({
      customer: {
        firstName: "Olivier",
        lastName: "Nshuti",
        email: "olivier@kigali.rw",
        phone: "+250 788 300 400",
        city: "Kigali",
        district: "Kicukiro",
        address: "KK 15 Rd",
        deliveryMethod: "regional-courier",
      },
      lines: [
        {
          slug: "kigali-oak-coffee-table",
          quantity: 2,
          selections: [],
        },
      ],
      careProtection: true,
    });

    const list = await (
      await import("@/lib/server/services/order.service")
    ).listAdminOrders({});
    const targetOrder = list.find((i) => i.reference === o1.reference)!;
    await updateAdminOrderStatus({
      orderId: targetOrder.id,
      nextStatus: "confirmed",
      notifyCustomer: false,
      actor: { id: "usr_system", name: "Concierge", email: "concierge@dodox.rw" },
    });

    const atl = await submitAtelierEnquiry({
      name: "Nadia Keza",
      email: "nadia@kigali.rw",
      phone: "+250 788 100 200",
      furnitureType: "Credenza",
      dimensions: "220cm",
      materials: "Walnut",
      finish: "Smoked",
      budget: "1,500,000 – 3,000,000 RWF",
      description: "Custom fluted walnut sideboard with brass pulls for dining room.",
      contactPreference: "email",
    });
    await updateAdminAtelierEnquiry({
      id: atl.id,
      status: "quotation_prepared",
      quotedAmount: 2100000,
    });

    const report = await getAdminAnalyticsReport({ days: 30 });
    expect(report.commerce.totalOrderRequests).toBe(2);
    expect(report.commerce.confirmedOrdersCount).toBe(1);
    expect(report.commerce.confirmedRevenueRwf).toBe(1450000);
    expect(report.commerce.requestedValueRwf).toBeGreaterThan(1450000);
    expect(report.conciergeFunnel.atelierQuotedValueRwf).toBe(2100000);
    expect(report.inventoryValuation.onHandRetailValueRwf).toBeGreaterThan(0);
    expect(report.topPieces.length).toBe(2);
  });

  it("enforces privilege-escalation guards, protects the last Super Admin, and neutralizes CSV/XSS vectors", async () => {
    const superUser = await bootstrapFirstSuperAdmin({
      bootstrapToken: "dodox-bootstrap-token-secret-2026",
      email: "founder@dodox.rw",
      password: "SuperStrongPassword!2026",
      firstName: "Amahoro",
      lastName: "Founder",
    });

    // Non-super_admin cannot grant super_admin
    await expect(
      createAdminStaffAccount({
        email: "rogue@dodox.rw",
        firstName: "Rogue",
        lastName: "Admin",
        password: "ValidStaffPassword!2026",
        roleSlug: "super_admin",
        actorRoles: ["administrator"],
      }),
    ).rejects.toThrow(/Super Admin/i);

    // Super admin creates Store Manager
    const manager = await createAdminStaffAccount({
      email: "manager@dodox.rw",
      firstName: "Diane",
      lastName: "Uwera",
      password: "ValidStaffPassword!2026",
      roleSlug: "store_manager",
      actorUserId: superUser.userId,
      actorEmail: superUser.email,
      actorRoles: ["super_admin"],
    });
    expect(manager.role).toBe("store_manager");

    // Cannot deactivate or demote the sole active Super Admin
    await expect(
      updateAdminStaffAccount({
        userId: superUser.userId,
        isActive: false,
        actorRoles: ["super_admin"],
      }),
    ).rejects.toThrow(/last active Super Admin/i);

    const directory = await listAdminStaffAndAudit();
    expect(directory.roles.length).toBe(8);
    expect(directory.staff.length).toBe(2);
    expect(directory.auditLogs.some((l) => l.action === "staff.create")).toBe(
      true,
    );

    // Security sanitization assertions
    expect(escapeCsvCell("=cmd|' /C calc'!A0")).toBe("'=cmd|' /C calc'!A0");
    expect(escapeCsvCell("=SUM(A1,A2)")).toBe("\"'=SUM(A1,A2)\"");
    expect(sanitizeText("<script>alert(1)</script>Kigali")).toBe(
      "alert(1)Kigali",
    );
  });
});
