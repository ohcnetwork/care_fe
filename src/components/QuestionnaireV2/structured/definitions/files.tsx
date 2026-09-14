import {
  FilesQuestion,
  validateFileUploadQuestion,
} from "@/components/Questionnaire/QuestionTypes/FileQuestion";

import { readFileAsDataURL } from "@/Utils/utils";

import type {
  StructuredInputProps,
  StructuredTypeDefinition,
} from "@/components/QuestionnaireV2/structured/types";
import { structuredReferenceId } from "@/components/QuestionnaireV2/structured/types";
import { useLegacyResponseCallback } from "./adapt";

function FilesInput(props: StructuredInputProps) {
  const updateResponse = useLegacyResponseCallback(props.onChange);
  if (!props.encounterId) return null;
  return (
    <FilesQuestion
      question={props.question}
      encounterId={props.encounterId}
      questionnaireResponse={props.response}
      updateQuestionnaireResponseCB={updateResponse}
      disabled={props.disabled}
      errors={props.errors}
    />
  );
}

export const filesDefinition: StructuredTypeDefinition<"files"> = {
  type: "files",
  component: FilesInput,
  requires: ["encounterId", "facilityId"],
  subjects: ["encounter"],
  // Raw `File` objects cannot round-trip through JSON — hard exclude.
  draftPolicy: "exclude",
  validate: (files, questionId) =>
    validateFileUploadQuestion(files, questionId),
  buildRequests: async (files, { encounterId, questionId }) =>
    await Promise.all(
      files.map(async (file) => {
        const base64 = (await readFileAsDataURL(file.file_data)).split(",")[1];
        return {
          url: `/api/v1/files/upload-file/`,
          method: "POST" as const,
          body: {
            ...file,
            file_data: base64,
            encounter: encounterId,
          },
          reference_id: structuredReferenceId("files", questionId),
        };
      }),
    ),
};
