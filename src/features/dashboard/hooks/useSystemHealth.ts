import { useQuery } from "@tanstack/react-query";
import { getSystemHealth } from "../services/healthService";

export function useSystemHealth() {
  return useQuery({
    queryKey: ["system-health"],
    queryFn: getSystemHealth,
    refetchInterval: 15_000,
  });
}
