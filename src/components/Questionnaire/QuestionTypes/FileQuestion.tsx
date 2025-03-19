import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { FileUploadQuestion } from "@/types/files/files";
import { QuestionValidationError } from "@/types/questionnaire/batch";
import {
  QuestionnaireResponse,
  ResponseValue,
} from "@/types/questionnaire/form";
import { Question } from "@/types/questionnaire/question";

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
  index: number;
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
    index,
  } = props;

  const { t } = useTranslation();

  const values =
    (questionnaireResponse.values?.[index]?.value as FileUploadQuestion[]) ||
    [];
  const value = values[0] ?? {};

  const handleUpdate = (updates: Partial<FileUploadQuestion>) => {
    updateQuestionnaireResponseCB(
      questionnaireResponse.values.map((v, i) =>
        i === index ? { type: "files", value: [{ ...value, ...updates }] } : v,
      ),
      questionnaireResponse.question_id,
      questionnaireResponse.note,
    );
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        placeholder={t("file_name")}
        className="flex-1"
        value={value.name}
        onChange={(e) => handleUpdate({ name: e.target.value })}
      />
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
            reader.onload = (event) => {
              const fileData = event.target?.result as string;
              handleUpdate({
                file_data: fileData,
                name: value.original_name || file.name,
                original_name: file.name,
              });
            };
          }}
        />
      </label>
    </div>
  );
}
