import { api } from "@lib/api/client";
import type { Paginated } from "@models/api";
import type { BloodType, Gender } from "@models/enums";

// A patient from patient-service. MRN is the number staff say out loud;
// the id only travels in URLs and API calls.
export interface Patient {
  id: string;
  mrn: string; // P-000123
  firstName: string;
  lastName: string;
  fatherName: string | null;
  finCode: string | null;
  dateOfBirth: string; // YYYY-MM-DD
  gender: Gender;
  bloodType: BloodType | null;
  phone: string;
  email: string | null;
  address: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelation: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PatientsQuery {
  page: number;
  limit: number;
  // fuzzy name, or exact MRN / FIN / phone; without sort the best match comes first
  search?: string;
  sort?: string; // createdAt | name | mrn | dateOfBirth
  isActive?: boolean;
  gender?: Gender;
}

export interface PatientInput {
  firstName: string;
  lastName: string;
  fatherName?: string | null;
  finCode?: string | null;
  dateOfBirth: string;
  gender: Gender;
  bloodType?: BloodType | null;
  phone: string;
  email?: string | null;
  address?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  emergencyContactRelation?: string | null;
  notes?: string | null;
}

// 409 on a FIN that another patient already has
export interface ExistingPatientRef {
  id: string;
  mrn: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
}

export async function listPatients(query: PatientsQuery): Promise<Paginated<Patient>> {
  const { data } = await api.get<Paginated<Patient>>("/patients", { params: query });
  return data;
}

export async function getPatient(id: string): Promise<Patient> {
  const { data } = await api.get<Patient>(`/patients/${id}`);
  return data;
}

export async function createPatient(input: PatientInput): Promise<Patient> {
  const { data } = await api.post<Patient>("/patients", input);
  return data;
}

export async function updatePatient(
  id: string,
  input: Partial<PatientInput>,
): Promise<Patient> {
  const { data } = await api.patch<Patient>(`/patients/${id}`, input);
  return data;
}

export async function setPatientActive(id: string, isActive: boolean): Promise<Patient> {
  const { data } = await api.patch<Patient>(
    `/patients/${id}/${isActive ? "reactivate" : "deactivate"}`,
  );
  return data;
}
