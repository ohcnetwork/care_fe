import { format } from "date-fns";
import { useAtom } from "jotai";
import { useCallback, useState } from "react";
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
import { StructuredDroppedRowsNotice } from "@/components/QuestionnaireV2/structured/core/StructuredDroppedRowsNotice";
import { StructuredFieldError } from "@/components/QuestionnaireV2/structured/core/StructuredFieldError";
import { SINGLETON_ROW_ID } from "@/components/QuestionnaireV2/structured/core/rowIds";
import { selectStructuredFieldErrors } from "@/components/QuestionnaireV2/structured/core/structuredFieldErrors";
import type { BaselineRow } from "@/components/QuestionnaireV2/structured/core/types";
import { useStructuredSingleRow } from "@/components/QuestionnaireV2/structured/core/useStructuredRows";
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

/** Appointment is create-only — no baseline row exists to prefetch. Module
 *  scope so the baseline identity is stable; passed explicitly (not
 *  omitted) so the core receives "the server confirmed zero rows", not
 *  `undefined` (its still-loading signal). */
const NO_BASELINE: readonly BaselineRow<AppointmentRow>[] = [];

/**
 * Everything the SLOT PICKER needs and the appointment row does not — one
 * object because open/date/resource/staged slot must change together.
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

/** Field-by-field equality over `SlotPickerState` — every field is either a
 *  primitive or an object this component only ever REPLACES wholesale
 *  (never mutates in place), so reference equality per field is the
 *  correct, cheap check. Used by `patch` to bail out (return the SAME
 *  object) when a merge changes nothing; see `patch`'s doc comment for why
 *  that bail-out is load-bearing, not an optimization. */
function slotPickerStateEqual(a: SlotPickerState, b: SlotPickerState): boolean {
  return (
    a.open === b.open &&
    a.date === b.date &&
    a.resource === b.resource &&
    a.stagedSlotId === b.stagedSlotId &&
    a.slotDetail === b.slotDetail
  );
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

  const single = useStructuredSingleRow({
    questionId: question.id,
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
    // The atom is read once as an initial preference; with `getOnInit: true`,
    // this first read already reflects any persisted value. The atom can be
    // written by other pages or tabs, and a half-filled questionnaire should
    // not reset its picker because of either.
    resource: initialResource(serviceType, currentUser),
    stagedSlotId: undefined,
    slotDetail: undefined,
  }));

  /**
   * Bails out (returns the SAME object) when a merge changes nothing —
   * load-bearing, not an optimization: `AppointmentSlotPicker`'s
   * auto-select effect re-runs whenever its `handleSlotSelect` identity
   * changes, so an unconditional new state object here plus any unstable
   * callback prop below becomes an infinite render loop the moment the
   * Sheet opens. The memoized `handleSlotSelect`/`handleSlotDetailsChange`
   * below are the other half; the bail-out also keeps a no-op save
   * (e.g. `onSlotSelect(undefined)` when nothing is staged) from forcing a
   * render.
   */
  const patch = useCallback((next: Partial<SlotPickerState>) => {
    setPicker((current) => {
      const merged = { ...current, ...next };
      return slotPickerStateEqual(current, merged) ? current : merged;
    });
  }, []);

  /** Stable identities — the other half of the render-loop fix above. An
   *  inline arrow passed as `onSlotDetailsChange`/`onSlotSelect` would be a
   *  fresh function every render regardless of `patch`'s own stability, so
   *  these are memoized separately, each depending only on `patch` (itself
   *  stable via the empty dependency array above). */
  const handleSlotDetailsChange = useCallback(
    (slotDetail: TokenSlot) => patch({ slotDetail }),
    [patch],
  );
  const handleSlotSelect = useCallback(
    (stagedSlotId: string | undefined) => patch({ stagedSlotId }),
    [patch],
  );

  const tagQueries = useTagConfigs({ ids: row.tags, facilityId });
  const selectedTags = tagQueries
    .map((queryResult) => queryResult.data)
    .filter((data): data is TagConfig => data !== undefined);

  // Computed once and reused for the ring, `aria-describedby` AND the
  // rendered message below — the SAME match `StructuredFieldError` makes
  // internally, so the three can never disagree with each other, and
  // `aria-describedby` never dangles at a nonexistent id when there is no
  // error to show.
  const [slotError] = selectStructuredFieldErrors(errors, {
    questionId: question.id,
    rowId: SINGLETON_ROW_ID,
    fieldKeys: ["slot_id"],
  });
  const slotErrorId = slotError ? `${question.id}--slot--error` : undefined;

  return (
    <div className="space-y-4">
      <StructuredDroppedRowsNotice
        droppedEdits={single.droppedEdits}
        rowLabel={(droppedRow) =>
          droppedRow.note?.trim() || t("structured_type__appointment")
        }
      />
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
                !row.slot_id && !!slotError && "ring-1 ring-red-500",
              )}
              aria-describedby={slotErrorId}
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
                onSlotDetailsChange={handleSlotDetailsChange}
                onSlotSelect={handleSlotSelect}
              />
              <div className="mt-6 flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() =>
                    // Restore `stagedSlotId` AND `slotDetail` together:
                    // `SlotTriggerLabel` renders `detail` whenever
                    // `row.slot_id` is truthy without checking it
                    // describes the same slot, so a staged-then-cancelled
                    // slot's detail would keep displaying against the
                    // committed slot. Keep the detail only if it describes
                    // the committed slot; otherwise fall back to the
                    // "selected, no detail" state.
                    patch({
                      open: false,
                      stagedSlotId: row.slot_id || undefined,
                      slotDetail:
                        picker.slotDetail?.id === row.slot_id
                          ? picker.slotDetail
                          : undefined,
                    })
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
          id={slotErrorId}
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
 * The trigger's three states. `row.slot_id && detail` is false after any
 * reload or draft restore because detail only comes from the picker and there
 * is no slot-retrieve endpoint to rehydrate it by slot id. A row with a slot
 * but no detail must still read as selected; a slot-retrieve endpoint would
 * let this show the real date and time after restore.
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
