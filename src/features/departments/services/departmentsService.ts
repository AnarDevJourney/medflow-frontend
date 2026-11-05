import { api } from "@lib/api/client";
import type { Paginated } from "@models/api";

export interface Department {
  id: string;
  code: string; // short and fixed: price codes are built from it (CONSULT-CARD)
  name: string;
  description: string | null;
  location: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentsQuery {
  page: number;
  limit: number;
  sort?: string; // name | code | createdAt, e.g. "name:asc"
  search?: string;
  isActive?: boolean;
}

export type CreateDepartmentInput = Pick<Department, "code" | "name"> &
  Partial<Pick<Department, "description" | "location" | "phone">>;

export type UpdateDepartmentInput = Partial<
  Pick<Department, "name" | "description" | "location" | "phone" | "isActive">
>;

// Every department, inactive ones too (departments.manage)
export async function listDepartments(
  query: DepartmentsQuery,
): Promise<Paginated<Department>> {
  const { data } = await api.get<Paginated<Department>>("/departments/all", {
    params: query,
  });
  return data;
}

export async function createDepartment(
  input: CreateDepartmentInput,
): Promise<Department> {
  const { data } = await api.post<Department>("/departments", input);
  return data;
}

export async function updateDepartment(
  id: string,
  input: UpdateDepartmentInput,
): Promise<Department> {
  const { data } = await api.patch<Department>(`/departments/${id}`, input);
  return data;
}
