import { z } from "zod";

import {
  searchEnum,
  searchPositiveInt,
  searchString,
} from "@/lib/router/search/fields";
import { QuestionnaireResponseStatus } from "@/types/questionnaire/questionnaireResponse";

/**
 * The questionnaire fill page, and the question types that read the URL
 * (encounter, medication request).
 */
export const questionnaireFillSearch = z.object({
  /** The id of a server draft to continue. */
  continue_draft: searchString(),
  resume_local_draft: searchEnum(["true", "false"]),
  /** The id of a prescription that the medication request question edits. */
  prescription: searchString(),
  toDischarge: searchEnum(["true", "false"]),
  /**
   * The encounter page that the fill page returns to. The page checks it
   * with `encounterPageKeySchema`.
   */
  return_page: searchString(),
});

/** The responses of a facility, a location or a device. */
export const resourceResponseListSearch = z.object({
  page: searchPositiveInt(),
  /** The id of the selected response. */
  response: searchString(),
  /** A questionnaire id. */
  questionnaire: searchString(),
  questionnaire_title: searchString(),
  /** A user id. */
  created_by: searchString(),
  creator_name: searchString(),
  status: searchEnum(QuestionnaireResponseStatus),
});
