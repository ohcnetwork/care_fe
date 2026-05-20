import { useQuery } from "@tanstack/react-query";
import { ExternalLinkIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

import {
  AccountBillingStatus,
  AccountStatus,
} from "@/types/billing/account/Account";
import accountApi from "@/types/billing/account/accountApi";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";
import query from "@/Utils/request/query";
import { Link } from "raviger";

export default function ViewDefaultAccountButton({
  facilityId,
  patientId,
  disabled,
}: {
  facilityId: string;
  patientId: string;
  disabled: boolean;
}) {
  const { t } = useTranslation();
  const { data: account } = useQuery({
    queryKey: ["accounts", patientId],
    queryFn: query(accountApi.listAccount, {
      pathParams: { facilityId },
      queryParams: {
        patient: patientId,
        limit: 1,
        offset: 0,
        status: AccountStatus.active,
        billing_status: AccountBillingStatus.open,
      },
    }),
  });

  const accountId = account?.results[0]?.id;

  return (
    accountId && (
      <Button variant="outline_primary" disabled={disabled} asChild>
        <Link
          href={`/facility/${facilityId}/billing/account/${accountId}`}
          basePath="/"
          target="_blank"
        >
          {t("view_account")}
          <ShortcutBadge actionId="view-account" />
          <ExternalLinkIcon className="size-4" />
        </Link>
      </Button>
    )
  );
}
