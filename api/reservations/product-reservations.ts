import { authenticatedRequest, profileApi, type FirebaseUser } from "../api.js";

// WIFIGATE Reservations. Customer routes need any verified Google/Apple
// account; the admin routes need the global WIFIGATE Admin with TOTP. The
// backend checks both on every request.
export type ProductLine = "wifigate" | "wifigate-roller-shutter";
export type ReservationStatus =
  | "new"
  | "contacted"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled";

export type ReservationInput = {
  items: { productLine: ProductLine; quantity: number }[];
  contact: { fullName: string; phone: string; company: string | null };
  address: {
    country: string;
    city: string;
    street: string;
    postalCode: string | null;
  };
  notes: string | null;
  language: "he" | "en";
  photos: { contentType: "image/jpeg"; data: string }[];
};

export type Reservation = {
  id: string;
  status: ReservationStatus;
  version: number;
  items: { productLine: ProductLine; quantity: number }[];
  contact: { fullName: string | null; phone: string | null; company: string | null };
  email: string | null;
  address: {
    country: string;
    city: string | null;
    street: string | null;
    postalCode: string | null;
  };
  notes: string | null;
  language: "he" | "en";
  photoCount: number;
  customerNote: string | null;
  trackingNumber: string | null;
  history: { status: ReservationStatus; at: string; by: string; actorEmail?: string | null }[];
  cancellable: boolean;
  createdAt: string;
  updatedAt: string;
  ownerUid?: string;
  adminNote?: string | null;
  erased?: boolean;
  nextStatuses?: ReservationStatus[];
};

export type ReservationSummary = Pick<
  Reservation,
  "id" | "status" | "items" | "email" | "photoCount" | "createdAt" | "updatedAt"
> & { fullName: string | null; country: string | null; city: string | null };

const base = "/api/v1/product-reservations";

export function listMyReservations(user: FirebaseUser) {
  return authenticatedRequest<{ items: Reservation[] }>(profileApi, user, {
    method: "GET",
    url: base,
  });
}

export function createReservation(
  user: FirebaseUser,
  input: ReservationInput,
  idempotencyKey: string,
) {
  return authenticatedRequest<{ reservation: Reservation }>(profileApi, user, {
    method: "POST",
    url: base,
    data: input,
    // Up to three photos: allow the upload more time than a plain request.
    timeout: 60_000,
    headers: { "Idempotency-Key": idempotencyKey },
  });
}

export function cancelReservation(user: FirebaseUser, id: string, version: number) {
  return authenticatedRequest<{ reservation: Reservation }>(profileApi, user, {
    method: "POST",
    url: `${base}/${encodeURIComponent(id)}/cancel`,
    data: { version },
  });
}

export function reservationPhoto(
  user: FirebaseUser,
  id: string,
  index: number,
  admin = false,
) {
  return authenticatedRequest<Blob>(profileApi, user, {
    method: "GET",
    url: `${base}${admin ? "/admin" : ""}/${encodeURIComponent(id)}/photos/${index}`,
    responseType: "blob",
  });
}

export function adminListReservations(
  user: FirebaseUser,
  query: { status?: ReservationStatus | "all"; after?: string } = {},
) {
  return authenticatedRequest<{
    counts: Record<ReservationStatus, number>;
    items: ReservationSummary[];
    nextCursor: string | null;
    truncated: boolean;
  }>(profileApi, user, {
    method: "GET",
    url: `${base}/admin`,
    params: Object.fromEntries(
      Object.entries(query).filter(([, value]) => value !== undefined),
    ),
  });
}

export function adminGetReservation(user: FirebaseUser, id: string) {
  return authenticatedRequest<{ reservation: Reservation }>(profileApi, user, {
    method: "GET",
    url: `${base}/admin/${encodeURIComponent(id)}`,
  });
}

export function adminChangeReservationStatus(
  user: FirebaseUser,
  id: string,
  input: {
    version: number;
    status: ReservationStatus;
    customerNote: string | null;
    adminNote: string | null;
    trackingNumber: string | null;
  },
) {
  return authenticatedRequest<{ reservation: Reservation }>(profileApi, user, {
    method: "POST",
    url: `${base}/admin/${encodeURIComponent(id)}/status`,
    data: input,
  });
}
