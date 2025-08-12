import { AppCacheDB, OfflineWritesEntry } from "./AppcacheDB";
import { DependencySchema } from "./dependencySchema";
import { IdMap } from "./idMap";


async function getServerIdForOfflineRecord(
  offlineId: string,
): Promise<string | undefined> {
  const db = new AppCacheDB();
  const entry = await db.OfflineWrites.get(offlineId);

  if (entry?.syncStatus === "success" && entry.response) {
    const response = entry.response as any;
    if (response.id) {
      return response.id;
    }
  }

  return undefined;
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

  const newWrite: OfflineWritesEntry = JSON.parse(JSON.stringify(write));


  const tempIdMap = new IdMap();


  const parentServerId = await getServerIdForOfflineRecord(
    write.parentMutationId,
  );
  if (parentServerId) {
    tempIdMap.addMapping(write.parentMutationId, parentServerId);

  }

  for (const dep of deps) {
    let container = newWrite[dep.location as keyof OfflineWritesEntry];
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
