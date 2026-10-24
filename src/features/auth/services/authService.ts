import { api } from "@lib/api/client";
import type { Role } from "@models/enums";

// What a user sees about themself (login, /auth/me)
export interface CurrentUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  avatarFileId: string | null;
}

export interface InvitationPreview {
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  expiresAt: string;
}

// GET /auth/me — the signed-in user (401 when not signed in)
export async function getCurrentUser(): Promise<CurrentUser> {
  const { data } = await api.get<CurrentUser>("/auth/me");
  return data;
}

// Sets the auth cookies; JS never sees a token
export async function login(email: string, password: string): Promise<CurrentUser> {
  const { data } = await api.post<{ user: CurrentUser }>("/auth/login", {
    email,
    password,
  });
  return data.user;
}

export async function logout(): Promise<void> {
  await api.post("/auth/logout");
}

export async function updateProfile(
  change: Partial<Pick<CurrentUser, "firstName" | "lastName">>,
): Promise<CurrentUser> {
  const { data } = await api.patch<CurrentUser>("/auth/me", change);
  return data;
}

// Other sessions are signed out; this one gets new cookies
export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<CurrentUser> {
  const { data } = await api.patch<{ user: CurrentUser }>("/auth/change-password", {
    currentPassword,
    newPassword,
  });
  return data.user;
}

// 404 invalid, 409 already used, 410 INVITE_EXPIRED
export async function previewInvitation(token: string): Promise<InvitationPreview> {
  const { data } = await api.get<InvitationPreview>(
    `/auth/invitations/${encodeURIComponent(token)}`,
  );
  return data;
}

// Sets the password and signs the new user in
export async function acceptInvite(
  token: string,
  password: string,
): Promise<CurrentUser> {
  const { data } = await api.post<{ user: CurrentUser }>("/auth/accept-invite", {
    token,
    password,
  });
  return data.user;
}

// Always succeeds (no account enumeration)
export async function forgotPassword(email: string): Promise<void> {
  await api.post("/auth/forgot-password", { email });
}

export async function resetPassword(token: string, password: string): Promise<void> {
  await api.post("/auth/reset-password", { token, password });
}
