import { t } from "i18next";

import { readFileAsDataURL } from "@/Utils/utils";

import { FilesEditor } from "@/components/QuestionnaireV2/structured/types/files/FilesEditor";
import {
  makeToRequests,
  rowSchema,
  unnamedFileRowIds,
} from "@/components/QuestionnaireV2/structured/types/files/model";

import type {
  StructuredInputProps,
  StructuredTypeDefinition,
} from "@/components/QuestionnaireV2/structured/types";

function FilesInput(props: StructuredInputProps) {
  if (!props.encounterId) return null;
  return <FilesEditor {...props} />;
}

// The real `readFileAsDataURL` is wired here so the model can stay free of
// Vite-only imports and remain safe to load in the node test harness.
const toRequests = makeToRequests({ readFileAsDataURL });

export const filesDefinition: StructuredTypeDefinition<"files"> = {
  type: "files",
  component: FilesInput,
  // Encounter only: the upload URL is composed from `encounterId` alone and
  // nothing in this type reads a facility — requiring one would show the
  // "requires context" placeholder on a mount that can upload perfectly well.
  requires: ["encounterId"],
  subjects: ["encounter"],
  /**
   * File rows carry a raw `File`, a live browser handle with no JSON
   * representation, so they cannot be restored from serialized drafts.
   * Attachments in this section are lost after a crash, reload, or accidental
   * navigation; other structured sections can still restore normally because
   * the exclusion is scoped to this type.
   */
  draftPolicy: "exclude",
  contract: 2,
  toRequests,
  rowSchema,
  // i18n boundary: `unnamedFileRowIds` stays pure; this definition turns its
  // row ids into translated errors bound to the `name` column.
  validate: (_projection, edits, questionId) =>
    unnamedFileRowIds(edits).map((rowId) => ({
      question_id: questionId,
      field_key: "name",
      row_id: rowId,
      error: t("field_required"),
      required: true,
    })),
};
