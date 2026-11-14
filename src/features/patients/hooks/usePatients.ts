import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createPatient,
  getPatient,
  listPatients,
  setPatientActive,
  updatePatient,
  type PatientInput,
  type PatientsQuery,
} from "../services/patientsService";

export const patientsKey = ["patients"] as const;

export function usePatients(query: PatientsQuery, enabled = true) {
  return useQuery({
    queryKey: [...patientsKey, "list", query],
    queryFn: () => listPatients(query),
    placeholderData: keepPreviousData, // no empty flash between pages / filters
    enabled,
  });
}

export function usePatient(id: string | undefined) {
  return useQuery({
    queryKey: [...patientsKey, "one", id],
    queryFn: () => getPatient(id!),
    enabled: Boolean(id),
  });
}

export function usePatientActions() {
  const queryClient = useQueryClient();
  const done = () => queryClient.invalidateQueries({ queryKey: patientsKey });

  return {
    create: useMutation({
      mutationFn: (input: PatientInput) => createPatient(input),
      onSettled: done,
    }),
    update: useMutation({
      mutationFn: ({ id, input }: { id: string; input: Partial<PatientInput> }) =>
        updatePatient(id, input),
      onSettled: done,
    }),
    setActive: useMutation({
      mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
        setPatientActive(id, isActive),
      onSettled: done,
    }),
  };
}
