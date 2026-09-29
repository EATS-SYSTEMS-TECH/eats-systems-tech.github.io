import { authenticatedRequest, profileApi, type FirebaseUser, type JsonObject } from "../api.js";

type CreateProfileResponse = { user?: JsonObject };

export async function createProfile(firebaseUser: FirebaseUser) {
  const data = await authenticatedRequest<CreateProfileResponse>(profileApi, firebaseUser, {
    method: "PUT",
    url: "/api/v1/users/me",
    headers: { "Content-Type": "application/json" },
    data: {},
  });
  if (!data?.user) throw new Error("Could not save profile");
  return data.user;
}
