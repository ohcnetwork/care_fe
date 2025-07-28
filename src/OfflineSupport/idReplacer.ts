import { OfflineWritesEntry } from "./AppcacheDB";
import { DependencySchema } from "./dependencySchema";
import { IdMap } from "./idMap";

/**
 * Recursively walk an object along a path and replace offline IDs with server IDs.
 * Handles arrays ("*") in the path.
 */
function walkAndReplace(obj: any, path: string[], idMap: IdMap) {
  if (!obj || path.length === 0) return;
  const [key, ...rest] = path;
  if (key === "*") {
    if (Array.isArray(obj)) {
      obj.forEach((item) => walkAndReplace(item, rest, idMap));
    }
  } else if (rest.length === 0) {
    if (typeof obj[key] === "string" && obj[key].startsWith("offline-")) {
      const serverId = idMap.getServerId(obj[key]);
      if (serverId) obj[key] = serverId;
    }
  } else if (obj[key]) {
    walkAndReplace(obj[key], rest, idMap);
  }
}

/**
 * Replace offline IDs in URLs (special case).
 * Looks for any offline ID in the URL and replaces it with the server ID.
 */
function replaceOfflineIdsInUrl(url: string, idMap: IdMap): string {
  return url.replace(
    /offline-[\w-]+/g,
    (match) => idMap.getServerId(match) || match,
  );
}

/**
 * Replace offline IDs in a write's payload/body, mutationPathParams, and URLs using the dependency schema and IdMap.
 * Returns a new write object with replacements applied.
 */
export function replaceOfflineIdsInWrite(
  write: OfflineWritesEntry,
  dependencySchema: DependencySchema,
  idMap: IdMap,
): OfflineWritesEntry {
  const deps = dependencySchema[write.type];
  if (!deps) return write;

  // Deep clone the write to avoid mutating the original
  const newWrite: OfflineWritesEntry = JSON.parse(JSON.stringify(write));

  for (const dep of deps) {
    let container = newWrite[dep.location as keyof OfflineWritesEntry];
    if (!container) continue;
    walkAndReplace(container, dep.path, idMap);
  }

  // Special case: replace offline IDs in URLs (if present), needed in update encounter questionnair
  if (
    newWrite.payload &&
    typeof newWrite.payload === "object" &&
    "requests" in newWrite.payload &&
    Array.isArray((newWrite.payload as any).requests)
  ) {
    for (const req of (newWrite.payload as any).requests) {
      if (typeof req.url === "string") {
        req.url = replaceOfflineIdsInUrl(req.url, idMap);
      }
    }
  }

  // Also handle mutationPathParams if present and not covered by schema
  if (newWrite.mutationPathParams) {
    for (const key in newWrite.mutationPathParams) {
      const val = newWrite.mutationPathParams[key];
      if (typeof val === "string" && val.startsWith("offline-")) {
        const serverId = idMap.getServerId(val);
        if (serverId) newWrite.mutationPathParams[key] = serverId;
      }
    }
  }

  return newWrite;
}
