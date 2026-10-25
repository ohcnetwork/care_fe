import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Users } from "lucide-react";
import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/careui/button";
import { Field, FieldError, FieldLabel } from "@/components/careui/field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { ReferralDefaultCareTeam } from "@/pages/Facility/settings/referrals/ReferralDefaultCareTeam";
import { CareTeamResponse } from "@/types/careTeam/careTeam";
import { ReferralRetrieve } from "@/types/emr/referral/referral";
import referralApi from "@/types/emr/referral/referralApi";
import { callApi } from "@/Utils/request/query";

import { referralResourceError } from "./referralResourceError";
import { useReferralFacilities } from "./ReferralResourcePicker";

export function ReferralAssignmentDialog({
  referral,
}: {
  referral: ReferralRetrieve;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!pending) setOpen(value);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Users className="size-4" />
          {t("referral_manage_assignees")}
        </Button>
      </DialogTrigger>
      {open && (
        <AssignmentContent
          referral={referral}
          onClose={() => setOpen(false)}
          onPending={setPending}
        />
      )}
    </Dialog>
  );
}

function serialize(members: CareTeamResponse[]) {
  return members.map(({ member, role }) => ({ user_id: member.id, role }));
}

function AssignmentContent({
  referral,
  onClose,
  onPending,
}: {
  referral: ReferralRetrieve;
  onClose: () => void;
  onPending: (value: boolean) => void;
}) {
  const { t } = useTranslation();
  const id = useId();
  const client = useQueryClient();
  const [baseline] = useState(referral.assignees);
  const [assignees, setAssignees] = useState(baseline);
  const facilities = useReferralFacilities();
  const [facilityId, setFacilityId] = useState(facilities[0]?.id ?? "all");
  const changed =
    JSON.stringify(serialize(assignees)) !==
    JSON.stringify(serialize(baseline));
  const update = useMutation({
    mutationFn: async () => {
      const latest = await callApi(referralApi.get, {
        pathParams: { referralId: referral.id },
        silent: true,
      });
      const desired = new Map(
        assignees.map((entry) => [entry.member.id, entry]),
      );
      const original = new Map(
        baseline.map((entry) => [entry.member.id, entry]),
      );
      const merged = new Map(
        latest.assignees.map((entry) => [entry.member.id, entry]),
      );
      // Apply only this editor's additions/removals; retain other team members
      // added since the dialog opened. This is not an atomic compare-and-swap.
      for (const memberId of original.keys()) {
        if (!desired.has(memberId)) merged.delete(memberId);
      }
      for (const [memberId, entry] of desired) {
        if (
          !original.has(memberId) ||
          JSON.stringify(original.get(memberId)?.role) !==
            JSON.stringify(entry.role)
        ) {
          merged.set(memberId, entry);
        }
      }
      return callApi(referralApi.update, {
        pathParams: { referralId: referral.id },
        body: { assignees: serialize([...merged.values()]) },
        silent: true,
      });
    },
    retry: false,
    onMutate: () => onPending(true),
    onSettled: () => onPending(false),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["referrals"] });
      toast.success(t("referral_updated"));
      onClose();
    },
  });
  return (
    <DialogContent className="careui max-h-[90vh] overflow-y-auto sm:max-w-xl">
      <DialogHeader>
        <DialogTitle>{t("referral_manage_assignees")}</DialogTitle>
        <DialogDescription>
          {t("referral_manage_assignees_description")}
        </DialogDescription>
      </DialogHeader>
      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          if (changed && !update.isPending) update.mutate();
        }}
      >
        {facilities.length > 0 && (
          <Field>
            <FieldLabel htmlFor={id}>
              {t("referral_assignment_directory")}
            </FieldLabel>
            <Select
              value={facilityId}
              onValueChange={setFacilityId}
              disabled={update.isPending}
            >
              <SelectTrigger id={id}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="careui">
                {facilities.map((facility) => (
                  <SelectItem key={facility.id} value={facility.id}>
                    {facility.name}
                  </SelectItem>
                ))}
                <SelectItem value="all">
                  {t("referral_all_accessible_users")}
                </SelectItem>
              </SelectContent>
            </Select>
          </Field>
        )}
        <ReferralDefaultCareTeam
          key={facilityId}
          facilityId={facilityId === "all" ? undefined : facilityId}
          value={assignees}
          onChange={setAssignees}
          disabled={update.isPending}
          title={t("assigned_to")}
          description={t("referral_assignees_help")}
        />
        {update.error && (
          <FieldError role="alert">
            {referralResourceError(update.error, t("referral_update_failed"))}
          </FieldError>
        )}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={update.isPending}
          >
            {t("cancel")}
          </Button>
          <Button type="submit" disabled={!changed || update.isPending}>
            {update.isPending && <Loader2 className="size-4 animate-spin" />}
            {t("save_changes")}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
