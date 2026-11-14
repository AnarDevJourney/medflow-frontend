import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  addAllergy,
  addCondition,
  createPatient,
  getPatient,
  getPatientStats,
  listPatients,
  removeAllergy,
  removeCondition,
  setPatientActive,
  updateAllergy,
  updateCondition,
  updatePatient,
  type AllergyInput,
  type ConditionInput,
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

export function usePatientStats(enabled = true) {
  return useQuery({
    queryKey: [...patientsKey, "stats"],
    queryFn: getPatientStats,
    enabled,
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

// Allergies and conditions of one patient; the profile (GET /patients/:id)
// carries both lists, so every change refetches it
export function useClinicalActions(patientId: string) {
  const queryClient = useQueryClient();
  const done = () =>
    queryClient.invalidateQueries({ queryKey: [...patientsKey, "one", patientId] });

  return {
    addAllergy: useMutation({
      mutationFn: (input: AllergyInput) => addAllergy(patientId, input),
      onSettled: done,
    }),
    updateAllergy: useMutation({
      mutationFn: ({ id, input }: { id: string; input: Partial<AllergyInput> }) =>
        updateAllergy(patientId, id, input),
      onSettled: done,
    }),
    removeAllergy: useMutation({
      mutationFn: (allergyId: string) => removeAllergy(patientId, allergyId),
      onSettled: done,
    }),
    addCondition: useMutation({
      mutationFn: (input: ConditionInput) => addCondition(patientId, input),
      onSettled: done,
    }),
    updateCondition: useMutation({
      mutationFn: ({ id, input }: { id: string; input: Partial<ConditionInput> }) =>
        updateCondition(patientId, id, input),
      onSettled: done,
    }),
    removeCondition: useMutation({
      mutationFn: (conditionId: string) => removeCondition(patientId, conditionId),
      onSettled: done,
    }),
  };
}
