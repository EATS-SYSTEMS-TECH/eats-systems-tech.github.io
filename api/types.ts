import { Roles, AccessStates } from "../js/host-constants.js";

export type FirebaseUser = { getIdToken(): Promise<string> };
export type JsonValue =
  string | number | boolean | null | JsonObject | JsonValue[];
export type JsonObject = { [key: string]: JsonValue };
export type User = {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
};
export type Role = (typeof Roles)[keyof typeof Roles] | null;
export type AccessState = (typeof AccessStates)[keyof typeof AccessStates];
export type Access = { state: AccessState };
export type Mfa = { required: boolean; enrolled: boolean; verified: boolean };
export type PortalProfile = {
  user: User;
  role: Role;
  access: Access;
  mfa: Mfa;
};
export type ProductId = "host" | "pay" | "manager";
export type ProductState =
  "active" | "pending" | "no-plan" | "blocked" | "mfa-required" | "unavailable";
export type PersonalSummary = { gates: number | null; dualControls: number | null; groups: number | null; organizations: number };
export type MonthlyEstimate = {
  kind: "monthly-estimate";
  currency: string;
  pricingVersion: string;
  taxIncluded: false;
  invoiceIssued: false;
  physicalGates: number;
  unitCents: number;
  minimumAdjustmentCents: number;
  lines: Record<"gates" | "dualControls" | "groups" | "organizations", { amountCents: number; physicalGates?: number; quantity?: number; included?: number | null }>;
  monthlyCents: number;
};
export type ProductFinancials = MonthlyEstimate | { kind: "revenue"; revenue: { currency: string; amountCents: number } | null };
export type ProductAccess = { state: ProductState; organizations?: number; summary?: PersonalSummary | null; financials?: ProductFinancials | null };
// The Host plan role: admin (WIFIGATE operator) or user (paying customer).
// null (or absent) means no plan: an organization member without My systems.
export type HostPlanRole = Role;
export type HostAccess = ProductAccess & { role?: HostPlanRole };
export type PlatformProfile = {
  user: User;
  mfa: { enrolled: boolean; verified: boolean };
  products: { host: HostAccess; pay: ProductAccess; manager: ProductAccess };
};
export type CreateProfileResponse = { user?: User };
export type AccountSubscription = { organization: string; product: ProductId };
export type AccountDeletionPreview = {
  allowed: true;
  subscriptions: AccountSubscription[];
  closingOrganizations: { organization: string; otherMembers: number }[];
  memberships: number;
  // My systems the deletion removes (a Host plan holder's own systems).
  mySystems?: number;
};
export type AccountDeletionResult = {
  deleted: true;
  cancelledSubscriptions: AccountSubscription[];
  archivedOrganizations: string[];
  removedMemberships: number;
  removedMySystems?: number;
};
export type ApiErrorDetails = {
  message?: string;
  code?: string;
  details?: JsonObject;
};
export type ApiErrorResponse = { error?: ApiErrorDetails; code?: string };
export type ApiErrorMetadata = {
  status?: number;
  code?: string;
  details?: JsonObject;
};
export type ApiError = Error & ApiErrorMetadata;
export type RequestOptions = { signal?: AbortSignal };
