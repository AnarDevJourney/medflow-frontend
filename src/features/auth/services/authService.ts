import { api } from "@lib/api/client";
import type { Role } from "@models/enums";

export interface CurrentUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  avatarFileId: string | null;
}

// GET /auth/me — the signed-in user (401 when not signed in)
export async function getCurrentUser(): Promise<CurrentUser> {
  const { data } = await api.get<CurrentUser>("/auth/me");
  return data;
}
