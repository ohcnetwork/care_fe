import { AppCacheDB, OfflineWritesEntry } from "./AppcacheDB";
import { DependencySchema } from "./dependencySchema";
import { IdMap } from "./idMap";

/**
 * Recursively resolves all ancestor IDs in the dependency chain
 * and adds them to the ID map. This ensures that when processing
 * offline writes, all parent, grandparent, and ancestor IDs are
 * properly mapped to their server IDs before replacement.
 *
 * @param parentMutationId - The immediate parent mutation ID to start resolving from
 * @param idMap - The ID map to populate with resolved mappings
 */
async function resolveAncestorIds(
  parentMutationId: string,
  idMap: IdMap,
): Promise<void> {
  if (!parentMutationId.startsWith("offline-")) {
    return;
  }

  // Get the parent record
  const db = new AppCacheDB();
  const parentEntry = await db.OfflineWrites.get(parentMutationId);

  if (!parentEntry) {
    console.warn(`Parent mutation ${parentMutationId} not found`);
    return;
  }

  if (parentEntry.syncStatus === "success" && parentEntry.response) {
    const response = parentEntry.response as any;
    if (response.id) {
      console.log(
        `Resolved ancestor ID: ${parentMutationId} -> ${response.id}`,
      );
      idMap.addMapping(parentMutationId, response.id);
    }
  }

  if (parentEntry.parentMutationId) {
    await resolveAncestorIds(parentEntry.parentMutationId, idMap);
  }
}

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

function replaceOfflineIdsInUrl(url: string, idMap: IdMap): string {
  return url.replace(
    /offline-[\w-]+/g,
    (match) => idMap.getServerId(match) || match,
  );
}

/**
 * @param write - The offline write entry to process
 * @param dependencySchema - The dependency schema defining relationships between resources
 * @returns A new write entry with offline IDs replaced by server IDs
 */
export async function replaceOfflineIdsInWrite(
  write: OfflineWritesEntry,
  dependencySchema: DependencySchema,
): Promise<OfflineWritesEntry> {
  const deps = dependencySchema[write.type];
  if (!deps) return write;

  if (
    !write.parentMutationId ||
    !write.parentMutationId.startsWith("offline-")
  ) {
    console.log(
      `No parent mutation found for ${write.id}, skipping ID replacement`,
    );
    return write;
  }
  console.log("parentt id", write.parentMutationId);
  const newWrite: OfflineWritesEntry = JSON.parse(JSON.stringify(write));

  const tempIdMap = new IdMap();

  await resolveAncestorIds(write.parentMutationId, tempIdMap);
  console.log("tempIdMap", tempIdMap);
  for (const dep of deps) {
    let container = newWrite[dep.location as keyof OfflineWritesEntry];
    console.log("container", container);
    if (!container) continue;
    walkAndReplace(container, dep.path, tempIdMap);
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
        req.url = replaceOfflineIdsInUrl(req.url, tempIdMap);
      }
    }
  }

  return newWrite;
}
