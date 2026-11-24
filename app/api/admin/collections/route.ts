import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/server/auth/rbac";
import {
  handleApiError,
  jsonCreated,
  jsonOk,
  parseJsonBody,
} from "@/lib/server/http";
import { recordActivityLog } from "@/lib/server/services/audit.service";
import {
  createAdminCollection,
  listAdminCollections,
} from "@/lib/server/services/catalogue.service";
import { collectionUpsertSchema } from "@/lib/server/validation/catalogue";

export async function GET(request: Request) {
  try {
    await requirePermission("products.read", request);
    const collections = await listAdminCollections();
    return jsonOk({ collections });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requirePermission("categories.manage", request);
    const input = await parseJsonBody(request, collectionUpsertSchema);
    const collection = await createAdminCollection(input);

    await recordActivityLog({
      actorUserId: admin.id,
      actorEmail: admin.email,
      action: "collection.create",
      resourceType: "collection",
      resourceId: collection.id,
      summary: `Created collection "${collection.name}"`,
      request,
    });

    revalidatePath("/");
    revalidatePath("/shop");

    return jsonCreated({ collection });
  } catch (error) {
    return handleApiError(error);
  }
}
