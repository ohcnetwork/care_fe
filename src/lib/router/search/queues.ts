import { z } from "zod";

import {
  paginationSearch,
  searchBoolean,
  searchDate,
  searchString,
} from "@/lib/router/search/fields";

/**
 * The queue list (`QueuesIndex`), of a practitioner, a location or a
 * healthcare service.
 */
export const queueListSearch = z.object({
  ...paginationSearch,
  date: searchDate(),
  /** The user id of the practitioner whose queues the list shows. */
  resource_id: searchString(),
});

/**
 * The queue board (`ManageQueuePage`) and its ongoing and completed tabs, of
 * a practitioner, a location or a healthcare service.
 */
export const queueBoardSearch = z.object({
  autoRefresh: searchBoolean(),
  /** The patient name search of the ongoing tab. */
  search: searchString(),
  patient: searchString(),
  patient_name: searchString(),
});
