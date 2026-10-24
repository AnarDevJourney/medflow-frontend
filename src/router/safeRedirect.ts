import { PATHS } from "./paths";

// Only same-app paths are allowed as ?redirect= targets (no open redirect)
export function safeRedirect(target: string | null): string {
  return target && target.startsWith("/") && !target.startsWith("//")
    ? target
    : PATHS.home;
}
