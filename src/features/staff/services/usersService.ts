import { api } from "@lib/api/client";
import type { Paginated } from "@models/api";
import type { Role, UserStatus } from "@models/enums";

// What an admin sees in user management (auth-service /users)
export interface StaffUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  avatarFileId: string | null;
  status: UserStatus;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface UsersQuery {
  page: number;
  limit: number;
  sort?: string; // createdAt | lastName | email | lastLoginAt, e.g. "lastName:asc"
  role?: Role;
  status?: UserStatus;
  search?: string;
}

export interface InviteUserInput {
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
}

export type UpdateUserInput = Partial<Pick<StaffUser, "firstName" | "lastName" | "role">>;

export async function listUsers(query: UsersQuery): Promise<Paginated<StaffUser>> {
  const { data } = await api.get<Paginated<StaffUser>>("/users", { params: query });
  return data;
}

// Creates the INVITED user and emails the invitation link
export async function inviteUser(input: InviteUserInput): Promise<StaffUser> {
  const { data } = await api.post<StaffUser>("/users", input);
  return data;
}

export async function updateUser(id: string, input: UpdateUserInput): Promise<StaffUser> {
  const { data } = await api.patch<StaffUser>(`/users/${id}`, input);
  return data;
}

export async function resendInvite(id: string): Promise<void> {
  await api.post(`/users/${id}/resend-invite`);
}

// Blocks sign-in and closes every session at once
export async function deactivateUser(id: string): Promise<StaffUser> {
  const { data } = await api.patch<StaffUser>(`/users/${id}/deactivate`);
  return data;
}

export async function reactivateUser(id: string): Promise<StaffUser> {
  const { data } = await api.patch<StaffUser>(`/users/${id}/reactivate`);
  return data;
}
