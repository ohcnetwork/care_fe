import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SquarePen } from "lucide-react";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { CardListSkeleton } from "@/components/Common/SkeletonLoading";
import { AccountSheetButton } from "@/components/Patient/AccountSheetButton";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";
import { ACCOUNT_BILLING_STATUS_COLORS } from "@/types/billing/account/Account";
import accountApi from "@/types/billing/account/accountApi";

import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { EmptyState } from "./empty-state";

export const Account = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const {
    selectedEncounter: encounter,
    patientId,
    facilityId,
  } = useEncounter();

  const { data: response, isLoading } = useQuery({
    queryKey: ["defaultAccount", facilityId, patientId, encounter?.id],
    queryFn: query(accountApi.defaultAccount, {
      pathParams: { facilityId: facilityId || "" },
      body: {
        patient: patientId,
        facility: facilityId || "",
        encounter: encounter?.id || "",
      },
      silent: true,
    }),
    enabled: !!facilityId && !!encounter?.id,
  });

  const account = response;
  const accountId = account?.id;

  const { mutate: setPrimaryEncounter, isPending } = useMutation({
    mutationFn: mutate(accountApi.updateAccount, {
      pathParams: {
        facilityId: facilityId || "",
        accountId: accountId || "",
      },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["defaultAccount"] });
      toast.success(t("encounter_set_as_primary_success"));
    },
  });

  if (!encounter) return <CardListSkeleton count={3} />;

  if (isLoading) {
    return <CardListSkeleton count={1} />;
  }

  if (facilityId !== encounter.facility.id) return null;

  const handleSetPrimaryEncounter = () => {
    if (!account) return;

    setPrimaryEncounter({
      id: account.id,
      name: account.name,
      description: account.description,
      status: account.status,
      billing_status: account.billing_status,
      service_period: account.service_period,
      patient: patientId || "",
      primary_encounter: encounter.id,
      extensions: account.extensions,
    });
  };

  const isCurrentEncounterPrimary =
    account?.primary_encounter?.id === encounter.id;

  return (
    <div className="bg-gray-100 rounded-md w-full border border-gray-200 p-1 pt-2 space-y-1">
      <div className="flex justify-between items-center text-gray-950 pl-2">
        <span className="font-semibold">{t("account")}:</span>
        <AccountSheetButton
          encounter={encounter}
          trigger={
            <Button variant="ghost" size="sm">
              <SquarePen className="cursor-pointer" strokeWidth={1.5} />
            </Button>
          }
        />
      </div>

      <div className="bg-white rounded-md p-1 shadow">
        {!account ? (
          <EmptyState message={t("no_account_found")} />
        ) : (
          <Link href={`/facility/${facilityId}/billing/account/${account.id}`}>
            <div
              className={cn(
                "flex flex-row bg-gray-100 rounded-md p-2 border border-gray-200 justify-between",
                !isCurrentEncounterPrimary ? "bg-red-100" : "bg-green-100",
              )}
            >
              <span className="text-sm text-black font-semibold">
                {account.name}
              </span>

              <Badge
                variant={ACCOUNT_BILLING_STATUS_COLORS[account.billing_status]}
              >
                {t(account.billing_status)}
              </Badge>
            </div>
          </Link>
        )}
      </div>
      {account && !isCurrentEncounterPrimary && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleSetPrimaryEncounter}
          disabled={isPending}
          className="w-full text-xs text-muted-foreground font-medium"
        >
          {t("assign_this_encounter")}
        </Button>
      )}
    </div>
  );
};
