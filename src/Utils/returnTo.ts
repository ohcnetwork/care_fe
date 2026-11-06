const LOCAL_ORIGIN = "https://care.invalid";

const RETURN_QUERY_KEYS = new Set([
  "created_date_after",
  "created_date_before",
  "date_after",
  "date_before",
  "direction",
  "limit",
  "offset",
  "ordering",
  "page",
  "selectedEncounter",
  "sort",
  "status",
  "tab",
]);

export function safeInternalPath(value?: string | null): string | undefined {
  if (!value?.startsWith("/") || value.startsWith("//")) return undefined;

  try {
    const url = new URL(value, LOCAL_ORIGIN);
    if (url.origin !== LOCAL_ORIGIN || url.pathname.startsWith("//")) {
      return undefined;
    }

    const safeSearchParams = new URLSearchParams();
    for (const [key, paramValue] of url.searchParams) {
      if (
        RETURN_QUERY_KEYS.has(key) &&
        paramValue.length <= 100 &&
        !/[\u0000-\u001f\u007f]/.test(paramValue)
      ) {
        safeSearchParams.append(key, paramValue);
      }
    }

    const search = safeSearchParams.toString();
    return `${url.pathname}${search ? `?${search}` : ""}`;
  } catch {
    return undefined;
  }
}

export function resolveEncounterReturnTo(
  returnTo: string | null | undefined,
  facilityId: string,
  patientId: string,
  encounterId: string,
) {
  const fallback =
    `/facility/${encodeURIComponent(facilityId)}` +
    `/patient/${encodeURIComponent(patientId)}` +
    `/encounter/${encodeURIComponent(encounterId)}/updates`;
  const safePath = safeInternalPath(returnTo);
  if (!safePath) return fallback;

  const url = new URL(safePath, LOCAL_ORIGIN);
  const encounterPath =
    `/facility/${encodeURIComponent(facilityId)}` +
    `/patient/${encodeURIComponent(patientId)}` +
    `/encounter/${encodeURIComponent(encounterId)}`;
  const isSameEncounter =
    url.pathname === encounterPath ||
    url.pathname.startsWith(`${encounterPath}/`);
  const isQuestionnaire =
    url.pathname === `${encounterPath}/questionnaire` ||
    url.pathname.startsWith(`${encounterPath}/questionnaire/`);

  if (!isSameEncounter || isQuestionnaire) {
    return fallback;
  }

  return safePath;
}

export function withReturnTo(
  path: string,
  returnTo: string,
  baseHref = window.location.href,
) {
  const target = new URL(path, baseHref);
  if (target.origin !== new URL(baseHref).origin) {
    throw new TypeError("Return destinations must stay on the current origin");
  }

  const safeReturnTo = safeInternalPath(returnTo);
  if (safeReturnTo) {
    target.searchParams.set("return_to", safeReturnTo);
  }

  return `${target.pathname}${target.search}${target.hash}`;
}

export function currentPathWithSafeReturnQuery(
  baseHref = window.location.href,
) {
  const current = new URL(baseHref);
  const path = `${current.pathname}${current.search}`;
  return safeInternalPath(path) ?? current.pathname;
}
