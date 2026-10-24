import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { isApiError } from "./errors";

// VALIDATION_ERROR from the server → errors on the matching form fields.
// Returns true when at least one field got its error (no extra alert needed).
export function applyFieldErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: Partial<Record<string, Path<T>>> = {}, // server field → form field
  translate?: (field: string, message: string) => string,
): boolean {
  if (!isApiError(error, "VALIDATION_ERROR")) return false;
  let applied = false;
  for (const [field, message] of Object.entries(error.fieldErrors)) {
    const target = fields[field] ?? (field as Path<T>);
    setError(target, {
      type: "server",
      message: translate ? translate(field, message) : message,
    });
    applied = true;
  }
  return applied;
}
