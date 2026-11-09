import { api } from "@lib/api/client";
import type { Paginated } from "@models/api";
import type { Role, UserStatus } from "@models/enums";

export interface StaffDepartment {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
}

// A work profile from staff-service. userId is the person's id everywhere
// (auth users.id). Name, email, role and status are copies of the account.
export interface StaffMember {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  status: UserStatus;
  isActive: boolean;
  department: StaffDepartment | null;
  title: string | null;
  specialization: string | null;
  licenseNumber: string | null;
  phone: string | null;
  hireDate: string | null; // YYYY-MM-DD
  bio: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StaffQuery {
  page: number;
  limit: number;
  sort?: string; // name | email | role | status | department | hireDate | createdAt
  search?: string;
  role?: Role;
  departmentId?: string;
  status?: UserStatus; // only with users.read; others see active staff only
}

export interface UpdateOwnStaffInput {
  phone?: string | null;
  bio?: string | null;
}

export interface UpdateStaffInput extends UpdateOwnStaffInput {
  departmentId?: string | null;
  title?: string | null;
  specialization?: string | null;
  licenseNumber?: string | null;
  hireDate?: string | null;
}

export async function listStaff(query: StaffQuery): Promise<Paginated<StaffMember>> {
  const { data } = await api.get<Paginated<StaffMember>>("/staff", { params: query });
  return data;
}

export async function getMyStaffProfile(): Promise<StaffMember> {
  const { data } = await api.get<StaffMember>("/staff/me");
  return data;
}

// Work profile fields (staff.update)
export async function updateStaff(
  userId: string,
  input: UpdateStaffInput,
): Promise<StaffMember> {
  const { data } = await api.patch<StaffMember>(`/staff/${userId}`, input);
  return data;
}

// Own phone and bio
export async function updateMyStaffProfile(
  input: UpdateOwnStaffInput,
): Promise<StaffMember> {
  const { data } = await api.patch<StaffMember>("/staff/me", input);
  return data;
}
