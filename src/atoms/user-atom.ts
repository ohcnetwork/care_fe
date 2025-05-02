import { atomWithStorage, createJSONStorage } from "jotai/utils";

interface UserState {
  username?: string;
}

export const userAtom = atomWithStorage<UserState>(
  "user-atom",
  {},
  createJSONStorage(() => sessionStorage),
);
