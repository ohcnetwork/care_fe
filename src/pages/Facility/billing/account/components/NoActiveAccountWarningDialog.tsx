import { TriangleAlert } from "lucide-react";
import { navigate } from "raviger";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { AccountBase, AccountStatus } from "@/types/billing/account/Account";
import accountApi from "@/types/billing/account/accountApi";
import query from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";
import { useQuery } from "@tanstack/react-query";

export default function NoActiveAccountWarningDialog({
  patientId,
  facilityId,
}: {
  patientId: string;
  facilityId: string;
}) {
  const { t } = useTranslation();
  const [showWarningDialog, setShowWarningDialog] = useState(false);

  const { data: hasActiveAccount, isLoading } = useQuery({
    queryKey: ["active-account-status", patientId],
    queryFn: query(accountApi.listAccount, {
      pathParams: { facilityId },
      queryParams: {
        patient: patientId,
        limit: 1,
        status: AccountStatus.active,
      },
    }),
    select: (data: PaginatedResponse<AccountBase>) => data.count > 0,
  });

  useEffect(() => {
    if (isLoading) {
      return;
    }
    setShowWarningDialog(hasActiveAccount === false);
  }, [hasActiveAccount, isLoading]);

  if (isLoading) {
    return null;
  }

  return (
    <AlertDialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <TriangleAlert className="size-5 text-yellow-500" />
            {t("no_active_account_found")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("no_active_account_warning_description")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("proceed")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => navigate(`/facility/${facilityId}/billing/account`)}
          >
            {t("go_to_accounts")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
