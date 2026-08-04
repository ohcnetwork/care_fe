import { format } from "date-fns";
import { useAtom } from "jotai";
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

import { scheduleServiceTypeAtom } from "@/atoms/scheduleServiceTypeAtom";
import { StructuredFieldError } from "@/components/QuestionnaireV2/structured/core/StructuredFieldError";
import { SINGLETON_ROW_ID } from "@/components/QuestionnaireV2/structured/core/rowIds";
import type { BaselineRow } from "@/components/QuestionnaireV2/structured/core/types";
import { useStructuredRows } from "@/components/QuestionnaireV2/structured/core/useStructuredRows";
import type { StructuredInputProps } from "@/components/QuestionnaireV2/structured/types";
import { ScheduleResourceFormState } from "@/components/Schedule/ResourceSelector";
import useAuthUser from "@/hooks/useAuthUser";
import { AppointmentDateSelection } from "@/pages/Appointments/BookAppointment/AppointmentDateSelection";
import { AppointmentFormSection } from "@/pages/Appointments/BookAppointment/AppointmentFormSection";
import { AppointmentSlotPicker } from "@/pages/Appointments/BookAppointment/AppointmentSlotPicker";
import type { TagConfig } from "@/types/emr/tagConfig/tagConfig";
import useTagConfigs from "@/types/emr/tagConfig/useTagConfig";
import {
  SchedulableResourceType,
  type TokenSlot,
} from "@/types/scheduling/schedule";

import {
  createSeed,
  isEmptyRow,
  projectValues,
  type AppointmentRow,
} from "./model";

/** Appointment is create-only — there is no baseline row to prefetch, ever
 *  (`AppointmentQuestion.tsx` only ever read the response). Module scope,
 *  like `projectValues`: a fresh `[]` literal on every render would be a
 *  new baseline identity each time, defeating the hook's own `useMemo` on
 *  it. Passed explicitly (rather than omitted) so the honest complete set
 *  — "the server confirmed zero rows", per the BASELINE COMPLETENESS
 *  CONTRACT — is what the core actually receives, not `undefined` (its
 *  "still loading/errored" signal). See `TimeOfDeathEditor.tsx`'s identical
 *  block for the known orphan-prune trade-off this shares. */
const NO_BASELINE: readonly BaselineRow<AppointmentRow>[] = [];

/**
 * Everything the SLOT PICKER needs and the appointment row does not.
 * One object, not five `useState`s (`AppointmentQuestion.tsx:112,132,134,
 * 135,164`): the five were interdependent — opening the sheet, changing
 * the resource and picking a date all had to agree — and each setter
 * re-rendered independently.
 */
interface SlotPickerState {
  open: boolean;
  date: Date;
  resource: ScheduleResourceFormState;
  /** Staged in the sheet, committed to the row only on Submit. */
  stagedSlotId: string | undefined;
  /** Display detail for the staged/committed slot, as the picker reports
   *  it. `undefined` after a reload or a draft restore — see the trigger
   *  label below. */
  slotDetail: TokenSlot | undefined;
}

function initialResource(
  serviceType: SchedulableResourceType,
  currentUser: ReturnType<typeof useAuthUser>,
): ScheduleResourceFormState {
  if (serviceType === SchedulableResourceType.Practitioner) {
    return { resource: currentUser, resource_type: serviceType };
  }
  return { resource: null, resource_type: serviceType };
}

export function AppointmentEditor({
  question,
  disabled,
  facilityId,
  errors,
}: StructuredInputProps) {
  const { t } = useTranslation();
  const currentUser = useAuthUser();
  const [serviceType, setServiceType] = useAtom(scheduleServiceTypeAtom);

  // No explicit type arguments — see TimeOfDeathEditor.tsx's identical note.
  // `TRow` infers from `projectValues`/`createSeed`/`isEmptyRow`, `Mode`
  // from the `mode: "single"` literal.
  const single = useStructuredRows({
    questionId: question.id,
    mode: "single",
    baseline: NO_BASELINE,
    projectValues,
    createSeed,
    isEmptyRow,
    disabled,
  });
  const row = single.row?.row ?? createSeed();

  const [picker, setPicker] = useState<SlotPickerState>(() => ({
    open: false,
    date: new Date(),
    // The atom is read ONCE, as an initial preference. The legacy effect
    // that re-derived `selectedResource` whenever the atom changed
    // (`AppointmentQuestion.tsx:117-123`) is deleted: the atom is written
    // by another page (`BookAppointmentDetails.tsx`) and by other tabs,
    // and a half-filled questionnaire has no business resetting its own
    // picker because of either.
    resource: initialResource(serviceType, currentUser),
    stagedSlotId: undefined,
    slotDetail: undefined,
  }));
  const patch = (next: Partial<SlotPickerState>) =>
    setPicker((current) => ({ ...current, ...next }));

  const tagQueries = useTagConfigs({ ids: row.tags, facilityId });
  const selectedTags = tagQueries
    .map((queryResult) => queryResult.data)
    .filter(Boolean) as TagConfig[];

  return (
    <div className="space-y-4">
      <AppointmentFormSection
        facilityId={facilityId!}
        selectedTags={selectedTags}
        setSelectedTags={(tags) =>
          single.setRow({ tags: tags.map((tag) => tag.id) })
        }
        reason={row.note}
        setReason={(note) => single.setRow({ note })}
        selectedResource={picker.resource}
        setSelectedResource={(resource) => {
          patch({ resource });
          if (resource.resource_type !== serviceType) {
            setServiceType(resource.resource_type);
          }
        }}
      />

      <div>
        <Label className="mb-2 block" htmlFor={`${question.id}--slot`}>
          {t("appointment_slot")}
          {question.required && <span className="ml-0.5 text-red-500">*</span>}
        </Label>
        <Sheet open={picker.open} onOpenChange={(open) => patch({ open })}>
          <SheetTrigger asChild>
            <Button
              id={`${question.id}--slot`}
              variant="outline"
              className={cn(
                "w-full justify-start",
                // The ring stays; what is new is that the message below it
                // exists at all.
                !row.slot_id &&
                  errors.some((error) => error.field_key === "slot_id") &&
                  "ring-1 ring-red-500",
              )}
              aria-describedby={`${question.id}--slot--error`}
              disabled={disabled || !picker.resource.resource}
            >
              <SlotTriggerLabel
                row={row}
                detail={picker.slotDetail}
                resource={picker.resource}
              />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="overflow-auto sm:max-w-xl">
            <SheetHeader>
              <SheetTitle>{t("select_appointment_slot")}</SheetTitle>
            </SheetHeader>
            <div className="space-y-4">
              <AppointmentDateSelection
                facilityId={facilityId!}
                resourceId={picker.resource.resource?.id || undefined}
                resourceType={picker.resource.resource_type}
                selectedDate={picker.date}
                setSelectedDate={(date) => patch({ date })}
              />
              <AppointmentSlotPicker
                facilityId={facilityId!}
                resourceId={picker.resource.resource?.id || undefined}
                resourceType={picker.resource.resource_type}
                selectedDate={picker.date}
                selectedSlotId={picker.stagedSlotId}
                onSlotDetailsChange={(slotDetail) => patch({ slotDetail })}
                onSlotSelect={(stagedSlotId) => patch({ stagedSlotId })}
              />
              <div className="mt-6 flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() =>
                    patch({ open: false, stagedSlotId: undefined })
                  }
                >
                  {t("cancel")}
                </Button>
                <Button
                  disabled={!picker.stagedSlotId}
                  onClick={() => {
                    single.setRow({ slot_id: picker.stagedSlotId });
                    patch({ open: false });
                  }}
                >
                  {t("submit")}
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
        <StructuredFieldError
          id={`${question.id}--slot--error`}
          questionId={question.id}
          rowId={SINGLETON_ROW_ID}
          fieldKeys={["slot_id"]}
          errors={errors}
        />
      </div>
    </div>
  );
}

/**
 * The trigger's three honest states. The legacy component had only two
 * (`AppointmentQuestion.tsx:209-243`) and therefore lied about the third:
 * `value.slot_id && selectedSlot` is false after any reload or draft
 * restore, because `selectedSlot` only ever came from the picker's
 * `onSlotDetailsChange` and there is no slot-retrieve endpoint to rehydrate
 * it from (`scheduleApi.slots` has `get_slots_for_day`,
 * `availability_stats` and `create_appointment` — nothing keyed by slot
 * id). So a restored appointment WITH a slot rendered "Select appointment
 * slot", reading as unset. It is now a distinct state.
 * BACKEND HAND-OFF: a slot-retrieve endpoint would let this show the real
 * date and time after a restore.
 */
function SlotTriggerLabel({
  row,
  detail,
  resource,
}: {
  row: AppointmentRow;
  detail: TokenSlot | undefined;
  resource: ScheduleResourceFormState;
}) {
  const { t } = useTranslation();
  if (row.slot_id && detail) {
    return (
      <span className="font-normal">
        <Trans
          i18nKey="selected_token_slot_display"
          values={{
            date: format(detail.start_datetime, "dd MMM, yyyy"),
            startTime: format(detail.start_datetime, "h:mm a"),
            endTime: format(detail.end_datetime, "h:mm a"),
          }}
          components={{ strong: <span className="font-semibold" /> }}
        />
      </span>
    );
  }
  if (row.slot_id) {
    return (
      <span className="font-normal">{t("appointment_slot_selected")}</span>
    );
  }
  return (
    <span className="text-gray-500">
      {resource.resource ? t("select_appointment_slot") : t("select_resource")}
    </span>
  );
}
