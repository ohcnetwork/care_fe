import { useMatches } from "@tanstack/react-router";
import { createContext, useContext } from "react";

import BrowserWarning from "@/components/ErrorPages/BrowserWarning";

import { useAuthContext } from "@/hooks/useAuthUser";

import {
  type Area,
  type AuthStatus,
  defaultArea,
  isAreaAllowed,
} from "@/lib/router/auth";
import { AppShell } from "@/Routers/AppShell";
import { PatientShell } from "@/Routers/PatientShell";

const AreaContext = createContext<Area | null>(null);

/** The area of the current page. Shared routes use it to pick their page. */
export function useArea(): Area {
  const area = useContext(AreaContext);
  if (!area) {
    throw new Error("'useArea' must be used within the route tree only");
  }
  return area;
}

/** The session status as rendered by `AuthUserProvider`. */
function useRenderedAuthStatus(): AuthStatus {
  const { user, patientToken, isUserLoading } = useAuthContext();
  if (isUserLoading) return "loading";
  if (user) return "user";
  return patientToken?.token ? "patient" : "anonymous";
}

/**
 * The area to render, or `null` while the session loads.
 *
 * Guards resolve `context.area` from the session at navigation time. React
 * can be one render behind that (for example, right after a sign-out). The
 * page renders only when the guard's area agrees with the rendered session,
 * so a staff page never renders without a staff user.
 */
export function useResolvedArea(): Area | null {
  const status = useRenderedAuthStatus();
  // A primitive keeps the selector stable between router store updates.
  const matched = useMatches({
    select: (matches) => {
      const failed = matches.some(
        (match) => match.status === "notFound" || match.status === "error",
      );
      let area = "";
      for (let index = matches.length - 1; index >= 0 && !area; index--) {
        area = (matches[index].context as { area?: Area }).area ?? "";
      }
      return `${area}|${failed ? "failed" : ""}`;
    },
  });
  const [matchedArea, failed] = matched.split("|") as [Area | "", string];

  if (status === "loading") return null;
  // A guard that ran while the session loaded sets no area; wait for the
  // guards to run again. A guard that failed (not found) sets none either;
  // that page renders in the default chrome.
  if (!matchedArea && !failed) return null;
  const area = matchedArea || defaultArea(status);
  return isAreaAllowed(area, status) ? area : null;
}

/** Renders the chrome of `area` around the page. */
export function AreaChrome({
  area,
  children,
}: {
  area: Area;
  children: React.ReactNode;
}) {
  let chrome: React.ReactNode;
  switch (area) {
    case "app":
      chrome = <AppShell>{children}</AppShell>;
      break;
    case "patient":
      chrome = <PatientShell>{children}</PatientShell>;
      break;
    default:
      chrome = (
        <>
          <BrowserWarning />
          {children}
        </>
      );
  }
  return <AreaContext.Provider value={area}>{chrome}</AreaContext.Provider>;
}
