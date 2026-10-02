import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isValid, parseISO } from "date-fns";
import { Loader2 } from "lucide-react";
import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import mutate from "@/Utils/request/mutate";
import { formatDateTime } from "@/Utils/utils";
import { ImmunizationRecommendationRead } from "@/types/emr/immunizationRecommendation/immunizationRecommendation";
import immunizationRecommendationApi from "@/types/emr/immunizationRecommendation/immunizationRecommendationApi";
import { PatientRead } from "@/types/emr/patient/patient";

import { fetchImmunizationPolicyCatalogue } from "@/pages/ImmunizationPolicies/useImmunizationPolicyOwnership";

import {
  MaterializedRecommendation,
  codingsLabel,
  countNodes,
  doseLabel,
  flattenRecommendations,
  materializePolicyTemplate,
  todayDateString,
} from "./immunizationUtils";

interface ApplyImmunizationPolicyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: PatientRead;
  facilityId: string;
  encounterId: string;
  existingRecommendations: number;
}

export function ApplyImmunizationPolicyDialog({
  open,
  onOpenChange,
  ...props
}: ApplyImmunizationPolicyDialogProps) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("immunization_apply_policy")}</DialogTitle>
          <DialogDescription>
            {t("immunization_apply_policy_description")}
          </DialogDescription>
        </DialogHeader>
        {open && (
          <ApplyPolicyForm {...props} onDone={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}

interface ApplyPolicyFormProps extends Omit<
  ApplyImmunizationPolicyDialogProps,
  "open" | "onOpenChange"
> {
  onDone: () => void;
}

function ApplyPolicyForm({
  patient,
  facilityId,
  encounterId,
  existingRecommendations,
  onDone,
}: ApplyPolicyFormProps) {
  const { t } = useTranslation();
  const id = useId();
  const queryClient = useQueryClient();
  const [policyId, setPolicyId] = useState<string>();
  const [startDate, setStartDate] = useState(
    patient.date_of_birth || todayDateString(),
  );
  const [progress, setProgress] = useState(0);

  const { data: policies, isLoading } = useQuery({
    queryKey: ["immunization-policies", "facility-catalogue", facilityId],
    queryFn: ({ signal }) =>
      fetchImmunizationPolicyCatalogue(signal, facilityId),
  });
  const policy = policies?.results.find((item) => item.id === policyId);
  const reference = parseISO(startDate);
  const schedule =
    policy && isValid(reference)
      ? materializePolicyTemplate(policy.policy_template, reference)
      : undefined;
  const preview = schedule ? flattenRecommendations(schedule) : [];
  const total = schedule ? countNodes(schedule) : 0;

  const apply = useMutation({
    mutationFn: async (root: MaterializedRecommendation) => {
      setProgress(0);
      const create = mutate(immunizationRecommendationApi.create, {
        pathParams: { patientId: patient.id },
      });
      // Parents are created first so each child can reference its group.
      const createNode = async (
        node: MaterializedRecommendation,
        parent: string | null,
      ) => {
        const { children, ...fields } = node;
        const created: ImmunizationRecommendationRead = await create({
          ...fields,
          patient: patient.id,
          encounter: encounterId,
          parent,
          forecast_status: "due",
        });
        setProgress((count) => count + 1);
        for (const child of children) await createNode(child, created.id);
      };
      await createNode(root, null);
    },
    onSuccess: () => {
      toast.success(t("immunization_policy_applied"));
      onDone();
    },
    onError: () => {
      toast.error(t("immunization_policy_apply_error"));
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["immunization-recommendations", patient.id],
      });
    },
  });

  return (
    <form
      noValidate
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        if (schedule && !apply.isPending) apply.mutate(schedule);
      }}
    >
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="space-y-1.5">
          <Label htmlFor={`${id}-policy`}>
            {t("immunization_policy_column")}
          </Label>
          <Select
            value={policyId}
            onValueChange={setPolicyId}
            disabled={isLoading || apply.isPending}
          >
            <SelectTrigger id={`${id}-policy`} className="w-full">
              <SelectValue
                placeholder={t(
                  isLoading ? "loading" : "immunization_select_policy",
                )}
              />
            </SelectTrigger>
            <SelectContent>
              {policies?.results.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!isLoading && !policies?.results.length && (
            <p className="text-xs text-gray-500">
              {t("immunization_policy_empty")}
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${id}-start`}>
            {t("immunization_schedule_start")}
          </Label>
          <Input
            id={`${id}-start`}
            type="date"
            value={startDate}
            disabled={apply.isPending}
            onChange={(event) => setStartDate(event.target.value)}
            aria-describedby={`${id}-start-hint`}
          />
        </div>
      </div>
      <p id={`${id}-start-hint`} className="-mt-2 text-xs text-gray-500">
        {t("immunization_schedule_start_hint")}
      </p>

      {existingRecommendations > 0 && (
        <Alert>
          <AlertDescription>
            {t("immunization_apply_policy_existing", {
              count: existingRecommendations,
            })}
          </AlertDescription>
        </Alert>
      )}

      {policy && (
        <section
          className="space-y-2"
          aria-label={t("immunization_schedule_preview")}
        >
          <h3 className="text-sm font-semibold text-gray-900">
            {t("immunization_schedule_preview")}
          </h3>
          {preview.length ? (
            <ul className="max-h-64 divide-y divide-gray-100 overflow-y-auto rounded-md border border-gray-200">
              {preview.map(({ path, node: item }) => (
                <li
                  key={path}
                  className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-3 py-2 text-sm"
                >
                  <span className="min-w-0 font-medium text-gray-900">
                    {[
                      codingsLabel(item.codes) ||
                        t("immunization_unspecified_vaccine"),
                      item.series,
                      doseLabel(t, item),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                  <span className="text-xs text-gray-500">
                    {item.due_date
                      ? t("immunization_due_on", {
                          date: formatDateTime(item.due_date, "DD MMM YYYY"),
                        })
                      : t("immunization_no_due_date")}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">
              {t("immunization_policy_no_recommendations")}
            </p>
          )}
        </section>
      )}

      <DialogFooter className="gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onDone}
          disabled={apply.isPending}
        >
          {t("cancel")}
        </Button>
        <Button type="submit" disabled={!preview.length || apply.isPending}>
          {apply.isPending && (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          )}
          {apply.isPending
            ? t("immunization_applying_policy", {
                done: progress,
                total,
              })
            : t("immunization_apply_policy_count", {
                count: preview.length,
              })}
        </Button>
      </DialogFooter>
    </form>
  );
}
