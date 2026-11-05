import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createDepartment,
  listDepartments,
  updateDepartment,
  type CreateDepartmentInput,
  type DepartmentsQuery,
  type UpdateDepartmentInput,
} from "../services/departmentsService";

export const departmentsKey = ["departments"] as const;

export function useDepartments(query: DepartmentsQuery) {
  return useQuery({
    queryKey: [...departmentsKey, query],
    queryFn: () => listDepartments(query),
    placeholderData: keepPreviousData, // no empty flash between pages / filters
  });
}

export function useDepartmentActions() {
  const queryClient = useQueryClient();
  const done = () => queryClient.invalidateQueries({ queryKey: departmentsKey });

  return {
    create: useMutation({
      mutationFn: (input: CreateDepartmentInput) => createDepartment(input),
      onSettled: done,
    }),
    update: useMutation({
      mutationFn: ({ id, input }: { id: string; input: UpdateDepartmentInput }) =>
        updateDepartment(id, input),
      onSettled: done,
    }),
  };
}
