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
export type ProductAccess = { state: ProductState; organizations?: number };
export type PlatformProfile = {
  user: User;
  mfa: { enrolled: boolean; verified: boolean };
  products: Record<ProductId, ProductAccess>;
};
export type CreateProfileResponse = { user?: User };
export type ApiErrorDetails = { message?: string; code?: string };
export type ApiErrorResponse = { error?: ApiErrorDetails; code?: string };
export type ApiErrorMetadata = { status?: number; code?: string };
export type ApiError = Error & ApiErrorMetadata;
export type RequestOptions = { signal?: AbortSignal };
