import { format } from "date-fns";
import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";

import { TagSelectorPopover } from "@/components/Tags/TagAssignmentSheet";

import { AppointmentDateSelection } from "@/pages/Appointments/BookAppointment/AppointmentDateSelection";
import { AppointmentSlotPicker } from "@/pages/Appointments/BookAppointment/AppointmentSlotPicker";
import { PractitionerSelector } from "@/pages/Appointments/components/PractitionerSelector";
import { TagConfig, TagResource } from "@/types/emr/tagConfig/tagConfig";
import useTagConfigs from "@/types/emr/tagConfig/useTagConfig";
import { QuestionValidationError } from "@/types/questionnaire/batch";
import {
  QuestionnaireResponse,
  ResponseValue,
} from "@/types/questionnaire/form";
import { Question } from "@/types/questionnaire/question";
import {
  FieldDefinitions,
  useFieldError,
  validateFields,
} from "@/types/questionnaire/validation";
import {
  CreateAppointmentQuestion,
  SchedulableResourceType,
  TokenSlot,
} from "@/types/scheduling/schedule";
import { UserReadMinimal } from "@/types/user/user";

interface AppointmentQuestionProps {
  question: Question;
  questionnaireResponse: QuestionnaireResponse;
  updateQuestionnaireResponseCB: (
    values: ResponseValue[],
    questionId: string,
    note?: string,
  ) => void;
  disabled?: boolean;
  errors: QuestionValidationError[];
  facilityId: string;
}

const APPOINTMENT_FIELDS: FieldDefinitions = {
  REASON: {
    key: "note",
    required: true,
  },
  SLOT: {
    key: "slot_id",
    required: true,
  },
  TAGS: {
    key: "tags",
    required: true,
  },
} as const;

export function validateAppointmentQuestion(
  value: CreateAppointmentQuestion,
  questionId: string,
  required: boolean,
): QuestionValidationError[] {
  return validateFields(value, questionId, {
    REASON: {
      ...APPOINTMENT_FIELDS.REASON,
      required: required || value?.slot_id !== undefined,
    },
    SLOT: {
      ...APPOINTMENT_FIELDS.SLOT,
      required: required || value?.note !== undefined,
    },
    TAGS: {
      ...APPOINTMENT_FIELDS.TAGS,
      required: required,
    },
  });
}

export function AppointmentQuestion({
  question,
  questionnaireResponse,
  updateQuestionnaireResponseCB,
  disabled,
  errors,
  facilityId,
}: AppointmentQuestionProps) {
  const { t } = useTranslation();
  const [resource, setResource] = useState<UserReadMinimal>();
  const [open, setOpen] = useState(false);
  const { hasError } = useFieldError(question.id, errors);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlotId, setSelectedSlotId] = useState<string>();

  const values =
    (questionnaireResponse.values?.[0]?.value as CreateAppointmentQuestion[]) ||
    [];
  const value = values[0] ?? { tags: [] };

  const handleUpdate = (updates: Partial<CreateAppointmentQuestion>) => {
    const updatedValue = { ...value, ...updates };
    if (
      !updatedValue.note?.trim() &&
      !updatedValue.slot_id &&
      !updatedValue.tags?.length
    ) {
      updateQuestionnaireResponseCB(
        [],
        questionnaireResponse.question_id,
        questionnaireResponse.note,
      );
    } else {
      updateQuestionnaireResponseCB(
        [{ type: "appointment", value: [updatedValue] }],
        questionnaireResponse.question_id,
        questionnaireResponse.note,
      );
    }
  };

  // Query to get slot details for display
  const [selectedSlot, setSelectedSlot] = useState<TokenSlot>();

  // Update slot details when a slot is selected
  const handleSlotSelect = (slotId: string | undefined) => {
    handleUpdate({ slot_id: slotId });
    // Only close the sheet if a slot was actually selected
    if (slotId) {
      setOpen(false);
    }
  };

  const tagQueries = useTagConfigs({ ids: value.tags, facilityId });
  const selectedTags = tagQueries
    .map((query) => query.data)
    .filter(Boolean) as TagConfig[];

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-4 mt-2">
          <Label className="mb-2">{t("tags", { count: 2 })}</Label>
          <TagSelectorPopover
            selected={selectedTags}
            onChange={(tags) => {
              handleUpdate({ tags: tags.map((tag) => tag.id) });
            }}
            resource={TagResource.APPOINTMENT}
            className={cn(
              hasError(APPOINTMENT_FIELDS.TAGS.key) && "ring-1 ring-red-500",
            )}
          />
        </div>
        <Label className="mb-2">
          {t("note")}
          {question.required && <span className="text-red-500 ml-0.5">*</span>}
        </Label>
        <Textarea
          placeholder={t("appointment_note")}
          value={value.note || ""}
          onChange={(e) =>
            handleUpdate({
              note: e.target.value || undefined,
            })
          }
          disabled={disabled}
          className={cn(
            hasError(APPOINTMENT_FIELDS.REASON.key) && "border-red-500",
          )}
        />
      </div>

      <div>
        <Label className="block mb-2">
          {t("select_practitioner")}
          {question.required && <span className="text-red-500 ml-0.5">*</span>}
        </Label>
        <div
          className={cn(
            "rounded-md",
            !resource &&
              hasError(APPOINTMENT_FIELDS.SLOT.key) &&
              "ring-1 ring-red-500",
          )}
        >
          <PractitionerSelector
            facilityId={facilityId}
            selected={resource ?? null}
            onSelect={(user) => {
              setResource(user ?? undefined);
              if (value.slot_id) {
                handleUpdate({ slot_id: undefined });
                setSelectedSlot(undefined);
              }
            }}
            clearSelection
          />
        </div>
      </div>

      <div>
        <Label className="block mb-2">
          {t("appointment_slot")}
          {question.required && <span className="text-red-500 ml-0.5">*</span>}
        </Label>
        <div
          className={cn(
            "rounded-md",
            !value.slot_id &&
              hasError(APPOINTMENT_FIELDS.SLOT.key) &&
              "ring-1 ring-red-500",
          )}
        >
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              {value.slot_id && selectedSlot ? (
                <Button variant="outline" className="w-full justify-start">
                  <span className="font-normal">
                    <Trans
                      i18nKey="selected_token_slot_display"
                      values={{
                        date: format(
                          selectedSlot.start_datetime,
                          "dd MMM, yyyy",
                        ),
                        startTime: format(
                          selectedSlot.start_datetime,
                          "h:mm a",
                        ),
                        endTime: format(selectedSlot.end_datetime, "h:mm a"),
                      }}
                      components={{
                        strong: <span className="font-semibold" />,
                      }}
                    />
                  </span>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  disabled={disabled || !resource}
                >
                  <span className="text-gray-500">
                    {resource
                      ? t("select_appointment_slot")
                      : t("select_practitioner_first")}
                  </span>
                </Button>
              )}
            </SheetTrigger>
            <SheetContent side="right" className="sm:max-w-xl overflow-auto">
              <SheetHeader>
                <SheetTitle>{t("select_appointment_slot")}</SheetTitle>
              </SheetHeader>
              <div className="space-y-4">
                <AppointmentDateSelection
                  facilityId={facilityId}
                  resourceId={resource?.id || undefined}
                  resourceType={SchedulableResourceType.Practitioner}
                  setSelectedDate={setSelectedDate}
                  selectedDate={selectedDate}
                />
                <AppointmentSlotPicker
                  selectedDate={selectedDate}
                  facilityId={facilityId}
                  resourceId={resource?.id || undefined}
                  resourceType={SchedulableResourceType.Practitioner}
                  selectedSlotId={selectedSlotId}
                  onSlotDetailsChange={setSelectedSlot}
                  onSlotSelect={setSelectedSlotId}
                />
                <div className="flex justify-end gap-2 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setOpen(false);
                      setSelectedSlot(undefined);
                    }}
                  >
                    {t("cancel")}
                  </Button>
                  <Button
                    variant="default"
                    disabled={!selectedSlotId}
                    onClick={() => {
                      handleSlotSelect(selectedSlotId);
                    }}
                  >
                    {t("submit")}
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
}
