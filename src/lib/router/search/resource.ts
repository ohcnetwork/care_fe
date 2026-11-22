import { z } from "zod";

import {
  paginationSearch,
  searchBoolean,
  searchEnum,
  searchPositiveInt,
  searchString,
} from "@/lib/router/search/fields";
import { ResourceRequestStatus } from "@/types/resourceRequest/resourceRequest";

/** The resource requests of a facility: `ResourceList`. */
export const resourceListSearch = z.object({
  ...paginationSearch,
  status: searchEnum(ResourceRequestStatus),
  title: searchString(),
  /** `true` lists the requests assigned to the facility. */
  incoming: searchBoolean(),
});

/** The resource request form: `ResourceForm`. */
export const resourceFormSearch = z.object({
  /** The patient that a new request is for. */
  related_patient: searchString(),
});

/** The comments of a resource request, on its page. */
export const resourceCommentListSearch = z.object({
  page: searchPositiveInt(),
});
