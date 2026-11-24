import { handleApiError, jsonOk } from "@/lib/server/http";
import { getPublishedCategoriesFromDb } from "@/lib/server/services/catalogue.service";

export async function GET() {
  try {
    const categories = await getPublishedCategoriesFromDb();
    return jsonOk({ categories });
  } catch (error) {
    return handleApiError(error);
  }
}
