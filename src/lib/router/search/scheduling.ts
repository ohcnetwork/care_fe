import { z } from "zod";

import {
  searchDate,
  searchEnum,
  searchString,
} from "@/lib/router/search/fields";

/**
 * The schedule (`ScheduleHome`) of a location or a healthcare service, and
 * the availability tab of a user, with its template and exception sheets.
 */
export const scheduleHomeSearch = z.object({
  tab: searchEnum(["schedule", "exceptions"]),
  /** The create template or add exception sheet that is open. */
  sheet: searchEnum(["create_template", "add_exception"]),
  /** The dates that the add exception sheet starts with. */
  valid_from: searchDate(),
  valid_to: searchDate(),
  /** The id of the template that the edit sheet shows. */
  edit: searchString(),
});
