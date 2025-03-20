import { t } from "i18next";
import { Trash2Icon, XIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { FileUploadModel } from "@/components/Patient/models";

import { BACKEND_ALLOWED_EXTENSIONS } from "@/common/constants";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";
import { FileUploadQuestion } from "@/types/files/files";
import { QuestionValidationError } from "@/types/questionnaire/batch";
import {
  QuestionnaireResponse,
  ResponseValue,
} from "@/types/questionnaire/form";
import { Question } from "@/types/questionnaire/question";
import { validateFields } from "@/types/questionnaire/validation";

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
  facilityId: string;
}

const FILE_UPLOAD_FIELDS = {
  FILE_DATA: {
    key: "file_data",
    required: true,
    validate: (value: unknown) => {
      const fileData = value as FileUploadQuestion["file_data"];
      return !!fileData;
    },
  },
  NAME: {
    key: "name",
    required: true,
    validate: (value: unknown) => {
      const name = value as FileUploadQuestion["name"];
      return !!name;
    },
  },
  ORIGINAL_NAME: {
    key: "original_name",
    required: true,
    validate: (value: unknown) => {
      const originalName = value as FileUploadQuestion["original_name"];
      return !!originalName;
    },
  },
} as const;

export function validateFileUploadQuestion(
  values: FileUploadQuestion[],
  questionId: string,
): QuestionValidationError[] {
  return values.reduce((errors: QuestionValidationError[], value, index) => {
    // Validate each dosage instruction

    // Validate using the fields
    const fieldErrors = validateFields(
      {
        [FILE_UPLOAD_FIELDS.FILE_DATA.key]: value.file_data,
        [FILE_UPLOAD_FIELDS.NAME.key]: value.name,
        [FILE_UPLOAD_FIELDS.ORIGINAL_NAME.key]: value.original_name,
      },
      questionId,
      FILE_UPLOAD_FIELDS,
      index,
    );

    // Map error messages to be more specific
    return [
      ...errors,
      ...fieldErrors.map((error) => ({
        ...error,
        error: (["FILE_DATA", "NAME", "ORIGINAL_NAME"] as const).some(
          (attr) => FILE_UPLOAD_FIELDS[attr].key === error.field_key,
        )
          ? t("field_required")
          : error.error,
      })),
    ];
  }, []);
}

export function FilesQuestion(props: FilesQuestionProps) {
  const {
    question,
    questionnaireResponse,
    updateQuestionnaireResponseCB,
    disabled,
    errors,
    encounterId,
    facilityId,
  } = props;

  const { t } = useTranslation();

  const initialValue: FileUploadQuestion = {
    name: "",
    file_data: "",
    original_name: "",
    file_type: "encounter",
    file_category: "unspecified",
    associating_id: encounterId,
  };

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

  const addFile = () => {
    updateQuestionnaireResponseCB(
      [
        {
          type: "files",
          value: [...values, initialValue],
        },
      ],
      questionnaireResponse.question_id,
      questionnaireResponse.note,
    );
  };

  return (
    <div className="flex flex-col gap-2">
      {values.map((value, index) => (
        <div key={index} className="flex items-center gap-2">
          <Input
            placeholder={t("file_name")}
            className="flex-1"
            value={value.name}
            onChange={(e) => handleUpdate({ name: e.target.value }, index)}
          />
          {!value.file_data ? (
            <label
              className={cn(
                buttonVariants({ variant: "secondary" }),
                "border border-secondary-300 cursor-pointer",
              )}
            >
              {t("choose_file")}
              <input
                type="file"
                className="hidden"
                onChange={(e) => {
                  // get base64 encoded file data
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.addEventListener("load", (e) => {
                    console.log("file", file);
                    const base64 = e.target?.result as string;
                    handleUpdate(
                      {
                        file_data: base64.split(",")[1],
                        original_name: file.name,
                      },
                      index,
                    );
                  });
                  reader.readAsDataURL(file);
                }}
                accept={BACKEND_ALLOWED_EXTENSIONS.join(",")}
              />
            </label>
          ) : (
            <div className="bg-gray-100 border border-gray-200 rounded-lg px-2 py-1 flex items-center gap-2">
              <span>{value.original_name}</span>
              <button>
                <XIcon
                  className="w-4"
                  onClick={() =>
                    handleUpdate(
                      {
                        file_data: undefined,
                        original_name: undefined,
                      },
                      index,
                    )
                  }
                />
              </button>
            </div>
          )}
          <Button>
            <Trash2Icon onClick={() => deleteFile(value)} />
          </Button>
        </div>
      ))}
      <Button variant={"secondary"} onClick={addFile}>
        {t("add_file")}
      </Button>
    </div>
  );
}
