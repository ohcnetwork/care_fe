import careConfig from "@careConfig";
import { differenceInMinutes, format, isValid, parseISO } from "date-fns";

import { Time } from "@/Utils/types";
import { navigate } from "@/lib/router/navigate";
import { getRouter } from "@/lib/router/routerRef";

export {
  dateQueryString,
  dateTimeQueryString,
  facilityLocalDateQueryString,
  formatDateTime,
  formatDateTimeInZone,
  formatPatientAge,
  formatPatientAgeBreakdown,
  isUserOnline,
  parseLocalDate,
  relativeDate,
  relativeTime,
} from "@/Utils/date";

/**
 * Guards against invalid dates from unvalidated query params (e.g. ?..._after=lol)
 */
export function parseValidISO(value: string | undefined) {
  if (!value) return undefined;
  const date = parseISO(value);
  return isValid(date) ? date : undefined;
}

export const formatTimeShort = (time: Time) => {
  return format(new Date(`1970-01-01T${time}`), "h:mm a").replace(":00", "");
};

export const formatName = (
  user?: {
    first_name: string;
    last_name: string;
    prefix?: string | null;
    suffix?: string | null;
    username: string;
  } | null,
  hidePrefixSuffix: boolean = false,
) => {
  if (!user) return "-";
  const name = [
    hidePrefixSuffix ? undefined : user.prefix,
    user.first_name,
    user.last_name,
    hidePrefixSuffix ? undefined : user.suffix,
  ]
    .map((s) => s?.trim())
    .filter(Boolean)
    .join(" ");
  return name || user.username || "-";
};

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const isAppleDevice = /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent);

function hasTouch() {
  try {
    document.createEvent("TouchEvent");
    return true;
  } catch {
    return false;
  }
}

export const isTouchDevice = hasTouch();

export const isAndroidDevice = /android/i.test(navigator.userAgent);

export const getMapUrl = (latitude: string, longitude: string) => {
  return isAndroidDevice
    ? `geo:${latitude},${longitude}`
    : careConfig.mapFallbackUrlTemplate
        .replace("{lat}", latitude)
        .replace("{long}", longitude);
};

export const isValidLatitude = (latitude: number) => {
  return Number.isFinite(latitude) && latitude >= -90 && latitude <= 90;
};

export const isValidLongitude = (longitude: number) => {
  return Number.isFinite(longitude) && longitude >= -180 && longitude <= 180;
};

/**
 * A utility method to format an array of string to human readable format.
 *
 * @param values Array of strings to be made human readable.
 * @returns Human readable version of the list of strings
 */
export const humanizeStrings = (strings: readonly string[], empty = "") => {
  if (strings.length === 0) {
    return empty;
  }

  if (strings.length === 1) {
    return strings[0];
  }

  const [last, ...items] = [...strings].reverse();
  return `${items.reverse().join(", ")} and ${last}`;
};

/**
 * Although same as `Objects.keys(...)`, this provides better type-safety.
 */
export const keysOf = <T extends object>(obj: T) => {
  return Object.keys(obj) as (keyof T)[];
};

/**
 * Although same as `Objects.entries(...)`, this provides better type-safety.
 */
export const entriesOf = <T extends object>(obj: T) => {
  return Object.entries(obj) as [keyof T, T[keyof T]][];
};

/**
 * Although same as `Objects.values(...)`, this provides better type-safety.
 */
export const valuesOf = <T extends object>(obj: T) => {
  return Object.values(obj) as T[keyof T][];
};

export const properCase = (str: string) => {
  return str
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

export const getMonthStartAndEnd = (date: Date) => {
  return {
    start: new Date(date.getFullYear(), date.getMonth(), 1),
    end: new Date(date.getFullYear(), date.getMonth() + 1, 0),
  };
};

/**
 * Returns hours and minutes between two dates.
 *
 * Eg.
 * 1 hour and 30 minutes
 * 2 hours
 * 30 minutes
 */
export const getReadableDuration = (
  start: string | Date,
  end: string | Date,
) => {
  const duration = differenceInMinutes(end, start);
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;
  if (hours === 0 && minutes === 0) return "0 minutes";
  if (hours === 0) return `${minutes} minute${minutes > 1 ? "s" : ""}`;
  if (minutes === 0) return `${hours} hour${hours > 1 ? "s" : ""}`;
  return `${hours} hour${hours > 1 ? "s" : ""} and ${minutes} minute${
    minutes > 1 ? "s" : ""
  }`;
};

export const conditionalAttribute = <T>(
  condition: boolean,
  attributes: Record<string, T>,
) => {
  return condition ? attributes : {};
};

export const stringifyNestedObject = <
  T extends { name: string; parent?: Partial<T> },
>(
  obj: T,
  separator: string | React.ReactNode = ", ",
  reverse: boolean = false,
) => {
  const levels: string[] = [];

  let current: Partial<T> | undefined = obj;
  while (current?.name) {
    levels.push(current.name);
    current = current.parent;
  }

  if (reverse) {
    levels.reverse();
  }

  if (typeof separator === "string") {
    return levels.join(separator);
  }

  return levels.reduce((acc: (string | React.ReactNode)[], curr, i) => {
    if (i === 0) return [curr];
    return [...acc, separator, curr];
  }, []);
};

export const mergeAutocompleteOptions = (
  options: { label: string; value: string }[],
  value?: { label: string; value: string },
) => {
  if (!value) return options;
  if (options.find((o) => o.value === value.value)) return options;
  return [value, ...options];
};

export const readFileAsDataURL = async (file: File) => {
  let result_base64 = await new Promise((resolve) => {
    let fileReader = new FileReader();
    fileReader.onload = () => resolve(fileReader.result);
    fileReader.readAsDataURL(file);
  });

  return result_base64 as string;
};

export function deepFreeze<T>(obj: T): T {
  if (!obj || typeof obj !== "object") return obj;

  Object.freeze(obj);
  Object.values(obj).forEach(deepFreeze);
  return obj;
}

/**
 * Goes back in the browser history when the previous entry belongs to this
 * app. Otherwise it replaces the current entry with `fallback`, or with the
 * nearest parent route, so the user never leaves the app.
 */
export const goBack = (fallback?: string) => {
  const router = getRouter();
  if (router.history.canGoBack()) {
    router.history.back();
    return;
  }
  const matches = router.state.matches;
  const current = matches.at(-1)?.pathname;
  const parent = matches
    .slice()
    .reverse()
    .find((match) => match.pathname !== current)?.pathname;
  navigate({ href: fallback ?? parent ?? "/", replace: true });
};

/**
 * Generates a timestamp-suffixed alternate identifier, e.g. for grouping
 * resources (prescriptions, dispense orders) created in a single submission.
 *
 * @example generateAlternateIdentifier(encounterId) // "<id>-2025-01-01T10-00-00-000Z"
 */
export const generateAlternateIdentifier = (prefix?: string) =>
  `${prefix}-${new Date().toISOString().replace(/[:.]/g, "-")}`;
