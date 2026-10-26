import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { FieldError, FieldGroup, FieldSet } from "@/components/ui/field";
import { Form, FormField, FormItem } from "@/components/ui/form";
import { Frame, FrameFooter, FramePanel } from "@/components/ui/frame";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

import mutate from "@/Utils/request/mutate";
import { CareTeamResponse } from "@/types/careTeam/careTeam";
import {
  ReferralAvailabilityCreate,
  ReferralAvailabilityRetrieve,
  ReferralAvailabilityUpdate,
} from "@/types/emr/referral/referral";
import { referralAvailabilityApi } from "@/types/emr/referral/referralApi";

import { ReferralAvailabilityField } from "./ReferralAvailabilityField";
import { ReferralDefaultCareTeam } from "./ReferralDefaultCareTeam";
import {
  QuestionnaireMappingSelection,
  ReferralQuestionnaireMappings,
} from "./ReferralQuestionnaireMappings";

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
  onDelete?: () => void;
}

export function ReferralAvailabilityForm({
  scope,
  availability,
  onSaved,
  onCancel,
  onDelete,
}: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [careTeam, setCareTeam] = useState<CareTeamResponse[]>(
    availability?.care_team ?? [],
  );
  const [questionnaires, setQuestionnaires] = useState<
    QuestionnaireMappingSelection[]
  >(availability?.questionnaires ?? []);
  const [formError, setFormError] = useState<string>();
  const serializeCareTeam = (members: CareTeamResponse[]) =>
    members.map(({ member, role }) => ({ user_id: member.id, role }));
  const serializeQuestionnaires = (forms: QuestionnaireMappingSelection[]) =>
    forms.map(({ id, questionnaire_type }) => ({
      questionnaire: id,
      questionnaire_type,
    }));
  const careTeamChanged =
    JSON.stringify(serializeCareTeam(careTeam)) !==
    JSON.stringify(serializeCareTeam(availability?.care_team ?? []));
  const questionnairesChanged =
    JSON.stringify(serializeQuestionnaires(questionnaires)) !==
    JSON.stringify(serializeQuestionnaires(availability?.questionnaires ?? []));
  const schema = z.object({
    name: z.string().trim().min(1, t("field_required")).max(255),
    description: z.string(),
    status: z.enum(["draft", "active", "inactive"]),
    referral_type: z.enum(["consultation", "lab"]),
    is_public: z.boolean(),
  });
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: availability?.name ?? "",
      description: availability?.description ?? "",
      status: availability?.status ?? "draft",
      referral_type: availability?.referral_type ?? "consultation",
      is_public: availability?.is_public ?? false,
    },
  });

  const { mutate: save, isPending } = useMutation({
    mutationFn: async (data: z.infer<typeof schema>) => {
      const payload: ReferralAvailabilityUpdate = {
        name: data.name,
        description: data.description,
        status: data.status,
        is_public: data.is_public,
        // Unchanged relationships may contain retired forms or former staff.
        // Preserve them when editing the destination's other settings.
        ...(!availability || careTeamChanged
          ? { care_team: serializeCareTeam(careTeam) }
          : {}),
        ...(!availability || questionnairesChanged
          ? { questionnaires: serializeQuestionnaires(questionnaires) }
          : {}),
      };
      if (availability) {
        return mutate(referralAvailabilityApi.update, {
          pathParams: { availabilityId: availability.id },
        })(payload);
      }
      const createPayload: ReferralAvailabilityCreate = {
        ...data,
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
    onSuccess: () => {
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
    onError: () => setFormError(t("referral_availability_save_error")),
  });

  function onSubmit(data: z.infer<typeof schema>) {
    setFormError(undefined);
    if (
      (!availability || questionnairesChanged) &&
      questionnaires.some((form) => form.status !== "active")
    ) {
      setFormError(t("referral_remove_inactive_forms"));
      return;
    }
    if (
      data.status === "active" &&
      (!availability ||
        availability.status !== "active" ||
        questionnairesChanged) &&
      !questionnaires.some(
        (form) =>
          form.questionnaire_type === "request" && form.status === "active",
      )
    ) {
      setFormError(t("referral_active_request_required"));
      return;
    }
    save(data);
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
        data-cy="referral-availability-form"
      >
        <FieldSet disabled={isPending} className="gap-0">
          <Frame stacked>
            <FramePanel>
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
                            <SelectItem value="consultation">
                              {t("referral_type_consultation")}
                            </SelectItem>
                            <SelectItem value="lab">
                              {t("referral_type_lab")}
                            </SelectItem>
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
                            {(["draft", "active", "inactive"] as const).map(
                              (status) => (
                                <SelectItem key={status} value={status}>
                                  {t(status)}
                                </SelectItem>
                              ),
                            )}
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
            </FramePanel>
            <FramePanel>
              <ReferralQuestionnaireMappings
                facilityId={scope.facilityId}
                value={questionnaires}
                onChange={setQuestionnaires}
                disabled={isPending}
              />
            </FramePanel>
            <FramePanel>
              <ReferralDefaultCareTeam
                facilityId={scope.facilityId}
                organizationId={
                  scope.entityType === "internal_organization"
                    ? scope.entityId
                    : undefined
                }
                value={careTeam}
                onChange={setCareTeam}
                disabled={isPending}
              />
            </FramePanel>
            {formError && (
              <div className="p-4">
                <FieldError>{formError}</FieldError>
              </div>
            )}
            <FrameFooter className="sticky bottom-0 flex-row flex-wrap justify-end gap-2 border-t border-border bg-background">
              {availability && onDelete && (
                <Button
                  type="button"
                  variant="destructive"
                  className="mr-auto"
                  onClick={onDelete}
                  disabled={isPending}
                >
                  <Trash2 className="size-4" />
                  {t("referral_delete_availability")}
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isPending}
              >
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="size-4 animate-spin" />}
                {t(
                  availability
                    ? "save_changes"
                    : "referral_create_availability",
                )}
              </Button>
            </FrameFooter>
          </Frame>
        </FieldSet>
      </form>
    </Form>
  );
}
