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
import { StructuredFieldError } from "@/components/QuestionnaireV2/structured/core/StructuredFieldError";
import { SINGLETON_ROW_ID } from "@/components/QuestionnaireV2/structured/core/rowIds";
import { selectStructuredFieldErrors } from "@/components/QuestionnaireV2/structured/core/structuredFieldErrors";
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
    // The atom is read ONCE, as an initial preference (and, since
    // `scheduleServiceTypeAtom` sets `getOnInit: true`, this first read
    // already reflects any persisted value — no hydration race to
    // reconcile against). The legacy effect that re-derived
    // `selectedResource` whenever the atom changed
    // (`AppointmentQuestion.tsx:117-123`) is deleted: the atom is written
    // by another page (`BookAppointmentDetails.tsx`) and by other tabs,
    // and a half-filled questionnaire has no business resetting its own
    // picker because of either.
    resource: initialResource(serviceType, currentUser),
    stagedSlotId: undefined,
    slotDetail: undefined,
  }));

  /**
   * REVIEW FIX (CRITICAL — render loop). This used to build a BRAND NEW
   * object unconditionally (`setPicker((c) => ({...c, ...next}))`), so a
   * no-op patch (identical content, new reference) still forced a
   * re-render. Combined with `onSlotSelect`/`onSlotDetailsChange` being
   * declared as inline arrows in the JSX below (a new function identity
   * every render), that produced a genuine infinite loop the instant the
   * slot Sheet opened: `AppointmentSlotPicker`'s own `handleSlotSelect`
   * (`AppointmentSlotPicker.tsx:71-84`) is `useCallback`'d on
   * `[onSlotSelect, onSlotDetailsChange, slotsQuery.data]`, and its
   * auto-select effect (`:129-131`) re-runs whenever `handleSlotSelect`'s
   * identity changes — which it did, every render, because the inline
   * arrows never stopped changing identity, because `patch` never stopped
   * handing back a "new" object. Stabilizing the two callback props alone
   * (below) would have broken the cycle, but this bail-out is kept too: it
   * is the right behavior for `patch` independent of that one loop (a
   * caller re-committing identical content — e.g. the auto-select effect
   * calling `onSlotSelect(undefined)` again when `stagedSlotId` is already
   * `undefined` — must not force a render), and it hardens the fix against
   * any future caller here that reintroduces an unstable callback.
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
    .filter(Boolean) as TagConfig[];

  // Computed once and reused for the ring, `aria-describedby` AND the
  // rendered message below — the SAME match `StructuredFieldError` makes
  // internally, so the three can never disagree with each other. Also
  // fixes `aria-describedby` dangling at a nonexistent id when there is no
  // error to show (REVIEW FIX, minor).
  const [slotError] = selectStructuredFieldErrors(errors, {
    questionId: question.id,
    rowId: SINGLETON_ROW_ID,
    fieldKeys: ["slot_id"],
  });
  const slotErrorId = slotError ? `${question.id}--slot--error` : undefined;

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
                    // REVIEW FIX (IMPORTANT — Cancel desync). Restoring
                    // only `stagedSlotId` and leaving `slotDetail` alone
                    // let a staged-then-cancelled slot's detail (date/time)
                    // go on being displayed against the row's actually
                    // committed slot: `SlotTriggerLabel` renders `detail`
                    // whenever `row.slot_id` is truthy, with nothing
                    // checking that `detail` is even the SAME slot.
                    // Restore both together — `stagedSlotId` back to the
                    // committed `row.slot_id`, and `slotDetail` kept only
                    // if it already describes THAT slot, otherwise cleared
                    // (falling back to `SlotTriggerLabel`'s honest
                    // "selected, no detail" state instead of showing a
                    // different slot's date/time).
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
