import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { TFunction } from "i18next";
import { Loader2 } from "lucide-react";
import { useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

import ValueSetSelect from "@/components/Questionnaire/ValueSetSelect";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";

import { DateTimeInput } from "@/components/Common/DateTimeInput";
import UserSelector from "@/components/Common/UserSelector";
import { LocationSearch } from "@/components/Location/LocationSearch";

import useAuthUser from "@/hooks/useAuthUser";

import mutate from "@/Utils/request/mutate";
import { Code } from "@/types/base/code/code";
import {
  IMMUNIZATION_NOT_DONE_REASONS,
  IMMUNIZATION_STATUS,
  ImmunizationRead,
  ImmunizationWrite,
} from "@/types/emr/immunization/immunization";
import immunizationApi from "@/types/emr/immunization/immunizationApi";
import { ImmunizationPolicyCoding } from "@/types/emr/immunizationPolicy/immunizationPolicy";
import { ImmunizationRecommendationRead } from "@/types/emr/immunizationRecommendation/immunizationRecommendation";
import immunizationRecommendationApi from "@/types/emr/immunizationRecommendation/immunizationRecommendationApi";
import { DOSAGE_UNITS_CODES } from "@/types/emr/medicationRequest/medicationRequest";
import { LocationRead } from "@/types/location/location";
import { UserReadMinimal } from "@/types/user/user";

import { codingsLabel, doseLabel } from "./immunizationUtils";

const NO_RECOMMENDATION = "none";
const DEFAULT_DOSE_UNIT = DOSAGE_UNITS_CODES.find(
  (unit) => unit.code === "mL",
)!;

function toCode(coding?: ImmunizationPolicyCoding | null): Code | null {
  if (!coding) return null;
  return {
    system: coding.system ?? "",
    code: coding.code,
    display: coding.display ?? coding.code,
  };
}

/** Statuses offered when recording; corrections are made by editing. */
const CREATE_STATUSES = ["completed", "not_done"] as const;

function recordSchema(t: TFunction) {
  const code = z.object({
    system: z.string(),
    code: z.string(),
    display: z.string(),
  });
  return z
    .object({
      code: code.nullable(),
      status: z.enum(IMMUNIZATION_STATUS),
      reason: z.enum(IMMUNIZATION_NOT_DONE_REASONS).optional(),
      occurrence: z.string().optional(),
      historical: z.boolean(),
      recommendation: z.string(),
      complete_recommendation: z.boolean(),
      dose_value: z.string(),
      dose_unit: z.string(),
      route: code.nullable(),
      site: code.nullable(),
      location: z.custom<LocationRead>().nullable(),
      administered_by: z.custom<UserReadMinimal>().nullable(),
      is_subpotent: z.boolean(),
      subpotent_reason: z.string(),
      note: z.string(),
    })
    .superRefine((values, context) => {
      if (!values.code) {
        context.addIssue({
          code: "custom",
          path: ["code"],
          message: t("immunization_vaccine_required"),
        });
      }
      if (values.status === "not_done" && !values.reason) {
        context.addIssue({
          code: "custom",
          path: ["reason"],
          message: t("immunization_reason_required"),
        });
      }
      if (values.status === "completed" && !values.occurrence) {
        context.addIssue({
          code: "custom",
          path: ["occurrence"],
          message: t("field_required"),
        });
      }
      if (values.occurrence && new Date(values.occurrence) > new Date()) {
        context.addIssue({
          code: "custom",
          path: ["occurrence"],
          message: t("immunization_occurrence_future"),
        });
      }
      const dose = values.dose_value.trim();
      if (dose && !(Number(dose) > 0)) {
        context.addIssue({
          code: "custom",
          path: ["dose_value"],
          message: t("immunization_dose_positive"),
        });
      }
    });
}

type RecordFormValues = z.infer<ReturnType<typeof recordSchema>>;

export interface ImmunizationRecordTarget {
  record?: ImmunizationRead;
  recommendation?: ImmunizationRecommendationRead;
}

interface ImmunizationRecordSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: ImmunizationRecordTarget;
  patientId: string;
  encounterId: string;
  facilityId: string;
  defaultLocation?: LocationRead | null;
  recommendations: ImmunizationRecommendationRead[];
}

export function ImmunizationRecordSheet({
  open,
  onOpenChange,
  target,
  ...props
}: ImmunizationRecordSheetProps) {
  const { t } = useTranslation();
  const isEdit = !!target.record;
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-xl">
        <SheetHeader className="mb-4">
          <SheetTitle>
            {t(isEdit ? "immunization_edit_record" : "immunization_record")}
          </SheetTitle>
          <SheetDescription>
            {t(
              isEdit
                ? "immunization_edit_record_description"
                : "immunization_record_description",
            )}
          </SheetDescription>
        </SheetHeader>
        <ImmunizationRecordForm
          {...props}
          target={target}
          onDone={() => onOpenChange(false)}
        />
      </SheetContent>
    </Sheet>
  );
}

interface ImmunizationRecordFormProps extends Omit<
  ImmunizationRecordSheetProps,
  "open" | "onOpenChange"
> {
  onDone: () => void;
}

function ImmunizationRecordForm({
  target: { record, recommendation },
  patientId,
  encounterId,
  facilityId,
  defaultLocation,
  recommendations,
  onDone,
}: ImmunizationRecordFormProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const user = useAuthUser();
  const isEdit = !!record;
  const schema = useMemo(() => recordSchema(t), [t]);
  const form = useForm<RecordFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      code: record?.code ?? toCode(recommendation?.codes?.[0]),
      status: record?.status ?? "completed",
      reason: record?.reason ?? undefined,
      occurrence: record
        ? (record.occurrence ?? undefined)
        : new Date().toISOString(),
      historical: record ? !record.primary_source : false,
      recommendation: recommendation?.id ?? NO_RECOMMENDATION,
      complete_recommendation: true,
      dose_value: record?.dose_quantity?.value ?? "",
      dose_unit: record?.dose_quantity?.unit?.code ?? DEFAULT_DOSE_UNIT.code,
      route: record?.route ?? null,
      site: record?.site ?? null,
      location: defaultLocation ?? null,
      administered_by: user ?? null,
      is_subpotent: record?.is_subpotent ?? false,
      subpotent_reason: record?.subpotent_reason ?? "",
      note: record?.note ?? "",
    },
  });
  const [status, historical, linkedId, isSubpotent] = useWatch({
    control: form.control,
    name: ["status", "historical", "recommendation", "is_subpotent"],
  });
  const linked = recommendations.find((item) => item.id === linkedId);
  const linkable = recommendations.filter(
    (item) =>
      !item.is_group &&
      (item.forecast_status === "due" || item.id === recommendation?.id),
  );

  const invalidate = () => {
    queryClient.invalidateQueries({
      queryKey: ["immunization-records", patientId],
    });
    queryClient.invalidateQueries({
      queryKey: ["immunization-recommendations", patientId],
    });
  };

  const completeRecommendation = useMutation({
    mutationFn: (item: ImmunizationRecommendationRead) =>
      mutate(immunizationRecommendationApi.update, {
        pathParams: { patientId, id: item.id },
      })({
        codes: item.codes ?? undefined,
        diseases: item.diseases ?? undefined,
        earliest_date: item.earliest_date ?? undefined,
        due_date: item.due_date ?? undefined,
        overdue_date: item.overdue_date ?? undefined,
        description: item.description ?? undefined,
        series: item.series ?? undefined,
        dose_number: item.dose_number ?? undefined,
        series_number: item.series_number ?? undefined,
        forecast_status: "complete",
      }),
  });

  const save = useMutation({
    mutationFn: (body: ImmunizationWrite) =>
      record
        ? mutate(immunizationApi.update, {
            pathParams: { patientId, id: record.id },
          })(body)
        : mutate(immunizationApi.create, { pathParams: { patientId } })({
            ...body,
            encounter: encounterId,
          }),
    onSuccess: async (_, body) => {
      const values = form.getValues();
      if (
        !record &&
        linked &&
        body.status === "completed" &&
        values.complete_recommendation
      ) {
        try {
          await completeRecommendation.mutateAsync(linked);
        } catch {
          toast.error(t("immunization_recommendation_update_error"));
        }
      }
      invalidate();
      toast.success(
        t(record ? "immunization_record_updated" : "immunization_recorded"),
      );
      onDone();
    },
  });

  const onSubmit = (values: RecordFormValues) => {
    const administered = values.status !== "not_done";
    const dose = values.dose_value.trim();
    const unit = DOSAGE_UNITS_CODES.find(
      (option) => option.code === values.dose_unit,
    );
    const body: ImmunizationWrite = {
      status: values.status,
      code: values.code!,
      primary_source: !values.historical,
      occurrence: values.occurrence || undefined,
      reason: values.status === "not_done" ? values.reason : undefined,
      note: values.note.trim() || undefined,
    };
    if (administered) {
      body.route = values.route ?? undefined;
      body.site = values.site ?? undefined;
      body.dose_quantity =
        dose && unit ? { value: dose, unit: { ...unit } } : undefined;
      body.is_subpotent = values.is_subpotent;
      body.subpotent_reason = values.is_subpotent
        ? values.subpotent_reason.trim() || undefined
        : undefined;
    }
    // Reads do not return links, so they are only sent when recording.
    if (!record) {
      if (values.recommendation !== NO_RECOMMENDATION)
        body.recommendation = values.recommendation;
      if (administered && !values.historical) {
        body.location = values.location?.id;
        body.administered_by = values.administered_by?.username;
      }
    }
    save.mutate(body);
  };

  const isPending = save.isPending;

  return (
    <Form {...form}>
      <form
        noValidate
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-1 flex-col gap-5"
      >
        {!isEdit && linkable.length > 0 && (
          <FormField
            control={form.control}
            name="recommendation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("immunization_for_recommendation")}</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    const next = recommendations.find(
                      (item) => item.id === value,
                    );
                    const code = toCode(next?.codes?.[0]);
                    if (code && !form.getValues("code"))
                      form.setValue("code", code, { shouldValidate: true });
                  }}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={NO_RECOMMENDATION}>
                      {t("immunization_no_recommendation")}
                    </SelectItem>
                    {linkable.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {[
                          codingsLabel(item.codes) ||
                            t("immunization_unspecified_vaccine"),
                          doseLabel(t, item),
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel aria-required>{t("immunization_vaccine")}</FormLabel>
              <FormControl>
                <ValueSetSelect
                  system="system-medication"
                  value={field.value}
                  onSelect={(code) => field.onChange(code)}
                  placeholder={t("immunization_select_vaccine")}
                  aria-label={t("immunization_vaccine")}
                  disabled={isEdit || isPending}
                  className="h-9 w-full justify-between text-left font-normal"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel aria-required>{t("status")}</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(isEdit ? IMMUNIZATION_STATUS : CREATE_STATUSES).map(
                      (option) => (
                        <SelectItem key={option} value={option}>
                          {t(`immunization_status__${option}`)}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="occurrence"
            render={({ field }) => (
              <FormItem>
                <FormLabel aria-required={status === "completed"}>
                  {t(
                    status === "not_done"
                      ? "immunization_decision_date"
                      : "immunization_administered_on",
                  )}
                </FormLabel>
                <FormControl>
                  <DateTimeInput
                    name={field.name}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    value={field.value ?? ""}
                    max={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                    onDateChange={(value) => field.onChange(value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {status === "not_done" && (
          <FormField
            control={form.control}
            name="reason"
            render={({ field }) => (
              <FormItem>
                <FormLabel aria-required>
                  {t("immunization_not_done_reason")}
                </FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={t("immunization_select_reason")}
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {IMMUNIZATION_NOT_DONE_REASONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {t(`immunization_reason__${option}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="historical"
          render={({ field }) => (
            <FormItem className="flex items-start gap-3 rounded-md border border-gray-200 p-3">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) =>
                    field.onChange(checked === true)
                  }
                  className="mt-0.5"
                />
              </FormControl>
              <div className="space-y-1">
                <FormLabel>{t("immunization_historical")}</FormLabel>
                <FormDescription>
                  {t("immunization_historical_hint")}
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        {!isEdit && linked && status === "completed" && (
          <FormField
            control={form.control}
            name="complete_recommendation"
            render={({ field }) => (
              <FormItem className="flex items-center gap-3">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) =>
                      field.onChange(checked === true)
                    }
                  />
                </FormControl>
                <FormLabel className="font-normal">
                  {t("immunization_mark_recommendation_complete")}
                </FormLabel>
              </FormItem>
            )}
          />
        )}

        {status !== "not_done" && (
          <section
            className="space-y-4 border-t border-gray-100 pt-5"
            aria-label={t("immunization_administration_details")}
          >
            <h3 className="text-sm font-semibold text-gray-900">
              {t("immunization_administration_details")}
            </h3>
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3">
              <FormField
                control={form.control}
                name="dose_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("immunization_dose_quantity")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step="any"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dose_unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("immunization_dose_unit")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DOSAGE_UNITS_CODES.map((unit) => (
                          <SelectItem key={unit.code} value={unit.code}>
                            {unit.display}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="route"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("route")}</FormLabel>
                    <FormControl>
                      <ValueSetSelect
                        system="system-route"
                        value={field.value}
                        onSelect={(code) => field.onChange(code)}
                        placeholder={t("select_route")}
                        aria-label={t("route")}
                        disabled={isPending}
                        className="h-9 w-full justify-between text-left font-normal"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="site"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("site")}</FormLabel>
                    <FormControl>
                      <ValueSetSelect
                        system="system-body-site"
                        value={field.value}
                        onSelect={(code) => field.onChange(code)}
                        placeholder={t("select_site")}
                        aria-label={t("site")}
                        disabled={isPending}
                        className="h-9 w-full justify-between text-left font-normal"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            {!isEdit && !historical && (
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="administered_by"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("immunization_administered_by")}</FormLabel>
                      <UserSelector
                        selected={field.value ?? undefined}
                        onChange={field.onChange}
                        onClear={() => field.onChange(null)}
                        facilityId={facilityId}
                        placeholder={t("select_user")}
                        disabled={isPending}
                      />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("location")}</FormLabel>
                      <LocationSearch
                        facilityId={facilityId}
                        value={field.value}
                        onSelect={field.onChange}
                        disabled={isPending}
                      />
                    </FormItem>
                  )}
                />
              </div>
            )}
            <FormField
              control={form.control}
              name="is_subpotent"
              render={({ field }) => (
                <FormItem className="flex items-center gap-3">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) =>
                        field.onChange(checked === true)
                      }
                    />
                  </FormControl>
                  <FormLabel className="font-normal">
                    {t("immunization_subpotent_dose")}
                  </FormLabel>
                </FormItem>
              )}
            />
            {isSubpotent && (
              <FormField
                control={form.control}
                name="subpotent_reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("immunization_subpotent_reason")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}
          </section>
        )}

        <FormField
          control={form.control}
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("note")}</FormLabel>
              <FormControl>
                <Textarea {...field} rows={3} />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="mt-auto flex justify-end gap-2 border-t border-gray-100 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onDone}
            disabled={isPending}
          >
            {t("cancel")}
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            )}
            {t(isEdit ? "save" : "immunization_save_record")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
