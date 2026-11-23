import { atomWithStorage, createJSONStorage } from "jotai/utils";

import { CurrentUserRetrieveSpec } from "@/types/user/user";

export const userAtom = atomWithStorage<CurrentUserRetrieveSpec | undefined>(
  "care-auth-user",
  undefined,
  createJSONStorage(() => sessionStorage),
);
