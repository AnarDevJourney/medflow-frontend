// Response envelopes of the MedFlow API (every service, via the gateway).
// Success: { success: true, data } — error: { success: false, error }.

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiErrorBody {
  statusCode: number;
  code: ErrorCode;
  message: string;
  path: string;
  requestId: string | null;
  // VALIDATION_ERROR: [{ field, errors }], ALLERGY_WARNING: { matches }, …
  details: unknown;
}

export interface ApiFailure {
  success: false;
  error: ApiErrorBody;
}

// Error codes the UI reacts to (backend libs/common ErrorCode)
export type ErrorCode =
  | "BAD_REQUEST"
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "SLOT_TAKEN"
  | "INVALID_STATUS"
  | "INVITE_EXPIRED"
  | "ALLERGY_WARNING"
  | "BUSINESS_RULE"
  | "TOO_MANY_REQUESTS"
  | "INTERNAL_ERROR"
  | "SERVICE_UNAVAILABLE";

export interface FieldError {
  field: string;
  errors: string[];
}

// List endpoints: ?page=1&limit=20&sort=createdAt:desc → { items, meta }
export interface Paginated<T> {
  items: T[];
  meta: { page: number; limit: number; total: number };
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort?: string; // "field:asc" | "field:desc"
}
