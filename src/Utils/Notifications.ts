import { toast } from "sonner";

/**
 * Formats input string to a more human readable format
 * @param {string} key - The key to format
 * @returns {string} The formatted key
 * @example
 * formatKey("patient_name") => "Patient Name"
 */
const formatKey = (key: string) => {
  return key
    .replace(/[^a-zA-Z0-9]+/g, " ") // Replace non-alphanumeric characters with a space
    .trim()
    .split(" ")
    .map(
      (word) =>
        word.charAt(0).toLocaleUpperCase() + word.slice(1).toLocaleLowerCase(),
    ) // Capitalize the first letter of each word and lowercase the rest
    .join(" ");
};

const notifyError = (error: unknown) => {
  let errorMsg = "";
  if (!error) {
    errorMsg = "Something went wrong...!";
  } else if (typeof error === "string") {
    errorMsg = error.length > 100 ? "Something went wrong...!" : error;
  } else if (typeof error === "object" && "detail" in error && error.detail) {
    errorMsg = String(error.detail);
  } else {
    for (const [key, value] of Object.entries(error)) {
      const keyName = formatKey(key);
      if (Array.isArray(value)) {
        const uniques = [...new Set(value)];
        errorMsg += `${keyName} - ${uniques.splice(0, 5).join(", ")}`;
      } else if (typeof value === "string") {
        errorMsg += `${keyName} - ${value}`;
      } else {
        errorMsg += `${keyName} - Bad Request`;
      }
      errorMsg += "\n";
    }
  }
  toast.error(errorMsg);
};

/**
 * 400 Bad Request handler
 * @deprecated TODO: add a better error handler
 */
export const BadRequest = ({ errs }: { errs: unknown }) => {
  if (Array.isArray(errs)) {
    errs.forEach((error) => notifyError(error));
  } else {
    notifyError(errs);
  }
};
