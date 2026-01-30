import { atomWithStorage } from "jotai/utils";

export const DEVELOPER_MODE_KEY = "care:developer_mode";

export const developerModeAtom = atomWithStorage<boolean>(
  DEVELOPER_MODE_KEY,
  false,
);
