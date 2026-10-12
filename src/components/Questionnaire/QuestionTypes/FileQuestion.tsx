import { t } from "i18next";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import FileUploadDropdown from "@/components/Files/FileUploadDropdown";

import useFileUpload from "@/hooks/useFileUpload";
import { cn } from "@/lib/utils";

import { QuestionLabel } from "@/components/Questionnaire/QuestionLabel";
import {
  BACKEND_ALLOWED_EXTENSIONS,
  FileCategory,
  FileType,
  FileUploadQuestion,
} from "@/types/files/file";
import { QuestionValidationError } from "@/types/questionnaire/batch";
import {
  QuestionnaireResponse,
  ResponseValue,
} from "@/types/questionnaire/form";
import { Question } from "@/types/questionnaire/question";
import { validateFields } from "@/types/questionnaire/validation";
import careConfig from "@careConfig";

interface FilesQuestionProps {
  question: Question;
  questionnaireResponse: QuestionnaireResponse;
  updateQuestionnaireResponseCB: (
    values: ResponseValue[],
    questionId: string,
    note?: string,
  ) => void;
  disabled?: boolean;
  errors: QuestionValidationError[];
  encounterId: string;
}

const MAX_FILE_SIZE_BYTES = careConfig.maxFileUploadSizeInMB * 1024 * 1024;

/**
 * The backend rejects files over its limit only after the whole file has been
 * sent, so the same limit is checked here before anything is uploaded.
 */
function getFileSizeError(file: File | undefined) {
  if (!file || file.size <= MAX_FILE_SIZE_BYTES) {
    return undefined;
  }
  return t("file_error__max_size", {
    fileName: file.name,
    maxSize: careConfig.maxFileUploadSizeInMB,
  });
}

// Validators return the translated message for a missing value, so nothing
// here depends on the generic `invalid_value` fallback in `validateFields`.
const FILE_UPLOAD_FIELDS = {
  FILE_DATA: {
    key: "file_data",
    required: true,
    validate: (value: unknown) => {
      const fileData = value as FileUploadQuestion["file_data"];
      if (!fileData) {
        return t("field_required");
      }
      return getFileSizeError(fileData) ?? true;
    },
  },
  NAME: {
    key: "name",
    required: true,
    validate: (value: unknown) => {
      const name = value as FileUploadQuestion["name"];
      return name ? true : t("field_required");
    },
  },
  ORIGINAL_NAME: {
    key: "original_name",
    required: true,
    validate: (value: unknown) => {
      const originalName = value as FileUploadQuestion["original_name"];
      return originalName ? true : t("field_required");
    },
  },
} as const;

export function validateFileUploadQuestion(
  values: FileUploadQuestion[],
  questionId: string,
): QuestionValidationError[] {
  return values.flatMap((value, index) =>
    validateFields(
      {
        [FILE_UPLOAD_FIELDS.FILE_DATA.key]: value.file_data,
        [FILE_UPLOAD_FIELDS.NAME.key]: value.name,
        [FILE_UPLOAD_FIELDS.ORIGINAL_NAME.key]: value.original_name,
      },
      questionId,
      FILE_UPLOAD_FIELDS,
      index,
    ),
  );
}

export function FilesQuestion(props: FilesQuestionProps) {
  const { questionnaireResponse, updateQuestionnaireResponseCB, encounterId } =
    props;

  const { t } = useTranslation();

  const values =
    (questionnaireResponse.values?.[0]?.value as FileUploadQuestion[]) || [];

  const handleUpdate = (
    updates: Partial<FileUploadQuestion>,
    index: number,
  ) => {
    updateQuestionnaireResponseCB(
      [
        {
          type: "files",
          value: values.map((v, i) => (i === index ? { ...v, ...updates } : v)),
        },
      ],
      questionnaireResponse.question_id,
      questionnaireResponse.note,
    );
  };

  const fileUpload = useFileUpload({
    type: FileType.ENCOUNTER,
    allowedExtensions: BACKEND_ALLOWED_EXTENSIONS,
    multiple: true,
    allowNameFallback: false,
    compress: false,
  });

  useEffect(() => {
    (async () => {
      updateQuestionnaireResponseCB(
        [
          {
            type: "files",
            value: fileUpload.files.map((file, i) => ({
              name: values[i]?.name || "",
              file_data: file,
              original_name: file.name,
              file_type: FileType.ENCOUNTER,
              file_category: FileCategory.UNSPECIFIED,
              associating_id: encounterId,
            })),
          },
        ],
        questionnaireResponse.question_id,
        questionnaireResponse.note,
      );
    })();
  }, [fileUpload.files]);

  return (
    <div className="flex flex-col gap-2">
      <QuestionLabel question={props.question} />
      {values.map((value, index) => {
        const sizeError = getFileSizeError(value.file_data);
        // Always rendered inline: the question-level slot shows only the first
        // error for the question, so a later row's size error could otherwise
        // go unseen.
        const sizeErrorId = `${props.question.id}-file-${index}-size-error`;
        return (
          <div key={index} className="flex flex-col gap-1">
            <div className="flex items-stretch gap-2">
              <Input
                placeholder={t("file_name")}
                className="flex-1"
                value={value.name}
                onChange={(e) => handleUpdate({ name: e.target.value }, index)}
              />
              <div
                className={cn(
                  "bg-gray-100 border border-gray-200 rounded-lg px-2 py-1 flex items-center gap-2 max-w-[150px]",
                  sizeError && "border-red-500 bg-red-50",
                )}
                aria-describedby={sizeError ? sizeErrorId : undefined}
              >
                <span className="text-sm truncate">{value.original_name}</span>
              </div>
              <Button
                variant={"outline"}
                className="border border-secondary-300"
                onClick={() => {
                  fileUpload.removeFile(index);
                  updateQuestionnaireResponseCB(
                    [
                      {
                        type: "files",
                        value: values.filter((_, i) => i !== index),
                      },
                    ],
                    questionnaireResponse.question_id,
                    questionnaireResponse.note,
                  );
                }}
              >
                <CareIcon icon="l-trash" className="size-4" />
              </Button>
            </div>
            {sizeError && (
              <p
                id={sizeErrorId}
                role="alert"
                className="text-sm font-medium text-red-500"
              >
                {sizeError}
              </p>
            )}
          </div>
        );
      })}
      <FileUploadDropdown
        fileUpload={fileUpload}
        buttonVariant="secondary"
        buttonClassName="border border-secondary-300"
      />
      {fileUpload.Dialogues}
    </div>
  );
}
