import careConfig from "@careConfig";
import { differenceInMinutes, format } from "date-fns";
import { toPng } from "html-to-image";
import { t } from "i18next";

import dayjs from "@/Utils/dayjs";
import { Time } from "@/Utils/types";
import { PatientRead } from "@/types/emr/patient/patient";

const DATE_FORMAT = "DD/MM/YYYY";
const TIME_FORMAT = "hh:mm A";
const DATE_TIME_FORMAT = `${TIME_FORMAT}; ${DATE_FORMAT}`;

type DateLike = Parameters<typeof dayjs>[0];

export const formatDateTime = (date: DateLike, format?: string) => {
  const obj = dayjs(date);

  if (format) {
    return obj.format(format);
  }

  // If time is 00:00:00 of local timezone, format as date only
  if (obj.isSame(obj.startOf("day"))) {
    return obj.format(DATE_FORMAT);
  }

  return obj.format(DATE_TIME_FORMAT);
};

export const formatTimeShort = (time: Time) => {
  return format(new Date(`1970-01-01T${time}`), "h:mm a").replace(":00", "");
};

export const relativeDate = (date: DateLike, withoutSuffix = false) => {
  const obj = dayjs(date);
  const isToday = obj.isSame(dayjs(), "day");

  const relative = obj.fromNow(withoutSuffix);

  const hasTime = !!(obj.hour() || obj.minute() || obj.second());

  if (isToday && !hasTime) {
    return t("today");
  }

  return `${relative}`;
};

export const formatName = (
  user?: {
    first_name: string;
    last_name: string;
    prefix?: string | null;
    suffix?: string | null;
    username: string;
  },
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

export const relativeTime = (time?: DateLike) => {
  return dayjs(time).fromNow();
};

export const dateQueryString = (date: DateLike) => {
  if (!date || !dayjs(date).isValid()) return "";
  return dayjs(date).format("YYYY-MM-DD");
};

export const dateTimeQueryString = (date: DateLike, isEndDate = false) => {
  if (!date || !dayjs(date).isValid()) return "";
  const d = dayjs(date).toDate();
  if (isEndDate) {
    d.setDate(d.getDate() + 1);
    d.setHours(0, 0, 0, 0);
  } else {
    d.setHours(0, 0, 0, 0);
  }
  return d.toISOString();
};

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const isAppleDevice =
  /iPhone|iPad|iPod|Mac/i.test(navigator.userAgent) ||
  (navigator.userAgent.includes("Mac") && "ontouchend" in document);

function hasTouch() {
  try {
    document.createEvent("TouchEvent");
    return true;
  } catch {
    return false;
  }
}

export const isTouchDevice = hasTouch();

export const isUserOnline = (user: { last_login: DateLike }) => {
  return user.last_login
    ? dayjs().subtract(5, "minutes").isBefore(user.last_login)
    : false;
};

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

const getRelativeDateSuffix = (abbreviated: boolean) => {
  return {
    day: abbreviated ? "d" : "days",
    month: abbreviated ? "mo" : "months",
    year: abbreviated ? "Y" : "years",
  };
};

export const formatPatientAge = (obj: PatientRead, abbreviated = false) => {
  const suffixes = getRelativeDateSuffix(abbreviated);
  const start = dayjs(
    obj.date_of_birth
      ? new Date(obj.date_of_birth)
      : new Date(obj.year_of_birth!, 0, 1),
  );

  const end = dayjs(
    obj.deceased_datetime ? new Date(obj.deceased_datetime) : new Date(),
  );

  const years = end.diff(start, "years");
  if (years) {
    return `${years} ${suffixes.year}`;
  }

  // Skip representing as no. of months/days if we don't know the date of birth
  // since it would anyways be inaccurate.
  if (!obj.date_of_birth) {
    return abbreviated
      ? `Born ${obj.year_of_birth}`
      : `Born on ${obj.year_of_birth}`;
  }

  const month = end.diff(start, "month");
  const day = end.diff(start.add(month, "month"), "day");
  if (month) {
    return `${month}${suffixes.month} ${day}${suffixes.day}`;
  }
  return `${day}${suffixes.day}`;
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

export const saveElementAsImage = async (id: string, filename: string) => {
  const element = document.getElementById(id);
  if (!element) return;

  try {
    const dataUrl = await toPng(element, {
      quality: 1.0,
    });

    const link = document.createElement("a");
    link.download = filename;
    link.href = dataUrl;
    link.click();
  } catch (error) {
    console.error("Failed to save element as image:", error);
  }
};

export const conditionalAttribute = <T>(
  condition: boolean,
  attributes: Record<string, T>,
) => {
  return condition ? attributes : {};
};

export const conditionalArrayAttribute = <T>(
  condition: boolean,
  attributes: T[],
) => {
  return condition ? attributes : [];
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
export function getWeeklyIntervalsFromTodayTill(pastDate?: Date | string) {
  if (!pastDate) {
    return [];
  }

  const intervals = [];
  let current = new Date(pastDate);
  let currentEnd = new Date();

  while (currentEnd >= current) {
    let currentStart = new Date(currentEnd);
    currentStart.setDate(currentStart.getDate() - 6);

    if (currentStart < current) {
      currentStart = current;
    }

    intervals.push({
      start: currentStart,
      end: currentEnd,
    });

    currentEnd = new Date(currentStart);
    currentEnd.setDate(currentEnd.getDate() - 1);
  }

  return intervals;
}

/**
 * Generates a URL-safe slug from a given string.
 *
 * @param title - The string to convert to a slug
 * @param maxLength - Maximum length of the slug (default: 50)
 * @returns A URL-safe slug string
 *
 * @example
 * generateSlug("Hello World!") // "hello-world"
 * generateSlug("Café & Résumé") // "cafe-resume"
 * generateSlug("Special @#$% Characters") // "special-characters"
 */
export function generateSlug(title: string, maxLength: number = 50): string {
  if (!title || typeof title !== "string") {
    return "";
  }

  return (
    title
      // Convert to lowercase
      .toLowerCase()
      // Normalize unicode characters (handles accented characters)
      .normalize("NFD")
      // Remove diacritics (accents, umlauts, etc.)
      .replace(/[\u0300-\u036f]/g, "")
      // Replace special characters and spaces with hyphens
      .replace(/[^\w\s-]/g, "")
      // Replace multiple spaces or hyphens with single hyphen
      .replace(/[\s-]+/g, "-")
      // Remove leading and trailing hyphens
      .replace(/^-+|-+$/g, "")
      // Limit length
      .slice(0, maxLength)
      // Remove trailing hyphens after truncation
      .replace(/-+$/, "")
  );
}

/**
 * Returns a formatted string of items, truncated if longer than maxItems
 * Eg.Formatted string like "item1, item2 ... +{count} more"
 * @param items Array of items to format
 * @param maxItems Maximum number of items to show before truncating
 * @param getDisplayValue Function to get display value from each item
 * @param moreText Text to show for additional items (e.g. "more" default is more)
 * @returns Formatted string like "item1, item2 ... +{count} more"
 */
export function formatTruncatedList<T>(
  items: T[],
  maxItems: number,
  getDisplayValue: (item: T) => string,
  moreText?: string,
): string {
  if (!items?.length) return "";

  if (items.length <= maxItems) {
    return items.map(getDisplayValue).join(", ");
  }

  const displayedItems = items.slice(0, maxItems);
  const remainingCount = items.length - maxItems;

  return `${displayedItems.map(getDisplayValue).join(", ")} ... +${remainingCount} ${t("more") || moreText}`;
}
