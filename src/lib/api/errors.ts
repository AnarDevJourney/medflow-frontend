import { AxiosError } from "axios";
import type { ApiErrorBody, ApiFailure, ErrorCode, FieldError } from "@models/api";

// Every failed request ends up as an ApiError: the backend's error envelope,
// or a synthetic one when the server could not be reached at all.
export class ApiError extends Error {
  readonly status: number;
  readonly code: ErrorCode;
  readonly details: unknown;
  readonly requestId: string | null;

  constructor(
    body: Pick<ApiErrorBody, "statusCode" | "code" | "message"> & Partial<ApiErrorBody>,
  ) {
    super(body.message);
    this.name = "ApiError";
    this.status = body.statusCode;
    this.code = body.code;
    this.details = body.details ?? null;
    this.requestId = body.requestId ?? null;
  }

  // VALIDATION_ERROR details → { field: "first message" } for form fields
  get fieldErrors(): Record<string, string> {
    if (this.code !== "VALIDATION_ERROR" || !Array.isArray(this.details)) return {};
    return Object.fromEntries(
      (this.details as FieldError[]).map((d) => [d.field, d.errors[0] ?? ""]),
    );
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (error instanceof AxiosError) {
    const body = (error.response?.data as ApiFailure | undefined)?.error;
    if (body?.code) return new ApiError(body);
    return new ApiError({
      statusCode: error.response?.status ?? 0,
      code: "SERVICE_UNAVAILABLE",
      message: "The server cannot be reached, please try again",
    });
  }
  return new ApiError({
    statusCode: 0,
    code: "INTERNAL_ERROR",
    message: error instanceof Error ? error.message : "Unexpected error",
  });
}

export const isApiError = (error: unknown, code?: ErrorCode): error is ApiError =>
  error instanceof ApiError && (code === undefined || error.code === code);
