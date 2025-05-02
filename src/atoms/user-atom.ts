import { atomWithStorage, createJSONStorage } from "jotai/utils";

import { AuthUserModel } from "@/components/Users/models";

export const userAtom = atomWithStorage<AuthUserModel | undefined>(
  "user-atom",
  undefined,
  createJSONStorage(() => sessionStorage),
);
