import { useQuery } from "@tanstack/react-query";
import { format, isBefore, startOfToday } from "date-fns";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import query from "@/Utils/request/query";
import { dateQueryString } from "@/Utils/utils";
import { PractitionerSelector } from "@/pages/Appointments/components/PractitionerSelector";
import { groupSlotsByAvailability } from "@/pages/Appointments/utils";
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
import { CreateAppointmentQuestion } from "@/types/scheduling/schedule";
import scheduleApis from "@/types/scheduling/scheduleApi";
import { UserBase } from "@/types/user/user";

import { FieldError } from "./FieldError";

interface FollowUpVisitQuestionProps {
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
    key: "reason_for_visit",
    required: true,
    validate: (value: unknown) => {
      const str = value as string;
      return !!str?.trim();
    },
  },
  SLOT: {
    key: "slot_id",
    required: true,
  },
} as const;

export function validateAppointmentQuestion(
  value: CreateAppointmentQuestion,
  questionId: string,
): QuestionValidationError[] {
  return validateFields(value, questionId, APPOINTMENT_FIELDS);
}

export function AppointmentQuestion({
  question,
  questionnaireResponse,
  updateQuestionnaireResponseCB,
  disabled,
  errors,
  facilityId,
}: FollowUpVisitQuestionProps) {
  const { t } = useTranslation();
  const [resource, setResource] = useState<UserBase>();
  const [selectedDate, setSelectedDate] = useState<Date>();
  const { hasError } = useFieldError(question.id, errors);

  const values =
    (questionnaireResponse.values?.[0]?.value as CreateAppointmentQuestion[]) ||
    [];
  const value = values[0] ?? {};

  const handleUpdate = (updates: Partial<CreateAppointmentQuestion>) => {
    updateQuestionnaireResponseCB(
      [{ type: "appointment", value: [{ ...value, ...updates }] }],
      questionnaireResponse.question_id,
      questionnaireResponse.note,
    );
  };

  const slotsQuery = useQuery({
    queryKey: [
      "slots",
      facilityId,
      resource?.id,
      dateQueryString(selectedDate),
    ],
    queryFn: query(scheduleApis.slots.getSlotsForDay, {
      pathParams: { facility_id: facilityId },
      body: {
        user: resource?.id ?? "",
        day: dateQueryString(selectedDate),
      },
    }),
    enabled: !!resource && !!selectedDate,
  });

  const slots = slotsQuery.data?.results ?? [];
  const availableSlots = groupSlotsByAvailability(slots, true);
  const hasSlots = availableSlots.length > 0;
  const showNoSlotsMessage = !hasSlots && selectedDate && resource;

  return (
    <div className="space-y-4">
      <div>
        <Label className="mb-2">
          {t("reason_for_visit")}
          <span className="text-red-500 ml-0.5">*</span>
        </Label>
        <Textarea
          placeholder={t("reason_for_visit_placeholder")}
          value={value.reason_for_visit || ""}
          onChange={(e) => handleUpdate({ reason_for_visit: e.target.value })}
          disabled={disabled}
          className={cn(
            hasError(APPOINTMENT_FIELDS.REASON.key) && "border-red-500",
          )}
        />
        <FieldError
          fieldKey={APPOINTMENT_FIELDS.REASON.key}
          questionId={question.id}
          errors={errors}
        />
      </div>

      <div>
        <Label className="block mb-2">
          {t("select_practitioner")}
          <span className="text-red-500 ml-0.5">*</span>
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
            onSelect={(user) => setResource(user ?? undefined)}
            clearSelection={t("show_all")}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <Label className="block mb-2">
            {t("select_date")}
            <span className="text-red-500 ml-0.5">*</span>
          </Label>
          <div
            className={cn(
              "rounded-md w-fit",
              !selectedDate &&
                hasError(APPOINTMENT_FIELDS.SLOT.key) &&
                "border border-red-500",
            )}
          >
            <DatePicker
              date={selectedDate}
              onChange={(date) => {
                setSelectedDate(date);
                if (value.slot_id) {
                  handleUpdate({ slot_id: undefined });
                }
              }}
              disabled={(date) => isBefore(date, startOfToday())}
            />
          </div>
        </div>

        <div className="flex-1">
          <Label className="block mb-2">
            {t("select_time")}
            <span className="text-red-500 ml-0.5">*</span>
          </Label>
          {showNoSlotsMessage ? (
            <div
              className={cn(
                "rounded-md border border-input px-3 py-2 text-sm text-gray-500",
                hasError(APPOINTMENT_FIELDS.SLOT.key) && "border-red-500",
              )}
            >
              {t("no_slots_available")}
            </div>
          ) : (
            <Select
              disabled={
                !selectedDate || !resource || slotsQuery.isLoading || disabled
              }
              value={value.slot_id}
              onValueChange={(slotId) => handleUpdate({ slot_id: slotId })}
            >
              <SelectTrigger
                className={cn(
                  hasError(APPOINTMENT_FIELDS.SLOT.key) && "border-red-500",
                )}
              >
                <SelectValue placeholder={t("select_time_slot")} />
              </SelectTrigger>
              <SelectContent>
                {hasSlots ? (
                  availableSlots.map(({ availability, slots }) => (
                    <div key={availability.name}>
                      <div className="px-2 py-1.5 text-sm font-semibold">
                        {availability.name}
                      </div>
                      {slots.map((slot) => {
                        const isFullyBooked =
                          slot.allocated >= availability.tokens_per_slot;
                        return (
                          <SelectItem
                            key={slot.id}
                            value={slot.id}
                            disabled={isFullyBooked}
                          >
                            <div className="flex items-center justify-between">
                              <span>
                                {format(slot.start_datetime, "HH:mm")} -{" "}
                                {format(slot.end_datetime, "HH:mm")}
                              </span>
                              <span className="pl-1 text-xs text-gray-500">
                                {availability.tokens_per_slot - slot.allocated}{" "}
                                {t("slots_left")}
                              </span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </div>
                  ))
                ) : (
                  <div className="px-2 py-4 text-center text-sm text-gray-500">
                    {t("no_slots_available")}
                  </div>
                )}
              </SelectContent>
            </Select>
          )}
          <FieldError
            fieldKey={APPOINTMENT_FIELDS.SLOT.key}
            questionId={question.id}
            errors={errors}
          />
        </div>
      </div>
    </div>
  );
}
