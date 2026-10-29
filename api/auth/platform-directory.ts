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
    billingExempt?: boolean;
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
  q?: string,
): Promise<PlatformDirectory> {
  const query = new URLSearchParams({ role, product });
  if (after) query.set("after", after);
  if (q) query.set("q", q);
  return authenticatedRequest(profileApi, user, {
    method: "GET",
    url: `/api/v1/platform/directory?${query}`,
  });
}

export function createPlatformOrganization(user: FirebaseUser, input: {product: "host" | "pay"; name: string; timezone: string}, key: string): Promise<{organization:{id:string;name:string}}> {
  return authenticatedRequest(profileApi,user,{method:"POST",url:input.product === "host" ? "/api/v1/organizations" : "/api/v1/platform/directory/organizations",data:input.product === "host" ? {name:input.name,timezone:input.timezone} : input,headers:{"Idempotency-Key":key}});
}

export type PlatformDirectoryFinancials = {
  billingPolicy?: "platform-admin-exempt-v1";
  kind: "monthly-estimate";
  totals: { currency: string; amountCents: number }[];
  accounts: number;
  unknownAccounts: number;
  complete: boolean;
  payRevenueAvailable: false;
};

export function getPlatformDirectoryFinancials(
  user: FirebaseUser,
  product = "all",
  role = "all",
): Promise<PlatformDirectoryFinancials> {
  return authenticatedRequest(profileApi, user, {
    method: "GET",
    url: `/api/v1/platform/directory/financials?${new URLSearchParams({ product, role })}`,
  });
}

export function getPayAccessOrganizations(
  user: FirebaseUser,
): Promise<{ items: { id: string; name: string }[] }> {
  return authenticatedRequest(profileApi, user, {
    method: "GET",
    url: "/api/v1/platform/directory/organizations",
  });
}

export type PlatformAccessChange =
  | { action: "remove"; email: string; product: ProductId }
  | { action: "invite"; email: string; product: "host" | "manager" }
  | { action: "invite"; email: string; product: "pay"; organizationId: string };

export function changePlatformProductAccess(
  user: FirebaseUser,
  input: PlatformAccessChange,
  key: string,
): Promise<{
  product: ProductId;
  state: "active" | "blocked";
  emailDelivery: false;
}> {
  return authenticatedRequest(profileApi, user, {
    method: "POST",
    url: "/api/v1/platform/directory/access",
    data: input,
    headers: { "Idempotency-Key": key },
  });
}

export function getPlatformOrganizationOverview(user: FirebaseUser, product = "all"): Promise<{items:{id:string;name:string;status:string;products:Partial<Record<ProductId,string>>}[];complete:true;basis:"provisioned-organizations"}> {
 return authenticatedRequest(profileApi,user,{method:"GET",url:`/api/v1/platform/directory/organization-overview?${new URLSearchParams({product})}`});
}
