import { atomWithStorage, createJSONStorage } from "jotai/utils";

import { CurrentUserRead } from "@/types/user/user";

export const userAtom = atomWithStorage<CurrentUserRead | undefined>(
  "care-auth-user",
  undefined,
  createJSONStorage(() => sessionStorage),
);
