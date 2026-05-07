import * as fs from "fs";
import * as path from "path";

/**
 * Generate expected slug from title
 * @param title - The title to convert to a slug
 * @returns The expected slug value
 */
export function expectedSlug(title: string): string {
  return title.toLowerCase().replace(/\s+/g, "-").slice(0, 25);
}

export function getApiHeaders(): {
  Authorization: string;
  "Content-Type": string;
} {
  const authFile = path.resolve("tests/.auth/user.json");
  const storageState = JSON.parse(fs.readFileSync(authFile, "utf-8"));
  const localStorage = storageState.origins?.[0]?.localStorage ?? [];
  const tokenEntry = localStorage.find(
    (item: { name: string; value: string }) =>
      item.name === "care_access_token",
  );
  if (!tokenEntry) throw new Error("No access token in auth storage state");
  return {
    Authorization: `Bearer ${tokenEntry.value}`,
    "Content-Type": "application/json",
  };
}

export function getApiUrl(): string {
  return process.env.REACT_CARE_API_URL || "http://localhost:9000";
}
