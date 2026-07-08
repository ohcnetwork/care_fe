// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";

import { clearQueryPersistenceCache } from "@/Utils/request/queryClient";

describe("clearQueryPersistenceCache", () => {
  beforeEach(() => {
    localStorage.setItem(
      "REACT_QUERY_OFFLINE_CACHE",
      JSON.stringify({ clientState: {}, timestamp: 0 }),
    );
  });

  it("removes the persisted cache blob from localStorage", async () => {
    expect(localStorage.getItem("REACT_QUERY_OFFLINE_CACHE")).not.toBeNull();
    await clearQueryPersistenceCache();
    expect(localStorage.getItem("REACT_QUERY_OFFLINE_CACHE")).toBeNull();
  });
});
