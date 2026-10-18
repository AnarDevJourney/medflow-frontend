import { api } from "@lib/api/client";
import { isApiError } from "@lib/api/errors";

export interface ComponentHealth {
  status: "up" | "down";
  latencyMs?: number;
  error?: string;
}

export interface SystemHealth {
  status: "ok" | "error";
  checks: Record<string, ComponentHealth>;
}

// GET /health on the gateway — Redis + every service. When something is
// down the gateway answers 503 with the same body in error.details.
export async function getSystemHealth(): Promise<SystemHealth> {
  try {
    const { data } = await api.get<SystemHealth>("/health");
    return data;
  } catch (error) {
    if (isApiError(error, "SERVICE_UNAVAILABLE") && error.details) {
      return error.details as SystemHealth;
    }
    throw error;
  }
}
