import { useState } from "react";

// The value, or the last non-null one. A drawer / modal opened for a record
// keeps showing it while it animates out after the record is set to null.
export function useLastDefined<T>(value: T | null | undefined): T | null {
  const [last, setLast] = useState<T | null>(value ?? null);
  if (value != null && value !== last) setLast(value);
  return value ?? last;
}
