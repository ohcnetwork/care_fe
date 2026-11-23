import { z } from "zod";

import { searchEnum } from "@/lib/router/search/fields";

/** The sign-in page and the password reset page: `Login`. */
export const loginPageSearch = z.object({
  /** The sign-in tab. */
  mode: searchEnum(["staff", "patient"]),
});
