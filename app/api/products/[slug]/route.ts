import { NotFoundError } from "@/lib/server/errors";
import { handleApiError, jsonOk } from "@/lib/server/http";
import {
  getPublishedProductBySlugFromDb,
  getRelatedProductsFromDb,
} from "@/lib/server/services/catalogue.service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params;
    const product = await getPublishedProductBySlugFromDb(slug);
    if (!product) {
      throw new NotFoundError("Product not found.");
    }
    const related = await getRelatedProductsFromDb(product, 4);
    return jsonOk({ product, related });
  } catch (error) {
    return handleApiError(error);
  }
}
