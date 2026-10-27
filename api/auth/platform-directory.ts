import { authenticatedRequest, profileApi, type FirebaseUser } from "../api.js";
import type { ProductAccess, ProductId } from "../types.js";

export type PlatformDirectory = {
  counts: { admins: number; users: number; total: number };
  productCounts?: Partial<Record<ProductId, number>>;
  items: {
    email: string;
    name: string | null;
    role: "admin" | "user";
    identityStatus: "verified" | "unavailable";
    products: Partial<
      Record<
        ProductId,
        ProductAccess & { role?: string | null; plan?: string | null }
      >
    >;
  }[];
  nextCursor: string | null;
  basis: "provisioned-identities";
};

export function getPlatformDirectory(
  user: FirebaseUser,
  role = "all",
  after?: string,
  product = "all",
): Promise<PlatformDirectory> {
  const query = new URLSearchParams({ role, product });
  if (after) query.set("after", after);
  return authenticatedRequest(profileApi, user, {
    method: "GET",
    url: `/api/v1/platform/directory?${query}`,
  });
}
