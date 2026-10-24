import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { isApiError } from "./errors";

// A human, translated message for any error. Codes with a generic meaning
// get our own text; business errors keep the server's message (it names the
// exact problem, e.g. "You cannot deactivate your own account").
export function useErrorMessage() {
  const { t } = useTranslation();
  return useCallback(
    (error: unknown): string => {
      if (!isApiError(error)) return t("errors.unexpected");
      switch (error.code) {
        case "SERVICE_UNAVAILABLE":
          return t("errors.unavailable");
        case "TOO_MANY_REQUESTS":
          return t("errors.tooManyRequests");
        case "FORBIDDEN":
          return t("errors.forbidden");
        case "INTERNAL_ERROR":
          return t("errors.unexpected");
        default:
          return error.message;
      }
    },
    [t],
  );
}
