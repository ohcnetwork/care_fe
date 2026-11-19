import { Spinner } from "@/components/ui/spinner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { FieldGroup, FieldSeparator, FieldSet } from "@/components/ui/field";
import { Form, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SheetBody } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

import mutate from "@/Utils/request/mutate";
import {
  CareTeamDraftMember,
  isCareTeamComplete,
} from "@/types/careTeam/careTeam";
import {
  QuestionnaireMappingDraft,
  REFERRAL_AVAILABILITY_STATUSES,
  REFERRAL_TYPES,
  ReferralAvailabilityCreate,
  ReferralAvailabilityRetrieve,
  ReferralAvailabilityUpdate,
} from "@/types/emr/referral/referral";
import { referralAvailabilityApi } from "@/types/emr/referral/referralApi";

import { ReferralAvailabilityField } from "./ReferralAvailabilityField";
import { ReferralDefaultCareTeam } from "./ReferralDefaultCareTeam";
import { ReferralQuestionnaireMappings } from "./ReferralQuestionnaireMappings";

export interface ReferralAvailabilityScope {
  facilityId?: string;
  entityType: "facility" | "internal_organization" | "external_organization";
  entityId: string;
}

interface Props {
  scope: ReferralAvailabilityScope;
  availability?: ReferralAvailabilityRetrieve;
  onSaved: () => void;
  onCancel: () => void;
}

export function ReferralAvailabilityForm({
  scope,
  availability,
  onSaved,
  onCancel,
}: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  // The schema blocks incomplete rows, so nothing is skipped when saving.
  const serializeCareTeam = (members: CareTeamDraftMember[]) =>
    members.flatMap(({ member, role }) =>
      member && role ? [{ user_id: member.id, role }] : [],
    );
  const serializeQuestionnaires = (forms: QuestionnaireMappingDraft[]) =>
    forms.flatMap(({ id, questionnaire_type }) =>
      id ? [{ questionnaire: id, questionnaire_type }] : [],
    );
  // Compared with the saved record rather than react-hook-form's dirtyFields:
  // adding and removing a row marks a list dirty even when it ends up equal.
  const careTeamChanged = (members: CareTeamDraftMember[]) =>
    JSON.stringify(serializeCareTeam(members)) !==
    JSON.stringify(serializeCareTeam(availability?.care_team ?? []));
  const questionnairesChanged = (forms: QuestionnaireMappingDraft[]) =>
    JSON.stringify(serializeQuestionnaires(forms)) !==
    JSON.stringify(serializeQuestionnaires(availability?.questionnaires ?? []));
  const schema = z
    .object({
      name: z.string().trim().min(1, t("field_required")).max(255),
      description: z.string(),
      status: z.enum(REFERRAL_AVAILABILITY_STATUSES),
      referral_type: z.enum(REFERRAL_TYPES),
      is_public: z.boolean(),
      questionnaires: z.array(z.custom<QuestionnaireMappingDraft>()),
      care_team: z
        .array(z.custom<CareTeamDraftMember>())
        .refine((rows) => isCareTeamComplete(rows)),
    })
    .superRefine((data, ctx) => {
      data.questionnaires.forEach((row, index) => {
        if (!row.id) {
          ctx.addIssue({
            code: "custom",
            path: ["questionnaires", index],
            message: t("please_select_form"),
          });
        }
      });
      if (data.questionnaires.some((row) => !row.id)) return;

      // Rules that compare against the saved availability. They land on the
      // forms list as a whole and are shown under the Referral forms section.
      const formsChanged =
        !availability || questionnairesChanged(data.questionnaires);
      if (
        formsChanged &&
        data.questionnaires.some((mapping) => mapping.status !== "active")
      ) {
        // The API rejects the whole list with a generic 400 otherwise.
        ctx.addIssue({
          code: "custom",
          path: ["questionnaires"],
          message: t("referral_remove_inactive_forms"),
        });
        return;
      }
      if (
        data.status === "active" &&
        (formsChanged || availability?.status !== "active") &&
        !data.questionnaires.some(
          (mapping) =>
            mapping.questionnaire_type === "request" &&
            mapping.status === "active",
        )
      ) {
        // Only enforced here: the API accepts an active availability without
        // a request form, which then fails when a referral is sent to it.
        ctx.addIssue({
          code: "custom",
          path: ["questionnaires"],
          message: t("referral_active_request_required"),
        });
      }
    });
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: availability?.name ?? "",
      description: availability?.description ?? "",
      status: availability?.status ?? "draft",
      referral_type: availability?.referral_type ?? "consultation",
      is_public: availability?.is_public ?? false,
      questionnaires: availability?.questionnaires ?? [],
      care_team: availability?.care_team ?? [],
    },
  });

  const { mutate: save, isPending } = useMutation({
    mutationFn: async (data: z.infer<typeof schema>) => {
      const { care_team, questionnaires, ...fields } = data;
      const payload: ReferralAvailabilityUpdate = {
        name: fields.name,
        description: fields.description,
        status: fields.status,
        is_public: fields.is_public,
        // Unchanged relationships may contain retired forms or former staff.
        // Preserve them when editing the destination's other settings.
        ...(!availability || careTeamChanged(care_team)
          ? { care_team: serializeCareTeam(care_team) }
          : {}),
        ...(!availability || questionnairesChanged(questionnaires)
          ? { questionnaires: serializeQuestionnaires(questionnaires) }
          : {}),
      };
      if (availability) {
        return mutate(referralAvailabilityApi.update, {
          pathParams: { availabilityId: availability.id },
        })(payload);
      }
      const createPayload: ReferralAvailabilityCreate = {
        ...fields,
        care_team: payload.care_team ?? [],
        questionnaires: payload.questionnaires ?? [],
        entity_type: scope.entityType,
        facility: scope.facilityId,
        ...(scope.entityType === "internal_organization"
          ? { internal_organization: scope.entityId }
          : {}),
        ...(scope.entityType === "external_organization"
          ? { external_organization: scope.entityId }
          : {}),
      };
      return mutate(referralAvailabilityApi.create)(createPayload);
    },
    onSuccess: (saved) => {
      queryClient.setQueryData(["referral-availability", saved.id], saved);
      queryClient.invalidateQueries({
        queryKey: ["referral-availability-config"],
      });
      queryClient.invalidateQueries({ queryKey: ["referral-availabilities"] });
      queryClient.invalidateQueries({ queryKey: ["referral-availability"] });
      toast.success(
        t(
          availability
            ? "referral_availability_updated"
            : "referral_availability_created",
        ),
      );
      onSaved();
    },
    // Save failures are reported by the global mutation error handler (toast).
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => save(data))}
        className="flex min-h-0 flex-1 flex-col"
        data-cy="referral-availability-form"
      >
        <SheetBody>
          {/* The sheet is the only surface: sections are split by separators,
              not wrapped in cards, as in other CARE sheet forms. */}
          <FieldSet disabled={isPending}>
            <FieldGroup>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <ReferralAvailabilityField label={t("name")} required>
                      <Input {...field} maxLength={255} autoFocus />
                    </ReferralAvailabilityField>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <ReferralAvailabilityField label={t("description")}>
                      <Textarea {...field} rows={3} />
                    </ReferralAvailabilityField>
                  </FormItem>
                )}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="referral_type"
                  render={({ field }) => (
                    <FormItem>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={!!availability || isPending}
                      >
                        <ReferralAvailabilityField label={t("referral_type")}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </ReferralAvailabilityField>
                        <SelectContent>
                          {REFERRAL_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type === "consultation"
                                ? t("referral_type_consultation")
                                : t("referral_type_lab")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={isPending}
                      >
                        <ReferralAvailabilityField label={t("status")}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </ReferralAvailabilityField>
                        <SelectContent>
                          {REFERRAL_AVAILABILITY_STATUSES.map((status) => (
                            <SelectItem key={status} value={status}>
                              {t(status)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="is_public"
                render={({ field }) => (
                  <FormItem>
                    <ReferralAvailabilityField
                      orientation="horizontal"
                      label={t("referral_public_availability")}
                      description={t("referral_public_availability_help")}
                    >
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isPending}
                      />
                    </ReferralAvailabilityField>
                  </FormItem>
                )}
              />
            </FieldGroup>
            <FieldSeparator />
            <FormField
              control={form.control}
              name="questionnaires"
              render={({ field, fieldState }) => (
                <ReferralQuestionnaireMappings
                  facilityId={scope.facilityId}
                  value={field.value}
                  onChange={field.onChange}
                  showErrors={form.formState.isSubmitted}
                  // Set only for list-level rules; incomplete rows are
                  // reported per row and carry no list-level message.
                  error={fieldState.error?.message}
                  disabled={isPending}
                />
              )}
            />
            <FieldSeparator />
            <FormField
              control={form.control}
              name="care_team"
              render={({ field }) => (
                <ReferralDefaultCareTeam
                  facilityId={scope.facilityId}
                  organizationId={
                    scope.entityType === "internal_organization"
                      ? scope.entityId
                      : undefined
                  }
                  value={field.value}
                  onChange={field.onChange}
                  showErrors={form.formState.isSubmitted}
                  disabled={isPending}
                />
              )}
            />
          </FieldSet>

          <div className="mt-6 flex justify-end gap-3 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isPending}
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="flex-1 sm:flex-none"
            >
              {isPending && <Spinner className="size-4 animate-spin" />}
              {t(availability ? "save" : "referral_create_availability")}
            </Button>
          </div>
        </SheetBody>
      </form>
    </Form>
  );
}
