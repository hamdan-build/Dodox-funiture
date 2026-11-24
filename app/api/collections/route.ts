import { handleApiError, jsonOk } from "@/lib/server/http";
import { getPublishedCollectionsFromDb } from "@/lib/server/services/catalogue.service";

export async function GET() {
  try {
    const collections = await getPublishedCollectionsFromDb();
    return jsonOk({ collections });
  } catch (error) {
    return handleApiError(error);
  }
}
