import { usePath } from "raviger";

import { keysOf } from "@/Utils/utils";

/**
 * Keys can be any value that is present in the url.
 * Value must be equivalent to the link of the sidebar item.
 * Entries must be sorted based on priority.
 * Whichever key is present in the url first, becomes the active link returned
 * by `useActiveLink` hook.
 */
const activeLinkPriority = {
  "/patient/home": "/patient/home",
  "/patients": "/patients",
  "/patient/": "/patients",
  "/death_report": "/patients",
  "/assets": "/assets",
  "/shifting": "/shifting",
  "/resource": "/resource",
  "/users": "/users",
  "/notice_board": "/notice_board",
  "/appointments": "/appointments",
  "/facility": "/facility",
};

/**
 * @returns The active link of the current path.
 */
export default function useActiveLink() {
  const path = usePath() || "";
  const key = keysOf(activeLinkPriority).find((key) => path.includes(key));
  return key && activeLinkPriority[key];
}
