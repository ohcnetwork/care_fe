import {
  MinusCircledIcon,
  QuestionMarkCircledIcon,
  TextAlignLeftIcon,
} from "@radix-ui/react-icons";
import React from "react";
import { useTranslation } from "react-i18next";

import CareIcon, { IconName } from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import ValueSetSelect from "@/components/Questionnaire/ValueSetSelect";

import {
  MEDICATION_STATEMENT_STATUS,
  MedicationStatement,
  MedicationStatementInformationSourceType,
  MedicationStatementStatus,
} from "@/types/emr/medicationStatement";
import { Code } from "@/types/questionnaire/code";
import { QuestionnaireResponse } from "@/types/questionnaire/form";
import { Question } from "@/types/questionnaire/question";

interface MedicationStatementQuestionProps {
  question: Question;
  questionnaireResponse: QuestionnaireResponse;
  updateQuestionnaireResponseCB: (response: QuestionnaireResponse) => void;
  disabled?: boolean;
}

const MEDICATION_STATEMENT_INITIAL_VALUE: Omit<
  MedicationStatement,
  "medication" | "patient" | "encounter" | "id"
> = {
  status: "active",
  reason: undefined,
  dosage_text: "",
  effective_period: undefined,
  information_source: MedicationStatementInformationSourceType.PATIENT,
  note: undefined,
};

export function MedicationStatementQuestion({
  questionnaireResponse,
  updateQuestionnaireResponseCB,
  disabled,
}: MedicationStatementQuestionProps) {
  const { t } = useTranslation();

  const medications =
    (questionnaireResponse.values?.[0]?.value as MedicationStatement[]) || [];

  const handleAddMedication = (medication: Code) => {
    const newMedications: Omit<
      MedicationStatement,
      "patient" | "encounter" | "id"
    >[] = [
      ...medications,
      { ...MEDICATION_STATEMENT_INITIAL_VALUE, medication },
    ];
    updateQuestionnaireResponseCB({
      ...questionnaireResponse,
      values: [
        {
          type: "medication_statement",
          value: newMedications as MedicationStatement[], // FIXME: Remove this cast
        },
      ],
    });
  };

  const handleRemoveMedication = (index: number) => {
    const newMedications = medications.filter((_, i) => i !== index);
    updateQuestionnaireResponseCB({
      ...questionnaireResponse,
      values: [{ type: "medication_statement", value: newMedications }],
    });
  };

  const handleUpdateMedication = (
    index: number,
    updates: Partial<MedicationStatement>,
  ) => {
    const newMedications = medications.map((medication, i) =>
      i === index ? { ...medication, ...updates } : medication,
    );

    updateQuestionnaireResponseCB({
      ...questionnaireResponse,
      values: [
        {
          type: "medication_statement",
          value: newMedications,
        },
      ],
    });
  };

  return (
    <>
      {medications.length > 0 && (
        <div className="rounded-lg border space-y-4">
          <ul className="space-y-2 divide-y-2 divide-gray-200 divide-dashed">
            {medications.map((medication, index) => (
              <li key={index}>
                <MedicationStatementItem
                  medication={medication}
                  disabled={disabled}
                  onUpdate={(medication) =>
                    handleUpdateMedication(index, medication)
                  }
                  onRemove={() => handleRemoveMedication(index)}
                  index={index}
                />
              </li>
            ))}
          </ul>
        </div>
      )}
      <ValueSetSelect
        system="system-medication"
        placeholder={t("search_medication")}
        onSelect={handleAddMedication}
        disabled={disabled}
        searchPostFix=" clinical drug"
      />
    </>
  );
}

const MedicationStatementItem: React.FC<{
  medication: MedicationStatement;
  disabled?: boolean;
  onUpdate: (medication: Partial<MedicationStatement>) => void;
  onRemove: () => void;
  index: number;
}> = ({ medication, disabled, onUpdate, onRemove, index }) => {
  const { t } = useTranslation();

  return (
    <div className="p-3 justify-between group focus-within:ring-2 ring-gray-300 rounded-lg space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-base font-semibold">
          {index + 1}. {medication.medication?.display}
        </h4>
        <div className="flex items-center gap-2">
          <div>
            <Label className="sr-only">{t("status")}</Label>
            <Select
              value={medication.status}
              onValueChange={(value: MedicationStatementStatus) =>
                onUpdate({ status: value })
              }
              disabled={disabled}
            >
              <SelectTrigger className="capitalize">
                <SelectValue placeholder={t("select_status")} />
              </SelectTrigger>
              <SelectContent>
                {MEDICATION_STATEMENT_STATUS.map((status) => (
                  <SelectItem
                    key={status}
                    value={status}
                    className="capitalize"
                  >
                    {status.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="secondary"
            size="icon"
            onClick={onRemove}
            disabled={disabled}
          >
            <MinusCircledIcon className="size-4" />
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex gap-2 flex-wrap">
          <div className="flex-1">
            <Label className="mb-1 block text-sm font-medium">
              {t("source")}
            </Label>
            <Select
              value={medication.information_source}
              onValueChange={(
                value: MedicationStatementInformationSourceType,
              ) => onUpdate({ information_source: value })}
              disabled={disabled}
            >
              <SelectTrigger className="capitalize">
                <SelectValue placeholder={t("select_source")} />
              </SelectTrigger>
              <SelectContent>
                {(
                  [
                    {
                      value: MedicationStatementInformationSourceType.PATIENT,
                      icon: "l-user",
                    },
                    {
                      value: MedicationStatementInformationSourceType.USER,
                      icon: "l-user-nurse",
                    },
                    {
                      value:
                        MedicationStatementInformationSourceType.RELATED_PERSON,
                      icon: "l-users-alt",
                    },
                  ] as {
                    value: MedicationStatementInformationSourceType;
                    icon: IconName;
                  }[]
                ).map((source) => (
                  <SelectItem value={source.value} className="capitalize">
                    <CareIcon icon={source.icon} className="mr-2" />
                    {source.value.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-[2]">
            <Label className="mb-1 block text-sm font-medium">
              {t("dosage_instructions")}
            </Label>
            <Input
              value={medication.dosage_text}
              onChange={(event) =>
                onUpdate({
                  dosage_text: event.target.value,
                })
              }
              disabled={disabled}
            />
          </div>
          <div className="flex-[2]">
            <Label className="mb-1 block text-sm font-medium truncate">
              {t("medication_taken_between")}
            </Label>
            <DateRangePicker
              date={{
                from: medication.effective_period?.start
                  ? new Date(medication.effective_period?.start)
                  : undefined,
                to: medication.effective_period?.end
                  ? new Date(medication.effective_period?.end)
                  : undefined,
              }}
              onChange={(date) =>
                onUpdate({
                  effective_period: {
                    start: date?.from?.toISOString(),
                    end: date?.to?.toISOString(),
                  },
                })
              }
            />
          </div>
        </div>

        {medication.reason !== undefined && (
          <div>
            <Label className="mb-1 block text-sm font-medium">
              {t("reason")}
            </Label>
            <Input
              maxLength={100}
              placeholder={t("reason_for_medication")}
              value={medication.reason}
              onChange={(e) => onUpdate({ reason: e.target.value })}
            />
          </div>
        )}

        {medication.note !== undefined && (
          <div>
            <Label className="mb-1 block text-sm font-medium">
              {t("additional_information")}
            </Label>
            <Textarea
              placeholder={t("any_additional_information")}
              value={medication.note}
              onChange={(e) => onUpdate({ note: e.target.value })}
            />
          </div>
        )}

        <div className="flex gap-3 flex-wrap mt-2">
          {medication.reason === undefined && (
            <Button
              onClick={() =>
                onUpdate({
                  reason: "",
                })
              }
              variant="secondary"
              className="flex gap-1.5 items-center"
            >
              <QuestionMarkCircledIcon className="size-4" />
              {t("reason")}
            </Button>
          )}
          {medication.note === undefined && (
            <Button
              onClick={() =>
                onUpdate({
                  note: "",
                })
              }
              variant="secondary"
              className="flex gap-1.5 items-center"
            >
              <TextAlignLeftIcon className="size-4" />
              {t("additional_information")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
