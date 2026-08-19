// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";

import queryClient, {
  clearQueryPersistenceCache,
  OFFLINE_CACHE_KEY,
} from "@/Utils/request/queryClient";

// `createAsyncStoragePersister` throttles saves with a 1000ms interval, so a
// save queued before clearing fires within that window. Wait a little past it
// to prove no queued save rewrites the cache.
const PERSISTER_THROTTLE_MS = 1000;
const flush = () =>
  new Promise((resolve) => setTimeout(resolve, PERSISTER_THROTTLE_MS + 300));

describe("clearQueryPersistenceCache", () => {
  beforeEach(() => {
    queryClient.clear();
    localStorage.setItem(
      OFFLINE_CACHE_KEY,
      JSON.stringify({ clientState: {}, timestamp: 0 }),
    );
  });

  it("removes the persisted cache blob from localStorage", async () => {
    expect(localStorage.getItem(OFFLINE_CACHE_KEY)).not.toBeNull();
    await clearQueryPersistenceCache();
    expect(localStorage.getItem(OFFLINE_CACHE_KEY)).toBeNull();
  });

  it("does not let a queued persistence save restore the cache after clearing", async () => {
    // Seed an in-memory query that opts into persistence. Removing it emits a
    // cache event that the persistence subscription would otherwise save back
    // through the async throttle, re-creating the storage key after logout.
    await queryClient.fetchQuery({
      queryKey: ["persisted"],
      queryFn: () => ({ secret: "value" }),
      meta: { persist: true },
    });

    await clearQueryPersistenceCache();
    // Give any throttled save a chance to fire.
    await flush();

    expect(localStorage.getItem(OFFLINE_CACHE_KEY)).toBeNull();
  });
});
