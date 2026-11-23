import { t } from "i18next";
import { useEffect, useEffectEvent, useId } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import FileUploadDropdown from "@/components/Files/FileUploadDropdown";

import useFileUpload from "@/hooks/useFileUpload";
import { cn } from "@/lib/utils";

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

const FILE_UPLOAD_FIELDS = {
  FILE_DATA: {
    key: "file_data",
    required: true,
    // `validateFields` reports a missing value itself, so this only sees a file.
    validate: (value: unknown) =>
      getFileSizeError(value as FileUploadQuestion["file_data"]) ?? true,
  },
  NAME: {
    key: "name",
    required: true,
  },
  ORIGINAL_NAME: {
    key: "original_name",
    required: true,
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
  // The same question can render more than once (repeating group rows), so
  // the question id alone does not give unique element ids.
  const idPrefix = useId();

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

  const appendSelectedFiles = useEffectEvent(() => {
    if (fileUpload.files.length === 0 || fileUpload.previewing) return;
    const additions = fileUpload.files.filter(
      (file) => !values.some((value) => value.file_data === file),
    );
    if (additions.length > 0) {
      updateQuestionnaireResponseCB(
        [
          {
            type: "files",
            value: [
              ...values,
              ...additions.map((file) => ({
                name: "",
                file_data: file,
                original_name: file.name,
                file_type: FileType.ENCOUNTER,
                file_category: FileCategory.UNSPECIFIED,
                associating_id: encounterId,
              })),
            ],
          },
        ],
        questionnaireResponse.question_id,
        questionnaireResponse.note,
      );
    }
    fileUpload.clearFiles();
  });

  useEffect(() => {
    appendSelectedFiles();
  }, [fileUpload.files, fileUpload.previewing]);

  return (
    <div className="flex flex-col gap-2">
      {values.map((value, index) => {
        const sizeError = getFileSizeError(value.file_data);
        // Shown as soon as the file is picked. After a submit attempt the
        // question lists the same message among its errors, so the inline
        // copy is hidden then to avoid showing (and announcing) it twice.
        const showSizeError =
          sizeError &&
          !props.errors.some(
            (error) =>
              error.index === index &&
              error.field_key === FILE_UPLOAD_FIELDS.FILE_DATA.key,
          );
        // The name input is the row's focusable control, so it carries the
        // aria association with the message. It is not marked invalid: the
        // name itself is fine.
        const sizeErrorId = `${idPrefix}-file-${index}-size-error`;
        return (
          <div key={index} className="flex flex-col gap-1">
            <div className="flex items-stretch gap-2">
              <Input
                placeholder={t("file_name")}
                className="flex-1"
                disabled={props.disabled}
                value={value.name}
                onChange={(e) => handleUpdate({ name: e.target.value }, index)}
                aria-describedby={showSizeError ? sizeErrorId : undefined}
              />
              <div
                className={cn(
                  "bg-gray-100 border border-gray-200 rounded-lg px-2 py-1 flex items-center gap-2 max-w-[150px]",
                  sizeError && "border-red-500 bg-red-50",
                )}
              >
                <span className="text-sm truncate">{value.original_name}</span>
              </div>
              <Button
                disabled={props.disabled}
                variant={"outline"}
                className="border border-secondary-300"
                onClick={() => {
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
            {showSizeError && (
              <p
                id={sizeErrorId}
                role="alert"
                className="text-sm text-red-600 break-words"
              >
                {sizeError}
              </p>
            )}
          </div>
        );
      })}
      <FileUploadDropdown
        fileUpload={fileUpload}
        disabled={props.disabled}
        buttonVariant="secondary"
        buttonClassName="border border-secondary-300"
      />
      {fileUpload.Dialogues}
    </div>
  );
}
