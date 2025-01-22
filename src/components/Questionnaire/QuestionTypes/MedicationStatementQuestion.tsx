import { MinusCircledIcon, Pencil2Icon } from "@radix-ui/react-icons";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon, { IconName } from "@/CAREUI/icons/CareIcon";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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

import { NotesInput } from "@/components/Questionnaire/QuestionTypes/NotesInput";
import ValueSetSelect from "@/components/Questionnaire/ValueSetSelect";

import useBreakpoints from "@/hooks/useBreakpoints";

import {
  MEDICATION_STATEMENT_STATUS,
  MedicationStatementInformationSourceType,
  MedicationStatementRequest,
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

const MEDICATION_STATEMENT_INITIAL_VALUE: MedicationStatementRequest = {
  status: "active",
  reason: undefined,
  medication: {
    code: "",
    display: "",
    system: "",
  },
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
  const desktopLayout = useBreakpoints({ lg: true, default: false });
  const [expandedMedicationIndex, setExpandedMedicationIndex] = useState<
    number | null
  >(null);
  const [medicationToDelete, setMedicationToDelete] = useState<number | null>(
    null,
  );

  const medications =
    (questionnaireResponse.values?.[0]
      ?.value as MedicationStatementRequest[]) || [];

  const handleAddMedication = (medication: Code) => {
    const newMedications: MedicationStatementRequest[] = [
      ...medications,
      { ...MEDICATION_STATEMENT_INITIAL_VALUE, medication },
    ];
    updateQuestionnaireResponseCB({
      ...questionnaireResponse,
      values: [
        {
          type: "medication_statement",
          value: newMedications,
        },
      ],
    });
    setExpandedMedicationIndex(newMedications.length - 1);
  };

  const handleRemoveMedication = (index: number) => {
    setMedicationToDelete(index);
  };

  const confirmRemoveMedication = () => {
    if (medicationToDelete === null) return;

    const newMedications = medications.filter(
      (_, i) => i !== medicationToDelete,
    );
    updateQuestionnaireResponseCB({
      ...questionnaireResponse,
      values: [{ type: "medication_statement", value: newMedications }],
    });
    setMedicationToDelete(null);
  };

  const handleUpdateMedication = (
    index: number,
    updates: Partial<MedicationStatementRequest>,
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
    <div className="space-y-4">
      <AlertDialog
        open={medicationToDelete !== null}
        onOpenChange={(open) => !open && setMedicationToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("remove_medication")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("remove_medication_confirmation", {
                medication:
                  medications[medicationToDelete!]?.medication?.display,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveMedication}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("remove")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {medications.length > 0 && (
        <div className="md:overflow-x-auto w-auto pb-2">
          <div className="min-w-fit">
            <div
              className={cn("max-w-[1600px] relative lg:border rounded-md", {
                "bg-gray-50/50": !desktopLayout,
              })}
            >
              {/* Header - Only show on desktop */}
              <div className="hidden lg:grid grid-cols-[300px,180px,170px,250px,260px,190px,200px,48px] bg-gray-50 border-b text-sm font-medium text-gray-500">
                <div className="font-semibold text-gray-600 p-3 border-r">
                  {t("medicine")}
                </div>
                <div className="font-semibold text-gray-600 p-3 border-r">
                  {t("source")}
                </div>
                <div className="font-semibold text-gray-600 p-3 border-r">
                  {t("status")}
                </div>
                <div className="font-semibold text-gray-600 p-3 border-r">
                  {t("dosage_instructions")}
                </div>
                <div className="font-semibold text-gray-600 p-3 border-r">
                  {t("medication_taken_between")}
                </div>
                <div className="font-semibold text-gray-600 p-3 border-r">
                  {t("reason")}
                </div>
                <div className="font-semibold text-gray-600 p-3 border-r">
                  {t("notes")}
                </div>
                <div className="font-semibold text-gray-600 p-3 sticky right-0 bg-gray-50 shadow-[-12px_0_15px_-4px_rgba(0,0,0,0.15)] w-12" />
              </div>

              {/* Body */}
              <div
                className={cn("bg-white", {
                  "bg-transparent": !desktopLayout,
                })}
              >
                {medications.map((medication, index) => (
                  <React.Fragment key={index}>
                    {!desktopLayout ? (
                      <Collapsible
                        open={expandedMedicationIndex === index}
                        onOpenChange={() => {
                          setExpandedMedicationIndex(
                            expandedMedicationIndex === index ? null : index,
                          );
                        }}
                        className="border-b last:border-b-0"
                      >
                        <div
                          className={cn(
                            "flex items-center gap-2 px-2 py-0.5 rounded-md shadow-sm text-sm",
                            expandedMedicationIndex === index
                              ? "bg-gray-50"
                              : "bg-gray-100",
                          )}
                        >
                          <CollapsibleTrigger className="flex-1 text-left">
                            <div className="font-medium text-gray-900">
                              {medication.medication?.display}
                            </div>
                          </CollapsibleTrigger>
                          <div className="flex items-center gap-1">
                            {expandedMedicationIndex !== index && (
                              <Button
                                aria-label="Expand Medication Statement"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-gray-500 hover:text-gray-900"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedMedicationIndex(index);
                                }}
                                disabled={disabled}
                              >
                                <Pencil2Icon className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveMedication(index);
                              }}
                              disabled={disabled}
                              className="h-8 w-8"
                            >
                              <MinusCircledIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <CollapsibleContent>
                          <div className="py-4 space-y-4 bg-white mx-2 mb-1">
                            <MedicationStatementGridRow
                              medication={medication}
                              disabled={disabled}
                              onUpdate={(updates) =>
                                handleUpdateMedication(index, updates)
                              }
                              onRemove={() => handleRemoveMedication(index)}
                            />
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    ) : (
                      <MedicationStatementGridRow
                        medication={medication}
                        disabled={disabled}
                        onUpdate={(updates) =>
                          handleUpdateMedication(index, updates)
                        }
                        onRemove={() => handleRemoveMedication(index)}
                      />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="max-w-4xl">
        <ValueSetSelect
          system="system-medication"
          placeholder={t("search_medications")}
          onSelect={handleAddMedication}
          disabled={disabled}
          searchPostFix=" clinical drug"
        />
      </div>
    </div>
  );
}

interface MedicationStatementGridRowProps {
  medication: MedicationStatementRequest;
  disabled?: boolean;
  onUpdate?: (medication: Partial<MedicationStatementRequest>) => void;
  onRemove?: () => void;
}

const MedicationStatementGridRow: React.FC<MedicationStatementGridRowProps> = ({
  medication,
  disabled,
  onUpdate,
  onRemove,
}) => {
  const { t } = useTranslation();
  const desktopLayout = useBreakpoints({ lg: true, default: false });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[300px,180px,170px,250px,260px,190px,200px,48px] border-b hover:bg-gray-50/50 gap-2 lg:gap-0">
      {/* Medicine Name */}
      <div className="lg:px-2 lg:py-1 flex items-center justify-between lg:justify-start lg:col-span-1 lg:border-r font-medium overflow-hidden text-sm">
        <span className="break-words line-clamp-2 hidden lg:block">
          {medication.medication?.display}
        </span>
      </div>

      {/* Source */}
      <div className="lg:px-2 lg:py-1 lg:border-r overflow-hidden">
        <Label className="mb-1.5 block text-sm lg:hidden">{t("source")}</Label>
        <Select
          value={medication.information_source}
          onValueChange={(value: MedicationStatementInformationSourceType) =>
            onUpdate?.({ information_source: value })
          }
          disabled={disabled}
        >
          <SelectTrigger className="h-9 text-sm capitalize">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(
              [
                {
                  value: MedicationStatementInformationSourceType.PATIENT,
                  icon: "l-user",
                },
                {
                  value: MedicationStatementInformationSourceType.PRACTITIONER,
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
              <SelectItem
                key={source.value}
                value={source.value}
                className="capitalize"
              >
                <CareIcon icon={source.icon} className="mr-2" />
                {t(`${source.value}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Status */}
      <div className="lg:px-2 lg:py-1 lg:border-r overflow-hidden">
        <Label className="mb-1.5 block text-sm lg:hidden">{t("status")}</Label>
        <Select
          value={medication.status}
          onValueChange={(value: MedicationStatementStatus) =>
            onUpdate?.({ status: value })
          }
          disabled={disabled}
        >
          <SelectTrigger className="h-9 text-sm capitalize">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MEDICATION_STATEMENT_STATUS.map((status) => (
              <SelectItem key={status} value={status}>
                {t(`${status}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Dosage Instructions */}
      <div className="lg:px-2 lg:py-1 lg:border-r overflow-hidden">
        <Label className="mb-1.5 block text-sm lg:hidden">
          {t("dosage_instructions")}
        </Label>
        <Input
          value={medication.dosage_text || ""}
          onChange={(e) => onUpdate?.({ dosage_text: e.target.value })}
          placeholder={t("enter_dosage_instructions")}
          disabled={disabled}
          className="h-9 text-sm"
        />
      </div>

      {/* Period */}
      <div className="lg:px-2 lg:py-1 lg:border-r overflow-hidden">
        <Label className="mb-1.5 block text-sm lg:hidden">
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
            onUpdate?.({
              effective_period: {
                start: date?.from?.toISOString(),
                end: date?.to?.toISOString(),
              },
            })
          }
        />
      </div>

      {/* Reason */}
      <div className="lg:px-2 lg:py-1 lg:border-r overflow-hidden">
        <Label className="mb-1.5 block text-sm lg:hidden">{t("reason")}</Label>
        <Input
          maxLength={100}
          placeholder={t("reason_for_medication")}
          value={medication.reason || ""}
          onChange={(e) => onUpdate?.({ reason: e.target.value })}
          disabled={disabled}
          className="h-9 text-sm"
        />
      </div>

      {/* Notes */}
      <div className="lg:px-2 lg:py-1 lg:border-r overflow-hidden">
        <Label className="mb-1.5 block text-sm lg:hidden">{t("notes")}</Label>
        {desktopLayout ? (
          <>
            <Label className="mb-1.5 block text-sm lg:hidden">
              {t("notes")}
            </Label>
            <Input
              value={medication.note || ""}
              onChange={(e) => onUpdate?.({ note: e.target.value })}
              placeholder={t("add_notes")}
              disabled={disabled}
              className="h-9 text-sm"
            />
          </>
        ) : (
          <NotesInput
            className="mt-2"
            questionnaireResponse={{
              question_id: "",
              structured_type: "medication_statement",
              link_id: "",
              values: [],
              note: medication.note,
            }}
            updateQuestionnaireResponseCB={(response) => {
              onUpdate?.({ note: response.note });
            }}
            disabled={disabled}
          />
        )}
      </div>

      {/* Remove Button */}
      <div className="hidden lg:flex lg:px-2 lg:py-1 items-center justify-center sticky right-0 bg-white shadow-[-12px_0_15px_-4px_rgba(0,0,0,0.15)] w-12">
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          disabled={disabled}
          className="h-8 w-8"
        >
          <MinusCircledIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
