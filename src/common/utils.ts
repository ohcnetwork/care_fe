export function booleanFromString(str: string | undefined, fallback = false) {
  if (str === "true") return true;
  if (str === "false") return false;
  return fallback;
}
