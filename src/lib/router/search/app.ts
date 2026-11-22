import { z } from "zod";

import { searchBoolean } from "@/lib/router/search/fields";

/**
 * Keys that the app reads on every page: `ProductionWarningBanner`.
 * No route lists them, so they pass through.
 */
export const appSearch = z.object({
  /** `true` turns on developer mode. */
  debug: searchBoolean(),
});
