import {
  AREACODES,
  IN_LANDLINE_AREA_CODES,
  USER_TYPES,
} from "../Common/constants";
import phoneCodesJson from "../Common/static/countryPhoneAndFlags.json";
import dayjs from "./dayjs";
import { UserModel } from "../Components/Users/models";
import { PatientModel } from "../Components/Patient/models";

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

interface ISchema {
  [key: string]: {
    prop: string;
    oneOf?: string[];
    parse?: (value: any) => any;
    type?: any;
    required?: boolean;
  };
}

export const parseCsvFile = async (
  file: File,
  schema: ISchema | undefined = undefined
) => {
  const parseWithSchema: any = (schema: any, data: any) =>
    Object.keys(schema).reduce((acc, key) => {
      if (schema[key]?.oneOf && !schema[key].oneOf.includes(data[key]))
        throw new Error(`${key} should be one of the ${schema[key].oneOf}`);

      const value =
        typeof schema[key]?.type === "object"
          ? parseWithSchema(schema[key]?.type, data)
          : schema[key]?.parse?.(data[key]) ?? data[key];

      if (schema[key]?.required && (value === undefined || value === null))
        throw new Error(`${key} is required`);

      return value === undefined || value === null
        ? acc
        : {
            ...acc,
            [schema[key]?.prop]: value,
          };
    }, {});

  const csvData = (await file.text())
    .trim()
    .split("\n")
    .map((row: string) => row.split(","));

  const parsed = csvData
    .map((row: string[]) =>
      row.reduce((acc, val, i) => ({ ...acc, [csvData[0][i]]: val }), {})
    )
    .splice(1)
    .map((csvMap: any) => (schema ? parseWithSchema(schema, csvMap) : csvMap));

  return parsed;
};

export const getPincodeDetails = async (pincode: string, apiKey: string) => {
  const response = await fetch(
    `https://api.data.gov.in/resource/6176ee09-3d56-4a3b-8115-21841576b2f6?api-key=${apiKey}&format=json&filters[pincode]=${pincode}&limit=1`
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
      phoneNumber.startsWith(code)
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
        subscriber_no_length / 2 + landline_code.length
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
          phoneCodes[phoneCodesArr[i]].code.replaceAll("-", "")
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
      max.code > country.code ? max : country
    );
    const sameCodeCountries = allMatchedCountries.filter(
      (country) => country.code === matchedCountry.code
    );
    if (matchedCountry === undefined) return undefined;
    // some countries share same country code but differ in area codes
    // The area codes are checked for such countries
    if (matchedCountry.code == "1") {
      const areaCode = phoneNumber.substring(1, 4);
      return (
        sameCodeCountries.find((country) =>
          AREACODES[country.name]?.includes(areaCode)
        )?.name ?? "US"
      );
    } else if (matchedCountry.code === "262") {
      const areaCode = phoneNumber.substring(3, 6);
      return sameCodeCountries.find((country) =>
        AREACODES[country.name]?.includes(areaCode)
      )?.name;
    } else if (matchedCountry.code === "61") {
      const areaCode = phoneNumber.substring(2, 7);
      return (
        sameCodeCountries.find((country) =>
          AREACODES[country.name]?.includes(areaCode)
        )?.name ?? "AU"
      );
    } else if (matchedCountry.code === "599") {
      const areaCode = phoneNumber.substring(3, 4);
      return (
        sameCodeCountries.find((country) =>
          AREACODES[country.name]?.includes(areaCode)
        )?.name ?? "CW"
      );
    } else if (matchedCountry.code == "7") {
      const areaCode = phoneNumber.substring(1, 2);
      return (
        sameCodeCountries.find((country) =>
          AREACODES[country.name]?.includes(areaCode)
        )?.name ?? "RU"
      );
    } else if (matchedCountry.code == "47") {
      const areaCode = phoneNumber.substring(2, 4);
      return (
        sameCodeCountries.find((country) =>
          AREACODES[country.name]?.includes(areaCode)
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

export const formatPatientAge = (obj: PatientModel, abbreviated = false) => {
  const suffixes = getRelativeDateSuffix(abbreviated);

  const start = dayjs(
    obj.date_of_birth
      ? new Date(obj.date_of_birth)
      : new Date(obj.year_of_birth, 0, 1)
  );

  const end = dayjs(
    obj.death_datetime ? new Date(obj.death_datetime) : new Date()
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

export const showUserDelete = (authUser: UserModel, targetUser: UserModel) => {
  // Auth user should be higher in hierarchy than target user
  if (
    USER_TYPES.indexOf(authUser.user_type) <=
    USER_TYPES.indexOf(targetUser.user_type)
  )
    return false;

  if (
    authUser.user_type === "StateAdmin" &&
    targetUser.state_object?.id === authUser.state
  )
    return true;

  if (
    authUser.user_type === "DistrictAdmin" &&
    targetUser.district_object?.id === authUser.district
  )
    return true;

  return false;
};

export const compareBy = <T extends object>(key: keyof T) => {
  return (a: T, b: T) => {
    return a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0;
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
  compareBy: (obj: T) => T[keyof T]
) => {
  if (!selected.length) return queryOptions;
  return [
    ...selected,
    ...queryOptions.filter(
      (option) => !selected.find((s) => compareBy(s) === compareBy(option))
    ),
  ];
};

export const properRoundOf = (value: number) => {
  if (value % 1 === 0) {
    return value.toFixed();
  }
  return value.toFixed(2);
};
