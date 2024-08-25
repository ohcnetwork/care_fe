import { usePath } from "raviger";

/**
 * Keys can be any value that is present in the url.
 * Value must be equivalent to the link of the sidebar item.
 * Entries must be sorted based on priority.
 * Whichever key is present in the url first, becomes the active link returned
 * by `useActiveLink` hook.
 */
const activeLinkPriority = {
  "/patients": "/patients",
  "/patient/": "/patients",
  "/death_report": "/patients",
  "/assets": "/assets",
  "/sample": "/sample",
  "/shifting": "/shifting",
  "/resource": "/resource",
  "/external_results": "/external_results",
  "/users": "/users",
  "/notice_board": "/notice_board",
  "/facility": "/facility",
};

/**
 * @returns The active link of the current path.
 */
export default function useActiveLink() {
  const path = usePath() || "";
  const key = Object.keys(activeLinkPriority).find((key) => path.includes(key));
  return key && (activeLinkPriority as any)[key];
}
