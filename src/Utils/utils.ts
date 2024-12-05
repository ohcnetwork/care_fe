import { PatientModel } from "@/components/Patient/models";

import { AREACODES, IN_LANDLINE_AREA_CODES } from "@/common/constants";
import phoneCodesJson from "@/common/static/countryPhoneAndFlags.json";

import dayjs from "@/Utils/dayjs";

interface ApacheParams {
  age: number;
  organFailure: boolean;
  temperatureC: number;
  heartRate: number;
  respiratoryRate: number;
  sodium: number;
  potassium: number;
  creatinine: number;
  acuteRenalFailure: boolean;
  hematocrit: number;
  wbcCount: number;
  glasgowComaScore: number;
  fiO2: number;
}

export const calculateApache2Score = (apacheParams: ApacheParams): number => {
  const {
    age,
    organFailure,
    temperatureC,
    heartRate,
    respiratoryRate,
    sodium,
    potassium,
    creatinine,
    acuteRenalFailure,
    hematocrit,
    wbcCount,
    glasgowComaScore,
    fiO2,
  } = apacheParams;

  const ageScore = age < 65 ? 1 : 0;
  const organFailureScore = organFailure ? 1 : 0;
  const temperatureScore = temperatureC < 37.5 ? 1 : 0;
  const heartRateScore = heartRate < 60 ? 1 : 0;
  const respiratoryRateScore = respiratoryRate < 12 ? 1 : 0;
  const sodiumScore = sodium < 135 ? 1 : 0;
  const potassiumScore = potassium < 3.5 ? 1 : 0;
  const creatinineScore = creatinine < 0.7 ? 1 : 0;
  const acuteRenalFailureScore = acuteRenalFailure ? 1 : 0;
  const hematocritScore = hematocrit < 0.45 ? 1 : 0;
  const wbcCountScore = wbcCount < 10 ? 1 : 0;
  const glasgowComaScoreScore = glasgowComaScore < 6 ? 1 : 0;
  const fiO2Score = fiO2 < 0.7 ? 1 : 0;

  const totalScore =
    ageScore +
    organFailureScore +
    temperatureScore +
    heartRateScore +
    respiratoryRateScore +
    sodiumScore +
    potassiumScore +
    creatinineScore +
    acuteRenalFailureScore +
    hematocritScore +
    wbcCountScore +
    glasgowComaScoreScore +
    fiO2Score;

  return totalScore;
};

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

export const formatDate = (date: DateLike, format = DATE_FORMAT) =>
  formatDateTime(date, format);

export const formatTime = (date: DateLike, format = TIME_FORMAT) =>
  formatDateTime(date, format);

export const relativeDate = (date: DateLike, withoutSuffix = false) => {
  const obj = dayjs(date);
  return `${obj.fromNow(withoutSuffix)}${
    withoutSuffix ? " ago " : ""
  } at ${obj.format(TIME_FORMAT)}`;
};

export const formatName = (user: { first_name: string; last_name: string }) => {
  return `${user.first_name} ${user.last_name}`;
};

export const formatDisplayName = (user: {
  first_name: string;
  last_name: string;
  username: string;
}) => {
  return user.first_name && user.last_name
    ? `${user.first_name} ${user.last_name}`
    : user.first_name || user.username || "User";
};

export const relativeTime = (time?: DateLike) => {
  return `${dayjs(time).fromNow()}`;
};

export const dateQueryString = (date: DateLike) => {
  if (!date || !dayjs(date).isValid()) return "";
  return dayjs(date).format("YYYY-MM-DD");
};

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Referred from: https://stackoverflow.com/a/9039885/7887936
 * @returns `true` if device is iOS, else `false`
 */
function _isAppleDevice() {
  if (navigator.platform.includes("Mac")) return true;
  return (
    [
      "iPad Simulator",
      "iPhone Simulator",
      "iPod Simulator",
      "iPad",
      "iPhone",
      "iPod",
    ].includes(navigator.platform) ||
    // iPad on iOS 13 detection
    (navigator.userAgent.includes("Mac") && "ontouchend" in document)
  );
}

/**
 * `true` if device is an Apple device, else `false`
 */
export const isAppleDevice = _isAppleDevice();

/**
 * `true` if device is an iOS device, else `false`
 */
export const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

/**
 * Conditionally concatenate classes. An alternate replacement for `clsx`.
 *
 * **Example Usage:**
 * ```tsx
 * <div className={classNames("md:flex", true && "p-0", false && "p-10")} />
 * // "md:flex p-0"
 * ```
 */
export const classNames = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(" ");
};

export const getPincodeDetails = async (pincode: string, apiKey: string) => {
  const response = await fetch(
    `https://api.data.gov.in/resource/6176ee09-3d56-4a3b-8115-21841576b2f6?api-key=${apiKey}&format=json&filters[pincode]=${pincode}&limit=1`,
  );
  const data = await response.json();
  return data.records[0];
};

export const includesIgnoreCase = (str1: string, str2: string) => {
  if (!str1 || !str2) return false;
  const lowerCaseStr1 = str1.toLowerCase();
  const lowerCaseStr2 = str2.toLowerCase();
  return (
    lowerCaseStr1.includes(lowerCaseStr2) ||
    lowerCaseStr2.includes(lowerCaseStr1)
  );
};

export const getExperienceSuffix = (date?: Date) => {
  if (!date) return "0 Years";

  const today = new Date();

  let m = (today.getFullYear() - date.getFullYear()) * 12;
  m -= date.getMonth();
  m += today.getMonth();

  let str = "";

  const years = Math.floor(m / 12);
  const months = m % 12;

  if (years) str += `${years} years `;
  if (months) str += `${months} months`;

  return str;
};

export const formatCurrency = (price: number) =>
  price?.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
  });

export const isUserOnline = (user: { last_login: DateLike }) => {
  return dayjs().subtract(5, "minutes").isBefore(user.last_login);
};

export interface CountryData {
  flag: string;
  name: string;
  code: string;
}

export const parsePhoneNumber = (phoneNumber: string, countryCode?: string) => {
  if (!phoneNumber) return "";
  if (phoneNumber === "+91") return "";
  const phoneCodes: Record<string, CountryData> = phoneCodesJson;
  let parsedNumber = phoneNumber.replace(/[-+() ]/g, "");
  if (countryCode && phoneCodes[countryCode]) {
    parsedNumber = phoneCodes[countryCode].code + parsedNumber;
  } else if (!phoneNumber.startsWith("+")) {
    return undefined;
  }
  parsedNumber = "+" + parsedNumber;
  return parsedNumber;
};

export const formatPhoneNumber = (phoneNumber: string) => {
  if (phoneNumber.startsWith("+91")) {
    phoneNumber = phoneNumber.startsWith("+910")
      ? phoneNumber.slice(4)
      : phoneNumber.slice(3);
    const landline_code = IN_LANDLINE_AREA_CODES.find((code) =>
      phoneNumber.startsWith(code),
    );
    if (landline_code === undefined)
      return "+91" + " " + phoneNumber.slice(0, 5) + " " + phoneNumber.slice(5);
    const subscriber_no_length = 10 - landline_code.length;
    return (
      "+91" +
      " " +
      landline_code +
      " " +
      phoneNumber.slice(
        landline_code.length,
        subscriber_no_length / 2 + landline_code.length,
      ) +
      " " +
      phoneNumber.slice(subscriber_no_length / 2 + landline_code.length)
    );
  } else if (phoneNumber.startsWith("1800")) {
    return "1800" + " " + phoneNumber.slice(4, 7) + " " + phoneNumber.slice(7);
  } else if (phoneNumber.startsWith("+")) {
    const countryCode = getCountryCode(phoneNumber);
    if (!countryCode) return phoneNumber;
    const phoneCodes: Record<string, CountryData> = phoneCodesJson;
    return (
      "+" +
      phoneCodes[countryCode].code +
      " " +
      phoneNumber.slice(phoneCodes[countryCode].code.length + 1)
    );
  }
  return phoneNumber;
};

export const getCountryCode = (phoneNumber: string) => {
  if (phoneNumber.startsWith("+")) {
    const phoneCodes: Record<string, CountryData> = phoneCodesJson;
    const phoneCodesArr = Object.keys(phoneCodes);
    phoneNumber = phoneNumber.slice(1);
    const allMatchedCountries: { name: string; code: string }[] = [];
    for (let i = 0; i < phoneCodesArr.length; i++) {
      if (
        phoneNumber.startsWith(
          phoneCodes[phoneCodesArr[i]].code.replaceAll("-", ""),
        )
      ) {
        allMatchedCountries.push({
          name: phoneCodesArr[i],
          code: phoneCodes[phoneCodesArr[i]].code.replaceAll("-", ""),
        });
      }
    }
    // returns the country which is longest in case there are multiple matches
    if (allMatchedCountries.length === 0) return undefined;
    const matchedCountry = allMatchedCountries.reduce((max, country) =>
      max.code > country.code ? max : country,
    );
    const sameCodeCountries = allMatchedCountries.filter(
      (country) => country.code === matchedCountry.code,
    );
    if (matchedCountry === undefined) return undefined;
    // some countries share same country code but differ in area codes
    // The area codes are checked for such countries
    if (matchedCountry.code == "1") {
      const areaCode = phoneNumber.substring(1, 4);
      return (
        sameCodeCountries.find((country) =>
          AREACODES[country.name]?.includes(areaCode),
        )?.name ?? "US"
      );
    } else if (matchedCountry.code === "262") {
      const areaCode = phoneNumber.substring(3, 6);
      return sameCodeCountries.find((country) =>
        AREACODES[country.name]?.includes(areaCode),
      )?.name;
    } else if (matchedCountry.code === "61") {
      const areaCode = phoneNumber.substring(2, 7);
      return (
        sameCodeCountries.find((country) =>
          AREACODES[country.name]?.includes(areaCode),
        )?.name ?? "AU"
      );
    } else if (matchedCountry.code === "599") {
      const areaCode = phoneNumber.substring(3, 4);
      return (
        sameCodeCountries.find((country) =>
          AREACODES[country.name]?.includes(areaCode),
        )?.name ?? "CW"
      );
    } else if (matchedCountry.code == "7") {
      const areaCode = phoneNumber.substring(1, 2);
      return (
        sameCodeCountries.find((country) =>
          AREACODES[country.name]?.includes(areaCode),
        )?.name ?? "RU"
      );
    } else if (matchedCountry.code == "47") {
      const areaCode = phoneNumber.substring(2, 4);
      return (
        sameCodeCountries.find((country) =>
          AREACODES[country.name]?.includes(areaCode),
        )?.name ?? "NO"
      );
    }
    return matchedCountry.name;
  }
  return undefined;
};

const getRelativeDateSuffix = (abbreviated: boolean) => {
  return {
    day: abbreviated ? "d" : "days",
    month: abbreviated ? "mo" : "months",
    year: abbreviated ? "yr" : "years",
  };
};

export const patientAgeInYears = (obj: PatientModel) => {
  const start = dayjs(
    obj.date_of_birth
      ? new Date(obj.date_of_birth)
      : new Date(obj.year_of_birth!, 0, 1),
  );

  const end = dayjs(
    obj.death_datetime ? new Date(obj.death_datetime) : new Date(),
  );

  return end.diff(start, "years");
};

export const formatPatientAge = (obj: PatientModel, abbreviated = false) => {
  const suffixes = getRelativeDateSuffix(abbreviated);

  const start = dayjs(
    obj.date_of_birth
      ? new Date(obj.date_of_birth)
      : new Date(obj.year_of_birth!, 0, 1),
  );

  const end = dayjs(
    obj.death_datetime ? new Date(obj.death_datetime) : new Date(),
  );

  const years = end.diff(start, "years");
  if (years) {
    return `${years}${suffixes.year}`;
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

export const scrollTo = (id: string | boolean) => {
  const element = document.querySelector(`#${id}`);
  element?.scrollIntoView({ behavior: "smooth", block: "center" });
};

export const compareBy = <T extends object>(key: keyof T) => {
  return (a: T, b: T) => {
    return a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0;
  };
};

export const compareByDateString = <T extends object>(key: keyof T) => {
  return (a: T, b: T) => {
    const aV = new Date(a[key] as string);
    const bV = new Date(b[key] as string);
    return aV < bV ? -1 : aV > bV ? 1 : 0;
  };
};

export const isValidUrl = (url?: string) => {
  try {
    new URL(url ?? "");
    return true;
  } catch {
    return false;
  }
};

export const mergeQueryOptions = <T extends object>(
  selected: T[],
  queryOptions: T[],
  compareBy: (obj: T) => T[keyof T],
) => {
  if (!selected.length) return queryOptions;
  return [
    ...selected,
    ...queryOptions.filter(
      (option) => !selected.find((s) => compareBy(s) === compareBy(option)),
    ),
  ];
};

export const properRoundOf = (value: number) => {
  if (value % 1 === 0) {
    return value.toFixed();
  }
  return value.toFixed(2);
};

export const isPostPartum = (data_of_delivery?: string) => {
  return dayjs().diff(data_of_delivery, "week") <= 6;
};

export const isAntenatal = (menstruation_start_date?: string) => {
  return dayjs().diff(menstruation_start_date, "month") <= 9;
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

export type ValueDescription = {
  till?: number;
  text: React.ReactNode;
  className?: string;
  color?: string;
};

export const getValueDescription = (
  valueDescriptions: ValueDescription[],
  value: number,
) => {
  return valueDescriptions.find((vd) => (vd.till || 0) >= (value || 0));
};

export const rangeValueDescription = (range: {
  low?: number;
  high?: number;
}) => {
  const results: ValueDescription[] = [];

  if (range.low != null) {
    results.push({
      till: range.low,
      text: "Low",
      className: "text-red-500",
    });
  }

  results.push({
    till: range.high,
    text: "Normal",
    className: "text-green-500",
  });

  if (range.high != null) {
    results.push({
      text: "High",
      className: "text-red-500",
    });
  }

  return results;
};

export const celsiusToFahrenheit = (celsius: number) => {
  return (celsius * 9) / 5 + 32;
};

export const fahrenheitToCelsius = (fahrenheit: number) => {
  return ((fahrenheit - 32) * 5) / 9;
};

/**
 * Although same as `Objects.keys(...)`, this provides better type-safety.
 */
export const keysOf = <T extends object>(obj: T) => {
  return Object.keys(obj) as (keyof T)[];
};
